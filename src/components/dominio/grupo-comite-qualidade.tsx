import Link from "next/link";
import { Gavel } from "lucide-react";
import { descreverContagemPrazo } from "@/components/fornecimento/constantes";
import { situacaoPrazoComite } from "@/lib/comite";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { calcularPeriodoDerivado } from "@/lib/mock/periodos";
import { contarNegativas, limiarNegativas, rotuloTotalNegativas } from "@/lib/negacoes";
import { formatarCompetenciaCurta, formatarData } from "@/lib/formatadores";
import type { ModuloId, PeriodoObrigacao } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export interface GrupoComiteQualidadeProps {
  periodos: PeriodoObrigacao[];
  rotaPeriodo: (moduloId: ModuloId, periodoId: string) => string;
  mostrarInstituicao?: boolean;
  className?: string;
}

export function GrupoComiteQualidade({
  periodos,
  rotaPeriodo,
  mostrarInstituicao = false,
  className,
}: GrupoComiteQualidadeProps) {
  if (periodos.length === 0) {
    return null;
  }

  const ordenados = periodos
    .map((periodo) => ({ periodo, derivado: calcularPeriodoDerivado(periodo) }))
    .sort((a, b) => a.derivado.diasParaPrazo - b.derivado.diasParaPrazo);

  return (
    <section
      data-tour="grupo-comite-qualidade"
      aria-labelledby="grupo-comite-titulo"
      className={cn(
        "rounded-lg border border-status-warning-border bg-status-warning-bg p-5",
        className
      )}
    >
      <h2
        id="grupo-comite-titulo"
        className="flex items-center gap-2 font-display text-base font-bold text-status-warning-text"
      >
        <Gavel className="size-4" aria-hidden="true" />
        Em Comitê de Qualidade ({periodos.length})
      </h2>
      <p className="mt-1 text-xs text-status-warning-text">
        Competências com {limiarNegativas()} ou mais negativas. Ficam somente leitura até a decisão do
        Comitê de Qualidade, presidido pelo Administrador da Videnas. O prazo regulatório continua
        correndo.
      </p>
      <ul className="mt-3 space-y-2">
        {ordenados.map(({ periodo, derivado }) => {
          const modulo = buscarModulo(periodo.moduloId);
          const instituicao = buscarInstituicao(periodo.instituicaoId);
          const prazoComite = situacaoPrazoComite(periodo);
          const critico = prazoComite?.critico ?? (derivado.atrasado || derivado.diasParaPrazo <= 3);
          return (
            <li key={periodo.id}>
              <Link
                href={rotaPeriodo(periodo.moduloId, periodo.id)}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-white p-3 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-neutral-700">
                    {modulo.nome} · Competência {formatarCompetenciaCurta(periodo.competencia)}
                    {mostrarInstituicao && instituicao ? ` · ${instituicao.nomeFantasia}` : ""}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {rotuloTotalNegativas(contarNegativas(periodo))} negativas · Prazo{" "}
                    {formatarData(periodo.prazoEntrega)}
                  </span>
                  {prazoComite ? (
                    <span
                      className={cn(
                        "block text-xs font-medium",
                        critico ? "text-status-error-text" : "text-neutral-600"
                      )}
                    >
                      Prazo do Comitê: {formatarData(prazoComite.prazoIso)} · {prazoComite.texto}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "status-badge shrink-0 first-letter:uppercase",
                    critico ? "status-badge-error" : "status-badge-warning"
                  )}
                >
                  {descreverContagemPrazo(derivado.diasParaPrazo, derivado.atrasado)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
