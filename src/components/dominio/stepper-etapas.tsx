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
  variante?: "completo" | "compacto";
}

const CLASSES_CIRCULO: Record<EstadoEtapa, string> = {
  concluida: "bg-brand-700 text-white",
  atual: "bg-brand-100 text-brand-700 border-2 border-brand-700",
  bloqueada: "bg-neutral-200 text-neutral-400",
  erro: "bg-status-error-bg text-status-error-text border-2 border-status-error-border",
};

const CLASSES_LABEL_COMPACTO: Record<EstadoEtapa, string> = {
  concluida: "text-neutral-600",
  atual: "text-neutral-700 font-medium",
  bloqueada: "text-neutral-400",
  erro: "text-neutral-600",
};

function descreverEtapaCompacta(etapa: EtapaStepperItem): string {
  if (etapa.estado === "concluida") {
    const quando = etapa.concluidaEm ? `: concluída em ${formatarDataHora(etapa.concluidaEm)}` : ": concluída";
    const responsavel = etapa.responsavelNome ? ` · ${etapa.responsavelNome}` : "";
    return `${etapa.rotulo}${quando}${responsavel}`;
  }
  if (etapa.estado === "bloqueada") {
    return `${etapa.rotulo}: aguardando etapas anteriores`;
  }
  if (etapa.estado === "erro") {
    return `${etapa.rotulo}: com exceções, necessita atenção`;
  }
  return `${etapa.rotulo}: etapa atual`;
}

export function StepperEtapas({
  etapas,
  aoSelecionar,
  etapaSelecionadaId,
  comAjuda = false,
  className,
  variante = "completo",
}: StepperEtapasProps) {
  const interativo = Boolean(aoSelecionar);

  if (variante === "compacto") {
    return (
      <ol
        data-tour="stepper-etapas"
        className={cn(
          "flex max-w-xl items-start gap-0 overflow-x-auto -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className
        )}
        aria-label="Etapas da obrigação regulatória"
      >
        {etapas.map((etapa, indice) => {
          const selecionada = etapaSelecionadaId === etapa.id;
          const ultima = indice === etapas.length - 1;
          const descricao = descreverEtapaCompacta(etapa);

          return (
            <li key={etapa.id} className="flex items-start">
              <div className="flex shrink-0 flex-col items-center gap-1">
                <button
                  type="button"
                  disabled={!interativo}
                  onClick={() => aoSelecionar?.(etapa.id)}
                  aria-current={selecionada ? "step" : undefined}
                  title={descricao}
                  aria-label={descricao}
                  data-tour={`stepper-item-${etapa.id}`}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    CLASSES_CIRCULO[etapa.estado],
                    interativo && "cursor-pointer",
                    !interativo && "cursor-default",
                    selecionada && "ring-2 ring-brand-700 ring-offset-2"
                  )}
                >
                  {etapa.estado === "concluida" && <Check className="size-3.5" aria-hidden="true" />}
                  {etapa.estado === "bloqueada" && <Lock className="size-3" aria-hidden="true" />}
                  {etapa.estado === "erro" && <TriangleAlert className="size-3.5" aria-hidden="true" />}
                  {etapa.estado === "atual" && <span>{indice + 1}</span>}
                </button>
                <p
                  className={cn(
                    "w-16 text-center text-[11px] leading-tight",
                    CLASSES_LABEL_COMPACTO[etapa.estado]
                  )}
                >
                  {etapa.rotulo}
                </p>
              </div>
              {!ultima ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    "mt-3.5 h-px min-w-6 flex-1",
                    etapa.estado === "concluida" ? "bg-brand-700" : "bg-neutral-200"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  }

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
