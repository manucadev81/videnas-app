"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { BellRing, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { BadgeSentido } from "@/components/evidencias/badge-sentido";
import { ValorHash } from "@/components/evidencias/valor-hash";
import {
  CLASSE_STATUS_INSUMO,
  descreverContagemPrazo,
} from "@/components/fornecimento/constantes";
import { buscarInsumos, calcularCompletude, ROTULOS_STATUS_INSUMO } from "@/lib/fornecimento";
import { podeVerRota } from "@/lib/permissoes";
import { fornecimentosDoPeriodo, lacresDoPeriodo, useEvidenciasStore } from "@/lib/store/evidencias";
import { usePeriodosStore, type AutorAcao } from "@/lib/store/periodos";
import { formatarData, formatarDataHora } from "@/lib/formatadores";
import type { PeriodoObrigacao } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export interface PainelAcompanhamentoFornecimentoProps {
  periodo: PeriodoObrigacao;
  autor: AutorAcao;
  className?: string;
}

export function PainelAcompanhamentoFornecimento({
  periodo,
  autor,
  className,
}: PainelAcompanhamentoFornecimentoProps) {
  const fornecimentosPorPeriodo = useEvidenciasStore((estado) => estado.fornecimentos);
  const lacres = useEvidenciasStore((estado) => estado.lacres);
  const notificarCliente = usePeriodosStore((estado) => estado.notificarCliente);
  const podeExecutarStore = usePeriodosStore((estado) => estado.podeExecutar);

  const fornecimentos = useMemo(
    () => fornecimentosDoPeriodo(fornecimentosPorPeriodo, periodo.id),
    [fornecimentosPorPeriodo, periodo.id]
  );

  const completude = useMemo(
    () => calcularCompletude(periodo, fornecimentos),
    [periodo, fornecimentos]
  );

  const insumos = buscarInsumos(periodo.moduloId);

  const lacresEntrada = useMemo(
    () =>
      lacresDoPeriodo(lacres, periodo.id)
        .filter((lacre) => lacre.sentido === "entrada")
        .slice(0, 5),
    [lacres, periodo.id]
  );

  const contagem = descreverContagemPrazo(completude.diasParaPrazo, completude.atrasado);
  const prazoCritico = completude.atrasado || completude.diasParaPrazo <= 3;
  const semPendencia = completude.pendencias.length === 0;

  const avaliacaoNotificar = podeExecutarStore(
    autor.perfilId,
    "notificar_cliente",
    periodo.id,
    autor.usuarioId
  );
  const podeNotificar = avaliacaoNotificar.permitido && !semPendencia;
  const motivoDesabilitado = semPendencia
    ? "Nada pendente nesta competência — não há o que notificar."
    : (avaliacaoNotificar.motivo ?? "Notificação indisponível no estado atual do período.");

  function aoNotificar() {
    const resultado = notificarCliente(periodo.id, autor, completude.pendencias.length);
    if (!resultado.sucesso) {
      toast.error(resultado.motivo ?? "Não foi possível notificar o cliente.");
      return;
    }
    toast.success(
      completude.pendencias.length === 1
        ? "Cliente notificado: 1 insumo pendente cobrado."
        : `Cliente notificado: ${completude.pendencias.length} insumos pendentes cobrados.`
    );
  }

  const ehExecutor = autor.perfilId === "executor";
  const ehOperacional = autor.perfilId === "operacional";
  const podeVerFornecimento = podeVerRota(autor.perfilId, "/app/fornecimento");
  const mostrarRodape = !ehExecutor && (avaliacaoNotificar.visivel || podeVerFornecimento);

  const botaoNotificar = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={!podeNotificar}
      onClick={aoNotificar}
      data-tour="acompanhamento-notificar-cliente"
    >
      <BellRing aria-hidden="true" />
      Notificar cliente do que falta
    </Button>
  );

  return (
    <div data-tour="acompanhamento-fornecimento" className={cn("space-y-4", className)}>
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
              Fornecimento do cliente
              <BadgeAjuda chave="fornecimento.acompanhamento" tamanho="sm" />
            </h2>
            <p className="text-sm text-neutral-500">
              {ehExecutor
                ? "Quem envia os insumos desta competência é o Cliente / Fornecedor de dados. Você não fornece dados: só gera o arquivo a partir do que já chegou."
                : ehOperacional
                  ? "Quem envia os insumos desta competência é o Cliente / Fornecedor de dados, em Fornecimento de dados. Aqui você acompanha o que já chegou e cobra o que falta — sem subir dados em nome dele."
                  : "Quem envia os insumos desta competência é o Cliente / Fornecedor de dados. Você consulta o andamento; cobrar o que falta é papel do Operacional / Suporte ao cliente."}
            </p>
          </div>
          <span
            className={cn(
              "status-badge shrink-0 first-letter:uppercase",
              prazoCritico ? "status-badge-error" : "status-badge-neutral"
            )}
          >
            {contagem}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-neutral-50 p-3">
            <dt className="text-xs text-neutral-500">Completude</dt>
            <dd className="text-sm font-medium text-neutral-700">
              {completude.totalFornecidos} de {completude.totalObrigatorios} insumos obrigatórios
            </dd>
          </div>
          <div className="rounded-md bg-neutral-50 p-3">
            <dt className="text-xs text-neutral-500">Prazo regulatório</dt>
            <dd className="text-sm font-medium text-neutral-700">
              {formatarData(completude.prazoEntrega)}
            </dd>
          </div>
          <div className="rounded-md bg-neutral-50 p-3">
            <dt className="text-xs text-neutral-500">Pendências abertas</dt>
            <dd className="text-sm font-medium text-neutral-700">
              {semPendencia ? "Nenhuma" : `${completude.pendencias.length} insumo(s)`}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <h3 className="mb-3 font-display text-base font-bold text-neutral-700">
          Insumos exigidos × fornecidos
        </h3>
        <ul className="space-y-2">
          {insumos.map((insumo) => {
            const fornecimento = fornecimentos[insumo.id];
            const status = fornecimento?.status ?? "pendente";
            return (
              <li
                key={insumo.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-neutral-50 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-700">{insumo.rotulo}</p>
                  <p className="text-xs text-neutral-500">
                    {insumo.obrigatorio ? "Obrigatório" : "Opcional"}
                  </p>
                </div>
                <span className={cn("status-badge shrink-0", CLASSE_STATUS_INSUMO[status])}>
                  {ROTULOS_STATUS_INSUMO[status]}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {semPendencia || !ehOperacional ? null : (
        <div className="rounded-lg border border-status-warning-border bg-status-warning-bg p-4">
          <h3 className="mb-2 text-sm font-semibold text-status-warning-text">
            O que ainda falta
          </h3>
          <ul className="space-y-1.5">
            {completude.pendencias.map((pendencia) => (
              <li key={pendencia.insumoId} className="text-sm text-neutral-700">
                <span className="font-medium">{pendencia.rotulo}</span> — {pendencia.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ehExecutor || lacresEntrada.length === 0 ? null : (
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h3 className="mb-3 font-display text-base font-bold text-neutral-700">
            Evidências de entrada recebidas
          </h3>
          <ul className="space-y-2">
            {lacresEntrada.map((lacre) => (
              <li
                key={lacre.id}
                className="flex flex-wrap items-center gap-2 rounded-md bg-neutral-50 p-3 text-sm"
              >
                <BadgeSentido sentido={lacre.sentido} />
                <span className="min-w-0 flex-1 truncate text-neutral-700">
                  {lacre.origemNome}
                </span>
                <ValorHash hash={lacre.hashSha256} truncado />
                <span className="shrink-0 text-xs text-neutral-500">
                  {formatarDataHora(lacre.seladoEm)} · {lacre.seladoPorNome}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mostrarRodape ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-5">
          {avaliacaoNotificar.visivel ? (
            <TooltipProvider>
              {podeNotificar ? (
                botaoNotificar
              ) : (
                <Tooltip>
                  <TooltipTrigger render={<span tabIndex={0} />}>{botaoNotificar}</TooltipTrigger>
                  <TooltipContent>{motivoDesabilitado}</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          ) : null}

          {podeVerFornecimento ? (
            <Button
              render={<Link href="/app/fornecimento" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
            >
              <Eye aria-hidden="true" />
              Ver fornecimento do cliente
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
