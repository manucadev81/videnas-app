"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardPrazo } from "@/components/dominio/card-prazo";
import { BadgeStatus } from "@/components/dominio/badge-status";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { CardModuloDashboard } from "@/components/dominio/card-modulo-dashboard";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import {
  CLASSE_STATUS_IMPLANTACAO,
  ROTULO_STATUS_IMPLANTACAO,
  useTenantsStore,
} from "@/lib/store/tenants";
import { fornecimentosDoPeriodo, useEvidenciasStore } from "@/lib/store/evidencias";
import { calcularCompletude } from "@/lib/fornecimento";
import { descreverContagemPrazo } from "@/components/fornecimento/constantes";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { calcularPeriodoDerivado, HOJE_ISO } from "@/lib/mock/periodos";
import { buscarPerfil, podeVerRota } from "@/lib/permissoes";
import { formatarCNPJ, formatarCompetencia, formatarCompetenciaCurta, formatarData, formatarDataHora } from "@/lib/formatadores";
import type {
  EstadoPeriodo,
  EventoAuditoria,
  Instituicao,
  ModuloId,
  PeriodoObrigacao,
  StatusImplantacao,
} from "@/lib/tipos";
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
  if (perfil === "cliente") {
    return "Fornecer dados";
  }
  if (perfil === "operacional" && (periodo.estado === "aguardando_dados" || periodo.estado === "dados_ingeridos")) {
    return "Acompanhar fornecimento";
  }
  if (perfil === "executor" && periodo.estado === "dados_ingeridos") {
    return "Gerar arquivo";
  }
  if (perfil === "validador" && periodo.estado === "em_validacao") {
    return "Executar validação";
  }
  if (perfil === "validador" && periodo.estado === "com_excecoes") {
    return "Reprocessar validação";
  }
  if (perfil === "validador" && periodo.estado === "validado") {
    return "Liberar para o cliente";
  }
  if (perfil === "diretor" && periodo.estado === "liberado") {
    return "Aprovar";
  }
  if (perfil === "diretor" && periodo.estado === "aprovado") {
    return periodo.moduloId === "fiscal" ? "Marcar encaminhado" : "Registrar protocolo";
  }
  if (perfil === "contador" && periodo.estado === "aguardando_contador") {
    return "Confirmar enquadramento";
  }
  return "Abrir período";
}

export default function DashboardPage() {
  const router = useRouter();
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const periodosStore = usePeriodosStore((estado) => estado.periodos);
  const eventosStore = usePeriodosStore((estado) => estado.eventos);
  const excecoesStore = usePeriodosStore((estado) => estado.excecoes);
  const evidenciasHidratadas = useEvidenciasStore((estado) => estado.hidratado);
  const fornecimentosStore = useEvidenciasStore((estado) => estado.fornecimentos);
  const tenants = useTenantsStore((estado) => estado.tenants);

  const todosPeriodos = Object.values(periodosStore);
  const instituicao =
    instituicaoAtivaId && instituicaoAtivaId !== "todas" ? buscarInstituicao(instituicaoAtivaId) : undefined;

  const ehOperacao = perfilAtivo === "executor" || perfilAtivo === "validador";
  const ehCliente = perfilAtivo === "cliente";
  const ehContador = perfilAtivo === "contador";
  const mostrarCardsModulo = !ehCliente;
  const mostrarExcecoes = !ehCliente && !ehContador;
  const mostrarAuditoria = !ehCliente && !ehContador;

  const rotaDoPeriodo = (moduloId: ModuloId, periodoId: string) =>
    ehCliente ? "/app/fornecimento" : rotaPeriodo(moduloId, periodoId);

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

  const competenciasParaFornecer = ehCliente
    ? periodosEscopo
        .filter(
          (periodo) => periodo.estado === "aguardando_dados" || periodo.estado === "dados_ingeridos"
        )
        .map((periodo) => ({
          periodo,
          completude: calcularCompletude(
            periodo,
            fornecimentosDoPeriodo(fornecimentosStore, periodo.id)
          ),
        }))
        .filter((item) => item.completude.pendencias.length > 0)
        .sort((a, b) => a.completude.diasParaPrazo - b.completude.diasParaPrazo)
    : [];

  const eventosRecentes = eventosStore
    .filter((evento) => (instituicaoAtivaId && instituicaoAtivaId !== "todas" ? evento.instituicaoId === instituicaoAtivaId : true))
    .filter((evento) => (perfilAtivo === "contador" ? evento.moduloId === "fiscal" : true))
    .sort((a, b) => (a.ocorridoEm < b.ocorridoEm ? 1 : -1))
    .slice(0, 5);

  const filaPorInstituicao = ehOperacao
    ? tenants.map((inst) => ({
        instituicao: inst,
        total: todosPeriodos.filter((periodo) => {
          if (periodo.instituicaoId !== inst.id) {
            return false;
          }
          if (perfilAtivo === "executor") {
            return ["dados_ingeridos", "gerado", "com_excecoes"].includes(periodo.estado);
          }
          return ["em_validacao", "com_excecoes", "validado"].includes(periodo.estado);
        }).length,
      }))
    : [];

  if (perfilAtivo === "admin") {
    return <PainelAdmin tenants={tenants} eventosRecentes={eventosRecentes} />;
  }

  if (periodosEscopo.length === 0) {
    const instituicaoAtiva = tenants.find((tenant) => tenant.id === instituicaoAtivaId);
    const ladoCliente = perfilAtivo ? buscarPerfil(perfilAtivo).lado === "cliente" : false;
    const precisaConcluirOnboarding =
      ladoCliente &&
      Boolean(instituicaoAtiva) &&
      instituicaoAtiva?.onboardingConcluido === false &&
      Boolean(perfilAtivo && podeVerRota(perfilAtivo, "/onboarding"));

    return (
      <EstadoVazio
        titulo="Nenhuma obrigação configurada ainda"
        mensagem={
          precisaConcluirOnboarding
            ? "A Videnas já cadastrou a sua instituição. Conclua a configuração guiada para abrir as primeiras competências."
            : "Conclua o onboarding para começar a acompanhar seus prazos regulatórios."
        }
        rotuloAcao={precisaConcluirOnboarding ? "Concluir configuração guiada" : undefined}
        aoAcionar={precisaConcluirOnboarding ? () => router.push("/onboarding") : undefined}
      />
    );
  }

  if (perfilAtivo === "diretor") {
    return <PainelCompliance instituicao={instituicao} periodos={periodosEscopo} />;
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

      {ehCliente ? (
        <section
          data-tour="dashboard-fornecimento"
          aria-labelledby="dashboard-fornecimento-titulo"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id="dashboard-fornecimento-titulo"
                className="flex items-center gap-1.5 font-display text-base font-bold text-neutral-700"
              >
                Dados a fornecer
                <BadgeAjuda chave="nav.fornecimento" tamanho="sm" />
              </h2>
              <p className="text-sm text-neutral-500">
                Competências abertas que ainda dependem de insumos da sua instituição.
              </p>
            </div>
            <Button
              render={<Link href="/app/fornecimento" />}
              nativeButton={false}
              size="sm"
              variant="outline"
            >
              <UploadCloud aria-hidden="true" />
              Ir para o fornecimento
            </Button>
          </div>

          {!evidenciasHidratadas ? (
            <div role="status" aria-label="Carregando competências a fornecer" className="space-y-2">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          ) : competenciasParaFornecer.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Nenhum insumo pendente nas competências abertas. Assim que a Videnas abrir uma nova
              competência, ela aparece aqui.
            </p>
          ) : (
            <ul className="space-y-2">
              {competenciasParaFornecer.map(({ periodo, completude }) => {
                const modulo = buscarModulo(periodo.moduloId);
                const contagem = descreverContagemPrazo(completude.diasParaPrazo, completude.atrasado);
                const prazoCritico = completude.atrasado || completude.diasParaPrazo <= 3;
                const faltando = completude.pendencias.length;

                return (
                  <li key={periodo.id}>
                    <Link
                      href="/app/fornecimento"
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-neutral-50 p-3 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-neutral-700">
                          {modulo.nome} · Competência {formatarCompetenciaCurta(periodo.competencia)}
                        </span>
                        <span className="block text-xs text-neutral-500">
                          {faltando === 1 ? "1 insumo pendente" : `${faltando} insumos pendentes`} ·{" "}
                          {completude.totalFornecidos} de {completude.totalObrigatorios} obrigatórios
                          fornecidos · Prazo {formatarData(completude.prazoEntrega)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "status-badge shrink-0 first-letter:uppercase",
                          prazoCritico ? "status-badge-error" : "status-badge-neutral"
                        )}
                      >
                        {contagem}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
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

      {mostrarCardsModulo ? (
      <div data-tour="dashboard-cards-modulo" className="grid gap-4 sm:grid-cols-2">
        {cardsModulo.map((periodo) => {
          const modulo = buscarModulo(periodo.moduloId);
          const derivado = calcularPeriodoDerivado(periodo);
          return (
            <CardModuloDashboard
              key={periodo.id}
              modulo={modulo}
              derivado={derivado}
              rotuloAcao={rotuloAcaoContextual(perfilAtivo, periodo)}
              href={rotaDoPeriodo(periodo.moduloId, periodo.id)}
            />
          );
        })}
      </div>
      ) : null}

      <div className={cn("grid gap-4", mostrarExcecoes ? "lg:grid-cols-2" : "")}>
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
                    href={rotaDoPeriodo(periodo.moduloId, periodo.id)}
                  />
                );
              })}
            </div>
          )}
          {perfilAtivo && podeVerRota(perfilAtivo, "/app/calendario") ? (
            <Link href="/app/calendario" className="mt-3 inline-block text-xs font-medium text-brand-700 hover:text-brand-800">
              Ver calendário completo
            </Link>
          ) : null}
        </div>

        {mostrarExcecoes ? (
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
        ) : null}
      </div>

      {mostrarAuditoria ? (
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
      ) : null}
    </div>
  );
}

function PainelCompliance({
  instituicao,
  periodos,
}: {
  instituicao: Instituicao | undefined;
  periodos: PeriodoObrigacao[];
}) {
  const paraAprovar = periodos.filter((periodo) => periodo.estado === "liberado");
  const paraRegistrar = periodos.filter((periodo) => periodo.estado === "aprovado");
  const atrasados = periodos.filter(
    (periodo) => periodo.estado !== "entregue" && calcularPeriodoDerivado(periodo).atrasado
  );

  function linhaAcao(periodo: PeriodoObrigacao, rotulo: string) {
    const modulo = buscarModulo(periodo.moduloId);
    return (
      <li key={periodo.id}>
        <Link
          href={rotaPeriodo(periodo.moduloId, periodo.id)}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-neutral-50 p-3 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-neutral-700">
              {modulo.nome} · Competência {formatarCompetenciaCurta(periodo.competencia)}
            </span>
            <span className="block text-xs text-neutral-500">
              Prazo {formatarData(periodo.prazoEntrega)}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <BadgeStatus estado={periodo.estado} />
            <span className="text-xs font-medium text-brand-700">{rotulo}</span>
          </span>
        </Link>
      </li>
    );
  }

  return (
    <div data-tour="dashboard-prazos" className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-neutral-700">
          {instituicao ? `${instituicao.nomeFantasia} · ${formatarCNPJ(instituicao.cnpj)}` : "Painel da instituição"}
        </h1>
        <p className="text-sm text-neutral-500">
          Sua atuação: aprovar o arquivo que a Videnas já validou e registrar a transmissão ao órgão.
          A Videnas não envia o arquivo ao regulador.
        </p>
      </header>

      <div
        role="note"
        className="rounded-lg border border-status-info-border bg-status-info-bg p-4 text-sm text-status-info-text"
      >
        A Videnas gera e valida o arquivo. Você, pela instituição cliente, assume a obrigação e
        transmite fora da plataforma (Sisbacen, PSTAW10 ou o emissor de NFS-e). Depois, registra aqui
        o protocolo recebido.
      </div>

      {atrasados.length > 0 ? (
        <div className="rounded-lg border border-status-error-border bg-status-error-bg p-4 text-sm text-status-error-text">
          {atrasados.length} competência{atrasados.length === 1 ? "" : "s"} fora do prazo.{" "}
          <Link href="/app/calendario" className="font-medium underline">
            Ver calendário
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Aguardando a sua aprovação</p>
          <p className="text-xl font-bold text-neutral-700">{paraAprovar.length}</p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">A registrar transmissão</p>
          <p className="text-xl font-bold text-neutral-700">{paraRegistrar.length}</p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Fora do prazo</p>
          <p className="text-xl font-bold text-neutral-700">{atrasados.length}</p>
        </div>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-5" aria-labelledby="compliance-aprovar">
        <h2 id="compliance-aprovar" className="mb-3 font-display text-base font-bold text-neutral-700">
          Aprovar o que a Videnas validou
        </h2>
        {paraAprovar.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhuma competência liberada aguardando a sua aprovação.</p>
        ) : (
          <ul className="space-y-2">{paraAprovar.map((periodo) => linhaAcao(periodo, "Aprovar"))}</ul>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5" aria-labelledby="compliance-registrar">
        <h2 id="compliance-registrar" className="mb-3 font-display text-base font-bold text-neutral-700">
          Registrar a transmissão ao órgão
        </h2>
        {paraRegistrar.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nada a registrar. Depois de transmitir fora da Videnas, o protocolo aparece aqui.
          </p>
        ) : (
          <ul className="space-y-2">
            {paraRegistrar.map((periodo) =>
              linhaAcao(
                periodo,
                periodo.moduloId === "fiscal" ? "Marcar encaminhado" : "Registrar protocolo"
              )
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function PainelAdmin({
  tenants,
  eventosRecentes,
}: {
  tenants: Instituicao[];
  eventosRecentes: EventoAuditoria[];
}) {
  const contagem: Record<StatusImplantacao, number> = {
    provisionado: 0,
    onboarding_em_andamento: 0,
    ativo: 0,
    suspenso: 0,
  };
  for (const tenant of tenants) {
    contagem[tenant.statusImplantacao] += 1;
  }

  const emImplantacao = contagem.provisionado + contagem.onboarding_em_andamento;

  const precisamAtencao = tenants.filter(
    (tenant) =>
      tenant.statusImplantacao === "provisionado" || tenant.statusImplantacao === "suspenso"
  );

  const ultimosProvisionados = [...tenants]
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
    .slice(0, 5);

  const tiles: { rotulo: string; valor: number }[] = [
    { rotulo: "Total de clientes", valor: tenants.length },
    { rotulo: "Ativos", valor: contagem.ativo },
    { rotulo: "Em implantação", valor: emImplantacao },
    { rotulo: "Suspensos", valor: contagem.suspenso },
  ];

  return (
    <div data-tour="dashboard-admin" className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-700">
            Carteira de clientes · Videnas
          </h1>
          <p className="text-sm text-neutral-500">
            Data de referência: {formatarData(HOJE_ISO)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button render={<Link href="/app/clientes/novo" />} nativeButton={false}>
            <Plus className="size-4" aria-hidden="true" />
            Cadastrar novo cliente
          </Button>
          <Link
            href="/app/clientes"
            className="rounded-sm text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Ver carteira completa
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.rotulo} className="rounded-md border border-neutral-200 bg-white p-3">
            <p className="text-xs text-neutral-500">{tile.rotulo}</p>
            <p className="text-xl font-bold text-neutral-700">{tile.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="admin-atencao-titulo"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <h2
            id="admin-atencao-titulo"
            className="mb-3 flex items-center gap-1.5 font-display text-base font-bold text-neutral-700"
          >
            Clientes que precisam de atenção
            <BadgeAjuda chave="cliente.status-implantacao" tamanho="sm" />
          </h2>
          {precisamAtencao.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Nenhum cliente parado. Todos já receberam o convite inicial e nenhum está suspenso.
            </p>
          ) : (
            <ul className="space-y-2">
              {precisamAtencao.map((tenant) => (
                <li key={tenant.id}>
                  <Link
                    href={`/app/clientes/${tenant.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-neutral-50 p-3 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-neutral-700">
                        {tenant.nomeFantasia}
                      </span>
                      <span className="block text-xs text-neutral-500">
                        {tenant.statusImplantacao === "provisionado"
                          ? "Cadastrado, mas o convite inicial ainda não foi enviado ao Responsável de Compliance."
                          : "Suspenso: o atendimento está interrompido até a reativação."}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "status-badge shrink-0",
                        CLASSE_STATUS_IMPLANTACAO[tenant.statusImplantacao]
                      )}
                    >
                      {ROTULO_STATUS_IMPLANTACAO[tenant.statusImplantacao]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="admin-recentes-titulo"
          className="rounded-lg border border-neutral-200 bg-white p-5"
        >
          <h2
            id="admin-recentes-titulo"
            className="mb-3 font-display text-base font-bold text-neutral-700"
          >
            Últimos clientes provisionados
          </h2>
          {ultimosProvisionados.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum cliente cadastrado ainda.</p>
          ) : (
            <ul className="space-y-2">
              {ultimosProvisionados.map((tenant) => (
                <li key={tenant.id}>
                  <Link
                    href={`/app/clientes/${tenant.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-neutral-50 p-3 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-neutral-700">
                        {tenant.nomeFantasia}
                      </span>
                      <span className="block text-xs text-neutral-500">
                        Entrada em {formatarData(tenant.criadoEm.slice(0, 10))} ·{" "}
                        {formatarCNPJ(tenant.cnpj)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "status-badge shrink-0",
                        CLASSE_STATUS_IMPLANTACAO[tenant.statusImplantacao]
                      )}
                    >
                      {ROTULO_STATUS_IMPLANTACAO[tenant.statusImplantacao]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section
        aria-labelledby="admin-auditoria-titulo"
        className="rounded-lg border border-neutral-200 bg-white p-5"
      >
        <h2
          id="admin-auditoria-titulo"
          className="mb-3 font-display text-base font-bold text-neutral-700"
        >
          Últimos eventos de auditoria
        </h2>
        {eventosRecentes.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum evento registrado ainda.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {eventosRecentes.map((evento) => (
              <li key={evento.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-mono text-xs text-neutral-500">
                  {formatarDataHora(evento.ocorridoEm)}
                </span>
                <span className="text-neutral-700">{evento.usuarioNome}</span>
                <span className="text-xs text-neutral-500">({evento.perfilId})</span>
                <span className="text-neutral-600">{evento.rotuloTipo}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/app/auditoria"
          className="mt-3 inline-block rounded-sm text-xs font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          Ver trilha completa
        </Link>
      </section>
    </div>
  );
}
