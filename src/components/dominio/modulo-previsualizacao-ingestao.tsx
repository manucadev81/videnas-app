"use client";

import { useRef } from "react";
import { AlertTriangle, CheckCircle2, FileWarning, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { formatarCompetencia, formatarNumero, formatarTamanhoArquivo } from "@/lib/formatadores";
import type { NaoConformidade, ResultadoPreValidacao } from "@/lib/ingestao";
import { cn } from "@/lib/utils";

export interface PrevisualizacaoIngestaoProps {
  resultado: ResultadoPreValidacao | null;
  restantesNaFila: number;
  onAceitar: () => void;
  onRejeitar: () => void;
  onDescartar: () => void;
}

interface ItemResumo {
  rotulo: string;
  valor: string;
  alerta?: boolean;
}

interface LinhaAmostra {
  chaveLinha: string;
  valores: Record<string, string>;
}

function construirResumo(resultado: ResultadoPreValidacao): ItemResumo[] {
  const { resumo } = resultado;
  const competenciaDetectada = resumo.competenciaDetectada
    ? formatarCompetencia(resumo.competenciaDetectada)
    : "não identificada";

  return [
    { rotulo: "Arquivo", valor: resumo.nomeArquivo },
    { rotulo: "Tamanho", valor: formatarTamanhoArquivo(resumo.tamanhoBytes) },
    { rotulo: "Obrigação", valor: resumo.moduloId },
    { rotulo: "Competência do período", valor: formatarCompetencia(resumo.competenciaEsperada) },
    {
      rotulo: "Competência detectada",
      valor: competenciaDetectada,
      alerta: resumo.competenciaDetectada !== resumo.competenciaEsperada,
    },
    {
      rotulo: "Instituição detectada",
      valor: resumo.instituicaoDetectada ?? "não identificada",
      alerta: resumo.instituicaoDetectada !== resumo.instituicaoEsperada,
    },
    { rotulo: "Delimitador", valor: resumo.rotuloDelimitador },
    { rotulo: "Linhas lidas", valor: formatarNumero(resumo.linhasLidas) },
    { rotulo: "Linhas válidas", valor: formatarNumero(resumo.linhasValidas) },
    {
      rotulo: "Linhas com ressalva",
      valor: formatarNumero(resumo.linhasComRessalva),
    },
    {
      rotulo: "Linhas com erro",
      valor: formatarNumero(resumo.linhasComPendencia),
      alerta: resumo.linhasComPendencia > 0,
    },
  ];
}

function localizacao(item: NaoConformidade): string | null {
  if (item.linha !== null && item.campo) return `Linha ${item.linha} · campo ${item.campo}`;
  if (item.linha !== null) return `Linha ${item.linha}`;
  if (item.campo) return `Campo ${item.campo}`;
  return null;
}

export function PrevisualizacaoIngestao({
  resultado,
  restantesNaFila,
  onAceitar,
  onRejeitar,
  onDescartar,
}: PrevisualizacaoIngestaoProps) {
  const botaoRejeitarRef = useRef<HTMLButtonElement>(null);

  if (!resultado) {
    return null;
  }

  const { resumo, amostra, naoConformidades, totalBloqueantes, totalAvisos, conforme } = resultado;

  const dadosAmostra = amostra.map((valores, indice) => ({ chaveLinha: `amostra-${indice + 1}`, valores }));

  const colunasAmostra: ColunaTabela<LinhaAmostra>[] = resultado.colunasAmostra
    .filter((coluna) => resumo.colunasDetectadas.includes(coluna.chave))
    .map((coluna) => ({
      id: coluna.chave,
      cabecalho: coluna.rotulo,
      alinhamento: coluna.tipo === "valor" || coluna.tipo === "quantidade" ? "right" : "left",
      renderizar: (linha) => linha.valores[coluna.chave] || "—",
    }));

  const itensResumo = construirResumo(resultado);

  const motivoBloqueio = conforme
    ? undefined
    : `Existem ${totalBloqueantes} não conformidade(s) bloqueante(s). Corrija o arquivo na origem e reenvie — o lote não pode ser aceito assim.`;

  const botaoAceitar = (
    <Button type="button" disabled={!conforme} onClick={onAceitar}>
      <CheckCircle2 className="size-4" aria-hidden="true" />
      Aceitar lote
    </Button>
  );

  return (
    <TooltipProvider>
      <Dialog
        open
        onOpenChange={(aberto) => {
          if (!aberto) {
            onDescartar();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          initialFocus={botaoRejeitarRef}
          className="max-h-[88vh] w-[calc(100%-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-4xl"
        >
          <DialogHeader className="gap-2 p-5 pb-4">
            <DialogTitle className="font-display text-lg font-bold text-neutral-700">
              Conferir arquivo antes do aceite
            </DialogTitle>
            <DialogDescription>
              Confira o conteúdo lido de <strong className="font-medium text-neutral-700">{resumo.nomeArquivo}</strong> e as
              não conformidades encontradas na pré-validação. Nenhum dado entra na competência antes do seu aceite.
              {restantesNaFila > 0 ? ` Há mais ${restantesNaFila} arquivo(s) aguardando conferência.` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 overflow-y-auto border-t border-neutral-200 p-5">
            <section aria-labelledby="previsualizacao-resumo-titulo">
              <h3 id="previsualizacao-resumo-titulo" className="mb-2 text-sm font-semibold text-neutral-700">
                Resumo da leitura
              </h3>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {itensResumo.map((item) => (
                  <div key={item.rotulo} className="rounded-md bg-neutral-50 p-3">
                    <dt className="text-xs text-neutral-500">{item.rotulo}</dt>
                    <dd
                      className={cn(
                        "break-words text-sm font-medium",
                        item.alerta ? "text-status-error-text" : "text-neutral-700"
                      )}
                    >
                      {item.valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="previsualizacao-amostra-titulo">
              <h3 id="previsualizacao-amostra-titulo" className="mb-2 text-sm font-semibold text-neutral-700">
                Amostra dos registros lidos
              </h3>
              {resumo.previsualizavel && amostra.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-md border border-neutral-200">
                    <TabelaDados
                      colunas={colunasAmostra}
                      dados={dadosAmostra}
                      chave={(linha) => linha.chaveLinha}
                      tituloVazio="Nenhum registro legível"
                      mensagemVazia="O arquivo não produziu linhas de dados."
                    />
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    Exibindo as {amostra.length} primeiras linhas de {formatarNumero(resumo.linhasLidas)} lida(s).
                  </p>
                </>
              ) : (
                <div className="flex items-start gap-2 rounded-md border border-status-warning-border bg-status-warning-bg p-3 text-sm text-status-warning-text">
                  <FileWarning className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>
                    Não foi possível pré-visualizar o conteúdo deste arquivo. Sem amostra legível, o operador não tem como
                    conferir o que seria enviado — por isso o aceite fica indisponível.
                  </p>
                </div>
              )}
            </section>

            <section aria-labelledby="previsualizacao-nao-conformidades-titulo">
              <h3
                id="previsualizacao-nao-conformidades-titulo"
                className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-neutral-700"
              >
                Não conformidades
                <span className={cn("status-badge", totalBloqueantes > 0 ? "status-badge-error" : "status-badge-neutral")}>
                  {totalBloqueantes} bloqueante(s)
                </span>
                <span className={cn("status-badge", totalAvisos > 0 ? "status-badge-warning" : "status-badge-neutral")}>
                  {totalAvisos} aviso(s)
                </span>
              </h3>

              {naoConformidades.length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border border-status-success-border bg-status-success-bg p-3 text-sm text-status-success-text">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>Nenhuma não conformidade encontrada. O arquivo está aderente ao layout desta obrigação.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {naoConformidades.map((item) => {
                    const bloqueante = item.severidade === "bloqueante";
                    const posicao = localizacao(item);
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "rounded-md border p-3",
                          bloqueante
                            ? "border-status-error-border bg-status-error-bg"
                            : "border-status-warning-border bg-status-warning-bg"
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {bloqueante ? (
                            <ShieldAlert className="size-4 shrink-0 text-status-error-text" aria-hidden="true" />
                          ) : (
                            <AlertTriangle className="size-4 shrink-0 text-status-warning-text" aria-hidden="true" />
                          )}
                          <span className={cn("status-badge", bloqueante ? "status-badge-error" : "status-badge-warning")}>
                            {item.codigo}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              bloqueante ? "text-status-error-text" : "text-status-warning-text"
                            )}
                          >
                            {bloqueante ? "Bloqueante" : "Aviso"}
                          </span>
                          {posicao ? <span className="text-xs text-neutral-500">{posicao}</span> : null}
                        </div>
                        <p className="mt-1.5 text-sm text-neutral-700">{item.mensagem}</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          <span className="font-medium text-neutral-700">Ajuste necessário: </span>
                          {item.ajuste}
                        </p>
                        {item.ocorrenciasAdicionais > 0 ? (
                          <p className="mt-1 text-xs text-neutral-500">
                            + {formatarNumero(item.ocorrenciasAdicionais)} ocorrência(s) semelhante(s) neste arquivo.
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <DialogFooter className="mx-0 mb-0 items-center gap-3 rounded-b-xl">
            <p className="mr-auto text-xs text-neutral-500">
              {conforme
                ? "Ao aceitar, o lote entra na competência e a etapa de ingestão avança."
                : "Arquivos com não conformidade bloqueante não podem ser aceitos."}
            </p>
            <Button ref={botaoRejeitarRef} type="button" variant="outline" onClick={onRejeitar}>
              Rejeitar / Solicitar ajustes
            </Button>
            {conforme ? (
              botaoAceitar
            ) : (
              <Tooltip>
                <TooltipTrigger render={<span tabIndex={0} />}>{botaoAceitar}</TooltipTrigger>
                <TooltipContent>{motivoBloqueio}</TooltipContent>
              </Tooltip>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
