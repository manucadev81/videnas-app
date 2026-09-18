"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus, BadgeAtrasado } from "@/components/dominio/badge-status";
import { StepperEtapas } from "@/components/dominio/stepper-etapas";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { construirEtapasStepper } from "@/components/dominio/modulo-etapas";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { chaveAjudaModulo } from "@/lib/ajuda/textos";
import { descreverContagemPrazo } from "@/components/fornecimento/constantes";
import { formatarBRL, formatarData } from "@/lib/formatadores";
import type { Modulo, PeriodoDerivado } from "@/lib/tipos";
import { cn } from "@/lib/utils";

interface MetricaModulo {
  valor: string;
  rotulo: string;
}

function metricasModulo(periodo: PeriodoDerivado): MetricaModulo[] {
  if (periodo.moduloId === "acam212") {
    return [{ valor: `${periodo.totaisResumo.operacoes ?? 0}`, rotulo: "Operações" }];
  }
  if (periodo.moduloId === "cadoc5711") {
    return [
      {
        valor: `${periodo.totaisResumo.datasBaseRecebidas ?? 0}/${periodo.totaisResumo.datasBaseEsperadas ?? 0}`,
        rotulo: "Datas-base",
      },
      { valor: `${periodo.totaisResumo.clientesDistintos ?? 0}`, rotulo: "Clientes" },
    ];
  }
  if (periodo.moduloId === "cadoc5710") {
    return [
      { valor: `${periodo.totaisResumo.carteiras ?? 0}`, rotulo: "Carteiras" },
      { valor: `${periodo.totaisResumo.ativos ?? 0}`, rotulo: "Ativos" },
    ];
  }
  return [
    { valor: `${periodo.totaisResumo.dps ?? 0}`, rotulo: "DPS estruturadas" },
    { valor: formatarBRL(Number(periodo.totaisResumo.valorServicos ?? 0)), rotulo: "Valor dos serviços" },
  ];
}

export interface CardModuloDashboardProps {
  modulo: Modulo;
  derivado: PeriodoDerivado;
  rotuloAcao: string;
  href: string;
  className?: string;
}

export function CardModuloDashboard({ modulo, derivado, rotuloAcao, href, className }: CardModuloDashboardProps) {
  const metricas = metricasModulo(derivado);
  const contagemPrazo = descreverContagemPrazo(derivado.diasParaPrazo, derivado.atrasado);
  const IconeAcao =
    rotuloAcao === "Fornecer dados"
      ? UploadCloud
      : rotuloAcao === "Acompanhar fornecimento"
        ? ClipboardList
        : ArrowRight;
  const corPrazo = derivado.atrasado
    ? "text-status-error-text"
    : derivado.diasParaPrazo <= 3
      ? "text-status-warning-text"
      : "text-neutral-500";

  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:border-neutral-300 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-x-1.5 font-display text-lg font-bold text-neutral-700">
            {modulo.nome}
            <span className="text-sm font-normal text-neutral-400">{modulo.sigla}</span>
            <BadgeAjuda chave={chaveAjudaModulo(derivado.moduloId)} tamanho="xs" />
          </h3>
          <p className="text-xs text-neutral-500">Competência {derivado.competenciaRotulo}</p>
        </div>
        {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <BadgeStatus estado={derivado.estado} />
        <BadgeAtrasado dias={derivado.diasDeAtraso} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metricas.map((metrica) => (
          <div key={metrica.rotulo}>
            <p className="text-lg font-semibold text-neutral-700">{metrica.valor}</p>
            <p className="text-xs text-neutral-500">{metrica.rotulo}</p>
          </div>
        ))}
      </div>

      <StepperEtapas
        etapas={construirEtapasStepper(modulo.etapas, derivado.etapaAtual, derivado.estado, {})}
        variante="compacto"
        className="mt-4"
      />

      <div className="mt-4 flex flex-col items-stretch gap-3 border-t border-neutral-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          Prazo {formatarData(derivado.prazoEntrega)}
          <span className={cn("font-medium", corPrazo)}>· {contagemPrazo}</span>
        </span>
        <Button render={<Link href={href} />} nativeButton={false} size="sm" className="self-end sm:self-auto">
          {rotuloAcao}
          <IconeAcao aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
