import type { ArquivoGerado, PeriodoObrigacao, ProtocoloBCB } from "@/lib/tipos";
import { calcularRetencaoAte, configuracaoFluxo } from "@/lib/mock/configuracao-fluxo";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarUsuario } from "@/lib/mock/usuarios";

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
    },
    instituicao: {
      identificador: periodo.instituicaoId,
      razaoSocial: instituicao?.razaoSocial ?? periodo.instituicaoId,
      cnpj: instituicao?.cnpj ?? null,
    },
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
    retorno: {
      artefato: entrada.rotuloArtefato,
      identificador: entrada.identificador,
      dataInformada: entrada.dataInformada,
      situacao: entrada.situacao,
      codigo: entrada.codigoRetorno,
      mensagem: entrada.mensagemRetorno,
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
