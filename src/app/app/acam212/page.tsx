"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BadgeStatus, BadgeAtrasado } from "@/components/dominio/badge-status";
import { StepperEtapas } from "@/components/dominio/stepper-etapas";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { construirEtapasStepper } from "@/components/dominio/modulo-etapas";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { calcularPeriodoDerivado } from "@/lib/mock/periodos";
import { buscarModulo } from "@/lib/mock/modulos";
import { formatarData, truncarHash } from "@/lib/formatadores";
import type { EstadoPeriodo, PeriodoObrigacao } from "@/lib/tipos";
import { toast } from "sonner";

const ROTULOS_ESTADO: Record<EstadoPeriodo | "todos", string> = {
  todos: "Todos os estados",
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

const GRUPOS_COMPOSICAO: { chave: string; rotulo: string }[] = [
  { chave: "grupoG01", rotulo: "G01 — Identificação da instituição declarante" },
  { chave: "grupoG10", rotulo: "G10 — Pagamentos e transferências internacionais" },
  { chave: "grupoG20", rotulo: "G20 — Operações com cartão" },
  { chave: "grupoG30", rotulo: "G30 — Movimentações para autocustódia" },
  { chave: "grupoG40", rotulo: "G40 — Totais mensais consolidados" },
  { chave: "grupoG90", rotulo: "G90 — Anulações e retificações" },
];

export default function Acam212Page() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const mapaPeriodos = usePeriodosStore((estado) => estado.periodos);
  const todosPeriodos = useMemo(() => Object.values(mapaPeriodos), [mapaPeriodos]);
  const arquivos = usePeriodosStore((estado) => estado.arquivos);
  const protocolos = usePeriodosStore((estado) => estado.protocolos);

  const [filtroEstado, setFiltroEstado] = useState<EstadoPeriodo | "todos">("todos");
  const [apenasAtrasados, setApenasAtrasados] = useState(false);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const modulo = buscarModulo("acam212");

  const periodosModulo = useMemo(() => {
    return todosPeriodos
      .filter((periodo) => periodo.moduloId === "acam212")
      .filter((periodo) =>
        instituicaoAtivaId && instituicaoAtivaId !== "todas" ? periodo.instituicaoId === instituicaoAtivaId : true
      )
      .sort((a, b) => (a.competencia < b.competencia ? 1 : -1));
  }, [todosPeriodos, instituicaoAtivaId]);

  const periodosFiltrados = periodosModulo
    .filter((periodo) => (filtroEstado === "todos" ? true : periodo.estado === filtroEstado))
    .filter((periodo) => (apenasAtrasados ? calcularPeriodoDerivado(periodo).atrasado : true));

  const periodoCorrente = periodosModulo[0];
  const periodoSelecionado = periodosModulo.find((periodo) => periodo.id === selecionadoId) ?? periodoCorrente;

  if (perfilAtivo === "contador") {
    return (
      <EstadoVazio
        titulo="Acesso não disponível"
        mensagem="Seu perfil não tem acesso a esta área. O módulo ACAM212 é restrito aos perfis Diretor, Operacional, Executor e Validador."
      />
    );
  }

  if (periodosModulo.length === 0) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="font-display text-2xl font-bold text-neutral-700">{modulo.nomeCompleto}</h1>
          <p className="text-sm text-neutral-500">
            Declaração mensal ao Banco Central do Brasil. Prazo: dia {modulo.diaPrazo} do mês seguinte à
            competência.
          </p>
        </header>
        <EstadoVazio
          titulo="Nenhuma competência gerada para este módulo ainda"
          mensagem="Ela aparece aqui assim que os dados do primeiro período forem enviados."
        />
      </div>
    );
  }

  const derivadoCorrente = periodoCorrente ? calcularPeriodoDerivado(periodoCorrente) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-neutral-700">{modulo.nomeCompleto}</h1>
        <p className="text-sm text-neutral-500">
          Declaração mensal ao Banco Central do Brasil. Prazo: dia {modulo.diaPrazo} do mês seguinte à
          competência.
        </p>
      </header>

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
            </div>
            <Button render={<Link href={`/app/acam212/${periodoCorrente.id}`} />} nativeButton={false} size="sm">
              Abrir período
            </Button>
          </div>
          <StepperEtapas
            etapas={construirEtapasStepper(modulo.etapas, derivadoCorrente.etapaAtual, periodoCorrente.estado, {})}
            className="mt-4 border-t pt-4"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-48">
          <Select value={filtroEstado} onValueChange={(valor) => setFiltroEstado(valor as EstadoPeriodo | "todos")}>
            <SelectTrigger aria-label="Filtrar por estado" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROTULOS_ESTADO).map(([valor, rotulo]) => (
                <SelectItem key={valor} value={valor}>
                  {rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="apenas-atrasados" checked={apenasAtrasados} onCheckedChange={setApenasAtrasados} />
          <Label htmlFor="apenas-atrasados" className="font-normal">
            Apenas atrasados
          </Label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-lg border border-neutral-200 bg-white">
          <TabelaDadosCompetencias
            periodos={periodosFiltrados}
            arquivos={arquivos}
            protocolos={protocolos}
            onSelecionar={setSelecionadoId}
          />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 font-display text-base font-bold text-neutral-700">Composição do arquivo</h2>
          {periodoSelecionado ? (
            <ul className="space-y-2 text-sm">
              {GRUPOS_COMPOSICAO.map((grupo) => (
                <li key={grupo.chave} className="flex items-center justify-between gap-2">
                  <span className="text-neutral-500">{grupo.rotulo}</span>
                  <span className="font-medium text-neutral-700">
                    {periodoSelecionado.totaisResumo[grupo.chave] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Selecione uma competência na tabela.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TabelaDadosCompetencias({
  periodos,
  arquivos,
  protocolos,
  onSelecionar,
}: {
  periodos: PeriodoObrigacao[];
  arquivos: ReturnType<typeof usePeriodosStore.getState>["arquivos"];
  protocolos: ReturnType<typeof usePeriodosStore.getState>["protocolos"];
  onSelecionar: (id: string) => void;
}) {
  const colunas: ColunaTabela<PeriodoObrigacao>[] = [
    {
      id: "competencia",
      cabecalho: "Competência",
      renderizar: (periodo) => (
        <button type="button" className="text-left hover:text-brand-700" onClick={() => onSelecionar(periodo.id)}>
          {periodo.competenciaRotulo}
        </button>
      ),
    },
    { id: "estado", cabecalho: "Estado", renderizar: (periodo) => <BadgeStatus estado={periodo.estado} /> },
    {
      id: "operacoes",
      cabecalho: "Operações",
      alinhamento: "right",
      renderizar: (periodo) => String(periodo.totaisResumo.operacoes ?? 0),
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
    {
      id: "prazo",
      cabecalho: "Prazo",
      renderizar: (periodo) => {
        const derivado = calcularPeriodoDerivado(periodo);
        return (
          <span className={derivado.atrasado ? "text-status-error-text" : undefined}>
            {formatarData(periodo.prazoEntrega)}
            {derivado.atrasado ? " · atrasado" : ""}
          </span>
        );
      },
    },
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
      renderizar: (periodo) => {
        const arquivo = periodo.arquivoCorrenteId ? arquivos[periodo.arquivoCorrenteId] : undefined;
        return (
          <div className="flex items-center gap-3">
            <Link href={`/app/acam212/${periodo.id}`} className="text-xs font-medium text-brand-700 hover:text-brand-800">
              Abrir
            </Link>
            {arquivo ? (
              <button
                type="button"
                className="text-xs font-medium text-brand-700 hover:text-brand-800"
                onClick={() => toast.info("Download simulado. Nenhum arquivo real é gerado nesta demonstração.")}
              >
                Baixar
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <TabelaDados
      colunas={colunas}
      dados={periodos}
      chave={(periodo) => periodo.id}
      tituloVazio="Nenhuma competência encontrada"
      mensagemVazia="Ajuste os filtros para ver outras competências."
    />
  );
}
