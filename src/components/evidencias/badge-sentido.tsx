import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { ROTULOS_SENTIDO_LACRE } from "@/lib/evidencias/lacre";
import type { SentidoLacre } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export function BadgeSentido({
  sentido,
  className,
}: {
  sentido: SentidoLacre;
  className?: string;
}) {
  const ehEntrada = sentido === "entrada";
  const Icone = ehEntrada ? ArrowDownToLine : ArrowUpFromLine;

  return (
    <span
      className={cn(
        "status-badge px-2 py-1 text-xs",
        ehEntrada ? "status-badge-info" : "status-badge-success",
        className
      )}
    >
      <Icone className="size-3.5" aria-hidden="true" />
      <span aria-hidden="true">{ehEntrada ? "Entrada" : "Saída"}</span>
      <span className="sr-only">{ROTULOS_SENTIDO_LACRE[sentido]}</span>
    </span>
  );
}
