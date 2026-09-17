import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatarData } from "@/lib/formatadores";

export interface CardPrazoProps {
  titulo: string;
  subtitulo: string;
  dataVencimento: string;
  diasParaPrazo: number;
  href: string;
  className?: string;
}

export function CardPrazo({
  titulo,
  subtitulo,
  dataVencimento,
  diasParaPrazo,
  href,
  className,
}: CardPrazoProps) {
  const vencido = diasParaPrazo < 0;
  const proximo = diasParaPrazo >= 0 && diasParaPrazo <= 5;

  const rotuloSituacao = vencido
    ? `Venceu há ${Math.abs(diasParaPrazo)} ${Math.abs(diasParaPrazo) === 1 ? "dia" : "dias"}`
    : diasParaPrazo === 0
      ? "Vence hoje"
      : `Vence em ${diasParaPrazo} ${diasParaPrazo === 1 ? "dia" : "dias"}`;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start justify-between gap-3 rounded-md border p-3 transition-colors hover:opacity-90",
        vencido && "border-status-error-border bg-status-error-bg",
        !vencido && proximo && "border-status-warning-border bg-status-warning-bg",
        !vencido && !proximo && "border-status-info-border bg-status-info-bg",
        className
      )}
    >
      <div>
        <p
          className={cn(
            "text-sm font-medium",
            vencido && "text-status-error-text",
            !vencido && proximo && "text-status-warning-text",
            !vencido && !proximo && "text-status-info-text"
          )}
        >
          {titulo}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {subtitulo} · Vencimento: {formatarData(dataVencimento)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-xs font-bold whitespace-nowrap",
          vencido && "text-status-error-text",
          !vencido && proximo && "text-status-warning-text",
          !vencido && !proximo && "text-status-info-text"
        )}
      >
        {rotuloSituacao}
      </span>
    </Link>
  );
}
