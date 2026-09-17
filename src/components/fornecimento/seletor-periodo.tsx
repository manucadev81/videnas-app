"use client";

import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { useEvidenciasStore, fornecimentosDoPeriodo } from "@/lib/store/evidencias";
import { calcularCompletude } from "@/lib/fornecimento";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { formatarCompetencia } from "@/lib/formatadores";
import { descreverContagemPrazo } from "@/components/fornecimento/constantes";
import type { ModuloId, PeriodoObrigacao } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const ORDEM_MODULOS: ModuloId[] = ["acam212", "cadoc5711", "cadoc5710", "fiscal"];

export interface SeletorPeriodoProps {
  periodos: PeriodoObrigacao[];
  selecionadoId: string | null;
  mostrarInstituicao: boolean;
  aoSelecionar: (periodoId: string) => void;
}

export function SeletorPeriodo({
  periodos,
  selecionadoId,
  mostrarInstituicao,
  aoSelecionar,
}: SeletorPeriodoProps) {
  const fornecimentosPorPeriodo = useEvidenciasStore((estado) => estado.fornecimentos);

  const modulosComPeriodos = ORDEM_MODULOS.map((moduloId) => ({
    moduloId,
    itens: periodos.filter((periodo) => periodo.moduloId === moduloId),
  })).filter((grupo) => grupo.itens.length > 0);

  return (
    <nav aria-label="Competências abertas para fornecimento" className="space-y-5">
      {modulosComPeriodos.map((grupo) => {
        const modulo = buscarModulo(grupo.moduloId);

        return (
          <div key={grupo.moduloId}>
            <h2 className="mb-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              {modulo.nome}
              {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
            </h2>
            <ul className="space-y-1.5">
              {grupo.itens.map((periodo) => {
                const completude = calcularCompletude(
                  periodo,
                  fornecimentosDoPeriodo(fornecimentosPorPeriodo, periodo.id)
                );
                const selecionado = periodo.id === selecionadoId;
                const instituicao = mostrarInstituicao
                  ? buscarInstituicao(periodo.instituicaoId)
                  : undefined;

                return (
                  <li key={periodo.id}>
                    <button
                      type="button"
                      aria-current={selecionado ? "true" : undefined}
                      onClick={() => aoSelecionar(periodo.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700",
                        selecionado
                          ? "border-brand-700 bg-brand-50"
                          : "border-neutral-200 bg-white hover:border-brand-400"
                      )}
                    >
                      <span className="block text-sm font-medium text-neutral-700">
                        {formatarCompetencia(periodo.competencia)}
                      </span>
                      {instituicao ? (
                        <span className="block text-xs text-neutral-500">
                          {instituicao.nomeFantasia}
                        </span>
                      ) : null}
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                        <span>
                          {completude.totalFornecidos}/{completude.totalObrigatorios} insumos
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={cn(
                            completude.atrasado ? "font-medium text-status-error-text" : undefined
                          )}
                        >
                          {descreverContagemPrazo(completude.diasParaPrazo, completude.atrasado)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
