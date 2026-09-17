import { Check, Lock, TriangleAlert } from "lucide-react";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { chaveAjudaEtapa } from "@/lib/ajuda/textos";
import { cn } from "@/lib/utils";
import type { EtapaId } from "@/lib/tipos";
import { formatarDataHora } from "@/lib/formatadores";

export type EstadoEtapa = "concluida" | "atual" | "bloqueada" | "erro";

export interface EtapaStepperItem {
  id: EtapaId;
  rotulo: string;
  estado: EstadoEtapa;
  concluidaEm?: string | null;
  responsavelNome?: string | null;
}

export interface StepperEtapasProps {
  etapas: EtapaStepperItem[];
  aoSelecionar?: (etapaId: EtapaId) => void;
  etapaSelecionadaId?: EtapaId;
  comAjuda?: boolean;
  className?: string;
}

const CLASSES_CIRCULO: Record<EstadoEtapa, string> = {
  concluida: "bg-brand-700 text-white",
  atual: "bg-brand-100 text-brand-700 border-2 border-brand-700",
  bloqueada: "bg-neutral-200 text-neutral-400",
  erro: "bg-status-error-bg text-status-error-text border-2 border-status-error-border",
};

export function StepperEtapas({
  etapas,
  aoSelecionar,
  etapaSelecionadaId,
  comAjuda = false,
  className,
}: StepperEtapasProps) {
  return (
    <ol
      data-tour="stepper-etapas"
      className={cn(
        "flex flex-col gap-4 border-b border-neutral-200 bg-white px-4 py-4 md:flex-row md:items-start md:justify-between md:gap-2 md:px-6",
        className
      )}
      aria-label="Etapas da obrigação regulatória"
    >
      {etapas.map((etapa, indice) => {
        const interativo = Boolean(aoSelecionar);
        const selecionada = etapaSelecionadaId === etapa.id;

        return (
          <li key={etapa.id} className="flex flex-1 items-start gap-3 md:flex-col md:items-center md:text-center">
            <button
              type="button"
              disabled={!interativo}
              onClick={() => aoSelecionar?.(etapa.id)}
              aria-current={selecionada ? "step" : undefined}
              data-tour={`stepper-item-${etapa.id}`}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                CLASSES_CIRCULO[etapa.estado],
                interativo && "cursor-pointer",
                !interativo && "cursor-default",
                selecionada && "ring-2 ring-brand-700 ring-offset-2"
              )}
            >
              {etapa.estado === "concluida" && <Check className="size-5" aria-hidden="true" />}
              {etapa.estado === "bloqueada" && <Lock className="size-4" aria-hidden="true" />}
              {etapa.estado === "erro" && <TriangleAlert className="size-5" aria-hidden="true" />}
              {(etapa.estado === "atual") && <span>{indice + 1}</span>}
            </button>

            <div className="flex flex-col gap-0.5 md:items-center">
              <p className="flex items-center gap-1 text-sm font-medium text-neutral-700">
                {etapa.rotulo}
                {comAjuda ? <BadgeAjuda chave={chaveAjudaEtapa(etapa.id)} tamanho="xs" /> : null}
              </p>
              {etapa.concluidaEm ? (
                <p className="text-xs text-neutral-500">
                  {formatarDataHora(etapa.concluidaEm)}
                  {etapa.responsavelNome ? ` · ${etapa.responsavelNome}` : ""}
                </p>
              ) : (
                <p className="text-xs text-neutral-400">
                  {etapa.estado === "bloqueada" ? "Aguardando etapas anteriores" : "—"}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
