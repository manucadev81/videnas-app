"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BadgeStatus, BadgeAtrasado } from "@/components/dominio/badge-status";
import { StepperEtapas } from "@/components/dominio/stepper-etapas";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { construirEtapasStepper } from "@/components/dominio/modulo-etapas";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { calcularPeriodoDerivado } from "@/lib/mock/periodos";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { formatarData, truncarHash } from "@/lib/formatadores";
import type { PeriodoObrigacao } from "@/lib/tipos";

export default function CadocPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const mapaPeriodos = usePeriodosStore((estado) => estado.periodos);
  const todosPeriodos = useMemo(() => Object.values(mapaPeriodos), [mapaPeriodos]);
  const arquivos = usePeriodosStore((estado) => estado.arquivos);
  const protocolos = usePeriodosStore((estado) => estado.protocolos);

  const [aba, setAba] = useState<"5711" | "5710">("5711");

  const modulo5711 = buscarModulo("cadoc5711");
  const modulo5710 = buscarModulo("cadoc5710");
  const instituicao = instituicaoAtivaId && instituicaoAtivaId !== "todas" ? buscarInstituicao(instituicaoAtivaId) : undefined;

  const periodos5711 = useMemo(
    () =>
      todosPeriodos
        .filter((periodo) => periodo.moduloId === "cadoc5711")
        .filter((periodo) => (instituicaoAtivaId && instituicaoAtivaId !== "todas" ? periodo.instituicaoId === instituicaoAtivaId : true))
        .sort((a, b) => (a.competencia < b.competencia ? 1 : -1)),
    [todosPeriodos, instituicaoAtivaId]
  );

  const periodos5710 = useMemo(
    () =>
      todosPeriodos
        .filter((periodo) => periodo.moduloId === "cadoc5710")
        .filter((periodo) => (instituicaoAtivaId && instituicaoAtivaId !== "todas" ? periodo.instituicaoId === instituicaoAtivaId : true))
        .sort((a, b) => (a.competencia < b.competencia ? 1 : -1)),
    [todosPeriodos, instituicaoAtivaId]
  );

  if (perfilAtivo === "contador") {
    return (
      <EstadoVazio
        titulo="Acesso não disponível"
        mensagem="Seu perfil não tem acesso a esta área. O módulo Cadoc é restrito aos perfis Diretor, Operacional, Executor e Validador."
      />
    );
  }

  const naoDeclaraCustodia = Boolean(instituicao && !instituicao.modulosContratados.includes("cadoc5711"));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-neutral-700">Cadoc 5710/5711 — Posição de custódia</h1>
        <p className="text-sm text-neutral-500">
          5711: posição diária de custódia por cliente, consolidada mensalmente. 5710: posição mensal agregada por
          carteira ou endereço, incluindo saldo em staking.
        </p>
      </header>

      {naoDeclaraCustodia ? (
        <BannerPosicionamento variante="info" titulo="Módulo desativado no onboarding">
          Esta instituição não declara posição de custódia. Módulo desativado no onboarding.
        </BannerPosicionamento>
      ) : (
        <Tabs value={aba} onValueChange={(valor) => setAba(valor as "5711" | "5710")}>
          <TabsList>
            <TabsTrigger value="5711">Cadoc 5711 — Posição diária por cliente</TabsTrigger>
            <TabsTrigger value="5710">Cadoc 5710 — Posição mensal por carteira</TabsTrigger>
          </TabsList>

          <TabsContent value="5711" className="space-y-4 pt-4">
            <ResumoPeriodo periodos={periodos5711} modulo={modulo5711} />
            <TabelaCadoc5711
              periodos={periodos5711}
              arquivos={arquivos}
              protocolos={protocolos}
            />
          </TabsContent>

          <TabsContent value="5710" className="space-y-4 pt-4">
            <ResumoPeriodo periodos={periodos5710} modulo={modulo5710} />
            {periodos5710.length === 0 ? (
              <EstadoVazio
                titulo="Nenhuma carteira com saldo nesta competência"
                mensagem="O documento não precisa ser transmitido."
                rotuloAcao="Registrar ausência de movimento"
                aoAcionar={() => toast.info("Ausência de movimento registrada (simulado).")}
              />
            ) : (
              <TabelaCadoc5710 periodos={periodos5710} arquivos={arquivos} protocolos={protocolos} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ResumoPeriodo({
  periodos,
  modulo,
}: {
  periodos: PeriodoObrigacao[];
  modulo: ReturnType<typeof buscarModulo>;
}) {
  const periodoCorrente = periodos[0];
  if (!periodoCorrente) {
    return (
      <EstadoVazio
        titulo="Nenhuma competência gerada para este módulo ainda"
        mensagem="Ela aparece aqui assim que os dados do primeiro período forem enviados."
      />
    );
  }
  const derivado = calcularPeriodoDerivado(periodoCorrente);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-neutral-700">
            Competência {periodoCorrente.competenciaRotulo}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <BadgeStatus estado={periodoCorrente.estado} />
            <BadgeAtrasado dias={derivado.diasDeAtraso} />
          </div>
        </div>
        <Button render={<Link href={`/app/cadoc/${periodoCorrente.id}`} />} nativeButton={false} size="sm">
          Abrir período
        </Button>
      </div>
      <StepperEtapas
        etapas={construirEtapasStepper(modulo.etapas, derivado.etapaAtual, periodoCorrente.estado, {})}
        className="mt-4 border-t pt-4"
      />
    </div>
  );
}

function TabelaCadoc5711({
  periodos,
  arquivos,
  protocolos,
}: {
  periodos: PeriodoObrigacao[];
  arquivos: ReturnType<typeof usePeriodosStore.getState>["arquivos"];
  protocolos: ReturnType<typeof usePeriodosStore.getState>["protocolos"];
}) {
  const colunas: ColunaTabela<PeriodoObrigacao>[] = [
    { id: "competencia", cabecalho: "Competência", renderizar: (periodo) => periodo.competenciaRotulo },
    { id: "estado", cabecalho: "Estado", renderizar: (periodo) => <BadgeStatus estado={periodo.estado} /> },
    {
      id: "datasBase",
      cabecalho: "Datas-base",
      renderizar: (periodo) => `${periodo.totaisResumo.datasBaseRecebidas ?? 0}/${periodo.totaisResumo.datasBaseEsperadas ?? 0}`,
    },
    { id: "clientes", cabecalho: "Clientes distintos", alinhamento: "right", renderizar: (periodo) => String(periodo.totaisResumo.clientesDistintos ?? 0) },
    { id: "ativos", cabecalho: "Ativos", alinhamento: "right", renderizar: (periodo) => String(periodo.totaisResumo.ativos ?? 0) },
    {
      id: "arquivo",
      cabecalho: "Arquivo",
      renderizar: (periodo) => {
        const arquivo = periodo.arquivoCorrenteId ? arquivos[periodo.arquivoCorrenteId] : undefined;
        return arquivo ? <span className="text-xs">{arquivo.nomeArquivo}</span> : "—";
      },
    },
    {
      id: "hash",
      cabecalho: "Hash",
      renderizar: (periodo) => {
        const arquivo = periodo.arquivoCorrenteId ? arquivos[periodo.arquivoCorrenteId] : undefined;
        return arquivo ? <span className="font-mono text-xs">{truncarHash(arquivo.hashSha256)}</span> : "—";
      },
    },
    { id: "prazo", cabecalho: "Prazo", renderizar: (periodo) => formatarData(periodo.prazoEntrega) },
    {
      id: "protocolo",
      cabecalho: "Protocolo BCB",
      renderizar: (periodo) => {
        const protocolo = periodo.protocoloId ? protocolos[periodo.protocoloId] : undefined;
        return protocolo ? <span className="font-mono text-xs">{protocolo.numeroProtocolo}</span> : "—";
      },
    },
    {
      id: "acoes",
      cabecalho: "Ações",
      renderizar: (periodo) => (
        <Link href={`/app/cadoc/${periodo.id}`} className="text-xs font-medium text-brand-700 hover:text-brand-800">
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
        tituloVazio="Nenhuma competência encontrada"
        mensagemVazia="Ajuste os filtros para ver outras competências."
      />
    </div>
  );
}

function TabelaCadoc5710({
  periodos,
  arquivos,
  protocolos,
}: {
  periodos: PeriodoObrigacao[];
  arquivos: ReturnType<typeof usePeriodosStore.getState>["arquivos"];
  protocolos: ReturnType<typeof usePeriodosStore.getState>["protocolos"];
}) {
  const colunas: ColunaTabela<PeriodoObrigacao>[] = [
    { id: "competencia", cabecalho: "Competência", renderizar: (periodo) => periodo.competenciaRotulo },
    { id: "estado", cabecalho: "Estado", renderizar: (periodo) => <BadgeStatus estado={periodo.estado} /> },
    { id: "carteiras", cabecalho: "Carteiras", alinhamento: "right", renderizar: (periodo) => String(periodo.totaisResumo.carteiras ?? 0) },
    { id: "ativos", cabecalho: "Ativos", alinhamento: "right", renderizar: (periodo) => String(periodo.totaisResumo.ativos ?? 0) },
    {
      id: "staking",
      cabecalho: "Saldo em staking",
      renderizar: (periodo) => {
        const total = Number(periodo.totaisResumo.carteirasComStaking ?? 0);
        return total > 0 ? `Sim · ${total} ativos` : "Não";
      },
    },
    {
      id: "arquivo",
      cabecalho: "Arquivo",
      renderizar: (periodo) => {
        const arquivo = periodo.arquivoCorrenteId ? arquivos[periodo.arquivoCorrenteId] : undefined;
        return arquivo ? <span className="text-xs">{arquivo.nomeArquivo}</span> : "—";
      },
    },
    {
      id: "hash",
      cabecalho: "Hash",
      renderizar: (periodo) => {
        const arquivo = periodo.arquivoCorrenteId ? arquivos[periodo.arquivoCorrenteId] : undefined;
        return arquivo ? <span className="font-mono text-xs">{truncarHash(arquivo.hashSha256)}</span> : "—";
      },
    },
    { id: "prazo", cabecalho: "Prazo", renderizar: (periodo) => formatarData(periodo.prazoEntrega) },
    {
      id: "protocolo",
      cabecalho: "Protocolo BCB",
      renderizar: (periodo) => {
        const protocolo = periodo.protocoloId ? protocolos[periodo.protocoloId] : undefined;
        return protocolo ? <span className="font-mono text-xs">{protocolo.numeroProtocolo}</span> : "—";
      },
    },
    {
      id: "acoes",
      cabecalho: "Ações",
      renderizar: (periodo) => (
        <Link href={`/app/cadoc/${periodo.id}`} className="text-xs font-medium text-brand-700 hover:text-brand-800">
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
        tituloVazio="Nenhuma competência encontrada"
        mensagemVazia="Ajuste os filtros para ver outras competências."
      />
    </div>
  );
}
