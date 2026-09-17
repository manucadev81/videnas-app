import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventoAuditoria } from "@/lib/tipos";
import { formatarDataHora } from "@/lib/formatadores";

export interface TimelineAuditoriaProps {
  eventos: EventoAuditoria[];
  className?: string;
}

export function TimelineAuditoria({ eventos, className }: TimelineAuditoriaProps) {
  if (eventos.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Nenhum evento de auditoria encontrado para os filtros selecionados.
      </p>
    );
  }

  return (
    <ol className={cn("space-y-4 py-2", className)}>
      {eventos.map((evento, indice) => (
        <li key={evento.id} className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-700 bg-brand-50">
              <Check className="size-4 text-brand-700" aria-hidden="true" />
            </div>
            {indice < eventos.length - 1 && <div className="my-2 h-full w-0.5 bg-neutral-200" />}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="font-mono text-xs text-neutral-500">{formatarDataHora(evento.ocorridoEm)}</p>
              <p className="text-sm font-medium text-neutral-700">{evento.usuarioNome}</p>
              <span className="text-xs text-neutral-500">
                ({evento.perfilId} · {evento.lado === "videnas" ? "Videnas" : "Cliente"})
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-600">{evento.rotuloTipo}</p>
            {evento.referencia ? (
              <p className="mt-0.5 font-mono text-xs text-neutral-400">Ref.: {evento.referencia}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
