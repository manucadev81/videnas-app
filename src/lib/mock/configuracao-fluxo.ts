import type { EstadoPeriodo, ModuloId, PerfilId } from "@/lib/tipos";

export interface ConfiguracaoContratoModulo {
  emissao?: boolean;
  transmissao?: boolean;
}

export interface RegistroPrevioModulo {
  responsavel: "videnas" | "diretor" | null;
  registradoEm?: string;
  identificador?: string;
}

export interface ConfiguracaoRetornoModulo {
  rotuloArtefato?: string;
}

export type CaminhoAposRessalvas = "arquivar" | "reabrir";

export const ROTULO_RETORNO_GENERICO = "Retorno do regulador/emissor";

export interface ConfiguracaoFluxoModulo {
  contrato?: ConfiguracaoContratoModulo;
  registroPrevio?: RegistroPrevioModulo;
  retorno?: ConfiguracaoRetornoModulo;
}

export interface ConfiguracaoComiteQualidade {
  decisorPerfilId?: PerfilId;
  desfechosPermitidos?: EstadoPeriodo[];
}

export interface ConfiguracaoRetencao {
  anos: number;
  baseLegal?: string;
  marcoInicial: "aprovacao" | "retorno" | "arquivamento";
}

export interface ConfiguracaoFluxo {
  limiarNegacoesComite: number;
  escaladaComiteAutomaticaHabilitada: boolean;
  devolucaoContadorContaComoNegacao?: boolean;
  reaproveitamentoAposDevolucaoDiretorExigeContador?: boolean;
  comiteQualidade?: ConfiguracaoComiteQualidade;
  arquivamentoPerfis: PerfilId[];
  caminhosAposRessalvas?: CaminhoAposRessalvas[];
  registroRetornoPerfis: PerfilId[];
  registroProtocoloManualHabilitado: boolean;
  enviarContadorAposNegacaoFiscalHabilitado?: boolean;
  retencao?: ConfiguracaoRetencao;
  modulos: Partial<Record<ModuloId, ConfiguracaoFluxoModulo>>;
}

export const configuracaoFluxo: ConfiguracaoFluxo = {
  limiarNegacoesComite: 2,
  escaladaComiteAutomaticaHabilitada: false,
  arquivamentoPerfis: ["executor", "validador"],
  caminhosAposRessalvas: ["arquivar", "reabrir"],
  registroRetornoPerfis: ["executor", "validador"],
  registroProtocoloManualHabilitado: false,
  retencao: { anos: 5, marcoInicial: "arquivamento" },
  modulos: {
    acam212: { retorno: { rotuloArtefato: "ACAM213" } },
  },
};

export function rotuloRetornoDoModulo(moduloId: ModuloId): string {
  return configuracaoFluxo.modulos[moduloId]?.retorno?.rotuloArtefato ?? ROTULO_RETORNO_GENERICO;
}

export function calcularRetencaoAte(arquivadoEm: string): string | null {
  const anos = configuracaoFluxo.retencao?.anos;
  if (!anos) {
    return null;
  }
  const base = new Date(arquivadoEm);
  if (Number.isNaN(base.getTime())) {
    return null;
  }
  const limite = new Date(base.getTime());
  limite.setUTCFullYear(limite.getUTCFullYear() + anos);
  if (limite.getUTCMonth() !== base.getUTCMonth()) {
    limite.setTime(
      Date.UTC(
        limite.getUTCFullYear(),
        base.getUTCMonth() + 1,
        0,
        base.getUTCHours(),
        base.getUTCMinutes(),
        base.getUTCSeconds(),
        base.getUTCMilliseconds()
      )
    );
  }
  return limite.toISOString();
}
