"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { toast } from "sonner";
import { Download, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PrevisualizacaoIngestao } from "@/components/dominio/modulo-previsualizacao-ingestao";
import { useEvidenciasStore } from "@/lib/store/evidencias";
import { usePeriodosStore } from "@/lib/store/periodos";
import {
  buscarEspecificacao,
  conteudoModeloCsv,
  extensoesParaAccept,
  listarExtensoes,
  nomeModeloCsv,
  prevalidarArquivo,
  slugInstituicao,
  type ResultadoPreValidacao,
} from "@/lib/ingestao";
import type { AutorLacre } from "@/lib/evidencias/lacre";
import { formatarNumero, formatarTamanhoArquivo } from "@/lib/formatadores";
import type { InsumoDefinicao, PeriodoObrigacao, RegistroLacre } from "@/lib/tipos";
import {
  EXTENSOES_INSUMO_AUXILIAR,
  TAMANHO_MINIMO_INSUMO_AUXILIAR_BYTES,
  extensaoDoArquivo,
} from "@/components/fornecimento/constantes";
import { cn } from "@/lib/utils";

export interface EnvioArquivoInsumoProps {
  periodo: PeriodoObrigacao;
  definicao: InsumoDefinicao;
  principal: boolean;
  autor: AutorLacre;
  instituicaoNome: string;
  desabilitado: boolean;
  aoConcluir: (lacre: RegistroLacre) => void;
}

export function EnvioArquivoInsumo({
  periodo,
  definicao,
  principal,
  autor,
  instituicaoNome,
  desabilitado,
  aoConcluir,
}: EnvioArquivoInsumoProps) {
  const registrarFornecimentoArquivo = useEvidenciasStore(
    (estado) => estado.registrarFornecimentoArquivo
  );
  const ingerirDados = usePeriodosStore((estado) => estado.ingerirDados);

  const inputRef = useRef<HTMLInputElement>(null);
  const arquivoPendenteRef = useRef<File | null>(null);

  const [resultado, setResultado] = useState<ResultadoPreValidacao | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  const idInput = `arquivo-${definicao.id}`;
  const especificacao = buscarEspecificacao(periodo.moduloId);
  const extensoesAceitas = principal
    ? extensoesParaAccept(periodo.moduloId)
    : EXTENSOES_INSUMO_AUXILIAR.map((extensao) => `.${extensao}`).join(",");
  const rotuloExtensoes = principal
    ? listarExtensoes(periodo.moduloId)
    : EXTENSOES_INSUMO_AUXILIAR.map((extensao) => `.${extensao}`).join(", ");

  function limparPendencia() {
    arquivoPendenteRef.current = null;
    setResultado(null);
  }

  function baixarModelo() {
    const blob = new Blob([conteudoModeloCsv(periodo.moduloId)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeModeloCsv(periodo.moduloId, periodo.instituicaoId, periodo.competencia);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Modelo baixado. O nome do arquivo já segue o padrão exigido pela obrigação.");
  }

  async function registrarArquivo(arquivo: File, linhasAceitas: number) {
    const registro = await registrarFornecimentoArquivo({
      periodo,
      insumoId: definicao.id,
      arquivo,
      linhasAceitas,
      autor,
    });

    if (!registro.sucesso || !registro.lacre) {
      const motivo = registro.motivo ?? "Não foi possível lacrar o envio. Tente novamente.";
      setErro(motivo);
      toast.error(motivo);
      return null;
    }

    return registro.lacre;
  }

  async function analisarArquivoPrincipal(arquivo: File) {
    setErro(null);
    setAnalisando(true);
    try {
      const prevalidacao = await prevalidarArquivo(
        arquivo,
        {
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          instituicaoSlug: slugInstituicao(periodo.instituicaoId),
          instituicaoNome,
        },
        `fornecimento-${periodo.id}-${definicao.id}-${Date.now()}`
      );
      arquivoPendenteRef.current = arquivo;
      setResultado(prevalidacao);
    } catch {
      const motivo = `Não foi possível ler ${arquivo.name}. Verifique o arquivo e tente novamente.`;
      setErro(motivo);
      toast.error(motivo);
    } finally {
      setAnalisando(false);
    }
  }

  async function enviarArquivoAuxiliar(arquivo: File) {
    setErro(null);

    const extensao = extensaoDoArquivo(arquivo.name);
    if (!EXTENSOES_INSUMO_AUXILIAR.includes(extensao)) {
      const motivo = `Formato não aceito para este insumo. Envie ${rotuloExtensoes}.`;
      setErro(motivo);
      toast.error(motivo);
      return;
    }
    if (arquivo.size === 0) {
      const motivo = "O arquivo está vazio. Exporte novamente a partir do seu sistema de origem.";
      setErro(motivo);
      toast.error(motivo);
      return;
    }
    if (arquivo.size < TAMANHO_MINIMO_INSUMO_AUXILIAR_BYTES) {
      const motivo = `O arquivo tem apenas ${formatarTamanhoArquivo(arquivo.size)} e não contém dados suficientes para ser aceito.`;
      setErro(motivo);
      toast.error(motivo);
      return;
    }

    setEnviando(true);
    const lacre = await registrarArquivo(arquivo, 0);
    setEnviando(false);

    if (!lacre) {
      return;
    }

    toast.success(`${arquivo.name} recebido e lacrado.`);
    aoConcluir(lacre);
  }

  async function aceitarArquivoPrincipal() {
    const arquivo = arquivoPendenteRef.current;
    if (!resultado || !arquivo || !resultado.conforme) {
      return;
    }

    setEnviando(true);
    const { resumo } = resultado;
    const lacre = await registrarArquivo(arquivo, resumo.linhasValidas);

    if (!lacre) {
      setEnviando(false);
      return;
    }

    const ingestao = ingerirDados(
      periodo.id,
      { usuarioId: autor.usuarioId, perfilId: autor.perfilId },
      {
        nomeArquivo: resumo.nomeArquivo,
        tamanhoBytes: resumo.tamanhoBytes,
        linhasRecebidas: resumo.linhasLidas,
        linhasResolvidas: resumo.linhasValidas,
        linhasComPendencia: resumo.linhasComPendencia,
        canal: "upload",
      }
    );

    setEnviando(false);
    limparPendencia();

    if (!ingestao.sucesso) {
      toast.warning(
        `${resumo.nomeArquivo} foi lacrado, mas o lote não entrou na competência: ${ingestao.motivo ?? "motivo não informado"}.`
      );
    } else if (resultado.totalAvisos > 0) {
      toast.warning(
        `${resumo.nomeArquivo} aceito com ${resultado.totalAvisos} ressalva(s) · ${formatarNumero(resumo.linhasValidas)} linha(s) reconhecida(s).`
      );
    } else {
      toast.success(
        `${resumo.nomeArquivo} aceito e lacrado · ${formatarNumero(resumo.linhasValidas)} linha(s) reconhecida(s).`
      );
    }

    aoConcluir(lacre);
  }

  function rejeitarArquivoPrincipal() {
    if (!resultado) {
      return;
    }
    const naoConforme = resultado.totalBloqueantes > 0;
    toast.error(
      naoConforme
        ? `${resultado.resumo.nomeArquivo} não está conforme o layout. Nenhum dado foi registrado.`
        : `${resultado.resumo.nomeArquivo} rejeitado. Nenhum dado foi registrado nesta competência.`
    );
    limparPendencia();
  }

  function descartarArquivoPrincipal() {
    if (!resultado) {
      return;
    }
    toast.info(`Conferência de ${resultado.resumo.nomeArquivo} cancelada. Nada foi enviado.`);
    limparPendencia();
  }

  function receberArquivos(lista: FileList | null) {
    const arquivo = lista?.[0];
    if (!arquivo || desabilitado) {
      return;
    }
    if (principal) {
      void analisarArquivoPrincipal(arquivo);
      return;
    }
    void enviarArquivoAuxiliar(arquivo);
  }

  function aoSelecionar(evento: ChangeEvent<HTMLInputElement>) {
    receberArquivos(evento.target.files);
    evento.target.value = "";
  }

  function aoArrastarSobre(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    if (!desabilitado) {
      setArrastando(true);
    }
  }

  function aoSairDoArraste(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
  }

  function aoSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
    receberArquivos(evento.dataTransfer.files);
  }

  const ocupado = analisando || enviando;

  return (
    <div className="space-y-3">
      {principal ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">
            Nome esperado:{" "}
            <span className="font-mono text-neutral-700">
              {especificacao.prefixoNome}_{slugInstituicao(periodo.instituicaoId)}_
              {periodo.competencia.replace("-", "")}.{especificacao.extensoesAceitas[0]}
            </span>
          </p>
          <Button type="button" variant="outline" size="sm" onClick={baixarModelo}>
            <Download className="size-4" aria-hidden="true" />
            Baixar modelo (CSV)
          </Button>
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={desabilitado ? -1 : 0}
        aria-disabled={desabilitado}
        aria-label={`Enviar arquivo para ${definicao.rotulo}. Formatos aceitos: ${rotuloExtensoes}.`}
        onClick={() => {
          if (!desabilitado) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(evento) => {
          if (!desabilitado && (evento.key === "Enter" || evento.key === " ")) {
            evento.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={aoArrastarSobre}
        onDragOver={aoArrastarSobre}
        onDragLeave={aoSairDoArraste}
        onDrop={aoSoltar}
        className={cn(
          "flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
          desabilitado && "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-70",
          !desabilitado && arrastando && "cursor-pointer border-brand-700 bg-brand-50",
          !desabilitado && !arrastando && "cursor-pointer border-neutral-300 bg-neutral-50 hover:border-brand-400",
          erro ? "border-status-error-border bg-status-error-bg" : null
        )}
      >
        <Label htmlFor={idInput} className="sr-only">
          Selecionar arquivo para {definicao.rotulo}
        </Label>
        <input
          ref={inputRef}
          id={idInput}
          type="file"
          accept={extensoesAceitas}
          disabled={desabilitado}
          tabIndex={-1}
          className="sr-only"
          onChange={aoSelecionar}
        />
        <UploadCloud className="size-6 text-neutral-400" aria-hidden="true" />
        <p className="text-sm font-medium text-neutral-700">
          Arraste o arquivo aqui ou{" "}
          <span className="text-brand-700 underline">clique para selecionar</span>
        </p>
        <p className="text-xs text-neutral-500">Aceita {rotuloExtensoes}.</p>
        {ocupado ? (
          <p className="flex items-center gap-2 text-xs font-medium text-brand-700">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            {analisando ? "Lendo e conferindo o arquivo…" : "Lacrando o envio…"}
          </p>
        ) : null}
      </div>

      {erro ? (
        <p role="alert" className="text-xs font-medium text-status-error-text">
          {erro}
        </p>
      ) : null}

      {principal ? (
        <PrevisualizacaoIngestao
          resultado={resultado}
          restantesNaFila={0}
          onAceitar={() => void aceitarArquivoPrincipal()}
          onRejeitar={rejeitarArquivoPrincipal}
          onDescartar={descartarArquivoPrincipal}
        />
      ) : null}
    </div>
  );
}
