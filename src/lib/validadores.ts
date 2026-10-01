import type { NivelValidador, PeriodoObrigacao, Usuario } from "@/lib/tipos";
import { buscarUsuario, listarUsuarios } from "@/lib/mock/usuarios";

export const NIVEIS_VALIDADOR: NivelValidador[] = ["V1", "V2", "V3"];

export const MENSAGEM_SEM_VALIDADOR_ELEGIVEL =
  "Nenhum validador elegível: é preciso haver um validador ativo com acesso ao módulo e à instituição, diferente de quem gerou o arquivo.";

export const ESTADOS_COM_VALIDADOR_DESIGNADO = ["em_validacao", "com_excecoes", "validado"];

export function nivelDoUsuario(usuarioId: string | null | undefined): NivelValidador | null {
  if (!usuarioId) {
    return null;
  }
  return buscarUsuario(usuarioId)?.nivelValidador ?? null;
}

export function rotuloUsuarioComNivel(usuario: Usuario | undefined): string {
  if (!usuario) {
    return "—";
  }
  return usuario.nivelValidador ? `${usuario.nome} (${usuario.nivelValidador})` : usuario.nome;
}

export function validadoresElegiveis(periodo: PeriodoObrigacao): Usuario[] {
  return listarUsuarios().filter(
    (usuario) =>
      usuario.perfilId === "validador" &&
      usuario.situacao === "ativo" &&
      usuario.moduloIds.includes(periodo.moduloId) &&
      usuario.instituicaoIds.includes(periodo.instituicaoId) &&
      usuario.id !== periodo.geradoPorUsuarioId
  );
}

export function sortearValidador(elegiveis: Usuario[]): Usuario | null {
  if (elegiveis.length === 0) {
    return null;
  }
  const limite = Math.floor(0x100000000 / elegiveis.length) * elegiveis.length;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limite);
  return elegiveis[buffer[0] % elegiveis.length];
}

export function validadorDesignado(periodo: PeriodoObrigacao): Usuario | undefined {
  return periodo.validadorDesignadoId ? buscarUsuario(periodo.validadorDesignadoId) : undefined;
}

export function validadorDesignadoVisivel(periodo: PeriodoObrigacao): Usuario | undefined {
  return ESTADOS_COM_VALIDADOR_DESIGNADO.includes(periodo.estado) ? validadorDesignado(periodo) : undefined;
}

export interface AvaliacaoValidador {
  permitido: boolean;
  visivel: boolean;
  motivo?: string;
}

export function avaliarValidadorDesignado(
  periodo: PeriodoObrigacao,
  usuarioId: string | undefined
): AvaliacaoValidador {
  if (!periodo.validadorDesignadoId || !usuarioId || usuarioId === periodo.validadorDesignadoId) {
    return { permitido: true, visivel: true };
  }
  return {
    permitido: false,
    visivel: true,
    motivo: `Validação designada por sorteio para ${rotuloUsuarioComNivel(validadorDesignado(periodo))}.`,
  };
}

export function avaliarEnvioParaValidacao(periodo: PeriodoObrigacao): AvaliacaoValidador {
  if (validadoresElegiveis(periodo).length === 0) {
    return { permitido: false, visivel: true, motivo: MENSAGEM_SEM_VALIDADOR_ELEGIVEL };
  }
  return { permitido: true, visivel: true };
}
