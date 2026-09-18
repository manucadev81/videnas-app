"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { prazosRegulatorios } from "@/lib/mock/prazos";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { HOJE_ISO } from "@/lib/mock/periodos";
import { formatarCompetenciaCurta, formatarData } from "@/lib/formatadores";
import type { ModuloId } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const CORES_MODULO: Record<ModuloId, { ponto: string; texto: string }> = {
  acam212: { ponto: "bg-indigo-500", texto: "text-indigo-700" },
  cadoc5711: { ponto: "bg-cyan-500", texto: "text-cyan-700" },
  cadoc5710: { ponto: "bg-teal-700", texto: "text-teal-700" },
  fiscal: { ponto: "bg-amber-500", texto: "text-amber-700" },
};

const MESES: { valor: string; rotulo: string }[] = [
  { valor: "2026-04", rotulo: "Abril de 2026" },
  { valor: "2026-05", rotulo: "Maio de 2026" },
  { valor: "2026-06", rotulo: "Junho de 2026" },
  { valor: "2026-07", rotulo: "Julho de 2026" },
  { valor: "2026-08", rotulo: "Agosto de 2026" },
  { valor: "2026-09", rotulo: "Setembro de 2026" },
  { valor: "2026-10", rotulo: "Outubro de 2026" },
  { valor: "2026-11", rotulo: "Novembro de 2026" },
  { valor: "2026-12", rotulo: "Dezembro de 2026" },
];

function rotaPeriodo(moduloId: ModuloId, periodoId: string): string {
  if (moduloId === "acam212") return `/app/acam212/${periodoId}`;
  if (moduloId === "fiscal") return `/app/fiscal/${periodoId}`;
  return `/app/cadoc/${periodoId}`;
}

export default function CalendarioPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const periodos = usePeriodosStore((estado) => estado.periodos);

  const [mesAtual, setMesAtual] = useState("2026-09");
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [modulosVisiveis, setModulosVisiveis] = useState<Set<ModuloId>>(
    new Set(["acam212", "cadoc5711", "cadoc5710", "fiscal"])
  );

  const modulosPermitidos: ModuloId[] = useMemo(
    () => (perfilAtivo === "contador" ? ["fiscal"] : ["acam212", "cadoc5711", "cadoc5710", "fiscal"]),
    [perfilAtivo]
  );

  const prazosBase = useMemo(() => {
    return prazosRegulatorios.filter((prazo) => {
      if (!modulosPermitidos.includes(prazo.moduloId)) return false;
      if (instituicaoAtivaId && instituicaoAtivaId !== "todas" && prazo.instituicaoId !== instituicaoAtivaId) return false;
      return true;
    });
  }, [instituicaoAtivaId, modulosPermitidos]);

  const prazosMes = prazosBase
    .filter((prazo) => prazo.dataVencimento.startsWith(mesAtual))
    .filter((prazo) => modulosVisiveis.has(prazo.moduloId));

  const [ano, mes] = mesAtual.split("-").map(Number);
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  function alternarModulo(moduloId: ModuloId) {
    setModulosVisiveis((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(moduloId)) {
        proximo.delete(moduloId);
      } else {
        proximo.add(moduloId);
      }
      return proximo;
    });
  }

  const prazosDoDia = diaSelecionado ? prazosMes.filter((prazo) => prazo.dataVencimento === diaSelecionado) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-neutral-700">Calendário regulatório</h1>
        <p className="text-sm text-neutral-500">Vencimentos por módulo ao longo de 2026.</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Mês anterior"
            disabled={mesAtual === MESES[0].valor}
            onClick={() => {
              const indice = MESES.findIndex((mesItem) => mesItem.valor === mesAtual);
              if (indice > 0) setMesAtual(MESES[indice - 1].valor);
              setDiaSelecionado(null);
            }}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <p className="min-w-40 text-center font-display text-lg font-bold text-neutral-700">
            {MESES.find((mesItem) => mesItem.valor === mesAtual)?.rotulo}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Próximo mês"
            disabled={mesAtual === MESES.at(-1)?.valor}
            onClick={() => {
              const indice = MESES.findIndex((mesItem) => mesItem.valor === mesAtual);
              if (indice < MESES.length - 1) setMesAtual(MESES[indice + 1].valor);
              setDiaSelecionado(null);
            }}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {modulosPermitidos.map((moduloId) => {
            const modulo = buscarModulo(moduloId);
            const ativo = modulosVisiveis.has(moduloId);
            return (
              <button
                key={moduloId}
                type="button"
                onClick={() => alternarModulo(moduloId)}
                className={cn(
                  "status-badge",
                  ativo ? "status-badge-info" : "status-badge-neutral",
                  "cursor-pointer"
                )}
              >
                <span className={cn("size-2 rounded-full", CORES_MODULO[moduloId].ponto)} />
                {modulo.sigla}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          {prazosMes.length === 0 ? (
            <EstadoVazio titulo="Nenhum prazo regulatório neste período" mensagem="Ajuste os filtros ou navegue para outro mês." />
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: diasNoMes }, (_, indice) => indice + 1).map((dia) => {
                const dataIso = `${mesAtual}-${String(dia).padStart(2, "0")}`;
                const prazosDia = prazosMes.filter((prazo) => prazo.dataVencimento === dataIso);
                const hoje = dataIso === HOJE_ISO;
                const vencido = prazosDia.some((prazo) => {
                  const periodo = periodos[prazo.periodoId];
                  return dataIso < HOJE_ISO && periodo && periodo.estado !== "entregue";
                });

                return (
                  <button
                    key={dataIso}
                    type="button"
                    onClick={() => setDiaSelecionado(dataIso)}
                    className={cn(
                      "flex min-h-16 flex-col items-start gap-1 rounded-md border p-1.5 text-left text-xs",
                      vencido ? "border-status-error-border bg-status-error-bg" : "border-neutral-200 bg-white",
                      hoje && "ring-2 ring-brand-700",
                      diaSelecionado === dataIso && "outline outline-2 outline-brand-700"
                    )}
                  >
                    <span className="font-medium text-neutral-600">{dia}</span>
                    <div className="flex flex-wrap gap-1">
                      {prazosDia.map((prazo) => (
                        <span
                          key={prazo.id}
                          className={cn("rounded px-1 py-0.5 text-[10px] font-medium text-white", CORES_MODULO[prazo.moduloId].ponto)}
                        >
                          {buscarModulo(prazo.moduloId).sigla}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3 border-t border-neutral-200 pt-3 text-xs text-neutral-500">
            {modulosPermitidos.map((moduloId) => (
              <span key={moduloId} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", CORES_MODULO[moduloId].ponto)} />
                {buscarModulo(moduloId).nome}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-display text-base font-bold text-neutral-700">
            {diaSelecionado ? formatarData(diaSelecionado) : "Selecione um dia"}
          </h2>
          {prazosDoDia.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma obrigação vence neste dia.</p>
          ) : (
            <ul className="space-y-3">
              {prazosDoDia.map((prazo) => {
                const periodo = periodos[prazo.periodoId];
                const instituicao = buscarInstituicao(prazo.instituicaoId);
                if (!periodo) return null;
                return (
                  <li key={prazo.id} className="rounded-md bg-neutral-50 p-3 text-sm">
                    <p className="font-medium text-neutral-700">
                      {buscarModulo(prazo.moduloId).nome} · {formatarCompetenciaCurta(prazo.competencia)}
                    </p>
                    {instituicaoAtivaId === "todas" ? (
                      <p className="text-xs text-neutral-500">{instituicao?.nomeFantasia}</p>
                    ) : null}
                    <p className="text-xs text-neutral-500">Estado: {periodo.estado}</p>
                    <Link
                      href={perfilAtivo === "cliente" ? "/app/fornecimento" : rotaPeriodo(prazo.moduloId, periodo.id)}
                      className="mt-1 inline-block text-xs font-medium text-brand-700 hover:text-brand-800"
                    >
                      {perfilAtivo === "cliente" ? "Ir para o fornecimento" : "Abrir período"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
