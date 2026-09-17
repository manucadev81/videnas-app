"use client";

import { useMemo, useState } from "react";
import { FileLock2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { BadgeSentido } from "@/components/evidencias/badge-sentido";
import { DetalheLacre } from "@/components/evidencias/detalhe-lacre";
import { ValorHash } from "@/components/evidencias/valor-hash";
import {
  lacresDaInstituicao,
  useEvidenciasStore,
  useHidratarEvidencias,
} from "@/lib/store/evidencias";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarPerfil } from "@/lib/permissoes";
import { formatarCompetencia, formatarDataHora } from "@/lib/formatadores";
import type { ModuloId, RegistroLacre } from "@/lib/tipos";

const TODOS = "todos";

export default function EvidenciasPage() {
  const hidratado = useHidratarEvidencias();
  const lacres = useEvidenciasStore((estado) => estado.lacres);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);

  const [filtroInstituicao, setFiltroInstituicao] = useState<string>(TODOS);
  const [filtroModulo, setFiltroModulo] = useState<string>(TODOS);
  const [filtroCompetencia, setFiltroCompetencia] = useState<string>(TODOS);
  const [filtroSentido, setFiltroSentido] = useState<string>(TODOS);
  const [busca, setBusca] = useState("");
  const [lacreSelecionado, setLacreSelecionado] = useState<RegistroLacre | null>(null);

  const escopo = instituicaoAtivaId;
  const mostrarInstituicao = escopo === "todas";

  const lacresEscopo = useMemo(
    () => (escopo ? lacresDaInstituicao(lacres, escopo) : []),
    [lacres, escopo]
  );

  const instituicoesDisponiveis = useMemo(
    () => Array.from(new Set(lacresEscopo.map((lacre) => lacre.instituicaoId))).sort(),
    [lacresEscopo]
  );

  const modulosDisponiveis = useMemo(
    () => Array.from(new Set(lacresEscopo.map((lacre) => lacre.moduloId))).sort() as ModuloId[],
    [lacresEscopo]
  );

  const competenciasDisponiveis = useMemo(
    () =>
      Array.from(new Set(lacresEscopo.map((lacre) => lacre.competencia))).sort((a, b) =>
        b.localeCompare(a)
      ),
    [lacresEscopo]
  );

  const lacresFiltrados = lacresEscopo
    .filter((lacre) => filtroInstituicao === TODOS || lacre.instituicaoId === filtroInstituicao)
    .filter((lacre) => filtroModulo === TODOS || lacre.moduloId === filtroModulo)
    .filter((lacre) => filtroCompetencia === TODOS || lacre.competencia === filtroCompetencia)
    .filter((lacre) => filtroSentido === TODOS || lacre.sentido === filtroSentido)
    .filter((lacre) => {
      const alvo = busca.trim().toLowerCase();
      if (!alvo) {
        return true;
      }
      return (
        lacre.id.toLowerCase().includes(alvo) ||
        lacre.hashSha256.toLowerCase().includes(alvo) ||
        (lacre.hashAnterior ?? "").toLowerCase().includes(alvo) ||
        lacre.origemNome.toLowerCase().includes(alvo)
      );
    });

  function limparFiltros() {
    setFiltroInstituicao(TODOS);
    setFiltroModulo(TODOS);
    setFiltroCompetencia(TODOS);
    setFiltroSentido(TODOS);
    setBusca("");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-neutral-700">
          <FileLock2 className="size-6 text-brand-700" aria-hidden="true" />
          Evidências e cadeia de custódia
          <BadgeAjuda chave="evidencia.cadeiaCustodia" tamanho="sm" side="bottom" />
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-neutral-500">
          Todo dado que entra e todo arquivo que sai recebe um lacre com hash, data, hora e autor.
          A cadeia protege as duas partes numa contestação: prova o que o cliente enviou e prova o
          que a Videnas devolveu.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            Lacre
            <BadgeAjuda chave="evidencia.lacre" tamanho="xs" side="bottom" />
          </span>
          <span className="flex items-center gap-1.5">
            Hash SHA-256
            <BadgeAjuda chave="evidencia.hash" tamanho="xs" side="bottom" />
          </span>
          <span className="flex items-center gap-1.5">
            Encadeamento
            <BadgeAjuda chave="evidencia.encadeamento" tamanho="xs" side="bottom" />
          </span>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mostrarInstituicao ? (
          <div className="space-y-1.5">
            <Label htmlFor="filtro-instituicao">Instituição</Label>
            <Select value={filtroInstituicao} onValueChange={(valor) => setFiltroInstituicao(valor ?? TODOS)}>
              <SelectTrigger id="filtro-instituicao" className="w-full">
                <SelectValue placeholder="Todas as instituições" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas as instituições</SelectItem>
                {instituicoesDisponiveis.map((id) => (
                  <SelectItem key={id} value={id}>
                    {buscarInstituicao(id)?.nomeFantasia ?? id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="filtro-modulo">Módulo</Label>
          <Select value={filtroModulo} onValueChange={(valor) => setFiltroModulo(valor ?? TODOS)}>
            <SelectTrigger id="filtro-modulo" className="w-full">
              <SelectValue placeholder="Todos os módulos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os módulos</SelectItem>
              {modulosDisponiveis.map((moduloId) => (
                <SelectItem key={moduloId} value={moduloId}>
                  {buscarModulo(moduloId).nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-competencia">Competência</Label>
          <Select value={filtroCompetencia} onValueChange={(valor) => setFiltroCompetencia(valor ?? TODOS)}>
            <SelectTrigger id="filtro-competencia" className="w-full">
              <SelectValue placeholder="Todas as competências" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todas as competências</SelectItem>
              {competenciasDisponiveis.map((competencia) => (
                <SelectItem key={competencia} value={competencia}>
                  {formatarCompetencia(competencia)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-sentido">Sentido</Label>
          <Select value={filtroSentido} onValueChange={(valor) => setFiltroSentido(valor ?? TODOS)}>
            <SelectTrigger id="filtro-sentido" className="w-full">
              <SelectValue placeholder="Entradas e saídas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Entradas e saídas</SelectItem>
              <SelectItem value="entrada">Somente entradas</SelectItem>
              <SelectItem value="saida">Somente saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="filtro-busca">Buscar por hash ou identificador do lacre</Label>
          <Input
            id="filtro-busca"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="LCR-SAI-ACAM212-202607-0001 ou 9f2c…"
          />
        </div>
      </div>

      {!hidratado ? (
        <div role="status" aria-label="Carregando cadeia de custódia" className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : lacresFiltrados.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum lacre encontrado"
          mensagem="Ajuste ou limpe os filtros para ver os lacres de entrada e de saída desta instituição."
          icone={FileLock2}
          rotuloAcao="Limpar filtros"
          aoAcionar={limparFiltros}
        />
      ) : (
        <div data-tour="evidencias-tabela" className="space-y-3">
          <p className="text-sm text-neutral-500">
            {lacresFiltrados.length === 1
              ? "1 lacre encontrado."
              : `${lacresFiltrados.length} lacres encontrados.`}
          </p>

          <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Lacres de entrada e de saída registrados na cadeia de custódia, com sentido,
                módulo, competência, origem, hash, autor e data.
              </caption>
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Lacre
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Sentido
                  </th>
                  {mostrarInstituicao ? (
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Instituição
                    </th>
                  ) : null}
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Módulo
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Competência
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Origem
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Hash SHA-256
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Selado por
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-neutral-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {lacresFiltrados.map((lacre) => {
                  const modulo = buscarModulo(lacre.moduloId);
                  return (
                    <tr key={lacre.id} className="border-t border-neutral-200 align-top">
                      <th
                        scope="row"
                        className="px-4 py-3 text-left font-mono text-xs font-medium break-all text-neutral-700"
                      >
                        {lacre.id}
                      </th>
                      <td className="px-4 py-3">
                        <BadgeSentido sentido={lacre.sentido} />
                      </td>
                      {mostrarInstituicao ? (
                        <td className="px-4 py-3 text-neutral-600">
                          {buscarInstituicao(lacre.instituicaoId)?.nomeFantasia ??
                            lacre.instituicaoId}
                        </td>
                      ) : null}
                      <td className="px-4 py-3 text-neutral-600">
                        <span className="flex flex-wrap items-center gap-1.5">
                          {modulo.nome}
                          {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatarCompetencia(lacre.competencia)}
                      </td>
                      <td className="max-w-56 px-4 py-3 break-all text-neutral-600">
                        {lacre.origemNome}
                      </td>
                      <td className="px-4 py-3">
                        <ValorHash hash={lacre.hashSha256} truncado />
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {lacre.seladoPorNome}
                        <span className="block text-xs text-neutral-500">
                          {buscarPerfil(lacre.perfilId).rotulo} ·{" "}
                          {formatarDataHora(lacre.seladoEm)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setLacreSelecionado(lacre)}
                        >
                          Ver detalhes
                          <span className="sr-only"> do lacre {lacre.id}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {lacresFiltrados.map((lacre) => {
              const modulo = buscarModulo(lacre.moduloId);
              return (
                <li
                  key={lacre.id}
                  className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <BadgeSentido sentido={lacre.sentido} />
                    <h2 className="font-mono text-xs font-bold break-all text-neutral-700">
                      {lacre.id}
                    </h2>
                  </div>

                  <dl className="space-y-2">
                    {mostrarInstituicao ? (
                      <div>
                        <dt className="text-xs font-medium text-neutral-500">Instituição</dt>
                        <dd className="text-sm text-neutral-700">
                          {buscarInstituicao(lacre.instituicaoId)?.nomeFantasia ??
                            lacre.instituicaoId}
                        </dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-xs font-medium text-neutral-500">Obrigação</dt>
                      <dd className="flex flex-wrap items-center gap-1.5 text-sm text-neutral-700">
                        {modulo.nome}
                        {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
                        <span className="text-neutral-500">
                          · {formatarCompetencia(lacre.competencia)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500">Origem</dt>
                      <dd className="text-sm break-all text-neutral-700">{lacre.origemNome}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500">Hash SHA-256</dt>
                      <dd className="mt-1">
                        <ValorHash hash={lacre.hashSha256} truncado />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500">Selado por</dt>
                      <dd className="text-sm text-neutral-700">
                        {lacre.seladoPorNome} · {buscarPerfil(lacre.perfilId).rotulo}
                        <span className="block text-xs text-neutral-500">
                          {formatarDataHora(lacre.seladoEm)}
                        </span>
                      </dd>
                    </div>
                  </dl>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLacreSelecionado(lacre)}
                  >
                    Ver detalhes
                    <span className="sr-only"> do lacre {lacre.id}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <DetalheLacre lacre={lacreSelecionado} aoFechar={() => setLacreSelecionado(null)} />
    </div>
  );
}
