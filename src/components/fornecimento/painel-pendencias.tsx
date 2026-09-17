"use client";

import { ArrowDownToLine, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { buscarInsumo, rotulosDosCampos } from "@/lib/fornecimento";
import type { PendenciaFornecimento } from "@/lib/tipos";

export interface PainelPendenciasProps {
  pendencias: PendenciaFornecimento[];
  aoIrParaInsumo: (insumoId: string) => void;
}

function rotulosFaltantes(insumoId: string, chaves: string[]): string[] {
  if (chaves.length === 0) {
    return [];
  }
  const definicao = buscarInsumo(insumoId);
  return definicao ? rotulosDosCampos(definicao, chaves) : chaves;
}

export function PainelPendencias({ pendencias, aoIrParaInsumo }: PainelPendenciasProps) {
  return (
    <section
      data-tour="fornecimento-faltantes"
      aria-labelledby="fornecimento-faltantes-titulo"
      className="rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div className="mb-3">
        <h2
          id="fornecimento-faltantes-titulo"
          className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700"
        >
          O que ainda falta
          <BadgeAjuda chave="fornecimento.faltantes" tamanho="sm" />
        </h2>
        <p className="text-sm text-neutral-500">
          Lista do que impede a Videnas de estruturar esta competência. Cada item leva direto ao
          insumo correspondente.
        </p>
      </div>

      {pendencias.length === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-status-success-border bg-status-success-bg p-4">
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-status-success-text"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-status-success-text">
              Nada pendente nesta competência.
            </p>
            <p className="text-sm text-status-success-text/90">
              Todos os insumos obrigatórios foram fornecidos e lacrados. A Videnas já pode estruturar
              os dados no modelo canônico.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {pendencias.map((pendencia) => {
            const faltantes = rotulosFaltantes(pendencia.insumoId, pendencia.camposFaltantes);

            return (
              <li
                key={pendencia.insumoId}
                className="rounded-lg border border-status-warning-border bg-status-warning-bg p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-neutral-700">{pendencia.rotulo}</h3>
                    <p className="mt-0.5 text-sm text-status-warning-text">{pendencia.motivo}</p>

                    {faltantes.length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {faltantes.map((rotulo) => (
                          <li
                            key={rotulo}
                            className="rounded-md border border-status-warning-border bg-white px-2 py-0.5 text-xs text-neutral-600"
                          >
                            {rotulo}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                      <span className="font-medium text-neutral-700">Como fornecer: </span>
                      {pendencia.comoFornecer}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white"
                    onClick={() => aoIrParaInsumo(pendencia.insumoId)}
                  >
                    <ArrowDownToLine className="size-4" aria-hidden="true" />
                    Resolver agora
                    <span className="sr-only"> — {pendencia.rotulo}</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
