"use client";

import { CalendarClock, TriangleAlert } from "lucide-react";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { ROTULOS_STATUS_CANONICO } from "@/lib/fornecimento";
import { formatarData } from "@/lib/formatadores";
import type { ResultadoCompletude } from "@/lib/tipos";
import { CLASSE_STATUS_CANONICO, descreverContagemPrazo } from "@/components/fornecimento/constantes";
import { cn } from "@/lib/utils";

export interface PainelCompletudeProps {
  completude: ResultadoCompletude;
  competenciaRotulo: string;
  moduloNome: string;
}

export function PainelCompletude({
  completude,
  competenciaRotulo,
  moduloNome,
}: PainelCompletudeProps) {
  const contagem = descreverContagemPrazo(completude.diasParaPrazo, completude.atrasado);
  const prazoCritico = completude.atrasado || completude.diasParaPrazo <= 3;

  return (
    <section
      data-tour="fornecimento-completude"
      aria-labelledby="fornecimento-completude-titulo"
      className="rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="fornecimento-completude-titulo"
            className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700"
          >
            Completude da competência
            <BadgeAjuda chave="fornecimento.completude" tamanho="sm" />
          </h2>
          <p className="text-sm text-neutral-500">
            {moduloNome} · {competenciaRotulo}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("status-badge", CLASSE_STATUS_CANONICO[completude.statusCanonico])}>
            {ROTULOS_STATUS_CANONICO[completude.statusCanonico]}
          </span>
          <BadgeAjuda chave="fornecimento.statusCanonico" tamanho="xs" align="end" />
        </span>
      </div>

      <Progress
        value={completude.percentual}
        aria-label={`Insumos obrigatórios fornecidos nesta competência: ${completude.percentual}%`}
        className="[&_[data-slot=progress-track]]:h-2"
      >
        <ProgressLabel className="text-sm font-medium text-neutral-700">
          {completude.totalFornecidos} de {completude.totalObrigatorios} insumos obrigatórios
          fornecidos
        </ProgressLabel>
        <ProgressValue className="text-sm font-semibold text-neutral-700 tabular-nums">
          {() => `${completude.percentual}%`}
        </ProgressValue>
      </Progress>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-neutral-50 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-neutral-500">
            Prazo regulatório
            <BadgeAjuda chave="fornecimento.prazo" tamanho="xs" />
          </dt>
          <dd className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
            <CalendarClock className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
            {formatarData(completude.prazoEntrega)}
          </dd>
        </div>
        <div className="rounded-md bg-neutral-50 p-3">
          <dt className="text-xs text-neutral-500">Contagem regressiva</dt>
          <dd
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              prazoCritico ? "text-status-error-text" : "text-neutral-700"
            )}
          >
            {prazoCritico ? (
              <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            ) : null}
            <span className="first-letter:uppercase">{contagem}</span>
          </dd>
        </div>
        <div className="rounded-md bg-neutral-50 p-3">
          <dt className="text-xs text-neutral-500">Pendências abertas</dt>
          <dd className="text-sm font-medium text-neutral-700">
            {completude.pendencias.length === 0
              ? "Nenhuma"
              : `${completude.pendencias.length} insumo(s)`}
          </dd>
        </div>
      </dl>

      <p className="sr-only" role="status" aria-live="polite">
        Completude em {completude.percentual} por cento. {completude.pendencias.length} pendência(s).
        Prazo {contagem}.
      </p>
    </section>
  );
}
