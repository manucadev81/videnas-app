"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { toast } from "sonner";
import { Download, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { PrevisualizacaoIngestao } from "@/components/dominio/modulo-previsualizacao-ingestao";
import { PainelAcompanhamentoFornecimento } from "@/components/dominio/painel-acompanhamento-fornecimento";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { formatarDataHora, formatarNumero, formatarTamanhoArquivo } from "@/lib/formatadores";
import {
  ROTULO_DELIMITADOR,
  buscarEspecificacao,
  conteudoModeloCsv,
  extensoesParaAccept,
  listarExtensoes,
  nomeModeloCsv,
  prevalidarArquivo,
  slugInstituicao,
  type ResultadoPreValidacao,
} from "@/lib/ingestao";
import type { CanalIngestao } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const ATRASO_LIMPEZA_ESTADO_ZONA_MS = 2400;

type StatusLinha = "aceito" | "aceito_com_ressalvas" | "nao_conforme" | "rejeitado";

interface MotivoLinha {
  codigo: string;
  mensagem: string;
  ajuste: string;
}

interface ArquivoAvaliado {
  id: string;
  nome: string;
  tamanhoBytes: number;
  registradoEm: string;
  status: Extract<StatusLinha, "nao_conforme" | "rejeitado">;
  motivo: MotivoLinha;
  totalBloqueantes: number;
  totalAvisos: number;
}

interface LinhaArquivo {
  id: string;
  nome: string;
  tamanhoBytes: number;
  recebidoEm: string;
  canal: CanalIngestao;
  status: StatusLinha;
  motivo?: MotivoLinha;
  removivel: boolean;
}

const ROTULO_CANAL: Record<CanalIngestao, string> = {
  upload: "Upload manual",
  sftp: "SFTP",
  api: "Integração",
};

const ROTULO_STATUS: Record<StatusLinha, string> = {
  aceito: "Aceito",
  aceito_com_ressalvas: "Aceito com ressalvas",
  nao_conforme: "Não conforme",
  rejeitado: "Rejeitado pelo operador",
};

const CLASSE_STATUS: Record<StatusLinha, string> = {
  aceito: "status-badge-success",
  aceito_com_ressalvas: "status-badge-warning",
  nao_conforme: "status-badge-error",
  rejeitado: "status-badge-error",
};

export interface RecepcaoDocumentosProps {
  periodoId: string;
  className?: string;
}

export function RecepcaoDocumentos({ periodoId, className }: RecepcaoDocumentosProps) {
  const periodo = usePeriodosStore((estado) => estado.periodos[periodoId]);
  const ingerirDados = usePeriodosStore((estado) => estado.ingerirDados);
  const podeExecutarStore = usePeriodosStore((estado) => estado.podeExecutar);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);

  const [fila, setFila] = useState<ResultadoPreValidacao[]>([]);
  const [avaliados, setAvaliados] = useState<ArquivoAvaliado[]>([]);
  const [ressalvasPorArquivo, setRessalvasPorArquivo] = useState<Record<string, number>>({});
  const [analisando, setAnalisando] = useState(0);
  const [zonaEstado, setZonaEstado] = useState<"repouso" | "arrastando" | "erro">("repouso");

  const inputRef = useRef<HTMLInputElement>(null);
  const contadorIdRef = useRef(0);
  const montadoRef = useRef(true);
  const timeoutZonaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      if (timeoutZonaRef.current) {
        clearTimeout(timeoutZonaRef.current);
      }
    };
  }, []);

  if (!periodo || !perfilAtivo || !usuarioId) {
    return null;
  }

  const especificacao = buscarEspecificacao(periodo.moduloId);
  const instituicao = buscarInstituicao(periodo.instituicaoId);
  const instituicaoSlug = slugInstituicao(periodo.instituicaoId);
  const avaliacaoSubir = podeExecutarStore(perfilAtivo, "subir_dados", periodoId, usuarioId);
  const autor = { usuarioId, perfilId: perfilAtivo };
  const emAnalise = fila[0] ?? null;

  function sinalizarErroNaZona() {
    setZonaEstado("erro");
    if (timeoutZonaRef.current) {
      clearTimeout(timeoutZonaRef.current);
    }
    timeoutZonaRef.current = setTimeout(() => {
      if (montadoRef.current) {
        setZonaEstado("repouso");
      }
    }, ATRASO_LIMPEZA_ESTADO_ZONA_MS);
  }

  async function adicionarArquivos(lista: FileList | File[]) {
    const arquivos = Array.from(lista);
    if (arquivos.length === 0) {
      return;
    }

    setAnalisando((atual) => atual + arquivos.length);

    for (const arquivo of arquivos) {
      contadorIdRef.current += 1;
      const identificador = `prev-${periodoId}-${contadorIdRef.current}`;

      let resultado: ResultadoPreValidacao | null = null;
      try {
        resultado = await prevalidarArquivo(
          arquivo,
          {
            moduloId: periodo.moduloId,
            competencia: periodo.competencia,
            instituicaoSlug,
            instituicaoNome: instituicao?.nomeFantasia ?? "esta instituição",
          },
          identificador
        );
      } catch {
        toast.error(`Não foi possível ler ${arquivo.name}. Verifique o arquivo e tente novamente.`);
      }

      if (!montadoRef.current) {
        return;
      }

      setAnalisando((atual) => Math.max(0, atual - 1));

      if (!resultado) {
        continue;
      }

      const resultadoLido = resultado;
      setFila((atual) => [...atual, resultadoLido]);

      const formatoInvalido = resultadoLido.naoConformidades.some(
        (item) => item.codigo === "ING-E001" || item.codigo === "ING-E002"
      );
      if (formatoInvalido) {
        sinalizarErroNaZona();
      }
    }
  }

  function motivoBloqueante(resultado: ResultadoPreValidacao): MotivoLinha {
    const bloqueante = resultado.naoConformidades.find((item) => item.severidade === "bloqueante");
    if (bloqueante) {
      return { codigo: bloqueante.codigo, mensagem: bloqueante.mensagem, ajuste: bloqueante.ajuste };
    }
    return {
      codigo: "ING-R001",
      mensagem: "Recusado pelo operador na conferência do arquivo.",
      ajuste: "Ajuste o conteúdo na origem e reenvie o arquivo para nova conferência.",
    };
  }

  function registrarAvaliado(resultado: ResultadoPreValidacao, status: ArquivoAvaliado["status"]) {
    setAvaliados((atual) => [
      ...atual,
      {
        id: resultado.id,
        nome: resultado.resumo.nomeArquivo,
        tamanhoBytes: resultado.resumo.tamanhoBytes,
        registradoEm: new Date().toISOString(),
        status,
        motivo: motivoBloqueante(resultado),
        totalBloqueantes: resultado.totalBloqueantes,
        totalAvisos: resultado.totalAvisos,
      },
    ]);
  }

  function avancarFila() {
    setFila((atual) => atual.slice(1));
  }

  function aoAceitar() {
    if (!emAnalise || !emAnalise.conforme) {
      return;
    }

    const { resumo } = emAnalise;
    const resultadoIngestao = ingerirDados(periodoId, autor, {
      nomeArquivo: resumo.nomeArquivo,
      tamanhoBytes: resumo.tamanhoBytes,
      linhasRecebidas: resumo.linhasLidas,
      linhasResolvidas: resumo.linhasValidas,
      linhasComPendencia: resumo.linhasComPendencia,
      canal: "upload",
    });

    if (!resultadoIngestao.sucesso) {
      toast.error(resultadoIngestao.motivo ?? "Não foi possível registrar o lote nesta competência.");
      return;
    }

    if (emAnalise.totalAvisos > 0) {
      setRessalvasPorArquivo((atual) => ({ ...atual, [resumo.nomeArquivo]: emAnalise.totalAvisos }));
      toast.warning(
        `${resumo.nomeArquivo} aceito com ${emAnalise.totalAvisos} ressalva(s) · ${formatarNumero(resumo.linhasValidas)} linha(s) reconhecida(s).`
      );
    } else {
      toast.success(
        `${resumo.nomeArquivo} aceito · ${formatarNumero(resumo.linhasValidas)} linha(s) reconhecida(s).`
      );
    }

    avancarFila();
  }

  function aoRejeitar() {
    if (!emAnalise) {
      return;
    }
    const naoConforme = emAnalise.totalBloqueantes > 0;
    registrarAvaliado(emAnalise, naoConforme ? "nao_conforme" : "rejeitado");
    toast.error(
      naoConforme
        ? `${emAnalise.resumo.nomeArquivo} marcado como não conforme. Nenhum dado entrou na competência.`
        : `${emAnalise.resumo.nomeArquivo} rejeitado. Solicite os ajustes ao time responsável.`
    );
    avancarFila();
  }

  function aoDescartar() {
    if (!emAnalise) {
      return;
    }
    if (emAnalise.totalBloqueantes > 0) {
      registrarAvaliado(emAnalise, "nao_conforme");
      toast.error(`${emAnalise.resumo.nomeArquivo} marcado como não conforme. Nenhum dado entrou na competência.`);
    } else {
      toast.info(`Conferência de ${emAnalise.resumo.nomeArquivo} cancelada. O arquivo não foi registrado.`);
    }
    avancarFila();
  }

  function aoArrastarSobre(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setZonaEstado((atual) => (atual === "erro" ? atual : "arrastando"));
  }

  function aoSairDoArraste(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setZonaEstado((atual) => (atual === "arrastando" ? "repouso" : atual));
  }

  function aoSoltarArquivos(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setZonaEstado("repouso");
    void adicionarArquivos(evento.dataTransfer.files);
  }

  function aoSelecionarArquivos(evento: ChangeEvent<HTMLInputElement>) {
    if (evento.target.files) {
      void adicionarArquivos(evento.target.files);
    }
    evento.target.value = "";
  }

  function removerAvaliado(id: string) {
    setAvaliados((atual) => atual.filter((item) => item.id !== id));
  }

  function baixarModelo() {
    const blob = new Blob([conteudoModeloCsv(periodo.moduloId)], { type: "text/csv;charset=utf-8;" });
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

  const linhasHistorico: LinhaArquivo[] = periodo.lotes.map((lote) => ({
    id: lote.id,
    nome: lote.nomeArquivo,
    tamanhoBytes: lote.tamanhoBytes,
    recebidoEm: lote.recebidoEm,
    canal: lote.canal,
    status: (ressalvasPorArquivo[lote.nomeArquivo] ?? 0) > 0 ? "aceito_com_ressalvas" : "aceito",
    removivel: false,
  }));

  const linhasAvaliadas: LinhaArquivo[] = avaliados.map((item) => ({
    id: item.id,
    nome: item.nome,
    tamanhoBytes: item.tamanhoBytes,
    recebidoEm: item.registradoEm,
    canal: "upload",
    status: item.status,
    motivo: item.motivo,
    removivel: true,
  }));

  const linhasTabela = [...linhasHistorico, ...linhasAvaliadas].sort((a, b) =>
    a.recebidoEm < b.recebidoEm ? 1 : a.recebidoEm > b.recebidoEm ? -1 : 0
  );

  const colunasTabela: ColunaTabela<LinhaArquivo>[] = [
    {
      id: "nome",
      cabecalho: "Arquivo",
      renderizar: (linha) => (
        <span className="flex items-center gap-2">
          <FileText className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
          {linha.nome}
        </span>
      ),
    },
    {
      id: "tamanho",
      cabecalho: "Tamanho",
      alinhamento: "right",
      renderizar: (linha) => formatarTamanhoArquivo(linha.tamanhoBytes),
    },
    { id: "recebido", cabecalho: "Recebido em", renderizar: (linha) => formatarDataHora(linha.recebidoEm) },
    { id: "canal", cabecalho: "Canal", renderizar: (linha) => ROTULO_CANAL[linha.canal] },
    {
      id: "status",
      cabecalho: "Status",
      renderizar: (linha) => (
        <span className="block space-y-1">
          <span className={cn("status-badge", CLASSE_STATUS[linha.status])}>{ROTULO_STATUS[linha.status]}</span>
          {linha.motivo ? (
            <>
              <span className="block text-xs text-status-error-text">
                {linha.motivo.codigo} — {linha.motivo.mensagem}
              </span>
              <span className="block text-xs text-neutral-500">Ajuste necessário: {linha.motivo.ajuste}</span>
            </>
          ) : null}
        </span>
      ),
    },
    {
      id: "acoes",
      cabecalho: "",
      alinhamento: "right",
      renderizar: (linha) =>
        linha.removivel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remover ${linha.nome} da lista`}
            onClick={() => removerAvaliado(linha.id)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null,
    },
  ];

  const totalLinhasReconhecidas = periodo.lotes.reduce((total, lote) => total + lote.linhasResolvidas, 0);
  const totalLinhasComPendencia = periodo.lotes.reduce((total, lote) => total + lote.linhasComPendencia, 0);
  const totalNaoConformes = avaliados.filter((item) => item.status === "nao_conforme").length;
  const totalRejeitados = avaliados.filter((item) => item.status === "rejeitado").length;

  const mensagemStatus =
    analisando > 0
      ? `Lendo e pré-validando ${analisando} arquivo(s).`
      : fila.length > 0
        ? `${fila.length} arquivo(s) aguardando o aceite do operador.`
        : `${periodo.lotes.length} lote(s) aceito(s), ${totalNaoConformes} não conforme(s), ${totalRejeitados} rejeitado(s).`;

  const inputId = `upload-recepcao-${periodoId}`;
  const delimitadoresAceitos = especificacao.delimitadoresAceitos
    .map((item) => ROTULO_DELIMITADOR[item] ?? item)
    .join(" ou ");

  return (
    <div className={cn("space-y-4", className)}>
      <p className="sr-only" role="status" aria-live="polite">
        {mensagemStatus}
      </p>

      {avaliacaoSubir.visivel ? (
        <>
          <div data-tour="upload-layout" className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
                  Layout esperado do arquivo
                  <BadgeAjuda chave="recepcao.layout" tamanho="sm" />
                </h2>
                <p className="text-sm text-neutral-500">{especificacao.descricao}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-tour="upload-baixar-modelo"
                onClick={baixarModelo}
              >
                <Download className="size-4" aria-hidden="true" />
                Baixar modelo (CSV)
              </Button>
            </div>

            <dl className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Nome do arquivo</dt>
                <dd className="font-mono text-xs text-neutral-700">
                  {especificacao.prefixoNome}_{instituicaoSlug}_{periodo.competencia.replace("-", "")}.
                  {especificacao.extensoesAceitas[0]}
                </dd>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Formatos aceitos</dt>
                <dd className="text-sm font-medium text-neutral-700">{listarExtensoes(periodo.moduloId)}</dd>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs text-neutral-500">Delimitador</dt>
                <dd className="text-sm font-medium text-neutral-700">{delimitadoresAceitos}</dd>
              </div>
            </dl>

            <div className="overflow-x-auto rounded-md border border-neutral-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                    {especificacao.colunas.map((coluna) => (
                      <th key={coluna.chave} className="whitespace-nowrap px-3 py-2 font-medium">
                        {coluna.rotulo}
                        {coluna.obrigatoria ? (
                          <span className="text-status-error-text" aria-label="coluna obrigatória">
                            {" *"}
                          </span>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {especificacao.colunas.map((coluna) => (
                      <td key={coluna.chave} className="whitespace-nowrap px-3 py-2 font-mono text-xs text-neutral-600">
                        {coluna.exemplo}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Colunas marcadas com <span className="text-status-error-text">*</span> são obrigatórias. A ausência de
              qualquer uma delas bloqueia o aceite do lote.
            </p>
          </div>

          {avaliacaoSubir.permitido ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-1 flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
                Enviar arquivos
                <BadgeAjuda chave="recepcao.envio" tamanho="sm" />
              </h2>
              <p className="mb-3 text-sm text-neutral-500">
                Cada arquivo é lido no navegador e conferido contra o layout da obrigação. A pré-visualização abre no ato
                do envio e o lote só entra na competência depois do seu aceite.
              </p>
              <div
                role="button"
                tabIndex={0}
                data-tour="upload-dropzone"
                aria-label={`Área para arrastar arquivos ou selecionar do computador. Formatos aceitos: ${listarExtensoes(periodo.moduloId)}.`}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragEnter={aoArrastarSobre}
                onDragOver={aoArrastarSobre}
                onDragLeave={aoSairDoArraste}
                onDrop={aoSoltarArquivos}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
                  zonaEstado === "arrastando" && "border-brand-700 bg-brand-50",
                  zonaEstado === "erro" && "border-status-error-border bg-status-error-bg",
                  zonaEstado === "repouso" && "border-neutral-300 bg-neutral-50 hover:border-brand-400"
                )}
              >
                <Label htmlFor={inputId} className="sr-only">
                  Selecionar arquivos de dados para upload
                </Label>
                <input
                  ref={inputRef}
                  id={inputId}
                  type="file"
                  multiple
                  accept={extensoesParaAccept(periodo.moduloId)}
                  tabIndex={-1}
                  className="sr-only"
                  onChange={aoSelecionarArquivos}
                />
                <UploadCloud className="size-8 text-neutral-400" aria-hidden="true" />
                <p className="text-sm font-medium text-neutral-700">
                  Arraste arquivos aqui ou <span className="text-brand-700 underline">clique para selecionar</span>
                </p>
                <p className="text-xs text-neutral-500">
                  Aceita {listarExtensoes(periodo.moduloId)} · vários arquivos por vez.
                </p>
                {analisando > 0 ? (
                  <p className="flex items-center gap-2 text-xs font-medium text-brand-700">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Lendo e pré-validando {analisando} arquivo(s)…
                  </p>
                ) : null}
                {zonaEstado === "erro" ? (
                  <p role="alert" className="text-xs font-medium text-status-error-text">
                    Formato não aceito por esta obrigação. Envie {listarExtensoes(periodo.moduloId)}.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
              {avaliacaoSubir.motivo ?? "Envio de dados indisponível no estado atual do período."}
            </div>
          )}
        </>
      ) : (
        <PainelAcompanhamentoFornecimento periodo={periodo} autor={autor} />
      )}

      <div data-tour="upload-tabela-arquivos" className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
            Arquivos recebidos
            <BadgeAjuda chave="recepcao.tabela" tamanho="sm" />
          </h2>
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            Coluna Status
            <BadgeAjuda chave="recepcao.status" tamanho="xs" align="end" />
          </span>
        </div>
        <TabelaDados
          colunas={colunasTabela}
          dados={linhasTabela}
          chave={(linha) => linha.id}
          tituloVazio="Nenhum arquivo recebido"
          mensagemVazia={
            avaliacaoSubir.visivel
              ? "Envie um arquivo para começar a ingestão desta competência."
              : "O Cliente / Fornecedor de dados da instituição ainda não enviou os dados desta competência."
          }
        />
      </div>

      {avaliacaoSubir.visivel && avaliacaoSubir.permitido ? (
        <div data-tour="upload-confirmar-envio" className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-1 font-display text-lg font-bold text-neutral-700">Resumo da conferência</h2>
          <p className="mb-3 text-sm text-neutral-500">
            O aceite acontece arquivo a arquivo, na pré-visualização que abre no ato do envio. Não existe confirmação
            adicional: o que está aqui como aceito já entrou na competência.
          </p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md bg-neutral-50 p-3">
              <dt className="text-xs text-neutral-500">Lotes aceitos</dt>
              <dd className="text-sm font-medium text-neutral-700">{periodo.lotes.length}</dd>
            </div>
            <div className="rounded-md bg-neutral-50 p-3">
              <dt className="text-xs text-neutral-500">Linhas reconhecidas</dt>
              <dd className="text-sm font-medium text-neutral-700">{formatarNumero(totalLinhasReconhecidas)}</dd>
            </div>
            <div className="rounded-md bg-neutral-50 p-3">
              <dt className="text-xs text-neutral-500">Linhas com pendência</dt>
              <dd className="text-sm font-medium text-neutral-700">{formatarNumero(totalLinhasComPendencia)}</dd>
            </div>
            <div className="rounded-md bg-neutral-50 p-3">
              <dt className="text-xs text-neutral-500">Não conformes / rejeitados</dt>
              <dd className="text-sm font-medium text-neutral-700">
                {totalNaoConformes} / {totalRejeitados}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      <PrevisualizacaoIngestao
        resultado={emAnalise}
        restantesNaFila={Math.max(0, fila.length - 1)}
        onAceitar={aoAceitar}
        onRejeitar={aoRejeitar}
        onDescartar={aoDescartar}
      />
    </div>
  );
}
