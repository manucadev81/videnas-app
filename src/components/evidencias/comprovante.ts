"use client";

import { montarComprovante, type ContextoComprovante } from "@/lib/evidencias/lacre";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarInsumo } from "@/lib/fornecimento";
import { formatarCompetencia } from "@/lib/formatadores";
import type { RegistroLacre } from "@/lib/tipos";

export function contextoComprovanteDoLacre(
  lacre: RegistroLacre,
  observacao?: string
): ContextoComprovante {
  const instituicao = buscarInstituicao(lacre.instituicaoId);
  const modulo = buscarModulo(lacre.moduloId);
  const insumo = lacre.insumoId ? buscarInsumo(lacre.insumoId) : undefined;

  return {
    instituicaoNome: instituicao?.razaoSocial ?? lacre.instituicaoId,
    instituicaoCnpj: instituicao?.cnpj,
    moduloNome: modulo.nome,
    competenciaRotulo: formatarCompetencia(lacre.competencia),
    insumoRotulo: insumo?.rotulo ?? null,
    observacao,
  };
}

export function baixarComprovante(lacre: RegistroLacre, contexto: ContextoComprovante): void {
  const comprovante = montarComprovante(lacre, contexto);
  const blob = new Blob([comprovante.conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const ancora = document.createElement("a");
  ancora.href = url;
  ancora.download = comprovante.nomeArquivo;
  document.body.append(ancora);
  ancora.click();
  ancora.remove();
  URL.revokeObjectURL(url);
}
