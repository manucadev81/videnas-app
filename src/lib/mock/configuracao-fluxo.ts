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
  diasRetencao?: number;
  baseLegal?: string;
  marcoInicial?: "aprovacao" | "retorno" | "arquivamento";
}

export interface ConfiguracaoFluxo {
  limiarNegacoesComite: number;
  escaladaComiteAutomaticaHabilitada: boolean;
  devolucaoContadorContaComoNegacao?: boolean;
  reaproveitamentoAposDevolucaoDiretorExigeContador?: boolean;
  comiteQualidade?: ConfiguracaoComiteQualidade;
  arquivamentoPerfilId?: PerfilId;
  registroRetornoPerfilId: PerfilId;
  registroProtocoloManualHabilitado: boolean;
  enviarContadorAposNegacaoFiscalHabilitado?: boolean;
  retencao?: ConfiguracaoRetencao;
  modulos: Partial<Record<ModuloId, ConfiguracaoFluxoModulo>>;
}

export const configuracaoFluxo: ConfiguracaoFluxo = {
  limiarNegacoesComite: 2,
  escaladaComiteAutomaticaHabilitada: false,
  registroRetornoPerfilId: "validador",
  registroProtocoloManualHabilitado: false,
  modulos: {},
};
