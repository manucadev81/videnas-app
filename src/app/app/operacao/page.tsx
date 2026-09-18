"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { BadgeStatus } from "@/components/dominio/badge-status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { useTenantsStore } from "@/lib/store/tenants";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { calcularPeriodoDerivado } from "@/lib/mock/periodos";
import { formatarData, formatarDataHora } from "@/lib/formatadores";
import type { ModuloId, PeriodoObrigacao } from "@/lib/tipos";
import { cn } from "@/lib/utils";

function rotaPeriodo(moduloId: ModuloId, periodoId: string): string {
  if (moduloId === "acam212") return `/app/acam212/${periodoId}`;
  if (moduloId === "fiscal") return `/app/fiscal/${periodoId}`;
  return `/app/cadoc/${periodoId}`;
}

export default function OperacaoPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const definirInstituicao = useSessaoStore((estado) => estado.definirInstituicao);
  const mapaPeriodos = usePeriodosStore((estado) => estado.periodos);
  const tenants = useTenantsStore((estado) => estado.tenants);
  const todosPeriodos = useMemo(() => Object.values(mapaPeriodos), [mapaPeriodos]);

  const [filtroModulo, setFiltroModulo] = useState<ModuloId | "todos">("todos");
  const [somenteMeus, setSomenteMeus] = useState(false);
  const [somenteAtrasados, setSomenteAtrasados] = useState(false);

  const ehOperacao = perfilAtivo === "executor" || perfilAtivo === "validador";

  const periodosInstituicao = useMemo(() => {
    return todosPeriodos.filter((periodo) =>
      instituicaoAtivaId && instituicaoAtivaId !== "todas" ? periodo.instituicaoId === instituicaoAtivaId : true
    );
  }, [todosPeriodos, instituicaoAtivaId]);

  const filaBase = periodosInstituicao
    .filter((periodo) => (filtroModulo === "todos" ? true : periodo.moduloId === filtroModulo))
    .filter((periodo) => (somenteAtrasados ? calcularPeriodoDerivado(periodo).atrasado : true))
    .filter((periodo) =>
      somenteMeus
        ? periodo.geradoPorUsuarioId === usuarioId || periodo.liberadoPorUsuarioId === usuarioId
        : true
    );

  const aGerar = filaBase.filter((periodo) => periodo.estado === "dados_ingeridos");
  const aValidar = filaBase.filter((periodo) => periodo.estado === "em_validacao" || periodo.estado === "com_excecoes");
  const aLiberar = filaBase.filter((periodo) => periodo.estado === "validado");

  const contadorPorInstituicao = tenants.map((instituicao) => ({
    instituicao,
    total: todosPeriodos.filter(
      (periodo) =>
        periodo.instituicaoId === instituicao.id &&
        (periodo.estado === "dados_ingeridos" || periodo.estado === "em_validacao" || periodo.estado === "com_excecoes" || periodo.estado === "validado")
    ).length,
  }));

  if (!ehOperacao) {
    return (
      <EstadoVazio
        titulo="Acesso não disponível"
        mensagem="Seu perfil não tem acesso a esta área. A fila de operação é restrita aos perfis Executor e Validador da Videnas."
      />
    );
  }

  const totalFila = aGerar.length + aValidar.length + aLiberar.length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-neutral-700">Operação Videnas</h1>
        <p className="text-sm text-neutral-500">
          Perfil ativo: {perfilAtivo === "executor" ? "Executor" : "Validador"} · {totalFila} itens na fila
        </p>
      </header>

      <div data-tour="operacao-chips-instituicao" className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => definirInstituicao("todas")}
          className={cn(
            "status-badge",
            instituicaoAtivaId === "todas" ? "status-badge-info" : "status-badge-neutral",
            "cursor-pointer"
          )}
        >
          Todas ({todosPeriodos.length})
        </button>
        {contadorPorInstituicao.map(({ instituicao, total }) => (
          <button
            key={instituicao.id}
            type="button"
            onClick={() => definirInstituicao(instituicao.id)}
            className={cn(
              "status-badge",
              instituicaoAtivaId === instituicao.id ? "status-badge-info" : "status-badge-neutral",
              "cursor-pointer"
            )}
          >
            {instituicao.nomeFantasia} ({total})
          </button>
        ))}
      </div>

      <div data-tour="operacao-contadores" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">
            {perfilAtivo === "validador" ? "Aguardando validação" : "Aguardando geração"}
          </p>
          <p className="text-xl font-bold text-neutral-700">{aGerar.length}</p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Em validação</p>
          <p className="text-xl font-bold text-neutral-700">{aValidar.length}</p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Com exceções</p>
          <p className="text-xl font-bold text-neutral-700">
            {filaBase.filter((periodo) => periodo.estado === "com_excecoes").length}
          </p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white p-3">
          <p className="text-xs text-neutral-500">Vencendo em 3 dias</p>
          <p className="text-xl font-bold text-neutral-700">
            {filaBase.filter((periodo) => {
              const derivado = calcularPeriodoDerivado(periodo);
              return derivado.diasParaPrazo >= 0 && derivado.diasParaPrazo <= 3;
            }).length}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "rounded-md border p-3 text-sm",
          "border-status-info-border bg-status-info-bg text-status-info-text"
        )}
      >
        Você está no perfil {perfilAtivo === "executor" ? "Executor" : "Validador"}.{" "}
        {perfilAtivo === "executor"
          ? "Itens já gerados por você aparecem destacados e só podem ser liberados por outro usuário."
          : "Itens gerados por você não podem ser liberados pelo mesmo usuário — segregação de funções obrigatória."}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-44">
          <Select value={filtroModulo} onValueChange={(valor) => setFiltroModulo(valor as ModuloId | "todos")}>
            <SelectTrigger aria-label="Filtrar por módulo" className="w-full">
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os módulos</SelectItem>
              <SelectItem value="acam212">ACAM212</SelectItem>
              <SelectItem value="cadoc5711">Cadoc 5711</SelectItem>
              <SelectItem value="cadoc5710">Cadoc 5710</SelectItem>
              <SelectItem value="fiscal">Fiscal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="somente-meus" checked={somenteMeus} onCheckedChange={setSomenteMeus} />
          <Label htmlFor="somente-meus" className="font-normal">
            Somente meus itens
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="somente-atrasados" checked={somenteAtrasados} onCheckedChange={setSomenteAtrasados} />
          <Label htmlFor="somente-atrasados" className="font-normal">
            Somente atrasados
          </Label>
        </div>
      </div>

      {totalFila === 0 ? (
        <EstadoVazio titulo="Nenhum item na sua fila. Tudo em dia." mensagem="Ajuste os filtros para ver outros itens." />
      ) : (
        <div data-tour="operacao-fila" className="space-y-6">
          <GrupoFila
            titulo="A gerar"
            periodos={aGerar}
            rotuloAcao="Gerar arquivo"
            usuarioId={usuarioId}
          />
          <GrupoFila
            titulo="A validar"
            periodos={aValidar}
            rotuloAcao="Executar validação"
            usuarioId={usuarioId}
          />
          <GrupoFila
            titulo="A liberar"
            periodos={aLiberar}
            rotuloAcao="Liberar"
            usuarioId={usuarioId}
          />
        </div>
      )}
    </div>
  );
}

function GrupoFila({
  titulo,
  periodos,
  rotuloAcao,
  usuarioId,
}: {
  titulo: string;
  periodos: PeriodoObrigacao[];
  rotuloAcao: string;
  usuarioId: string | null;
}) {
  if (periodos.length === 0) return null;

  const ordenados = [...periodos].sort((a, b) => {
    const derivadoA = calcularPeriodoDerivado(a);
    const derivadoB = calcularPeriodoDerivado(b);
    if (derivadoA.atrasado !== derivadoB.atrasado) return derivadoA.atrasado ? -1 : 1;
    return derivadoA.diasParaPrazo - derivadoB.diasParaPrazo;
  });

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <h2 className="border-b border-neutral-200 px-5 py-3 font-display text-base font-bold text-neutral-700">
        {titulo} ({periodos.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-neutral-700">Prioridade</th>
              <th className="px-4 py-2 text-left font-semibold text-neutral-700">Instituição</th>
              <th className="px-4 py-2 text-left font-semibold text-neutral-700">Módulo</th>
              <th className="px-4 py-2 text-left font-semibold text-neutral-700">Competência</th>
              <th className="px-4 py-2 text-left font-semibold text-neutral-700">Estado</th>
              <th className="px-4 py-2 text-left font-semibold text-neutral-700">Prazo</th>
              <th className="px-4 py-2 text-left font-semibold text-neutral-700">Última ação</th>
              <th className="px-4 py-2 text-left font-semibold text-neutral-700">Ação</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((periodo) => {
              const derivado = calcularPeriodoDerivado(periodo);
              const instituicao = buscarInstituicao(periodo.instituicaoId);
              const modulo = buscarModulo(periodo.moduloId);
              const geradoPorMim = periodo.geradoPorUsuarioId === usuarioId;

              return (
                <tr key={periodo.id} className={cn("border-t border-neutral-200", geradoPorMim && "bg-neutral-50 text-neutral-400")}>
                  <td className="px-4 py-2">
                    <span className={cn("status-badge", derivado.atrasado ? "status-badge-error" : "status-badge-neutral")}>
                      {derivado.atrasado ? "Atrasado" : derivado.diasParaPrazo <= 3 ? "Urgente" : "Normal"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-neutral-700">{instituicao?.nomeFantasia}</p>
                    <p className="text-xs text-neutral-400">{instituicao?.cnpj}</p>
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{modulo.sigla}</td>
                  <td className="px-4 py-2 text-neutral-600">{periodo.competenciaRotulo}</td>
                  <td className="px-4 py-2">
                    <BadgeStatus estado={periodo.estado} />
                  </td>
                  <td className="px-4 py-2">
                    <span className={derivado.atrasado ? "text-status-error-text" : "text-neutral-600"}>
                      {formatarData(periodo.prazoEntrega)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-neutral-500">
                    {periodo.geradoEm ? (
                      <>
                        Arquivo gerado · {buscarUsuario(periodo.geradoPorUsuarioId ?? "")?.nome} ·{" "}
                        {formatarDataHora(periodo.geradoEm)}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={rotaPeriodo(periodo.moduloId, periodo.id)}
                      className="text-xs font-medium text-brand-700 hover:text-brand-800"
                    >
                      {geradoPorMim ? "Abrir" : rotuloAcao}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
