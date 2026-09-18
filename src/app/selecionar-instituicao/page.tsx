"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Search,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { useHidratarSessao, useSessaoStore, perfilTemContextoFixo } from "@/lib/store/sessao";
import { buscarUsuario } from "@/lib/mock/usuarios";
import {
  CLASSE_STATUS_IMPLANTACAO,
  ROTULO_STATUS_IMPLANTACAO,
  useHidratarTenants,
  useTenantsStore,
} from "@/lib/store/tenants";
import { buscarProtocolo, calcularPeriodoDerivado, periodosPorInstituicao } from "@/lib/mock/periodos";
import { buscarPerfil } from "@/lib/permissoes";
import { formatarCNPJ, formatarData } from "@/lib/formatadores";
import { cn } from "@/lib/utils";
import type { TipoInstituicao } from "@/lib/tipos";

const ROTULO_TIPO: Record<TipoInstituicao, string> = {
  exchange: "Exchange",
  custodiante: "Custodiante",
  mesa_otc: "Mesa de OTC",
};

const SIGLA_MODULO: Record<string, string> = {
  acam212: "C212",
  cadoc5711: "5711",
  cadoc5710: "5710",
  fiscal: "DPS",
};

function resumoInstituicao(instituicaoId: string) {
  const periodos = periodosPorInstituicao(instituicaoId).map((periodo) => calcularPeriodoDerivado(periodo));
  const emAberto = periodos.filter((periodo) => periodo.estado !== "entregue").length;
  const atrasados = periodos.filter((periodo) => periodo.atrasado).length;

  const entregues = periodos
    .filter((periodo) => periodo.estado === "entregue" && periodo.entregueEm)
    .sort((a, b) => (a.entregueEm! < b.entregueEm! ? 1 : -1));

  const ultimaEntrega = entregues[0];
  const protocolo = ultimaEntrega?.protocoloId ? buscarProtocolo(ultimaEntrega.protocoloId) : undefined;

  return { emAberto, atrasados, ultimaEntrega, protocolo };
}

export default function SelecionarInstituicaoPage() {
  const router = useRouter();
  const hidratado = useHidratarSessao();
  const tenantsHidratados = useHidratarTenants();
  const tenants = useTenantsStore((estado) => estado.tenants);
  const autenticado = useSessaoStore((estado) => estado.autenticado);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const definirInstituicao = useSessaoStore((estado) => estado.definirInstituicao);

  const usuario = usuarioId ? buscarUsuario(usuarioId) : undefined;

  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState<string | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [autoSelecaoConcluida, setAutoSelecaoConcluida] = useState(false);

  const contextoFixo = perfilTemContextoFixo(perfilAtivo);

  useEffect(() => {
    if (hidratado && !autenticado) {
      router.replace("/login");
    }
  }, [hidratado, autenticado, router]);

  useEffect(() => {
    if (hidratado && autenticado && contextoFixo) {
      router.replace("/app");
    }
  }, [hidratado, autenticado, contextoFixo, router]);

  const perfilSelecionado = perfilAtivo ?? "operacional";
  const perfilMetadados = buscarPerfil(perfilSelecionado);

  const instituicoesDisponiveis = useMemo(() => {
    if (perfilMetadados.multiTenant) {
      return tenants;
    }
    if (!usuario) return [];
    return tenants.filter((instituicao) => usuario.instituicaoIds.includes(instituicao.id));
  }, [perfilMetadados.multiTenant, tenants, usuario]);

  const instituicoesFiltradas = useMemo(() => {
    if (!termoBusca.trim()) return instituicoesDisponiveis;
    const termo = termoBusca.trim().toLowerCase();
    return instituicoesDisponiveis.filter(
      (instituicao) =>
        instituicao.nomeFantasia.toLowerCase().includes(termo) ||
        instituicao.razaoSocial.toLowerCase().includes(termo) ||
        instituicao.cnpj.includes(termo)
    );
  }, [instituicoesDisponiveis, termoBusca]);

  const carregandoAutoSelecao = instituicoesDisponiveis.length === 1 && !autoSelecaoConcluida;

  const cartaoGlobal =
    perfilSelecionado === "admin"
      ? {
          titulo: "Carteira de clientes",
          descricao: "Cadastre e administre os clientes da Videnas.",
          rotuloAcao: "Abrir carteira",
          icone: Building2,
          destino: "/app/clientes",
        }
      : {
          titulo: "Todas as instituições",
          descricao: "Visão de operação, com fila de trabalho multi-tenant.",
          rotuloAcao: "Abrir operação",
          icone: Workflow,
          destino: "/app/operacao",
        };

  useEffect(() => {
    if (instituicoesDisponiveis.length === 1 && !autoSelecaoConcluida) {
      const temporizador = setTimeout(() => {
        setInstituicaoSelecionada(instituicoesDisponiveis[0].id);
        setAutoSelecaoConcluida(true);
      }, 800);
      return () => clearTimeout(temporizador);
    }
  }, [instituicoesDisponiveis, autoSelecaoConcluida]);

  if (!hidratado || !tenantsHidratados || !usuario || contextoFixo) {
    return null;
  }

  function confirmar() {
    if (!instituicaoSelecionada) return;
    definirInstituicao(instituicaoSelecionada);
    router.push("/app");
  }

  function abrirVisaoGlobal() {
    definirInstituicao("todas");
    router.push(cartaoGlobal.destino);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 md:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-700">Selecione a instituição</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Olá, {usuario.nome}. Perfil ativo:{" "}
          <span className="font-medium text-brand-700">{perfilMetadados.rotuloCompleto}</span>.
        </p>
      </div>

      <section aria-labelledby="instituicao-titulo" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="instituicao-titulo" className="font-display text-lg font-bold text-neutral-700">
            Instituições vinculadas
          </h2>
          {instituicoesDisponiveis.length > 3 ? (
            <div className="relative w-56">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <Input
                value={termoBusca}
                onChange={(evento) => setTermoBusca(evento.target.value)}
                placeholder="Buscar por nome ou CNPJ"
                aria-label="Buscar instituição por nome ou CNPJ"
                className="pl-8"
              />
            </div>
          ) : null}
        </div>

        {instituicoesDisponiveis.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma instituição vinculada ao seu usuário."
            mensagem="Fale com o administrador da sua conta."
            icone={Building2}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {carregandoAutoSelecao ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-3 h-3 w-1/2" />
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-3/4" />
              </div>
            ) : (
              instituicoesFiltradas.map((instituicao) => {
                const resumo = resumoInstituicao(instituicao.id);
                const selecionada = instituicaoSelecionada === instituicao.id;
                return (
                  <button
                    key={instituicao.id}
                    type="button"
                    onClick={() => setInstituicaoSelecionada(instituicao.id)}
                    aria-pressed={selecionada}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border bg-white p-5 text-left transition-colors",
                      selecionada ? "border-brand-700 ring-2 ring-brand-100" : "border-neutral-200 hover:border-brand-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-base font-bold text-neutral-700">{instituicao.nomeFantasia}</p>
                        <p className="text-xs text-neutral-500">{instituicao.razaoSocial}</p>
                      </div>
                      {selecionada ? (
                        <CheckCircle2 className="size-5 shrink-0 text-brand-700" aria-hidden="true" />
                      ) : null}
                    </div>

                    <p className="text-xs text-neutral-500">{formatarCNPJ(instituicao.cnpj)}</p>

                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="w-fit rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                        {ROTULO_TIPO[instituicao.tipo]}
                      </span>
                      <span
                        className={cn(
                          "status-badge",
                          CLASSE_STATUS_IMPLANTACAO[instituicao.statusImplantacao]
                        )}
                      >
                        {ROTULO_STATUS_IMPLANTACAO[instituicao.statusImplantacao]}
                      </span>
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {instituicao.modulosContratados.map((modulo) => (
                        <span key={modulo} className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">
                          {SIGLA_MODULO[modulo]}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-neutral-500">
                      {resumo.emAberto} {resumo.emAberto === 1 ? "obrigação em aberto" : "obrigações em aberto"}
                      {resumo.atrasados > 0 ? (
                        <span className="text-status-error-text"> · {resumo.atrasados} atrasada{resumo.atrasados > 1 ? "s" : ""}</span>
                      ) : null}
                    </p>

                    <p className="text-xs text-neutral-400">
                      {resumo.protocolo
                        ? `Última entrega: ${formatarData(resumo.protocolo.dataHoraEnvio.slice(0, 10))}`
                        : "Sem entregas registradas"}
                    </p>
                  </button>
                );
              })
            )}

            {perfilMetadados.multiTenant ? (
              <button
                type="button"
                onClick={abrirVisaoGlobal}
                className="flex flex-col items-start justify-center gap-2 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 p-5 text-left transition-colors hover:border-brand-700"
              >
                <cartaoGlobal.icone className="size-6 text-brand-700" aria-hidden="true" />
                <p className="font-display text-base font-bold text-brand-700">{cartaoGlobal.titulo}</p>
                <p className="text-xs text-brand-700/80">{cartaoGlobal.descricao}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                  {cartaoGlobal.rotuloAcao}
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </span>
              </button>
            ) : null}
          </div>
        )}
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="button" size="lg" disabled={!instituicaoSelecionada} onClick={confirmar}>
          Confirmar e entrar
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
