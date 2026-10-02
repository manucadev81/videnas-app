import type {
  ArquivoGerado,
  CadastroPrevio,
  CanalEnvioBcb,
  DesfechoComite,
  EstadoPeriodo,
  PeriodoObrigacao,
  ProtocoloBCB,
  ResponsavelTransmissao,
} from "@/lib/tipos";
import {
  calcularRetencaoAte,
  configuracaoFluxo,
  DESFECHOS_COMITE,
  retornoSomentePosicionamento,
} from "@/lib/mock/configuracao-fluxo";
import { descricaoQuorumComite } from "@/lib/comite";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarUsuario } from "@/lib/mock/usuarios";
import {
  cicloDoPeriodo,
  limiarNegativas,
  montarHistoricoNegativas,
  negativasDoCiclo,
  tipoRemessaDoPeriodo,
} from "@/lib/negacoes";
import {
  ROTULO_CANAL_BCB,
  ROTULO_RESPONSAVEL_TRANSMISSAO,
  rotuloCanalCompletoDoCadastro,
} from "@/lib/contrato";

export interface EntradaDossieArquivamento {
  periodo: PeriodoObrigacao;
  arquivo: ArquivoGerado | undefined;
  protocolo: ProtocoloBCB | undefined;
  arquivadoEm: string;
  arquivadoPorUsuarioId: string;
  hashLacreAnterior: string | null;
}

function nomeDoUsuario(usuarioId: string | null): string | null {
  if (!usuarioId) {
    return null;
  }
  return buscarUsuario(usuarioId)?.nome ?? usuarioId;
}

function descreverRemessa(periodo: PeriodoObrigacao) {
  const tipoRemessa = tipoRemessaDoPeriodo(periodo);
  return {
    cicloEnvio: cicloDoPeriodo(periodo),
    tipoRemessa,
    protocoloSubstituido:
      tipoRemessa === "S" ? (periodo.substituicoes?.at(-1)?.protocoloSubstituido ?? null) : null,
  };
}

function descreverContratoCongelado(periodo: PeriodoObrigacao) {
  const congelado = periodo.contratoCongelado;
  if (!congelado) {
    return null;
  }
  return {
    congeladoEm: congelado.congeladoEm,
    emissaoIncluida: congelado.emissaoIncluida,
    transmissaoIncluida: congelado.transmissaoIncluida,
    responsavelTransmissao: ROTULO_RESPONSAVEL_TRANSMISSAO[congelado.responsavelTransmissao],
    responsavelTransmissaoCodigo: congelado.responsavelTransmissao,
    cadastroPrevioReferencia: congelado.cadastroId,
  };
}

export function montarDossieArquivamento(entrada: EntradaDossieArquivamento): string {
  const { periodo, arquivo, protocolo } = entrada;
  const instituicao = buscarInstituicao(periodo.instituicaoId);
  const modulo = buscarModulo(periodo.moduloId);
  const retorno = protocolo?.retornoRegulador ?? null;

  const documento = {
    documento: "Dossiê de arquivamento — Videnas",
    periodo: {
      identificador: periodo.id,
      modulo: modulo.nome,
      moduloIdentificador: periodo.moduloId,
      competencia: periodo.competencia,
      competenciaRotulo: periodo.competenciaRotulo,
      estadoAoArquivar: periodo.estado,
      remessa: descreverRemessa(periodo),
    },
    instituicao: {
      identificador: periodo.instituicaoId,
      razaoSocial: instituicao?.razaoSocial ?? periodo.instituicaoId,
      cnpj: instituicao?.cnpj ?? null,
    },
    contratoVigenteNaAprovacao: descreverContratoCongelado(periodo),
    arquivo: arquivo
      ? {
          identificador: arquivo.id,
          nome: arquivo.nomeArquivo,
          versao: arquivo.versao,
          hashSha256: arquivo.hashSha256,
          algoritmoHash: arquivo.algoritmoHash,
          tamanhoBytes: arquivo.tamanhoBytes,
        }
      : null,
    aprovacoes: periodo.aprovadoEm
      ? [
          {
            aprovadoPor: nomeDoUsuario(periodo.aprovadoPorUsuarioId),
            aprovadoEm: periodo.aprovadoEm,
          },
        ]
      : [],
    negacoes: periodo.negacoesAprovacao.map((negacao) => ({
      cicloEnvio: negacao.cicloEnvio ?? 1,
      origem: negacao.origem ?? "diretor",
      negadoPor: nomeDoUsuario(negacao.usuarioId),
      negadoEm: negacao.ocorridoEm,
      motivo: negacao.motivo,
      arquivoIdentificador: negacao.arquivoId,
    })),
    protocolo: protocolo
      ? {
          numero: protocolo.numeroProtocolo,
          canal: protocolo.canalEnvio,
          dataHoraEnvio: protocolo.dataHoraEnvio,
          reciboHash: protocolo.reciboHash,
          registradoPor: nomeDoUsuario(protocolo.registradoPorUsuarioId),
        }
      : null,
    retorno: protocolo
      ? {
          situacao: protocolo.situacaoRetorno,
          codigo: protocolo.codigoRetorno,
          mensagem: protocolo.mensagemRetorno,
          dataRegistro: protocolo.dataRetorno,
          artefato: retorno?.rotuloArtefato ?? null,
          identificador: retorno?.identificador ?? null,
          dataInformada: retorno?.dataInformada ?? null,
          anexoNome: retorno?.anexoNome ?? null,
          anexoHash: retorno?.anexoHash ?? null,
          anexoLacreIdentificador: retorno?.anexoLacreId ?? null,
          reciboLacreIdentificador: retorno?.reciboLacreId ?? null,
        }
      : null,
    arquivamento: {
      arquivadoEm: entrada.arquivadoEm,
      arquivadoPor: nomeDoUsuario(entrada.arquivadoPorUsuarioId),
      hashLacreAnterior: entrada.hashLacreAnterior,
      retencao: {
        marcoInicial: configuracaoFluxo.retencao?.marcoInicial ?? null,
        anos: configuracaoFluxo.retencao?.anos ?? null,
        retencaoAte: calcularRetencaoAte(entrada.arquivadoEm),
      },
    },
  };

  return JSON.stringify(documento, null, 2);
}

export interface EntradaReciboRetorno {
  periodo: PeriodoObrigacao;
  protocolo: ProtocoloBCB;
  rotuloArtefato: string;
  situacao: string;
  codigoRetorno: string;
  mensagemRetorno: string;
  identificador: string | null;
  dataInformada: string | null;
  anexoNome: string | null;
  anexoTamanhoBytes: number | null;
  anexoHash: string | null;
  anexoLacreId: string | null;
  registradoEm: string;
  registradoPorUsuarioId: string;
}

export function montarReciboRetorno(entrada: EntradaReciboRetorno): string {
  const { periodo, protocolo } = entrada;
  const modulo = buscarModulo(periodo.moduloId);

  const documento = {
    documento: `Recibo de retorno (${entrada.rotuloArtefato}) — Videnas`,
    periodo: {
      identificador: periodo.id,
      modulo: modulo.nome,
      competencia: periodo.competencia,
    },
    protocolo: {
      numero: protocolo.numeroProtocolo,
      dataHoraEnvio: protocolo.dataHoraEnvio,
      canal: protocolo.canalEnvio,
    },
    remessa: descreverRemessa(periodo),
    retorno: {
      artefato: entrada.rotuloArtefato,
      identificador: entrada.identificador,
      dataInformada: entrada.dataInformada,
      ...(retornoSomentePosicionamento(periodo.moduloId)
        ? { aprovado: entrada.situacao === "aceito" }
        : {
            situacao: entrada.situacao,
            codigo: entrada.codigoRetorno,
            mensagem: entrada.mensagemRetorno,
          }),
      anexo: entrada.anexoNome
        ? {
            nome: entrada.anexoNome,
            tamanhoBytes: entrada.anexoTamanhoBytes,
            hashSha256: entrada.anexoHash,
            lacreIdentificador: entrada.anexoLacreId,
          }
        : null,
    },
    registro: {
      registradoEm: entrada.registradoEm,
      registradoPor: nomeDoUsuario(entrada.registradoPorUsuarioId),
    },
  };

  return JSON.stringify(documento, null, 2);
}

export interface EntradaDossieComite {
  periodo: PeriodoObrigacao;
  buscarArquivo: (arquivoId: string) => ArquivoGerado | undefined;
  escaladoEm: string;
  escaladoPorUsuarioId: string;
  hashLacreAnterior: string | null;
}

export function montarDossieComite(entrada: EntradaDossieComite): string {
  const { periodo } = entrada;
  const instituicao = buscarInstituicao(periodo.instituicaoId);
  const modulo = buscarModulo(periodo.moduloId);
  const historico = montarHistoricoNegativas(periodo.negacoesAprovacao, entrada.buscarArquivo);
  const cicloAtual = cicloDoPeriodo(periodo);

  const documento = {
    documento: "Dossiê de escalonamento ao Comitê de Qualidade — Videnas",
    periodo: {
      identificador: periodo.id,
      modulo: modulo.nome,
      moduloIdentificador: periodo.moduloId,
      competencia: periodo.competencia,
      competenciaRotulo: periodo.competenciaRotulo,
    },
    instituicao: {
      identificador: periodo.instituicaoId,
      razaoSocial: instituicao?.razaoSocial ?? periodo.instituicaoId,
      cnpj: instituicao?.cnpj ?? null,
    },
    escalonamento: {
      limiarNegativas: limiarNegativas(),
      cicloEnvio: cicloAtual,
      tipoRemessa: tipoRemessaDoPeriodo(periodo),
      totalNegativas: negativasDoCiclo(periodo).length,
      totalNegativasTodosCiclos: historico.length,
      escaladoEm: entrada.escaladoEm,
      escaladoPor: nomeDoUsuario(entrada.escaladoPorUsuarioId),
      hashLacreAnterior: entrada.hashLacreAnterior,
    },
    historicoNegativas: historico.map((registro) => ({
      cicloEnvio: registro.ciclo,
      tipoRemessa: registro.tipoRemessa,
      numero: registro.numero,
      origem: registro.origem,
      negadoPor: registro.usuarioNome,
      negadoEm: registro.ocorridoEm,
      motivo: registro.motivo,
      arquivoIdentificador: registro.arquivoId,
      versaoArquivo: registro.versaoArquivo,
      hashArquivo: registro.hashArquivo,
    })),
    decisaoDoComite: `Aguardando decisão do Comitê de Qualidade (presidido pelo Administrador da Videnas, quórum ${descricaoQuorumComite()}). A decisão é lavrada em ata lacrada na cadeia do período.`,
  };

  return JSON.stringify(documento, null, 2);
}

export interface ParticipanteAtaComite {
  usuarioId: string;
  papel: "Presidente" | "Membro";
}

export interface EntradaAtaComite {
  periodo: PeriodoObrigacao;
  buscarArquivo: (arquivoId: string) => ArquivoGerado | undefined;
  desfecho: DesfechoComite;
  participantes: ParticipanteAtaComite[];
  justificativa: string;
  planoCorrecao: string | null;
  estadoAnterior: EstadoPeriodo;
  estadoNovo: EstadoPeriodo;
  decididoEm: string;
  hashLacreAnterior: string | null;
}

export function montarAtaComite(entrada: EntradaAtaComite): string {
  const { periodo } = entrada;
  const instituicao = buscarInstituicao(periodo.instituicaoId);
  const modulo = buscarModulo(periodo.moduloId);
  const historico = montarHistoricoNegativas(periodo.negacoesAprovacao, entrada.buscarArquivo);
  const definicao = DESFECHOS_COMITE[entrada.desfecho];

  const documento = {
    documento: "Ata do Comitê de Qualidade — Videnas",
    periodo: {
      identificador: periodo.id,
      modulo: modulo.nome,
      moduloIdentificador: periodo.moduloId,
      competencia: periodo.competencia,
      competenciaRotulo: periodo.competenciaRotulo,
    },
    instituicao: {
      identificador: periodo.instituicaoId,
      razaoSocial: instituicao?.razaoSocial ?? periodo.instituicaoId,
      cnpj: instituicao?.cnpj ?? null,
    },
    participantes: entrada.participantes.map((participante) => {
      const usuario = buscarUsuario(participante.usuarioId);
      return {
        papel: participante.papel,
        identificador: participante.usuarioId,
        nome: usuario?.nome ?? participante.usuarioId,
        perfil: usuario?.perfilId ?? null,
        cargo: usuario?.cargo ?? null,
      };
    }),
    quorum: descricaoQuorumComite(),
    historicoNegativas: historico.map((registro) => ({
      cicloEnvio: registro.ciclo,
      tipoRemessa: registro.tipoRemessa,
      numero: registro.numero,
      origem: registro.origem,
      negadoPor: registro.usuarioNome,
      negadoEm: registro.ocorridoEm,
      motivo: registro.motivo,
      versaoArquivo: registro.versaoArquivo,
      hashArquivo: registro.hashArquivo,
    })),
    decisao: {
      desfecho: entrada.desfecho,
      descricaoDesfecho: definicao.rotulo,
      justificativa: entrada.justificativa,
      planoCorrecao: entrada.planoCorrecao,
      estadoAnterior: entrada.estadoAnterior,
      estadoNovo: entrada.estadoNovo,
      decididoEm: entrada.decididoEm,
      efeito: definicao.descricao,
    },
    cadeia: {
      hashLacreAnterior: entrada.hashLacreAnterior,
    },
  };

  return JSON.stringify(documento, null, 2);
}

function escaparXml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface EntradaDocumentoFiscal {
  periodo: PeriodoObrigacao;
  arquivo: ArquivoGerado | undefined;
  numeroDocumento: string;
  emitidoEm: string;
  emitidoPorUsuarioId: string;
  cadastro: CadastroPrevio | null;
}

export function montarDocumentoFiscal(entrada: EntradaDocumentoFiscal): string {
  const { periodo, arquivo } = entrada;
  const instituicao = buscarInstituicao(periodo.instituicaoId);
  const totais = periodo.totaisResumo;

  const linhas = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<NFSeDemonstracao versao="1.0" ambiente="demonstracao">',
    `  <Numero>${escaparXml(entrada.numeroDocumento)}</Numero>`,
    `  <Competencia>${escaparXml(periodo.competencia)}</Competencia>`,
    "  <Prestador>",
    `    <RazaoSocial>${escaparXml(instituicao?.razaoSocial ?? periodo.instituicaoId)}</RazaoSocial>`,
    `    <CNPJ>${escaparXml(instituicao?.cnpj ?? "")}</CNPJ>`,
    `    <InscricaoMunicipal>${escaparXml(instituicao?.inscricaoMunicipal ?? "")}</InscricaoMunicipal>`,
    `    <Municipio>${escaparXml(instituicao?.municipio ?? "")}</Municipio>`,
    "  </Prestador>",
    "  <DPSOrigem>",
    `    <Arquivo>${escaparXml(arquivo?.nomeArquivo ?? "")}</Arquivo>`,
    `    <HashSha256>${escaparXml(arquivo?.hashSha256 ?? "")}</HashSha256>`,
    `    <Registros>${arquivo?.quantidadeRegistros ?? 0}</Registros>`,
    "  </DPSOrigem>",
    "  <Totais>",
    `    <DPS>${escaparXml(String(totais.dps ?? 0))}</DPS>`,
    `    <ValorServicos>${escaparXml(String(totais.valorServicos ?? 0))}</ValorServicos>`,
    `    <ValorIss>${escaparXml(String(totais.valorIss ?? 0))}</ValorIss>`,
    "  </Totais>",
    `  <EmitidoEm>${escaparXml(entrada.emitidoEm)}</EmitidoEm>`,
    `  <EmitidoPor>${escaparXml(nomeDoUsuario(entrada.emitidoPorUsuarioId) ?? entrada.emitidoPorUsuarioId)}</EmitidoPor>`,
    `  <EmissorCadastro>${escaparXml(entrada.cadastro?.identificador ?? "")}</EmissorCadastro>`,
    "  <Aviso>Documento fiscal de demonstração. Nenhuma NFS-e real foi emitida.</Aviso>",
    "</NFSeDemonstracao>",
  ];

  return linhas.join("\n");
}

export interface EntradaComprovanteTransmissao {
  periodo: PeriodoObrigacao;
  objeto: { tipo: "arquivo" | "documento_fiscal"; nome: string; hashSha256: string };
  numeroProtocolo: string;
  canalBcb: CanalEnvioBcb | null;
  cadastro: CadastroPrevio;
  responsavel: ResponsavelTransmissao;
  transmitidoEm: string;
  transmitidoPorUsuarioId: string;
  hashLacreAnterior: string | null;
}

export function montarComprovanteTransmissao(entrada: EntradaComprovanteTransmissao): string {
  const { periodo, cadastro } = entrada;
  const instituicao = buscarInstituicao(periodo.instituicaoId);
  const modulo = buscarModulo(periodo.moduloId);

  const documento = {
    documento: "Comprovante de transmissão (simulada) — Videnas",
    periodo: {
      identificador: periodo.id,
      modulo: modulo.nome,
      moduloIdentificador: periodo.moduloId,
      competencia: periodo.competencia,
      competenciaRotulo: periodo.competenciaRotulo,
    },
    instituicao: {
      identificador: periodo.instituicaoId,
      razaoSocial: instituicao?.razaoSocial ?? periodo.instituicaoId,
      cnpj: instituicao?.cnpj ?? null,
    },
    contratoVigenteNaAprovacao: descreverContratoCongelado(periodo),
    transmissao: {
      protocolo: entrada.numeroProtocolo,
      canal: entrada.canalBcb ? ROTULO_CANAL_BCB[entrada.canalBcb] : rotuloCanalCompletoDoCadastro(cadastro),
      transmitidoEm: entrada.transmitidoEm,
      responsavel: ROTULO_RESPONSAVEL_TRANSMISSAO[entrada.responsavel],
      responsavelCodigo: entrada.responsavel,
      executadoPor: nomeDoUsuario(entrada.transmitidoPorUsuarioId),
      ...descreverRemessa(periodo),
    },
    cadastroPrevioUtilizado: {
      identificador: cadastro.id,
      codigoDoCadastro: cadastro.identificador,
      canal: rotuloCanalCompletoDoCadastro(cadastro),
      responsavel: ROTULO_RESPONSAVEL_TRANSMISSAO[cadastro.responsavel],
      registradoEm: cadastro.registradoEm,
      validoAte: cadastro.validoAte,
    },
    objetoTransmitido: {
      tipo: entrada.objeto.tipo,
      nome: entrada.objeto.nome,
      hashSha256: entrada.objeto.hashSha256,
    },
    cadeia: {
      hashLacreAnterior: entrada.hashLacreAnterior,
    },
    aviso: "Transmissão simulada: nenhum arquivo foi enviado a um órgão real nesta demonstração.",
  };

  return JSON.stringify(documento, null, 2);
}

export interface EntradaReciboProtocoloManual {
  periodo: PeriodoObrigacao;
  numeroProtocolo: string;
  dataInformada: string;
  canalBcb: CanalEnvioBcb | null;
  emissor: string | null;
  justificativa: string;
  motivoIndisponibilidade: string | null;
  objeto: { nome: string; hashSha256: string } | null;
  anexoNome: string | null;
  anexoTamanhoBytes: number | null;
  anexoHash: string | null;
  anexoLacreId: string | null;
  registradoEm: string;
  registradoPorUsuarioId: string;
}

export function montarReciboProtocoloManual(entrada: EntradaReciboProtocoloManual): string {
  const { periodo } = entrada;
  const modulo = buscarModulo(periodo.moduloId);
  const instituicao = buscarInstituicao(periodo.instituicaoId);

  const documento = {
    documento: "Recibo de registro manual de protocolo — Videnas",
    periodo: {
      identificador: periodo.id,
      modulo: modulo.nome,
      competencia: periodo.competencia,
      competenciaRotulo: periodo.competenciaRotulo,
    },
    instituicao: {
      identificador: periodo.instituicaoId,
      razaoSocial: instituicao?.razaoSocial ?? periodo.instituicaoId,
    },
    protocolo: {
      numero: entrada.numeroProtocolo,
      dataInformada: entrada.dataInformada,
      canal: entrada.canalBcb ? ROTULO_CANAL_BCB[entrada.canalBcb] : null,
      emissor: entrada.emissor,
    },
    remessa: descreverRemessa(periodo),
    objetoRegistrado: entrada.objeto,
    justificativa: entrada.justificativa,
    motivoDaTransmissaoManual: entrada.motivoIndisponibilidade,
    anexo: entrada.anexoNome
      ? {
          nome: entrada.anexoNome,
          tamanhoBytes: entrada.anexoTamanhoBytes,
          hashSha256: entrada.anexoHash,
          lacreIdentificador: entrada.anexoLacreId,
        }
      : null,
    contratoVigenteNaAprovacao: descreverContratoCongelado(periodo),
    registro: {
      registradoEm: entrada.registradoEm,
      registradoPor: nomeDoUsuario(entrada.registradoPorUsuarioId),
    },
  };

  return JSON.stringify(documento, null, 2);
}

export interface EntradaReciboEncaminhamento {
  periodo: PeriodoObrigacao;
  emissor: string;
  observacao: string | null;
  objeto: { nome: string; hashSha256: string } | null;
  registradoEm: string;
  registradoPorUsuarioId: string;
}

export function montarReciboEncaminhamento(entrada: EntradaReciboEncaminhamento): string {
  const { periodo } = entrada;
  const modulo = buscarModulo(periodo.moduloId);
  const instituicao = buscarInstituicao(periodo.instituicaoId);

  const documento = {
    documento: "Recibo de encaminhamento da DPS ao emissor — Videnas",
    periodo: {
      identificador: periodo.id,
      modulo: modulo.nome,
      competencia: periodo.competencia,
      competenciaRotulo: periodo.competenciaRotulo,
    },
    instituicao: {
      identificador: periodo.instituicaoId,
      razaoSocial: instituicao?.razaoSocial ?? periodo.instituicaoId,
    },
    encaminhamento: {
      emissor: entrada.emissor,
      observacao: entrada.observacao,
      motivo: "Emissão da NFS-e não contratada: a DPS é encaminhada ao emissor definido pelo cliente.",
    },
    objetoEncaminhado: entrada.objeto,
    contratoVigenteNaAprovacao: descreverContratoCongelado(periodo),
    registro: {
      registradoEm: entrada.registradoEm,
      registradoPor: nomeDoUsuario(entrada.registradoPorUsuarioId),
    },
  };

  return JSON.stringify(documento, null, 2);
}
