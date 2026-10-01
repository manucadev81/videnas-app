"use client";

import { useTenantsStore } from "@/lib/store/tenants";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { configuracaoFluxo } from "@/lib/mock/configuracao-fluxo";
import {
  ROTULO_ETAPA_AREA,
  ROTULO_TIPO_AREA,
  areasDaInstituicao,
  responsabilidadePorEtapa,
} from "@/lib/areas-cliente";
import { rotuloUsuarioComNivel, validadorDesignadoVisivel } from "@/lib/validadores";
import type { PeriodoObrigacao } from "@/lib/tipos";

export function ValidadorDoPeriodo({ periodo }: { periodo: PeriodoObrigacao }) {
  const designado = validadorDesignadoVisivel(periodo);
  const liberador = periodo.liberadoPorUsuarioId ? buscarUsuario(periodo.liberadoPorUsuarioId) : undefined;

  if (!designado && !liberador) {
    return <span className="text-neutral-400">—</span>;
  }

  return (
    <span className="flex flex-col gap-0.5">
      {designado ? (
        <span className="text-xs text-neutral-500">Designado: {rotuloUsuarioComNivel(designado)}</span>
      ) : null}
      {liberador ? (
        <span className="text-xs text-neutral-600">Liberou: {rotuloUsuarioComNivel(liberador)}</span>
      ) : null}
    </span>
  );
}

export function FaixaOrganizacaoPeriodo({ periodo }: { periodo: PeriodoObrigacao }) {
  const tenants = useTenantsStore((estado) => estado.tenants);
  const instituicao =
    tenants.find((tenant) => tenant.id === periodo.instituicaoId) ?? buscarInstituicao(periodo.instituicaoId);
  const modulo = buscarModulo(periodo.moduloId);
  const designado = validadorDesignadoVisivel(periodo);
  const liberador = periodo.liberadoPorUsuarioId ? buscarUsuario(periodo.liberadoPorUsuarioId) : undefined;
  const responsabilidades = configuracaoFluxo.areasCliente.responsabilidadePorModuloVisivel
    ? responsabilidadePorEtapa(instituicao, periodo.moduloId, modulo.etapas)
    : [];
  const areas = areasDaInstituicao(instituicao);

  if (!designado && !liberador && responsabilidades.length === 0) {
    return null;
  }

  return (
    <div data-tour="faixa-organizacao" className="mt-2 space-y-1.5 text-xs text-neutral-600">
      {designado || liberador ? (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {designado ? (
            <span>
              Validador designado por sorteio:{" "}
              <strong className="font-medium text-neutral-700">{rotuloUsuarioComNivel(designado)}</strong>
            </span>
          ) : null}
          {liberador ? (
            <span>
              Liberado por:{" "}
              <strong className="font-medium text-neutral-700">{rotuloUsuarioComNivel(liberador)}</strong>
            </span>
          ) : null}
        </p>
      ) : null}
      {responsabilidades.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-neutral-700">Responsável pelo controle (informado pelo cliente)</span>
          {responsabilidades.flatMap(({ etapaId, tipos }) =>
            tipos.map((tipo) => {
              const area = areas.find((item) => item.tipo === tipo);
              return (
                <span key={`${etapaId}-${tipo}`} className="status-badge status-badge-neutral">
                  {ROTULO_ETAPA_AREA[etapaId]}: {area ? area.nome : ROTULO_TIPO_AREA[tipo]}
                  {area ? ` · ${area.responsavelNome}` : " · não cadastrada"}
                </span>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
