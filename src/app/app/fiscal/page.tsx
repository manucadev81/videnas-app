"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadgeStatus, BadgeAtrasado } from "@/components/dominio/badge-status";
import { StepperEtapas } from "@/components/dominio/stepper-etapas";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { construirEtapasStepper } from "@/components/dominio/modulo-etapas";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { calcularPeriodoDerivado } from "@/lib/mock/periodos";
import { buscarModulo } from "@/lib/mock/modulos";
import { servicosPendentesContador, servicosPorPeriodo } from "@/lib/mock/fiscal";
import { formatarBRL, formatarData } from "@/lib/formatadores";
import type { PeriodoObrigacao } from "@/lib/tipos";

export default function FiscalPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const mapaPeriodos = usePeriodosStore((estado) => estado.periodos);
  const todosPeriodos = useMemo(() => Object.values(mapaPeriodos), [mapaPeriodos]);

  const modulo = buscarModulo("fiscal");

  const periodosModulo = useMemo(
    () =>
      todosPeriodos
        .filter((periodo) => periodo.moduloId === "fiscal")
        .filter((periodo) => (instituicaoAtivaId && instituicaoAtivaId !== "todas" ? periodo.instituicaoId === instituicaoAtivaId : true))
        .sort((a, b) => (a.competencia < b.competencia ? 1 : -1)),
    [todosPeriodos, instituicaoAtivaId]
  );

  const periodoCorrente = periodosModulo[0];
  const derivadoCorrente = periodoCorrente ? calcularPeriodoDerivado(periodoCorrente) : null;

  const pendentesContador = periodoCorrente ? servicosPendentesContador(periodoCorrente.id) : [];

  const distribuicaoMunicipio = useMemo(() => {
    const servicosCorrente = periodoCorrente ? servicosPorPeriodo(periodoCorrente.id) : [];
    const mapa = new Map<string, { nome: string; codigo: string; total: number }>();
    for (const servico of servicosCorrente) {
      const chave = servico.codigoIbgePrestacao;
      const atual = mapa.get(chave) ?? { nome: servico.municipioPrestacao, codigo: chave, total: 0 };
      atual.total += 1;
      mapa.set(chave, atual);
    }
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [periodoCorrente]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-neutral-700">Fiscal — NFS-e / DPS</h1>
        <span data-tour="fiscal-selo-candidato">
          <SeloCandidato />
        </span>
      </header>
      <div data-tour="fiscal-banner">
        <BannerPosicionamento variante="atencao" />
      </div>

      {periodosModulo.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma competência gerada para este módulo ainda"
          mensagem="Ela aparece aqui assim que os dados do primeiro período forem enviados."
        />
      ) : (
        <>
          {periodoCorrente && derivadoCorrente ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-neutral-700">
                    Competência {periodoCorrente.competenciaRotulo}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <BadgeStatus estado={periodoCorrente.estado} />
                    <BadgeAtrasado dias={derivadoCorrente.diasDeAtraso} />
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    {String(periodoCorrente.totaisResumo.dps ?? 0)} DPS ·{" "}
                    {formatarBRL(Number(periodoCorrente.totaisResumo.valorServicos ?? 0))} em serviços ·{" "}
                    {formatarBRL(Number(periodoCorrente.totaisResumo.valorIss ?? 0))} de ISS ·{" "}
                    {formatarBRL(Number(periodoCorrente.totaisResumo.valorRetido ?? 0))} retido na fonte
                  </p>
                </div>
                <Button render={<Link href={`/app/fiscal/${periodoCorrente.id}`} />} nativeButton={false} size="sm">
                  Abrir período
                </Button>
              </div>
              <StepperEtapas
                etapas={construirEtapasStepper(modulo.etapas, derivadoCorrente.etapaAtual, periodoCorrente.estado, {})}
                className="mt-4 border-t pt-4"
              />
            </div>
          ) : null}

          {perfilAtivo === "contador" && pendentesContador.length > 0 ? (
            <div className="rounded-lg border border-status-warning-border bg-status-warning-bg p-5">
              <h2 className="mb-2 font-display text-base font-bold text-status-warning-text">Aguardando você</h2>
              <p className="mb-3 text-sm text-status-warning-text">
                {pendentesContador.length} DPS aguardando confirmação de alíquota, retenção e enquadramento.
              </p>
              {periodoCorrente ? (
                <Button render={<Link href={`/app/fiscal/${periodoCorrente.id}`} />} nativeButton={false} size="sm" variant="outline">
                  Analisar competência
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <TabelaCompetencias periodos={periodosModulo} />

            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 font-display text-base font-bold text-neutral-700">Distribuição por município</h2>
              {distribuicaoMunicipio.length === 0 ? (
                <p className="text-sm text-neutral-500">Sem serviços na competência corrente.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {distribuicaoMunicipio.map((municipio) => (
                    <li key={municipio.codigo} className="flex items-center justify-between gap-2">
                      <span className="text-neutral-600">
                        {municipio.nome} ({municipio.codigo})
                      </span>
                      <span className="font-medium text-neutral-700">{municipio.total} DPS</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TabelaCompetencias({ periodos }: { periodos: PeriodoObrigacao[] }) {
  const protocolos = usePeriodosStore((estado) => estado.protocolos);

  const colunas: ColunaTabela<PeriodoObrigacao>[] = [
    { id: "competencia", cabecalho: "Competência", renderizar: (periodo) => periodo.competenciaRotulo },
    { id: "estado", cabecalho: "Estado", renderizar: (periodo) => <BadgeStatus estado={periodo.estado} /> },
    { id: "dps", cabecalho: "DPS", alinhamento: "right", renderizar: (periodo) => String(periodo.totaisResumo.dps ?? 0) },
    {
      id: "valorServicos",
      cabecalho: "Valor dos serviços",
      alinhamento: "right",
      renderizar: (periodo) => formatarBRL(Number(periodo.totaisResumo.valorServicos ?? 0)),
    },
    {
      id: "iss",
      cabecalho: "ISS devido",
      alinhamento: "right",
      renderizar: (periodo) => formatarBRL(Number(periodo.totaisResumo.valorIss ?? 0)),
    },
    {
      id: "retido",
      cabecalho: "Retido na fonte",
      alinhamento: "right",
      renderizar: (periodo) => formatarBRL(Number(periodo.totaisResumo.valorRetido ?? 0)),
    },
    {
      id: "contador",
      cabecalho: "Contador",
      renderizar: (periodo) => {
        if (periodo.contadorStatus === "confirmado" && periodo.contadorConfirmadoEm) {
          return formatarData(periodo.contadorConfirmadoEm);
        }
        if (periodo.estado === "aguardando_contador") {
          return "Pendente";
        }
        return "—";
      },
    },
    {
      id: "encaminhado",
      cabecalho: "Encaminhado a",
      renderizar: (periodo) => {
        const protocolo = periodo.protocoloId ? protocolos[periodo.protocoloId] : undefined;
        return protocolo?.observacao ? <span className="text-xs">{protocolo.observacao}</span> : "—";
      },
    },
    {
      id: "acoes",
      cabecalho: "Ações",
      renderizar: (periodo) => (
        <Link href={`/app/fiscal/${periodo.id}`} className="text-xs font-medium text-brand-700 hover:text-brand-800">
          Abrir
        </Link>
      ),
    },
  ];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <TabelaDados
        colunas={colunas}
        dados={periodos}
        chave={(periodo) => periodo.id}
        tituloVazio="Nenhum serviço prestado registrado nesta competência"
        mensagemVazia="Ajuste os filtros para ver outras competências."
      />
    </div>
  );
}
