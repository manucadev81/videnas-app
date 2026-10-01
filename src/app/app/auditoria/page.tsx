"use client";

import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { ROTULOS_TIPO } from "@/lib/mock/auditoria";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { formatarDataHora, truncarHash } from "@/lib/formatadores";
import { detalheLegivelDoEvento } from "@/lib/auditoria-detalhe";
import { baixarCsv, montarCsvTrilha, nomeArquivoTrilha } from "@/lib/auditoria/exportar-csv";
import { buscarPerfil } from "@/lib/permissoes";
import type { ModuloId, PerfilId, TipoEventoAuditoria } from "@/lib/tipos";

const ROTULOS_MODULO: Record<ModuloId, string> = {
  acam212: "ACAM212",
  cadoc5711: "Cadoc 5711",
  cadoc5710: "Cadoc 5710",
  fiscal: "Fiscal",
};

const ROTULOS_PERFIL: Record<PerfilId, string> = {
  diretor: buscarPerfil("diretor").rotulo,
  operacional: buscarPerfil("operacional").rotulo,
  contador: buscarPerfil("contador").rotulo,
  cliente: buscarPerfil("cliente").rotulo,
  executor: buscarPerfil("executor").rotulo,
  validador: buscarPerfil("validador").rotulo,
  admin: buscarPerfil("admin").rotulo,
};

export default function AuditoriaPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const eventos = usePeriodosStore((estado) => estado.eventos);
  const arquivos = usePeriodosStore((estado) => estado.arquivos);
  const periodos = usePeriodosStore((estado) => estado.periodos);
  const registrarEventoAdministrativo = usePeriodosStore((estado) => estado.registrarEventoAdministrativo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);

  const [filtroModulo, setFiltroModulo] = useState<ModuloId | "todos">("todos");
  const [filtroPerfil, setFiltroPerfil] = useState<PerfilId | "todos">("todos");
  const [filtroTipo, setFiltroTipo] = useState<TipoEventoAuditoria | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [linhaExpandida, setLinhaExpandida] = useState<string | null>(null);

  const eventosEscopo = useMemo(() => {
    return eventos.filter((evento) => {
      if (perfilAtivo === "diretor" || perfilAtivo === "operacional") {
        return instituicaoAtivaId ? evento.instituicaoId === instituicaoAtivaId : true;
      }
      if (perfilAtivo === "contador") {
        const escopoTenant = instituicaoAtivaId ? evento.instituicaoId === instituicaoAtivaId : true;
        return escopoTenant && evento.moduloId === "fiscal";
      }
      if (instituicaoAtivaId && instituicaoAtivaId !== "todas") {
        return evento.instituicaoId === instituicaoAtivaId;
      }
      return true;
    });
  }, [eventos, perfilAtivo, instituicaoAtivaId]);

  const tiposDisponiveis = useMemo(
    () =>
      Array.from(new Set(eventosEscopo.map((evento) => evento.tipo))).sort((a, b) =>
        ROTULOS_TIPO[a].localeCompare(ROTULOS_TIPO[b], "pt-BR")
      ),
    [eventosEscopo]
  );

  const eventosFiltrados = eventosEscopo
    .filter((evento) => (filtroTipo === "todos" ? true : evento.tipo === filtroTipo))
    .filter((evento) => (filtroModulo === "todos" ? true : evento.moduloId === filtroModulo))
    .filter((evento) => (filtroPerfil === "todos" ? true : evento.perfilId === filtroPerfil))
    .filter((evento) => {
      if (!busca.trim()) return true;
      const alvo = busca.trim().toLowerCase();
      return (
        evento.usuarioNome.toLowerCase().includes(alvo) ||
        evento.rotuloTipo.toLowerCase().includes(alvo) ||
        (evento.referencia ?? "").toLowerCase().includes(alvo) ||
        (evento.competencia ?? "").toLowerCase().includes(alvo)
      );
    })
    .sort((a, b) => (a.ocorridoEm < b.ocorridoEm ? 1 : -1));

  const podeExportar = Boolean(perfilAtivo && buscarPerfil(perfilAtivo).acoesPermitidas.includes("exportar_auditoria"));

  function exportarTrilha() {
    if (!perfilAtivo || !usuarioId) {
      return;
    }
    if (!podeExportar) {
      toast.error("Seu perfil não pode exportar a trilha.");
      return;
    }
    if (eventosFiltrados.length === 0) {
      toast.info("Nenhum evento para exportar com os filtros atuais.");
      return;
    }
    try {
      const escopo = instituicaoAtivaId ?? "todas";
      const nomeArquivo = nomeArquivoTrilha(escopo, new Date().toISOString());
      const conteudo = montarCsvTrilha(eventosFiltrados, {
        rotulosTipo: ROTULOS_TIPO,
        rotuloPerfil: (perfilId) => ROTULOS_PERFIL[perfilId],
        rotuloModulo: (moduloId) => ROTULOS_MODULO[moduloId],
        nomeInstituicao: (instituicaoId) => buscarInstituicao(instituicaoId)?.nomeFantasia ?? "",
      });
      baixarCsv(nomeArquivo, conteudo);
      registrarEventoAdministrativo({
        autor: { usuarioId, perfilId: perfilAtivo },
        instituicaoId: escopo,
        tipo: "TRILHA_EXPORTADA",
        rotuloTipo: ROTULOS_TIPO.TRILHA_EXPORTADA,
        referencia: nomeArquivo,
        payload: {
          quantidade: eventosFiltrados.length,
          formato: "csv",
          nomeArquivo,
          filtros: {
            modulo: filtroModulo,
            perfil: filtroPerfil,
            tipo: filtroTipo,
            busca: busca.trim() || null,
          },
        },
      });
      toast.success(`Trilha exportada: ${eventosFiltrados.length} evento(s) em ${nomeArquivo}.`);
    } catch {
      toast.error("Não foi possível gerar o arquivo CSV.");
    }
  }

  const arquivosEscopo = Object.values(arquivos).filter((arquivo) => {
    const periodo = periodos[arquivo.periodoId];
    if (!periodo) return false;
    if (perfilAtivo === "diretor" || perfilAtivo === "operacional" || perfilAtivo === "contador") {
      return instituicaoAtivaId ? periodo.instituicaoId === instituicaoAtivaId : true;
    }
    if (instituicaoAtivaId && instituicaoAtivaId !== "todas") {
      return periodo.instituicaoId === instituicaoAtivaId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-neutral-700">Trilha de auditoria</h1>
        <p className="text-sm text-neutral-500">
          Consulta transversal de todos os eventos registrados, com evidência de integridade.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40">
          <Select value={filtroModulo} onValueChange={(valor) => setFiltroModulo(valor as ModuloId | "todos")}>
            <SelectTrigger aria-label="Filtrar por módulo" className="w-full">
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os módulos</SelectItem>
              {(Object.keys(ROTULOS_MODULO) as ModuloId[]).map((moduloId) => (
                <SelectItem key={moduloId} value={moduloId}>
                  {ROTULOS_MODULO[moduloId]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-40">
          <Select value={filtroPerfil} onValueChange={(valor) => setFiltroPerfil(valor as PerfilId | "todos")}>
            <SelectTrigger aria-label="Filtrar por perfil" className="w-full">
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os perfis</SelectItem>
              {(Object.keys(ROTULOS_PERFIL) as PerfilId[]).map((perfilId) => (
                <SelectItem key={perfilId} value={perfilId}>
                  {ROTULOS_PERFIL[perfilId]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-56">
          <Select value={filtroTipo} onValueChange={(valor) => setFiltroTipo(valor as TipoEventoAuditoria | "todos")}>
            <SelectTrigger aria-label="Filtrar por tipo de evento" className="w-full">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos de evento</SelectItem>
              {tiposDisponiveis.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {ROTULOS_TIPO[tipo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-56 flex-1">
          <Input
            placeholder="Buscar por hash, protocolo, usuário ou competência"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            aria-label="Busca livre"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!podeExportar || eventosFiltrados.length === 0}
          title={
            !podeExportar
              ? "Seu perfil não pode exportar a trilha."
              : eventosFiltrados.length === 0
                ? "Nenhum evento para exportar com os filtros atuais."
                : undefined
          }
          onClick={exportarTrilha}
        >
          <Download className="size-4" aria-hidden="true" />
          Exportar trilha (CSV)
        </Button>
      </div>

      {eventosFiltrados.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum evento encontrado para os filtros selecionados"
          mensagem="Ajuste ou limpe os filtros para ver mais eventos."
          rotuloAcao="Limpar filtros"
          aoAcionar={() => {
            setFiltroModulo("todos");
            setFiltroPerfil("todos");
            setFiltroTipo("todos");
            setBusca("");
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Data e hora</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Instituição</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Módulo</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Competência</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Evento</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Usuário</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Perfil</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Lado</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Referência</th>
              </tr>
            </thead>
            <tbody>
              {eventosFiltrados.map((evento) => {
                const instituicao = buscarInstituicao(evento.instituicaoId);
                const expandida = linhaExpandida === evento.id;
                return (
                  <Fragment key={evento.id}>
                    <tr
                      className="cursor-pointer border-t border-neutral-200 hover:bg-neutral-50"
                      onClick={() => setLinhaExpandida(expandida ? null : evento.id)}
                    >
                      <td className="px-4 py-2 font-mono text-xs text-neutral-500">{formatarDataHora(evento.ocorridoEm)}</td>
                      <td className="px-4 py-2 text-neutral-600">{instituicao?.nomeFantasia ?? (evento.instituicaoId === "todas" ? "Todas" : "—")}</td>
                      <td className="px-4 py-2 text-neutral-600">{evento.moduloId ? ROTULOS_MODULO[evento.moduloId] : "—"}</td>
                      <td className="px-4 py-2 text-neutral-600">{evento.competencia ?? "—"}</td>
                      <td className="px-4 py-2">
                        <span className="status-badge status-badge-info">{evento.rotuloTipo}</span>
                        {detalheLegivelDoEvento(evento) ? (
                          <span className="mt-1 block text-xs text-neutral-500">
                            {detalheLegivelDoEvento(evento)?.resumo}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-neutral-600">{evento.usuarioNome}</td>
                      <td className="px-4 py-2 text-neutral-600">{ROTULOS_PERFIL[evento.perfilId]}</td>
                      <td className="px-4 py-2 text-neutral-600">
                        {evento.lado === "videnas" ? "Videnas" : "Cliente"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-neutral-500">
                        {evento.referencia ? truncarHash(evento.referencia, 6, 6) : "—"}
                      </td>
                    </tr>
                    {expandida ? (
                      <tr className="border-t border-neutral-100 bg-neutral-50">
                        <td colSpan={9} className="px-4 py-3">
                          <p className="mb-1 text-xs text-neutral-500">
                            eventoId: <span className="font-mono">{evento.id}</span> · IP:{" "}
                            <span className="font-mono">{evento.ip}</span> · {evento.userAgent}
                          </p>
                          {detalheLegivelDoEvento(evento) ? (
                            <div className="mb-2 space-y-1 rounded-md border border-neutral-200 bg-white p-3 text-xs text-neutral-700">
                              <p className="font-semibold">{detalheLegivelDoEvento(evento)?.resumo}</p>
                              <ul className="space-y-0.5">
                                {detalheLegivelDoEvento(evento)?.linhas.map((linha, indice) => (
                                  <li key={`${indice}-${linha}`}>{linha}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          <pre className="max-h-48 overflow-auto rounded-md bg-white p-3 font-mono text-xs text-neutral-600">
                            {JSON.stringify(evento.payload, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Integridade dos arquivos</h2>
        {arquivosEscopo.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum arquivo gerado no escopo atual.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Nome</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Competência</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Versão</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Hash SHA-256</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Gerado por</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Estado atual</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Integridade</th>
                </tr>
              </thead>
              <tbody>
                {arquivosEscopo.map((arquivo) => {
                  const periodo = periodos[arquivo.periodoId];
                  return (
                    <tr key={arquivo.id} className="border-t border-neutral-200">
                      <td className="px-3 py-2 text-xs text-neutral-600">{arquivo.nomeArquivo}</td>
                      <td className="px-3 py-2 text-neutral-600">{periodo?.competenciaRotulo ?? "—"}</td>
                      <td className="px-3 py-2 text-neutral-600">v{arquivo.versao}</td>
                      <td className="px-3 py-2 font-mono text-xs text-neutral-500">{arquivo.hashSha256}</td>
                      <td className="px-3 py-2 text-neutral-600">
                        {buscarUsuario(arquivo.geradoPorUsuarioId)?.nome ?? arquivo.geradoPorUsuarioId}
                      </td>
                      <td className="px-3 py-2 text-neutral-600">{periodo?.estado ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className="status-badge status-badge-success">Íntegro</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
