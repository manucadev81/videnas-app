"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { toast } from "sonner";
import { Download, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { formatarDataHora, formatarNumero, formatarTamanhoArquivo } from "@/lib/formatadores";
import type { CanalIngestao, ModuloId } from "@/lib/tipos";
import { cn } from "@/lib/utils";

interface EspecificacaoColuna {
  chave: string;
  rotulo: string;
  exemplo: string;
}

interface EspecificacaoModulo {
  descricao: string;
  colunas: EspecificacaoColuna[];
}

const ESPECIFICACAO_MODULOS: Record<ModuloId, EspecificacaoModulo> = {
  acam212: {
    descricao: "Uma linha por operação de câmbio com ativo virtual realizada na competência.",
    colunas: [
      { chave: "numero_controle", rotulo: "Número de controle", exemplo: "C212-2026-08-0000741" },
      { chave: "data_hora", rotulo: "Data/hora", exemplo: "2026-08-14T10:32:00-03:00" },
      { chave: "tipo_operacao", rotulo: "Tipo de operação", exemplo: "Pagamento internacional" },
      { chave: "cliente_documento", rotulo: "Cliente (CPF/CNPJ)", exemplo: "318.447.902-15" },
      { chave: "ativo_virtual", rotulo: "Ativo virtual", exemplo: "USDT" },
      { chave: "quantidade", rotulo: "Quantidade", exemplo: "48250.00000000" },
      { chave: "valor_brl", rotulo: "Valor em BRL", exemplo: "250137.65" },
      { chave: "valor_moeda_estrangeira", rotulo: "Valor em moeda estrangeira", exemplo: "48250.00" },
      { chave: "taxa_cambio", rotulo: "Taxa de câmbio", exemplo: "5.1842" },
    ],
  },
  cadoc5711: {
    descricao: "Uma linha por posição de custódia diária por cliente, para cada data-base da competência.",
    colunas: [
      { chave: "data_base", rotulo: "Data-base", exemplo: "2026-08-14" },
      { chave: "cliente_documento", rotulo: "Cliente (CPF/CNPJ)", exemplo: "22.905.663/0001-70" },
      { chave: "ativo_virtual", rotulo: "Ativo", exemplo: "BTC" },
      { chave: "quantidade", rotulo: "Quantidade", exemplo: "3.41827500" },
      { chave: "valor_brl", rotulo: "Valor em BRL", exemplo: "1284902.17" },
    ],
  },
  cadoc5710: {
    descricao: "Uma linha por carteira/endereço com posição consolidada na data-base mensal.",
    colunas: [
      { chave: "data_base", rotulo: "Data-base", exemplo: "2026-08-31" },
      { chave: "carteira_endereco", rotulo: "Carteira/Endereço", exemplo: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
      { chave: "rede", rotulo: "Rede", exemplo: "Ethereum" },
      { chave: "ativo_virtual", rotulo: "Ativo", exemplo: "ETH" },
      { chave: "quantidade", rotulo: "Quantidade", exemplo: "2410.88000000" },
      { chave: "valor_brl", rotulo: "Valor em BRL", exemplo: "41220905.10" },
      { chave: "quantidade_staking", rotulo: "Quantidade em staking", exemplo: "1850.00000000" },
      { chave: "recompensa_acumulada", rotulo: "Recompensa acumulada", exemplo: "6.42910000" },
    ],
  },
  fiscal: {
    descricao: "Uma linha por serviço prestado (DPS) estruturado na competência.",
    colunas: [
      { chave: "tomador", rotulo: "Tomador", exemplo: "Bluewave Tecnologia S.A." },
      { chave: "tomador_documento", rotulo: "CNPJ do tomador", exemplo: "19.284.775/0001-33" },
      { chave: "municipio", rotulo: "Município", exemplo: "São Paulo" },
      { chave: "codigo_ibge", rotulo: "Código IBGE", exemplo: "3550308" },
      { chave: "codigo_servico", rotulo: "Código do serviço", exemplo: "17.01" },
      { chave: "descricao", rotulo: "Descrição", exemplo: "Assessoria ou consultoria de qualquer natureza" },
      { chave: "valor_servico", rotulo: "Valor do serviço", exemplo: "34500.00" },
      { chave: "aliquota_iss", rotulo: "Alíquota ISS", exemplo: "2.00" },
      { chave: "retencao", rotulo: "Retenção", exemplo: "Sim" },
    ],
  },
};

const EXTENSOES_ACEITAS = ["csv", "xlsx", "txt"];
const ATRASO_EM_PRE_VALIDACAO_MS = 650;
const ATRASO_RESULTADO_FINAL_MS = 1500;
const ATRASO_LIMPEZA_ESTADO_ZONA_MS = 2400;

type StatusArquivo = "recebido" | "em_pre_validacao" | "aceito" | "rejeitado";

interface MotivoRejeicao {
  codigo: string;
  mensagem: string;
}

interface ArquivoPendente {
  id: string;
  nome: string;
  tamanhoBytes: number;
  tipo: string;
  ultimaModificacao: number;
  recebidoEm: string;
  status: StatusArquivo;
  motivo?: MotivoRejeicao;
  linhasRecebidas: number;
  linhasResolvidas: number;
  linhasComPendencia: number;
}

interface ResultadoPreValidacao {
  status: "aceito" | "rejeitado";
  motivo?: MotivoRejeicao;
  linhasRecebidas: number;
  linhasResolvidas: number;
  linhasComPendencia: number;
}

interface LinhaArquivo {
  id: string;
  nome: string;
  tamanhoBytes: number;
  recebidoEm: string;
  canal: CanalIngestao;
  status: StatusArquivo;
  motivo?: MotivoRejeicao;
  removivel: boolean;
}

function obterExtensao(nomeArquivo: string): string {
  const partes = nomeArquivo.split(".");
  return partes.length > 1 ? (partes.at(-1) ?? "").toLowerCase() : "";
}

function somaCaracteres(texto: string): number {
  let soma = 0;
  for (let indice = 0; indice < texto.length; indice += 1) {
    soma += texto.charCodeAt(indice);
  }
  return soma;
}

function prevalidarArquivo(nomeArquivo: string, tamanhoBytes: number, moduloId: ModuloId): ResultadoPreValidacao {
  const extensao = obterExtensao(nomeArquivo);
  const primeiraColuna = ESPECIFICACAO_MODULOS[moduloId].colunas[0]?.chave ?? "coluna_obrigatoria";

  if (!EXTENSOES_ACEITAS.includes(extensao)) {
    return {
      status: "rejeitado",
      motivo: {
        codigo: "ING-E001",
        mensagem: `Formato não aceito ("${extensao || "sem extensão"}"). Envie um arquivo .csv, .xlsx ou .txt.`,
      },
      linhasRecebidas: 0,
      linhasResolvidas: 0,
      linhasComPendencia: 0,
    };
  }

  const linhasRecebidas = Math.max(1, Math.round(tamanhoBytes / 180));

  if (nomeArquivo.toLowerCase().includes("erro")) {
    return {
      status: "rejeitado",
      motivo: {
        codigo: "ING-E003",
        mensagem: `Coluna obrigatória "${primeiraColuna}" ausente na linha 1.`,
      },
      linhasRecebidas,
      linhasResolvidas: 0,
      linhasComPendencia: linhasRecebidas,
    };
  }

  const linhasComPendencia = Math.round((linhasRecebidas * (somaCaracteres(nomeArquivo) % 7)) / 100);
  const linhasResolvidas = linhasRecebidas - linhasComPendencia;

  return {
    status: "aceito",
    linhasRecebidas,
    linhasResolvidas,
    linhasComPendencia,
  };
}

const ROTULO_CANAL: Record<CanalIngestao, string> = {
  upload: "Upload manual",
  sftp: "SFTP",
  api: "Integração",
};

const ROTULO_STATUS: Record<StatusArquivo, string> = {
  recebido: "Recebido",
  em_pre_validacao: "Em pré-validação",
  aceito: "Aceito",
  rejeitado: "Rejeitado",
};

const CLASSE_STATUS: Record<StatusArquivo, string> = {
  recebido: "status-badge-neutral",
  em_pre_validacao: "status-badge-info",
  aceito: "status-badge-success",
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

  const [pendentes, setPendentes] = useState<ArquivoPendente[]>([]);
  const [zonaEstado, setZonaEstado] = useState<"repouso" | "arrastando" | "erro">("repouso");

  const inputRef = useRef<HTMLInputElement>(null);
  const contadorIdRef = useRef(0);
  const timeoutsPorArquivoRef = useRef<Map<string, ReturnType<typeof setTimeout>[]>>(new Map());
  const timeoutZonaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timeoutsPorArquivo = timeoutsPorArquivoRef.current;
    return () => {
      timeoutsPorArquivo.forEach((ids) => ids.forEach((id) => clearTimeout(id)));
      if (timeoutZonaRef.current) {
        clearTimeout(timeoutZonaRef.current);
      }
    };
  }, []);

  if (!periodo || !perfilAtivo || !usuarioId) {
    return null;
  }

  const especificacao = ESPECIFICACAO_MODULOS[periodo.moduloId];
  const avaliacaoSubir = podeExecutarStore(perfilAtivo, "subir_dados", periodoId, usuarioId);
  const autor = { usuarioId, perfilId: perfilAtivo };

  function agendar(id: string, atrasoMs: number, callback: () => void) {
    const timeoutId = setTimeout(callback, atrasoMs);
    const listaAtual = timeoutsPorArquivoRef.current.get(id) ?? [];
    timeoutsPorArquivoRef.current.set(id, [...listaAtual, timeoutId]);
  }

  function adicionarArquivos(lista: FileList | File[]) {
    const arquivos = Array.from(lista);
    if (arquivos.length === 0) {
      return;
    }

    let houveRejeicaoDeFormato = false;

    const novosPendentes: ArquivoPendente[] = arquivos.map((arquivo) => {
      contadorIdRef.current += 1;
      const id = `pend-${periodoId}-${contadorIdRef.current}`;
      const resultado = prevalidarArquivo(arquivo.name, arquivo.size, periodo.moduloId);

      if (resultado.status === "rejeitado" && resultado.motivo?.codigo === "ING-E001") {
        houveRejeicaoDeFormato = true;
      }

      agendar(id, ATRASO_EM_PRE_VALIDACAO_MS, () => {
        setPendentes((atual) =>
          atual.map((item) => (item.id === id ? { ...item, status: "em_pre_validacao" } : item))
        );
      });
      agendar(id, ATRASO_RESULTADO_FINAL_MS, () => {
        setPendentes((atual) =>
          atual.map((item) => (item.id === id ? { ...item, status: resultado.status, motivo: resultado.motivo } : item))
        );
      });

      return {
        id,
        nome: arquivo.name,
        tamanhoBytes: arquivo.size,
        tipo: arquivo.type || "desconhecido",
        ultimaModificacao: arquivo.lastModified,
        recebidoEm: new Date().toISOString(),
        status: "recebido",
        linhasRecebidas: resultado.linhasRecebidas,
        linhasResolvidas: resultado.linhasResolvidas,
        linhasComPendencia: resultado.linhasComPendencia,
      };
    });

    setPendentes((atual) => [...atual, ...novosPendentes]);

    if (houveRejeicaoDeFormato) {
      setZonaEstado("erro");
      if (timeoutZonaRef.current) {
        clearTimeout(timeoutZonaRef.current);
      }
      timeoutZonaRef.current = setTimeout(() => setZonaEstado("repouso"), ATRASO_LIMPEZA_ESTADO_ZONA_MS);
    }
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
    adicionarArquivos(evento.dataTransfer.files);
  }

  function aoSelecionarArquivos(evento: ChangeEvent<HTMLInputElement>) {
    if (evento.target.files) {
      adicionarArquivos(evento.target.files);
    }
    evento.target.value = "";
  }

  function removerPendente(id: string) {
    const timeoutsDoArquivo = timeoutsPorArquivoRef.current.get(id);
    timeoutsDoArquivo?.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsPorArquivoRef.current.delete(id);
    setPendentes((atual) => atual.filter((item) => item.id !== id));
  }

  function baixarModelo() {
    const cabecalho = especificacao.colunas.map((coluna) => coluna.chave).join(",");
    const linhaExemplo = especificacao.colunas.map((coluna) => coluna.exemplo).join(",");
    const conteudo = `${cabecalho}\n${linhaExemplo}\n`;
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `modelo_${periodo.moduloId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Modelo baixado. Preencha as colunas conforme o exemplo da primeira linha.");
  }

  const aceitosPendentes = pendentes.filter((item) => item.status === "aceito");
  const rejeitadosPendentes = pendentes.filter((item) => item.status === "rejeitado");
  const emProcessamento = pendentes.filter((item) => item.status === "recebido" || item.status === "em_pre_validacao");

  const totalLinhasReconhecidas = aceitosPendentes.reduce((total, item) => total + item.linhasResolvidas, 0);
  const totalLinhasComPendencia = aceitosPendentes.reduce((total, item) => total + item.linhasComPendencia, 0);

  const motivoBloqueio =
    aceitosPendentes.length === 0
      ? pendentes.length === 0
        ? "Envie ao menos um arquivo para confirmar o recebimento dos dados."
        : "Nenhum arquivo aceito para confirmar o envio. Corrija ou remova os arquivos rejeitados."
      : emProcessamento.length > 0
        ? "Aguarde a pré-validação dos arquivos terminar."
        : undefined;

  function confirmarEnvio() {
    if (aceitosPendentes.length === 0) {
      return;
    }
    let resultadoFinal: { sucesso: boolean; motivo?: string } = { sucesso: true };

    for (const arquivo of aceitosPendentes) {
      resultadoFinal = ingerirDados(periodoId, autor, {
        nomeArquivo: arquivo.nome,
        tamanhoBytes: arquivo.tamanhoBytes,
        linhasRecebidas: arquivo.linhasRecebidas,
        linhasResolvidas: arquivo.linhasResolvidas,
        linhasComPendencia: arquivo.linhasComPendencia,
        canal: "upload",
      });
      if (!resultadoFinal.sucesso) {
        break;
      }
    }

    if (resultadoFinal.sucesso) {
      toast.success(
        `${aceitosPendentes.length} arquivo(s) confirmado(s) · ${formatarNumero(totalLinhasReconhecidas)} linha(s) reconhecida(s).`
      );
      setPendentes((atual) => atual.filter((item) => item.status !== "aceito"));
    } else {
      toast.error(resultadoFinal.motivo ?? "Não foi possível confirmar o envio dos dados.");
    }
  }

  const linhasHistorico: LinhaArquivo[] = periodo.lotes.map((lote) => ({
    id: lote.id,
    nome: lote.nomeArquivo,
    tamanhoBytes: lote.tamanhoBytes,
    recebidoEm: lote.recebidoEm,
    canal: lote.canal,
    status: "aceito",
    removivel: false,
  }));

  const linhasPendentes: LinhaArquivo[] = pendentes.map((item) => ({
    id: item.id,
    nome: item.nome,
    tamanhoBytes: item.tamanhoBytes,
    recebidoEm: item.recebidoEm,
    canal: "upload",
    status: item.status,
    motivo: item.motivo,
    removivel: true,
  }));

  const linhasTabela = [...linhasHistorico, ...linhasPendentes].sort((a, b) =>
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
          <span className={cn("status-badge", CLASSE_STATUS[linha.status])}>
            {linha.status === "recebido" || linha.status === "em_pre_validacao" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            {ROTULO_STATUS[linha.status]}
          </span>
          {linha.status === "rejeitado" && linha.motivo ? (
            <span className="block text-xs text-status-error-text">
              {linha.motivo.codigo} — {linha.motivo.mensagem}
            </span>
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
            onClick={() => removerPendente(linha.id)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null,
    },
  ];

  const inputId = `upload-recepcao-${periodoId}`;

  return (
    <div className={cn("space-y-4", className)}>
      <p className="sr-only" role="status" aria-live="polite">
        {pendentes.length > 0
          ? `${aceitosPendentes.length} arquivo(s) aceito(s), ${rejeitadosPendentes.length} rejeitado(s), ${emProcessamento.length} em processamento.`
          : ""}
      </p>

      {avaliacaoSubir.visivel ? (
        <>
          <div data-tour="upload-layout" className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-neutral-700">Layout esperado do arquivo</h2>
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
            <div className="overflow-x-auto rounded-md border border-neutral-100">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                    {especificacao.colunas.map((coluna) => (
                      <th key={coluna.chave} className="whitespace-nowrap px-3 py-2 font-medium">
                        {coluna.rotulo}
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
          </div>

          {avaliacaoSubir.permitido ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Enviar arquivos</h2>
              <div
                role="button"
                tabIndex={0}
                data-tour="upload-dropzone"
                aria-label="Área para arrastar arquivos ou selecionar do computador. Formatos aceitos: CSV, XLSX ou TXT."
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
                  accept=".csv,.xlsx,.txt"
                  tabIndex={-1}
                  className="sr-only"
                  onChange={aoSelecionarArquivos}
                />
                <UploadCloud className="size-8 text-neutral-400" aria-hidden="true" />
                <p className="text-sm font-medium text-neutral-700">
                  Arraste arquivos aqui ou <span className="text-brand-700 underline">clique para selecionar</span>
                </p>
                <p className="text-xs text-neutral-500">Aceita .csv, .xlsx ou .txt · vários arquivos por vez.</p>
                {zonaEstado === "erro" ? (
                  <p role="alert" className="text-xs font-medium text-status-error-text">
                    Formato não aceito. Envie arquivos .csv, .xlsx ou .txt.
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
      ) : null}

      <div data-tour="upload-tabela-arquivos" className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Arquivos recebidos</h2>
        <TabelaDados
          colunas={colunasTabela}
          dados={linhasTabela}
          chave={(linha) => linha.id}
          tituloVazio="Nenhum arquivo recebido"
          mensagemVazia={
            avaliacaoSubir.visivel
              ? "Envie um arquivo para começar a ingestão desta competência."
              : "O time Operacional da instituição ainda não enviou os dados desta competência."
          }
        />
      </div>

      {avaliacaoSubir.visivel && avaliacaoSubir.permitido ? (
        <div data-tour="upload-confirmar-envio" className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Resumo da pré-validação</h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md bg-neutral-50 p-3">
              <dt className="text-xs text-neutral-500">Arquivos aceitos</dt>
              <dd className="text-sm font-medium text-neutral-700">{aceitosPendentes.length}</dd>
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
              <dt className="text-xs text-neutral-500">Arquivos rejeitados</dt>
              <dd className="text-sm font-medium text-neutral-700">{rejeitadosPendentes.length}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={confirmarEnvio} disabled={Boolean(motivoBloqueio)}>
              Confirmar envio dos dados
            </Button>
            {motivoBloqueio ? <p className="text-sm text-status-error-text">{motivoBloqueio}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
