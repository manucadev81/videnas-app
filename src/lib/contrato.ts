import type {
  CadastroPrevio,
  CanalEnvioBcb,
  ContratoCongelado,
  ContratoModulo,
  EstadoPeriodo,
  Instituicao,
  ModuloId,
  PerfilId,
  PeriodoObrigacao,
  ResponsavelTransmissao,
  StatusCadastroPrevio,
} from "@/lib/tipos";
import { configuracaoFluxo } from "@/lib/mock/configuracao-fluxo";
import { HOJE_ISO } from "@/lib/mock/data-referencia";
import { formatarData } from "@/lib/formatadores";

export const CONTRATO_MODULO_PADRAO: ContratoModulo = {
  emissaoIncluida: false,
  transmissaoIncluida: false,
  responsavelTransmissao: "videnas",
};

export const ROTULO_CANAL_BCB: Record<CanalEnvioBcb, string> = {
  sisbacen: "STA (Sisbacen)",
  pstaw10: "PSTAW10",
  portal_cidadao: "Portal do Cidadão",
  outro: "Outro",
};

export const ROTULO_CANAL_BCB_CURTO: Record<CanalEnvioBcb, string> = {
  sisbacen: "STA",
  pstaw10: "PSTAW10",
  portal_cidadao: "Portal do Cidadão",
  outro: "Outro canal",
};

export const CANAIS_BCB_OFERECIDOS: CanalEnvioBcb[] = ["sisbacen", "pstaw10", "portal_cidadao", "outro"];

export const ROTULO_RESPONSAVEL_TRANSMISSAO: Record<ResponsavelTransmissao, string> = {
  videnas: "Videnas",
  diretor: "Responsável de Compliance da instituição",
};

export const ROTULO_STATUS_CADASTRO: Record<StatusCadastroPrevio, string> = {
  ativo: "Ativo",
  pendente: "Pendente",
  expirado: "Expirado",
};

export const CLASSE_STATUS_CADASTRO: Record<StatusCadastroPrevio, string> = {
  ativo: "status-badge-success",
  pendente: "status-badge-warning",
  expirado: "status-badge-error",
};

export const MOTIVO_SEGREGACAO_EMISSAO =
  "Quem gerou o arquivo não pode emiti-lo. Segregação de funções obrigatória.";

export const MOTIVO_SEGREGACAO_TRANSMISSAO_GERADOR =
  "Quem gerou o arquivo não pode transmiti-lo. Segregação de funções obrigatória.";

export const MOTIVO_SEGREGACAO_TRANSMISSAO_EMISSOR =
  "Quem emitiu o documento fiscal não pode transmiti-lo. Segregação de funções obrigatória.";

export const MOTIVO_TRANSMISSAO_NAO_CONTRATADA = "Transmissão não contratada para este módulo";

export const MOTIVO_EMISSAO_NAO_CONTRATADA =
  "Emissão não contratada: encaminhe a DPS ao emissor definido pelo cliente";

export const TAMANHO_MINIMO_JUSTIFICATIVA_MANUAL = 10;

export function contratoDoModulo(
  instituicao: Pick<Instituicao, "contrato"> | undefined,
  moduloId: ModuloId
): ContratoModulo {
  const contrato = instituicao?.contrato?.modulos[moduloId];
  if (!contrato) {
    return { ...CONTRATO_MODULO_PADRAO };
  }
  return {
    emissaoIncluida: moduloId === "fiscal" && contrato.emissaoIncluida === true,
    transmissaoIncluida: contrato.transmissaoIncluida === true,
    responsavelTransmissao: contrato.responsavelTransmissao === "diretor" ? "diretor" : "videnas",
  };
}

export function contratoEfetivoDoPeriodo(
  periodo: Pick<PeriodoObrigacao, "moduloId" | "contratoCongelado">,
  instituicao: Pick<Instituicao, "contrato"> | undefined
): ContratoModulo {
  const congelado = periodo.contratoCongelado;
  if (congelado) {
    return {
      emissaoIncluida: congelado.emissaoIncluida,
      transmissaoIncluida: congelado.transmissaoIncluida,
      responsavelTransmissao: congelado.responsavelTransmissao,
    };
  }
  return contratoDoModulo(instituicao, periodo.moduloId);
}

export function contratoMudouAposAprovacao(
  periodo: Pick<PeriodoObrigacao, "moduloId" | "contratoCongelado">,
  instituicao: Pick<Instituicao, "contrato"> | undefined
): boolean {
  const congelado = periodo.contratoCongelado;
  if (!congelado) {
    return false;
  }
  const atual = contratoDoModulo(instituicao, periodo.moduloId);
  return (
    atual.emissaoIncluida !== congelado.emissaoIncluida ||
    atual.transmissaoIncluida !== congelado.transmissaoIncluida ||
    atual.responsavelTransmissao !== congelado.responsavelTransmissao
  );
}

export function cadastrosDoModulo(
  instituicao: Pick<Instituicao, "contrato"> | undefined,
  moduloId: ModuloId
): CadastroPrevio[] {
  return (instituicao?.contrato?.cadastros ?? []).filter((cadastro) =>
    cadastro.moduloIds.includes(moduloId)
  );
}

export function situacaoEfetivaCadastro(
  cadastro: Pick<CadastroPrevio, "status" | "validoAte">,
  hojeIso: string = HOJE_ISO
): StatusCadastroPrevio {
  if (cadastro.status === "expirado") {
    return "expirado";
  }
  if (cadastro.validoAte && cadastro.validoAte.slice(0, 10) < hojeIso.slice(0, 10)) {
    return "expirado";
  }
  return cadastro.status;
}

export function rotuloCanalDoCadastro(cadastro: Pick<CadastroPrevio, "canal" | "emissor">): string {
  if (cadastro.canal) {
    return ROTULO_CANAL_BCB_CURTO[cadastro.canal];
  }
  return cadastro.emissor ?? "Canal não informado";
}

export function rotuloCanalCompletoDoCadastro(cadastro: Pick<CadastroPrevio, "canal" | "emissor">): string {
  if (cadastro.canal) {
    return ROTULO_CANAL_BCB[cadastro.canal];
  }
  return cadastro.emissor ?? "Canal não informado";
}

const PRIORIDADE_SITUACAO: Record<StatusCadastroPrevio, number> = {
  ativo: 0,
  pendente: 1,
  expirado: 2,
};

export function cadastroAplicavel(
  instituicao: Pick<Instituicao, "contrato"> | undefined,
  moduloId: ModuloId,
  hojeIso: string = HOJE_ISO,
  contratoBase?: ContratoModulo
): CadastroPrevio | null {
  const contrato = contratoBase ?? contratoDoModulo(instituicao, moduloId);
  const candidatos = cadastrosDoModulo(instituicao, moduloId).filter(
    (cadastro) => cadastro.responsavel === contrato.responsavelTransmissao
  );
  if (candidatos.length === 0) {
    return null;
  }
  return (
    [...candidatos].sort((a, b) => {
      const diferenca =
        PRIORIDADE_SITUACAO[situacaoEfetivaCadastro(a, hojeIso)] -
        PRIORIDADE_SITUACAO[situacaoEfetivaCadastro(b, hojeIso)];
      if (diferenca !== 0) {
        return diferenca;
      }
      return b.registradoEm.localeCompare(a.registradoEm);
    })[0] ?? null
  );
}

export function congelarContrato(
  instituicao: Pick<Instituicao, "contrato"> | undefined,
  moduloId: ModuloId,
  congeladoEm: string,
  hojeIso: string = HOJE_ISO
): ContratoCongelado {
  return {
    ...contratoDoModulo(instituicao, moduloId),
    congeladoEm,
    cadastroId: cadastroAplicavel(instituicao, moduloId, hojeIso)?.id ?? null,
  };
}

export type CausaIndisponibilidade =
  | "nenhuma"
  | "emissao_nao_contratada"
  | "transmissao_nao_contratada"
  | "sem_cadastro"
  | "cadastro_pendente"
  | "cadastro_expirado";

export interface DisponibilidadeTransmissao {
  disponivel: boolean;
  causa: CausaIndisponibilidade;
  motivo: string | null;
  contrato: ContratoModulo;
  responsavel: ResponsavelTransmissao;
  cadastro: CadastroPrevio | null;
  situacaoCadastro: StatusCadastroPrevio | null;
}

export function avaliarDisponibilidadeTransmissao(
  instituicao: Pick<Instituicao, "contrato"> | undefined,
  moduloId: ModuloId,
  hojeIso: string = HOJE_ISO,
  congelado?: ContratoCongelado | null
): DisponibilidadeTransmissao {
  const contrato = congelado
    ? contratoEfetivoDoPeriodo({ moduloId, contratoCongelado: congelado }, instituicao)
    : contratoDoModulo(instituicao, moduloId);
  const base = {
    contrato,
    responsavel: contrato.responsavelTransmissao,
    cadastro: null,
    situacaoCadastro: null,
  };

  if (moduloId === "fiscal" && !contrato.emissaoIncluida) {
    return { ...base, disponivel: false, causa: "emissao_nao_contratada", motivo: MOTIVO_EMISSAO_NAO_CONTRATADA };
  }

  if (!contrato.transmissaoIncluida) {
    return {
      ...base,
      disponivel: false,
      causa: "transmissao_nao_contratada",
      motivo: MOTIVO_TRANSMISSAO_NAO_CONTRATADA,
    };
  }

  const cadastroCongelado = congelado?.cadastroId
    ? cadastrosDoModulo(instituicao, moduloId).find((item) => item.id === congelado.cadastroId)
    : undefined;
  const cadastro = cadastroCongelado ?? cadastroAplicavel(instituicao, moduloId, hojeIso, contrato);
  if (!cadastro) {
    const dono = contrato.responsavelTransmissao === "diretor" ? " do Responsável de Compliance" : "";
    return {
      ...base,
      disponivel: false,
      causa: "sem_cadastro",
      motivo: `Nenhum cadastro prévio${dono} registrado para o canal deste módulo`,
    };
  }

  const situacao = situacaoEfetivaCadastro(cadastro, hojeIso);
  const rotuloCanal = rotuloCanalDoCadastro(cadastro);

  if (situacao === "pendente") {
    return {
      ...base,
      cadastro,
      situacaoCadastro: situacao,
      disponivel: false,
      causa: "cadastro_pendente",
      motivo: `Cadastro prévio pendente (${rotuloCanal})`,
    };
  }

  if (situacao === "expirado") {
    const data = cadastro.validoAte ? ` em ${formatarData(cadastro.validoAte)}` : "";
    return {
      ...base,
      cadastro,
      situacaoCadastro: situacao,
      disponivel: false,
      causa: "cadastro_expirado",
      motivo: `Cadastro ${rotuloCanal} expirado${data}`,
    };
  }

  return {
    ...base,
    cadastro,
    situacaoCadastro: situacao,
    disponivel: true,
    causa: "nenhuma",
    motivo: null,
  };
}

export function avaliarDisponibilidadeDoPeriodo(
  periodo: Pick<PeriodoObrigacao, "moduloId" | "contratoCongelado">,
  instituicao: Pick<Instituicao, "contrato"> | undefined,
  hojeIso: string = HOJE_ISO
): DisponibilidadeTransmissao {
  return avaliarDisponibilidadeTransmissao(
    instituicao,
    periodo.moduloId,
    hojeIso,
    periodo.contratoCongelado
  );
}

export type AcaoDeEntrega =
  | "emitir_fiscal"
  | "transmitir"
  | "registrar_protocolo_manual"
  | "marcar_encaminhado";

export interface AvaliacaoEntrega {
  visivel: boolean;
  permitido: boolean;
  motivo?: string;
}

const OCULTA: AvaliacaoEntrega = { visivel: false, permitido: false };

export function estadoOrigemDaTransmissao(moduloId: ModuloId): EstadoPeriodo {
  return moduloId === "fiscal" ? "emitido_fiscal" : "aprovado";
}

export function avaliarAcaoDeEntrega(
  acao: AcaoDeEntrega,
  perfil: PerfilId,
  periodo: Pick<
    PeriodoObrigacao,
    "moduloId" | "estado" | "contratoCongelado" | "geradoPorUsuarioId" | "documentoFiscal"
  >,
  instituicao: Pick<Instituicao, "contrato"> | undefined,
  usuarioAtualId?: string,
  hojeIso: string = HOJE_ISO
): AvaliacaoEntrega {
  const ehFiscal = periodo.moduloId === "fiscal";
  const contrato = contratoEfetivoDoPeriodo(periodo, instituicao);
  const ehGerador = Boolean(usuarioAtualId) && usuarioAtualId === periodo.geradoPorUsuarioId;

  if (acao === "emitir_fiscal") {
    if (!ehFiscal || periodo.estado !== "aprovado" || !contrato.emissaoIncluida) {
      return OCULTA;
    }
    if (!configuracaoFluxo.emissaoFiscalPerfis.includes(perfil)) {
      return OCULTA;
    }
    if (ehGerador) {
      return { visivel: true, permitido: false, motivo: MOTIVO_SEGREGACAO_EMISSAO };
    }
    return { visivel: true, permitido: true };
  }

  if (acao === "marcar_encaminhado") {
    if (!ehFiscal || periodo.estado !== "aprovado" || contrato.emissaoIncluida) {
      return OCULTA;
    }
    return { visivel: true, permitido: true };
  }

  const disponibilidade = avaliarDisponibilidadeDoPeriodo(periodo, instituicao, hojeIso);

  if (acao === "transmitir") {
    if (periodo.estado !== estadoOrigemDaTransmissao(periodo.moduloId)) {
      return OCULTA;
    }
    if (!contrato.transmissaoIncluida || (ehFiscal && !contrato.emissaoIncluida)) {
      return OCULTA;
    }
    const ladoResponsavel = disponibilidade.responsavel;
    if (ladoResponsavel === "diretor" && perfil !== "diretor") {
      return { visivel: true, permitido: false, motivo: "Transmissão feita pelo Responsável de Compliance da instituição" };
    }
    if (ladoResponsavel === "videnas" && !configuracaoFluxo.transmissaoPerfisVidenas.includes(perfil)) {
      return {
        visivel: true,
        permitido: false,
        motivo: "Transmissão feita pela Videnas (Executor ou Validador)",
      };
    }
    if (!disponibilidade.disponivel) {
      return { visivel: true, permitido: false, motivo: disponibilidade.motivo ?? undefined };
    }
    if (ehGerador) {
      return { visivel: true, permitido: false, motivo: MOTIVO_SEGREGACAO_TRANSMISSAO_GERADOR };
    }
    if (
      ehFiscal &&
      Boolean(usuarioAtualId) &&
      usuarioAtualId === periodo.documentoFiscal?.emitidoPorUsuarioId
    ) {
      return { visivel: true, permitido: false, motivo: MOTIVO_SEGREGACAO_TRANSMISSAO_EMISSOR };
    }
    return { visivel: true, permitido: true };
  }

  if (!configuracaoFluxo.registroProtocoloManualHabilitado) {
    return OCULTA;
  }
  if (periodo.estado !== estadoOrigemDaTransmissao(periodo.moduloId)) {
    return OCULTA;
  }
  if (ehFiscal && !contrato.emissaoIncluida) {
    return OCULTA;
  }
  if (disponibilidade.disponivel) {
    return OCULTA;
  }
  return { visivel: true, permitido: true };
}

export type TomCaminhoEntrega = "info" | "atencao" | "sucesso";

export interface CaminhoDeEntrega {
  tom: TomCaminhoEntrega;
  titulo: string;
  texto: string;
}

export function descreverCaminhoDeEntrega(
  periodo: Pick<PeriodoObrigacao, "moduloId" | "estado" | "contratoCongelado">,
  instituicao: Pick<Instituicao, "contrato"> | undefined,
  hojeIso: string = HOJE_ISO
): CaminhoDeEntrega {
  const ehFiscal = periodo.moduloId === "fiscal";
  const disponibilidade = avaliarDisponibilidadeDoPeriodo(periodo, instituicao, hojeIso);
  const contrato = disponibilidade.contrato;

  if (ehFiscal && !contrato.emissaoIncluida) {
    return {
      tom: "atencao",
      titulo: "Emissão da NFS-e não contratada",
      texto:
        "A emissão da NFS-e não faz parte do contrato desta instituição. Depois da aprovação, o Responsável de Compliance encaminha a DPS ao emissor definido pelo cliente e registra o encaminhamento aqui.",
    };
  }

  if (disponibilidade.disponivel) {
    const canal = disponibilidade.cadastro ? rotuloCanalCompletoDoCadastro(disponibilidade.cadastro) : "o canal cadastrado";
    if (disponibilidade.responsavel === "diretor") {
      return {
        tom: "sucesso",
        titulo: "Transmissão feita pelo Responsável de Compliance da instituição",
        texto: `O contrato inclui a transmissão e o cadastro prévio é do Responsável de Compliance (${canal}). O Responsável de Compliance transmite pela plataforma e a Videnas guarda o comprovante lacrado.`,
      };
    }
    return {
      tom: "sucesso",
      titulo: "Transmissão feita pela Videnas",
      texto: `O contrato inclui a transmissão e a Videnas mantém o cadastro prévio ativo (${canal}). O Executor ou o Validador transmite o ${ehFiscal ? "documento fiscal, desde que não seja quem gerou o arquivo nem quem emitiu o documento," : "arquivo aprovado, desde que não seja quem o gerou,"} e a plataforma lacra o comprovante.`,
    };
  }

  const complemento = ehFiscal
    ? "O Responsável de Compliance registra manualmente o protocolo do emissor, com justificativa."
    : "O Responsável de Compliance registra manualmente o protocolo recebido, com justificativa.";

  return {
    tom: "atencao",
    titulo: disponibilidade.motivo ?? "Transmissão indisponível",
    texto: `A transmissão automática não está disponível. ${complemento}`,
  };
}

export function rotuloProximoPassoDaEntrega(
  periodo: Pick<
    PeriodoObrigacao,
    "moduloId" | "estado" | "contratoCongelado" | "geradoPorUsuarioId" | "documentoFiscal"
  >,
  perfil: PerfilId,
  instituicao: Pick<Instituicao, "contrato"> | undefined
): string | null {
  if (periodo.estado !== "aprovado" && periodo.estado !== "emitido_fiscal") {
    return null;
  }
  const acoes: { acao: AcaoDeEntrega; rotulo: string }[] = [
    { acao: "emitir_fiscal", rotulo: "Emitir documento fiscal" },
    { acao: "transmitir", rotulo: "Transmitir" },
    { acao: "marcar_encaminhado", rotulo: "Marcar encaminhado" },
    { acao: "registrar_protocolo_manual", rotulo: "Registrar protocolo manual" },
  ];
  for (const { acao, rotulo } of acoes) {
    const avaliacao = avaliarAcaoDeEntrega(acao, perfil, periodo, instituicao);
    if (avaliacao.visivel && avaliacao.permitido) {
      return rotulo;
    }
  }
  return null;
}

export interface ResultadoValidacaoProtocoloManual {
  sucesso: boolean;
  motivo?: string;
}

export interface EntradaProtocoloManual {
  justificativa: string;
  numeroProtocolo: string;
  dataInformada: string;
  canal: CanalEnvioBcb | null;
  emissor: string;
}

export function validarEntradaProtocoloManual(
  moduloId: ModuloId,
  entrada: EntradaProtocoloManual
): ResultadoValidacaoProtocoloManual {
  if (entrada.justificativa.trim().length < TAMANHO_MINIMO_JUSTIFICATIVA_MANUAL) {
    return {
      sucesso: false,
      motivo: `Descreva a justificativa com pelo menos ${TAMANHO_MINIMO_JUSTIFICATIVA_MANUAL} caracteres.`,
    };
  }
  if (entrada.numeroProtocolo.trim().length < 6) {
    return { sucesso: false, motivo: "Informe o número do protocolo recebido (mínimo de 6 caracteres)." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.dataInformada)) {
    return { sucesso: false, motivo: "Informe a data do protocolo." };
  }
  if (moduloId === "fiscal") {
    if (entrada.emissor.trim().length < 2) {
      return { sucesso: false, motivo: "Informe o nome do emissor que recebeu a DPS." };
    }
  } else if (!entrada.canal || !CANAIS_BCB_OFERECIDOS.includes(entrada.canal)) {
    return { sucesso: false, motivo: "Selecione o canal usado no envio ao Banco Central." };
  }
  return { sucesso: true };
}

export function validarEntradaEncaminhamento(emissor: string): ResultadoValidacaoProtocoloManual {
  if (emissor.trim().length < 2) {
    return { sucesso: false, motivo: "Informe o nome do emissor definido pela instituição." };
  }
  return { sucesso: true };
}
