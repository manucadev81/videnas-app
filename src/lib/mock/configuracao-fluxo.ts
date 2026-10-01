import type { DesfechoComite, EstadoPeriodo, ModuloId, PerfilId } from "@/lib/tipos";

export interface ConfiguracaoRetornoModulo {
  rotuloArtefato?: string;
  somentePosicionamento?: boolean;
}

export type RotuloAprovador = "Compliance";

export type GatilhoNotificacaoArea = "aprovacao" | "arquivamento";

export type DestinatariosNotificacaoArea = "todas_as_areas" | "areas_mapeadas";

export interface ConfiguracaoAreasCliente {
  responsabilidadePorModuloVisivel: boolean;
  notificacaoHabilitada: boolean;
  eventosNotificados: GatilhoNotificacaoArea[];
  destinatariosNotificacao: DestinatariosNotificacaoArea;
}

export type CaminhoAposRessalvas = "arquivar" | "reabrir";

export const ROTULO_RETORNO_GENERICO = "Retorno do regulador/emissor";

export interface ConfiguracaoFluxoModulo {
  retorno?: ConfiguracaoRetornoModulo;
}

export interface ConfiguracaoComiteQualidade {
  decisorPerfilId: PerfilId;
  membrosPerfisElegiveis: PerfilId[];
  quorum: number;
  unanime: boolean;
  prazoDiasUteisAposEscalada: number;
  prazoDiasAntesDoPrazoRegulatorio: number;
  destaqueCriticoDiasAntesDoPrazo: number;
  desfechosPermitidos: DesfechoComite[];
}

export interface DefinicaoDesfechoComite {
  rotulo: string;
  descricao: string;
  estadoDestino: EstadoPeriodo;
  exigePlanoCorrecao: boolean;
}

export const DESFECHOS_COMITE: Record<DesfechoComite, DefinicaoDesfechoComite> = {
  manter_negativa: {
    rotulo: "Manter negativa e devolver ao Executor com plano de correção",
    descricao:
      "O período volta ao Executor, que precisa gerar uma nova versão do arquivo seguindo o plano de correção.",
    estadoDestino: "devolvido_diretor",
    exigePlanoCorrecao: true,
  },
  negativa_superada: {
    rotulo: "Negativa superada/esclarecida, submeter novamente ao Compliance",
    descricao:
      "O período volta a Liberado e o Compliance vê a justificativa do Comitê ao decidir de novo. A decisão de aprovar continua sendo dele.",
    estadoDestino: "liberado",
    exigePlanoCorrecao: false,
  },
};

export interface ConfiguracaoRetencao {
  anos: number;
  baseLegal?: string;
  marcoInicial: "aprovacao" | "retorno" | "arquivamento";
}

export type ContagemNegacoes = "por_periodo";

export interface ConfiguracaoFluxo {
  limiarNegacoesComite: number;
  contagemNegacoes: ContagemNegacoes;
  escaladaComiteAutomaticaHabilitada: boolean;
  devolucaoContadorContaComoNegacao?: boolean;
  reaproveitamentoAposDevolucaoDiretorExigeContador?: boolean;
  comiteQualidade?: ConfiguracaoComiteQualidade;
  arquivamentoPerfis: PerfilId[];
  caminhosAposRessalvas?: CaminhoAposRessalvas[];
  registroRetornoPerfis: PerfilId[];
  emissaoFiscalPerfis: PerfilId[];
  transmissaoPerfisVidenas: PerfilId[];
  registroProtocoloManualHabilitado: boolean;
  enviarContadorAposNegacaoFiscalHabilitado?: boolean;
  retencao?: ConfiguracaoRetencao;
  rotuloAprovador: RotuloAprovador;
  areasCliente: ConfiguracaoAreasCliente;
  modulos: Partial<Record<ModuloId, ConfiguracaoFluxoModulo>>;
}

export const configuracaoFluxo: ConfiguracaoFluxo = {
  limiarNegacoesComite: 2,
  contagemNegacoes: "por_periodo",
  escaladaComiteAutomaticaHabilitada: true,
  devolucaoContadorContaComoNegacao: false,
  comiteQualidade: {
    decisorPerfilId: "admin",
    membrosPerfisElegiveis: ["admin", "executor", "validador"],
    quorum: 2,
    unanime: true,
    prazoDiasUteisAposEscalada: 2,
    prazoDiasAntesDoPrazoRegulatorio: 3,
    destaqueCriticoDiasAntesDoPrazo: 3,
    desfechosPermitidos: ["manter_negativa", "negativa_superada"],
  },
  arquivamentoPerfis: ["executor", "validador"],
  caminhosAposRessalvas: ["arquivar", "reabrir"],
  registroRetornoPerfis: ["executor", "validador"],
  emissaoFiscalPerfis: ["executor", "validador"],
  transmissaoPerfisVidenas: ["executor", "validador"],
  registroProtocoloManualHabilitado: true,
  retencao: { anos: 5, marcoInicial: "arquivamento" },
  rotuloAprovador: "Compliance",
  areasCliente: {
    responsabilidadePorModuloVisivel: true,
    notificacaoHabilitada: true,
    eventosNotificados: ["aprovacao", "arquivamento"],
    destinatariosNotificacao: "areas_mapeadas",
  },
  modulos: {
    acam212: { retorno: { rotuloArtefato: "ACAM213" } },
    cadoc5711: { retorno: { somentePosicionamento: true } },
    cadoc5710: { retorno: { somentePosicionamento: true } },
    fiscal: { retorno: { somentePosicionamento: true } },
  },
};

export const ROTULOS_COMPLETOS_APROVADOR: Record<RotuloAprovador, string> = {
  Compliance: "Responsável de Compliance",
};

export function retornoSomentePosicionamento(moduloId: ModuloId): boolean {
  return configuracaoFluxo.modulos[moduloId]?.retorno?.somentePosicionamento === true;
}

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
