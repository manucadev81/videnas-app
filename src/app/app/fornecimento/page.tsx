"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { SeletorPeriodo } from "@/components/fornecimento/seletor-periodo";
import { PainelPeriodo } from "@/components/fornecimento/painel-periodo";
import { useEvidenciasStore, useHidratarEvidencias } from "@/lib/store/evidencias";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarUsuario } from "@/lib/mock/usuarios";
import type { EstadoPeriodo } from "@/lib/tipos";

const ESTADOS_ABERTOS: EstadoPeriodo[] = ["aguardando_dados", "dados_ingeridos"];

function EsqueletoFornecimento() {
  return (
    <div role="status" aria-label="Carregando competências abertas" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function FornecimentoPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const mapaPeriodos = usePeriodosStore((estado) => estado.periodos);
  const hidratado = useEvidenciasStore((estado) => estado.hidratado);

  useHidratarEvidencias();

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const instituicaoEscopo =
    instituicaoAtivaId && instituicaoAtivaId !== "todas" ? instituicaoAtivaId : null;
  const instituicao = instituicaoEscopo ? buscarInstituicao(instituicaoEscopo) : undefined;

  const periodosAbertos = useMemo(() => {
    const modulosContratados = instituicao?.modulosContratados ?? null;

    return Object.values(mapaPeriodos)
      .filter((periodo) => ESTADOS_ABERTOS.includes(periodo.estado))
      .filter((periodo) => periodo.instituicaoId === instituicaoEscopo)
      .filter((periodo) =>
        modulosContratados ? modulosContratados.includes(periodo.moduloId) : true
      )
      .sort((a, b) => a.prazoEntrega.localeCompare(b.prazoEntrega));
  }, [mapaPeriodos, instituicaoEscopo, instituicao]);

  const periodoSelecionado =
    periodosAbertos.find((periodo) => periodo.id === selecionadoId) ?? periodosAbertos[0] ?? null;

  if (!hidratado || !perfilAtivo || !usuarioId) {
    return <EsqueletoFornecimento />;
  }

  const usuario = buscarUsuario(usuarioId);
  const autor = {
    usuarioId,
    nome: usuario?.nome ?? "Usuário da demonstração",
    perfilId: perfilAtivo,
  };

  const instituicaoDoPeriodo = periodoSelecionado
    ? buscarInstituicao(periodoSelecionado.instituicaoId)
    : undefined;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-1.5 font-display text-2xl font-bold text-neutral-700">
          Fornecimento de dados
          <BadgeAjuda chave="nav.fornecimento" tamanho="md" />
        </h1>
        <p className="text-sm text-neutral-500">
          {perfilAtivo === "cliente"
            ? "Envie os insumos de cada obrigação e acompanhe o que ainda falta antes do prazo regulatório."
            : "Acompanhe os insumos de cada obrigação. O envio é responsabilidade do perfil Cliente / Fornecedor de dados da instituição."}
        </p>
      </header>

      {periodosAbertos.length === 0 || !periodoSelecionado ? (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <EstadoVazio
            icone={CalendarCheck2}
            titulo="Nenhuma competência aberta para fornecimento"
            mensagem={
              instituicao
                ? `Não há competência aguardando dados em ${instituicao.nomeFantasia} neste momento. Assim que a Videnas abrir uma nova competência, ela aparece aqui.`
                : "Não há competência aguardando dados no escopo selecionado. Escolha outra instituição no seletor do topo."
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <SeletorPeriodo
            periodos={periodosAbertos}
            selecionadoId={periodoSelecionado.id}
            mostrarInstituicao={!instituicaoEscopo}
            aoSelecionar={setSelecionadoId}
          />

          <PainelPeriodo
            key={periodoSelecionado.id}
            periodo={periodoSelecionado}
            instituicao={instituicaoDoPeriodo}
            perfilAtivo={perfilAtivo}
            usuarioId={usuarioId}
            autor={autor}
          />
        </div>
      )}
    </div>
  );
}
