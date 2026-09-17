"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadgeStatus, BadgeAtrasado } from "@/components/dominio/badge-status";
import { StepperEtapas } from "@/components/dominio/stepper-etapas";
import { CardPrazo } from "@/components/dominio/card-prazo";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { construirEtapasStepper } from "@/components/dominio/modulo-etapas";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { chaveAjudaModulo } from "@/lib/ajuda/textos";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarInstituicao, instituicoes } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { calcularPeriodoDerivado, HOJE_ISO } from "@/lib/mock/periodos";
import { prazosRegulatorios } from "@/lib/mock/prazos";
import { formatarBRL, formatarCNPJ, formatarCompetencia, formatarCompetenciaCurta, formatarData, formatarDataHora } from "@/lib/formatadores";
import type { EstadoPeriodo, ModuloId, PeriodoObrigacao } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const ROTULOS_ESTADO: Record<EstadoPeriodo, string> = {
  aguardando_dados: "Aguardando dados",
  dados_ingeridos: "Dados recebidos",
  gerado: "Arquivo gerado",
  aguardando_contador: "Aguardando contador",
  em_validacao: "Em validação",
  validado: "Validado",
  com_excecoes: "Com exceções",
  liberado: "Liberado",
  aprovado: "Aprovado",
  entregue: "Entregue",
  retorno_com_erro: "Retorno com erro",
};

function rotaPeriodo(moduloId: ModuloId, periodoId: string): string {
  if (moduloId === "acam212") return `/app/acam212/${periodoId}`;
  if (moduloId === "fiscal") return `/app/fiscal/${periodoId}`;
  return `/app/cadoc/${periodoId}`;
}

function rotuloAcaoContextual(perfil: string | null, periodo: PeriodoObrigacao): string {
  if (perfil === "operacional" && (periodo.estado === "aguardando_dados" || periodo.estado === "dados_ingeridos")) {
    return "Enviar dados";
  }
  if (perfil === "executor" && periodo.estado === "dados_ingeridos") {
    return "Gerar arquivo";
  }
  if (perfil === "validador" && (periodo.estado === "em_validacao" || periodo.estado === "com_excecoes")) {
    return "Executar validação";
  }
  if (perfil === "diretor" && periodo.estado === "liberado") {
    return "Aprovar";
  }
  return "Abrir período";
}

function metricasModulo(periodo: PeriodoObrigacao): string {
  if (periodo.moduloId === "acam212") {
    return `${periodo.totaisResumo.operacoes ?? 0} operações`;
  }
  if (periodo.moduloId === "cadoc5711") {
    return `${periodo.totaisResumo.datasBaseRecebidas ?? 0}/${periodo.totaisResumo.datasBaseEsperadas ?? 0} datas-base · ${periodo.totaisResumo.clientesDistintos ?? 0} clientes`;
  }
  if (periodo.moduloId === "cadoc5710") {
    return `${periodo.totaisResumo.carteiras ?? 0} carteiras · ${periodo.totaisResumo.ativos ?? 0} ativos`;
  }
  return `${periodo.totaisResumo.dps ?? 0} DPS estruturadas · ${formatarBRL(Number(periodo.totaisResumo.valorServicos ?? 0))}`;
}

export default function DashboardPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const periodosStore = usePeriodosStore((estado) => estado.periodos);
  const eventosStore = usePeriodosStore((estado) => estado.eventos);
  const excecoesStore = usePeriodosStore((estado) => estado.excecoes);

  const todosPeriodos = Object.values(periodosStore);
  const instituicao =
    instituicaoAtivaId && instituicaoAtivaId !== "todas" ? buscarInstituicao(instituicaoAtivaId) : undefined;

  const ehOperacao = perfilAtivo === "executor" || perfilAtivo === "validador";

  const periodosEscopo = todosPeriodos.filter((periodo) =>
    instituicaoAtivaId && instituicaoAtivaId !== "todas" ? periodo.instituicaoId === instituicaoAtivaId : true
  );

  const competenciaCorrente = HOJE_ISO.slice(0, 7);

  const modulosParaCards: ModuloId[] =
    perfilAtivo === "contador"
      ? ["fiscal"]
      : (instituicao?.modulosContratados ?? ["acam212", "cadoc5711", "cadoc5710", "fiscal"]);

  const cardsModulo = modulosParaCards
    .map((moduloId) => periodosEscopo.find((periodo) => periodo.moduloId === moduloId && periodo.competencia === competenciaCorrente))
    .filter((periodo): periodo is PeriodoObrigacao => Boolean(periodo));

  const periodosAtrasados = periodosEscopo.filter((periodo) => calcularPeriodoDerivado(periodo).atrasado);

  const proximosPrazos = periodosEscopo
    .filter((periodo) => periodo.estado !== "entregue")
    .map((periodo) => ({ periodo, derivado: calcularPeriodoDerivado(periodo) }))
    .sort((a, b) => a.derivado.diasParaPrazo - b.derivado.diasParaPrazo)
    .slice(0, 6);

  const excecoesEscopo = Object.values(excecoesStore)
    .filter((excecao) => (instituicaoAtivaId && instituicaoAtivaId !== "todas" ? excecao.instituicaoId === instituicaoAtivaId : true))
    .filter((excecao) => (perfilAtivo === "contador" ? excecao.moduloId === "fiscal" : true))
    .filter((excecao) => excecao.status === "aberta" || excecao.status === "em_tratamento")
    .sort((a) => (perfilAtivo === "operacional" ? (a.origem === "ingestao" ? -1 : 1) : 0));

  const eventosRecentes = eventosStore
    .filter((evento) => (instituicaoAtivaId && instituicaoAtivaId !== "todas" ? evento.instituicaoId === instituicaoAtivaId : true))
    .filter((evento) => (perfilAtivo === "contador" ? evento.moduloId === "fiscal" : true))
    .sort((a, b) => (a.ocorridoEm < b.ocorridoEm ? 1 : -1))
    .slice(0, 5);

  const filaPorInstituicao = ehOperacao
    ? instituicoes.map((inst) => ({
        instituicao: inst,
        total: todosPeriodos.filter(
          (periodo) =>
            periodo.instituicaoId === inst.id &&
            ["dados_ingeridos", "em_validacao", "com_excecoes", "validado"].includes(periodo.estado)
        ).length,
      }))
    : [];

  const prazosMesEscopo = prazosRegulatorios.filter(
    (prazo) =>
      prazo.dataVencimento.startsWith(competenciaCorrente) &&
      (instituicaoAtivaId && instituicaoAtivaId !== "todas" ? prazo.instituicaoId === instituicaoAtivaId : true) &&
      (perfilAtivo !== "contador" || prazo.moduloId === "fiscal")
  );

  if (periodosEscopo.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhuma obrigação configurada ainda"
        mensagem="Conclua o onboarding para começar a acompanhar seus prazos regulatórios."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-neutral-700">
          {instituicao ? `${instituicao.nomeFantasia} · ${formatarCNPJ(instituicao.cnpj)}` : "Painel Videnas"}
        </h1>
        <p className="text-sm text-neutral-500">
          Competência {formatarCompetencia(competenciaCorrente)} · Data de referência: {formatarData(HOJE_ISO)}
        </p>
      </header>

      {periodosAtrasados.length > 0 ? (
        <div
          data-tour="dashboard-alerta"
          className="rounded-lg border border-status-error-border bg-status-error-bg p-4 text-sm text-status-error-text"
        >
          {periodosAtrasados.length} obrigaç{periodosAtrasados.length === 1 ? "ão está" : "ões estão"} fora do prazo
          regulatório.{" "}
          <Link href="/app/calendario" className="font-medium underline">
            Ver pendências
          </Link>
        </div>
      ) : null}

      {ehOperacao ? (
        <div data-tour="dashboard-fila" className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-2 font-display text-base font-bold text-neutral-700">Sua fila</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            {filaPorInstituicao.map(({ instituicao: inst, total }) => (
              <span key={inst.id} className="rounded-md bg-neutral-50 px-3 py-1.5 text-neutral-600">
                {inst.nomeFantasia}: <span className="font-medium text-neutral-700">{total}</span>
              </span>
            ))}
          </div>
          <Link href="/app/operacao" className="mt-2 inline-block text-xs font-medium text-brand-700 hover:text-brand-800">
            Ir para a fila de operação
          </Link>
        </div>
      ) : null}

      <div data-tour="dashboard-cards-modulo" className="grid gap-4 sm:grid-cols-2">
        {cardsModulo.map((periodo) => {
          const modulo = buscarModulo(periodo.moduloId);
          const derivado = calcularPeriodoDerivado(periodo);
          return (
            <div key={periodo.id} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="flex flex-wrap items-center gap-x-1.5 font-display text-lg font-bold text-neutral-700">
                    {modulo.nome}
                    <span className="text-sm font-normal text-neutral-400">{modulo.sigla}</span>
                    <BadgeAjuda chave={chaveAjudaModulo(periodo.moduloId)} tamanho="xs" />
                  </h3>
                  <p className="text-xs text-neutral-500">Competência {periodo.competenciaRotulo}</p>
                </div>
                {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <BadgeStatus estado={periodo.estado} />
                <BadgeAtrasado dias={derivado.diasDeAtraso} />
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {metricasModulo(periodo)} · Prazo: {formatarData(periodo.prazoEntrega)}
              </p>
              <StepperEtapas
                etapas={construirEtapasStepper(modulo.etapas, derivado.etapaAtual, periodo.estado, {})}
                className="mt-3 border-0 px-0 py-0"
              />
              <Button render={<Link href={rotaPeriodo(periodo.moduloId, periodo.id)} />} nativeButton={false} className="mt-3 w-full" size="sm">
                {rotuloAcaoContextual(perfilAtivo, periodo)}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div data-tour="dashboard-prazos" className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-base font-bold text-neutral-700">
            Próximos prazos regulatórios
            <BadgeAjuda chave="painel.prazos" tamanho="sm" />
          </h2>
          {proximosPrazos.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum prazo em aberto.</p>
          ) : (
            <div className="space-y-2">
              {proximosPrazos.map(({ periodo, derivado }) => {
                const modulo = buscarModulo(periodo.moduloId);
                return (
                  <CardPrazo
                    key={periodo.id}
                    titulo={`${modulo.sigla} · Competência ${formatarCompetenciaCurta(periodo.competencia)}`}
                    subtitulo={ROTULOS_ESTADO[periodo.estado]}
                    dataVencimento={periodo.prazoEntrega}
                    diasParaPrazo={derivado.diasParaPrazo}
                    href={rotaPeriodo(periodo.moduloId, periodo.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-base font-bold text-neutral-700">
            Pendências e exceções
            <BadgeAjuda chave="painel.excecoes" tamanho="sm" align="end" />
          </h2>
          {excecoesEscopo.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma pendência aberta. Todas as exceções foram tratadas.</p>
          ) : (
            <div className="space-y-2">
              {excecoesEscopo.slice(0, 5).map((excecao) => (
                <div key={excecao.id} className="flex items-start justify-between gap-2 rounded-md bg-neutral-50 p-2.5 text-sm">
                  <div>
                    <p className="font-mono text-xs text-neutral-500">{excecao.codigo}</p>
                    <p className="text-neutral-700">{excecao.titulo}</p>
                  </div>
                  <span
                    className={cn(
                      "status-badge shrink-0",
                      excecao.severidade === "bloqueante" ? "status-badge-error" : "status-badge-warning"
                    )}
                  >
                    {excecao.severidade === "bloqueante" ? "Bloqueante" : "Aviso"}
                  </span>
                </div>
              ))}
              {excecoesEscopo.length > 5 ? (
                <Link href="/app/auditoria" className="inline-block text-xs font-medium text-brand-700 hover:text-brand-800">
                  Ver todas ({excecoesEscopo.length})
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-display text-base font-bold text-neutral-700">
            Calendário regulatório · {formatarCompetencia(competenciaCorrente)}
          </h2>
          {prazosMesEscopo.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum prazo neste mês.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {prazosMesEscopo
                .sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))
                .map((prazo) => (
                  <li key={prazo.id} className="flex items-center justify-between gap-2">
                    <span className="text-neutral-600">
                      {formatarData(prazo.dataVencimento)} · {buscarModulo(prazo.moduloId).sigla}
                    </span>
                    <Link
                      href={rotaPeriodo(prazo.moduloId, prazo.periodoId)}
                      className="text-xs font-medium text-brand-700 hover:text-brand-800"
                    >
                      Abrir
                    </Link>
                  </li>
                ))}
            </ul>
          )}
          <Link href="/app/calendario" className="mt-3 inline-block text-xs font-medium text-brand-700 hover:text-brand-800">
            Ver calendário completo
          </Link>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-display text-base font-bold text-neutral-700">Últimos eventos de auditoria</h2>
          {eventosRecentes.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum evento registrado ainda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {eventosRecentes.map((evento) => (
                <li key={evento.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-mono text-xs text-neutral-500">{formatarDataHora(evento.ocorridoEm)}</span>
                  <span className="text-neutral-700">{evento.usuarioNome}</span>
                  <span className="text-xs text-neutral-500">({evento.perfilId})</span>
                  <span className="text-neutral-600">{evento.rotuloTipo}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/app/auditoria" className="mt-3 inline-block text-xs font-medium text-brand-700 hover:text-brand-800">
            Ver trilha completa
          </Link>
        </div>
      </div>
    </div>
  );
}
