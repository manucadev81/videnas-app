import { descricaoAreaPorId } from "@/lib/areas-cliente";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarUsuario } from "@/lib/mock/usuarios";

export interface ResolvedoresReferencia {
  nomeUsuario: (usuarioId: string) => string;
  descricaoArea: (areaId: string) => string;
  nomeInstituicao: (instituicaoId: string) => string;
}

export const resolvedoresReferenciaPadrao: ResolvedoresReferencia = {
  nomeUsuario: (usuarioId) => buscarUsuario(usuarioId)?.nome ?? "",
  descricaoArea: descricaoAreaPorId,
  nomeInstituicao: (instituicaoId) => buscarInstituicao(instituicaoId)?.nomeFantasia ?? "",
};

export function resolverReferenciaPorPrefixo(
  valor: string,
  resolvedores: ResolvedoresReferencia
): string | null {
  try {
    if (valor.startsWith("usr-")) {
      return resolvedores.nomeUsuario(valor) || valor;
    }
    if (valor.startsWith("area-")) {
      return resolvedores.descricaoArea(valor) || valor;
    }
    if (valor.startsWith("inst-")) {
      return resolvedores.nomeInstituicao(valor) || valor;
    }
  } catch {
    return valor;
  }
  return null;
}

export function rotularReferencia(
  referencia: string,
  resolvedores: ResolvedoresReferencia = resolvedoresReferenciaPadrao
): string {
  return resolverReferenciaPorPrefixo(referencia, resolvedores) ?? referencia;
}
