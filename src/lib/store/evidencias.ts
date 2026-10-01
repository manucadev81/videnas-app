"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ArquivoGerado,
  CadastroPrevio,
  CanalEnvioBcb,
  FornecimentoInsumo,
  PeriodoObrigacao,
  ProtocoloBCB,
  RegistroLacre,
  SentidoLacre,
  SituacaoRetornoBcb,
  DesfechoComite,
  EstadoPeriodo,
  ResponsavelTransmissao,
  TipoArtefatoLacre,
} from "@/lib/tipos";
import {
  chaveDaCadeiaDe,
  construirLacre,
  encadearApos,
  filtrarCadeia,
  montarIdentificadorLacre,
  resumirValoresDeFormulario,
  tipoArtefatoDoLacre,
  type AutorLacre,
} from "@/lib/evidencias/lacre";
import { criptografiaDisponivel } from "@/lib/evidencias/cripto";
import {
  montarAtaComite,
  montarComprovanteTransmissao,
  montarDocumentoFiscal,
  montarDossieArquivamento,
  montarDossieComite,
  montarReciboEncaminhamento,
  montarReciboProtocoloManual,
  montarReciboRetorno,
  type ParticipanteAtaComite,
} from "@/lib/evidencias/dossie";
import {
  montarConteudoArquivoEntregue,
  tamanhoEmBytesDoConteudo,
} from "@/lib/evidencias/conteudo-arquivo";
import { buscarInsumo } from "@/lib/fornecimento/insumos";
import { camposFaltantesDoFormulario } from "@/lib/fornecimento/completude";
import { fornecimentosSemente, lacresSemente } from "@/lib/mock/evidencias";

export interface VerificacaoLacre {
  lacreId: string;
  verificadoEm: string;
  confere: boolean;
  hashCalculado: string;
}

export interface ResultadoEvidencia {
  sucesso: boolean;
  motivo?: string;
  lacre?: RegistroLacre;
}

export interface EstadoEvidencias {
  hidratado: boolean;
  lacres: Record<string, RegistroLacre>;
  fornecimentos: Record<string, Record<string, FornecimentoInsumo>>;
  verificacoes: VerificacaoLacre[];
  registrarFornecimentoArquivo: (entrada: EntradaFornecimentoArquivo) => Promise<ResultadoEvidencia>;
  registrarFornecimentoFormulario: (
    entrada: EntradaFornecimentoFormulario
  ) => Promise<ResultadoEvidencia>;
  registrarEntregaAoCliente: (entrada: EntradaEntregaAoCliente) => Promise<ResultadoEvidencia>;
  selarNovaVersaoArquivo: (entrada: EntradaSelarNovaVersaoArquivo) => Promise<ResultadoEvidencia>;
  selarRetornoRegulador: (entrada: EntradaSelarRetornoRegulador) => Promise<ResultadoSelagemRetorno>;
  selarArquivamento: (entrada: EntradaSelarArquivamento) => Promise<ResultadoEvidencia>;
  selarEscalaComite: (entrada: EntradaSelarEscalaComite) => Promise<ResultadoEvidencia>;
  selarAtaComite: (entrada: EntradaSelarAtaComite) => Promise<ResultadoEvidencia>;
  selarDocumentoFiscal: (entrada: EntradaSelarDocumentoFiscal) => Promise<ResultadoEvidencia>;
  selarTransmissao: (entrada: EntradaSelarTransmissao) => Promise<ResultadoEvidencia>;
  selarProtocoloManual: (entrada: EntradaSelarProtocoloManual) => Promise<ResultadoSelagemRetorno>;
  selarEncaminhamento: (entrada: EntradaSelarEncaminhamento) => Promise<ResultadoEvidencia>;
  registrarVerificacao: (lacreId: string, confere: boolean, hashCalculado: string) => void;
  reiniciarEvidencias: () => void;
}

export interface EntradaFornecimentoArquivo {
  periodo: PeriodoObrigacao;
  insumoId: string;
  arquivo: File;
  linhasAceitas: number;
  autor: AutorLacre;
}

export interface EntradaFornecimentoFormulario {
  periodo: PeriodoObrigacao;
  insumoId: string;
  valores: Record<string, string>;
  autor: AutorLacre;
}

export interface EntradaEntregaAoCliente {
  periodo: PeriodoObrigacao;
  arquivo: ArquivoGerado;
  autor: AutorLacre;
}

export interface EntradaSelarNovaVersaoArquivo {
  periodo: PeriodoObrigacao;
  arquivo: ArquivoGerado;
  autor: AutorLacre;
  origemNome?: string;
}

export interface EntradaSelarRetornoRegulador {
  periodo: PeriodoObrigacao;
  protocolo: ProtocoloBCB;
  rotuloArtefato: string;
  situacao: Exclude<SituacaoRetornoBcb, "aguardando">;
  codigoRetorno: string;
  mensagemRetorno: string;
  identificador: string | null;
  dataInformada: string | null;
  anexo: File | null;
  autor: AutorLacre;
}

export interface ResultadoSelagemRetorno {
  sucesso: boolean;
  motivo?: string;
  anexoLacre?: RegistroLacre;
  reciboLacre?: RegistroLacre;
}

export interface EntradaSelarArquivamento {
  periodo: PeriodoObrigacao;
  arquivo: ArquivoGerado | undefined;
  protocolo: ProtocoloBCB | undefined;
  arquivadoEm: string;
  autor: AutorLacre;
}

export interface EntradaSelarEscalaComite {
  periodo: PeriodoObrigacao;
  buscarArquivo: (arquivoId: string) => ArquivoGerado | undefined;
  escaladoEm: string;
  autor: AutorLacre;
}

export interface EntradaSelarAtaComite {
  periodo: PeriodoObrigacao;
  buscarArquivo: (arquivoId: string) => ArquivoGerado | undefined;
  desfecho: DesfechoComite;
  participantes: ParticipanteAtaComite[];
  justificativa: string;
  planoCorrecao: string | null;
  estadoNovo: EstadoPeriodo;
  decididoEm: string;
  autor: AutorLacre;
}

export interface EntradaSelarDocumentoFiscal {
  periodo: PeriodoObrigacao;
  arquivo: ArquivoGerado | undefined;
  numeroDocumento: string;
  emitidoEm: string;
  cadastro: CadastroPrevio | null;
  autor: AutorLacre;
}

export interface EntradaSelarTransmissao {
  periodo: PeriodoObrigacao;
  objeto: { tipo: "arquivo" | "documento_fiscal"; nome: string; hashSha256: string };
  numeroProtocolo: string;
  canalBcb: CanalEnvioBcb | null;
  cadastro: CadastroPrevio;
  responsavel: ResponsavelTransmissao;
  transmitidoEm: string;
  autor: AutorLacre;
}

export interface EntradaSelarProtocoloManual {
  periodo: PeriodoObrigacao;
  numeroProtocolo: string;
  dataInformada: string;
  canalBcb: CanalEnvioBcb | null;
  emissor: string | null;
  justificativa: string;
  motivoIndisponibilidade: string | null;
  objeto: { nome: string; hashSha256: string } | null;
  anexo: File | null;
  autor: AutorLacre;
}

export interface EntradaSelarEncaminhamento {
  periodo: PeriodoObrigacao;
  emissor: string;
  observacao: string | null;
  objeto: { nome: string; hashSha256: string } | null;
  autor: AutorLacre;
}

type EvidenciasPersistidas = Pick<EstadoEvidencias, "lacres" | "fornecimentos" | "verificacoes">;

export const NOME_ARMAZENAMENTO_EVIDENCIAS = "videnas-evidencias";

const MOTIVO_SEM_CRIPTOGRAFIA =
  "Este navegador não expõe a Web Crypto API. O lacre criptográfico não pode ser gerado agora.";

const MOTIVO_LACRE_JA_EXISTE =
  "Já existe um lacre com este identificador e lacres nunca são sobrescritos. Envie novamente para gerar um lacre novo.";

const MOTIVO_SEM_CONTEUDO_ENTREGUE =
  "Não foi possível reconstruir o conteúdo do arquivo entregue. Sem o conteúdo completo não há o que lacrar — a prova de entrega não foi gerada.";

function lacresIniciais(): Record<string, RegistroLacre> {
  const registro: Record<string, RegistroLacre> = {};
  for (const lacre of lacresSemente) {
    registro[lacre.id] = lacre;
  }
  return registro;
}

function fornecimentosIniciais(): Record<string, Record<string, FornecimentoInsumo>> {
  const registro: Record<string, Record<string, FornecimentoInsumo>> = {};
  for (const [periodoId, porInsumo] of Object.entries(fornecimentosSemente)) {
    registro[periodoId] = { ...porInsumo };
  }
  return registro;
}

function estadoInicial(): EvidenciasPersistidas {
  return {
    lacres: lacresIniciais(),
    fornecimentos: fornecimentosIniciais(),
    verificacoes: [],
  };
}

export function lacresDoPeriodo(
  lacres: Record<string, RegistroLacre>,
  periodoId: string
): RegistroLacre[] {
  return Object.values(lacres)
    .filter((lacre) => lacre.periodoId === periodoId)
    .sort((a, b) => b.seladoEm.localeCompare(a.seladoEm));
}

export function lacresDaInstituicao(
  lacres: Record<string, RegistroLacre>,
  instituicaoId: string | "todas"
): RegistroLacre[] {
  return Object.values(lacres)
    .filter((lacre) => instituicaoId === "todas" || lacre.instituicaoId === instituicaoId)
    .sort((a, b) => b.seladoEm.localeCompare(a.seladoEm));
}

export function fornecimentosDoPeriodo(
  fornecimentos: Record<string, Record<string, FornecimentoInsumo>>,
  periodoId: string
): Record<string, FornecimentoInsumo> {
  return fornecimentos[periodoId] ?? {};
}

export function ultimoLacreDe(
  lacres: Record<string, RegistroLacre>,
  periodoId: string,
  insumoId: string | null
): RegistroLacre | undefined {
  const doPeriodo = Object.values(lacres).filter(
    (lacre) => lacre.periodoId === periodoId && lacre.insumoId === insumoId
  );
  if (doPeriodo.length === 0) {
    return undefined;
  }
  return doPeriodo.sort((a, b) => a.seladoEm.localeCompare(b.seladoEm))[doPeriodo.length - 1];
}

export function lacreDeSaidaDoArquivo(
  lacres: Record<string, RegistroLacre>,
  arquivoId: string
): RegistroLacre | undefined {
  return Object.values(lacres)
    .filter(
      (lacre) =>
        lacre.sentido === "saida" &&
        lacre.arquivoId === arquivoId &&
        tipoArtefatoDoLacre(lacre) === "arquivo_entregue"
    )
    .sort((a, b) => a.seladoEm.localeCompare(b.seladoEm))
    .at(-1);
}

export function hashDoArquivoEntregue(
  lacres: Record<string, RegistroLacre>,
  arquivo: ArquivoGerado
): string {
  return lacreDeSaidaDoArquivo(lacres, arquivo.id)?.hashSha256 ?? arquivo.hashSha256;
}

function proximaSequenciaDaCadeia(
  lacres: Record<string, RegistroLacre>,
  periodo: PeriodoObrigacao,
  sentido: RegistroLacre["sentido"]
): number {
  return (
    Object.values(lacres).filter(
      (lacre) =>
        lacre.sentido === sentido &&
        lacre.instituicaoId === periodo.instituicaoId &&
        lacre.moduloId === periodo.moduloId &&
        lacre.competencia === periodo.competencia
    ).length + 1
  );
}

function ajustarNaCadeia(
  lacre: RegistroLacre,
  lacres: Record<string, RegistroLacre>,
  periodo: PeriodoObrigacao
): RegistroLacre {
  const hashAnterior = encadearApos(
    filtrarCadeia(Object.values(lacres), {
      instituicaoId: periodo.instituicaoId,
      moduloId: periodo.moduloId,
      competencia: periodo.competencia,
      insumoId: lacre.insumoId,
    })
  );

  let sequencia = proximaSequenciaDaCadeia(lacres, periodo, lacre.sentido);
  let id = montarIdentificadorLacre(lacre.sentido, lacre.moduloId, lacre.competencia, sequencia);
  while (lacres[id]) {
    sequencia += 1;
    id = montarIdentificadorLacre(lacre.sentido, lacre.moduloId, lacre.competencia, sequencia);
  }

  if (id === lacre.id && hashAnterior === lacre.hashAnterior) {
    return lacre;
  }

  return { ...lacre, id, hashAnterior };
}

interface AcessoresEvidencias {
  get: () => EstadoEvidencias;
  set: (
    atualizar: (estado: EstadoEvidencias) => EstadoEvidencias | Partial<EstadoEvidencias>
  ) => void;
}

interface EntradaSelagemNaCadeia {
  periodo: PeriodoObrigacao;
  sentido: SentidoLacre;
  tipoArtefato: TipoArtefatoLacre;
  conteudo: string | ArrayBuffer;
  origemNome: string;
  tamanhoBytes: number;
  autor: AutorLacre;
}

async function selarNaCadeia(
  { get, set }: AcessoresEvidencias,
  entrada: EntradaSelagemNaCadeia
): Promise<ResultadoEvidencia> {
  const { periodo } = entrada;
  const lacresAtuais = get().lacres;
  const cadeia = filtrarCadeia(Object.values(lacresAtuais), {
    instituicaoId: periodo.instituicaoId,
    moduloId: periodo.moduloId,
    competencia: periodo.competencia,
    insumoId: null,
  });

  const ultimo = cadeia.at(-1);
  const instanteMinimo = ultimo ? Date.parse(ultimo.seladoEm) + 1 : 0;
  const seladoEm = new Date(Math.max(Date.now(), instanteMinimo)).toISOString();

  const lacre = await construirLacre({
    sentido: entrada.sentido,
    instituicaoId: periodo.instituicaoId,
    moduloId: periodo.moduloId,
    competencia: periodo.competencia,
    periodoId: periodo.id,
    insumoId: null,
    conteudo: entrada.conteudo,
    origemNome: entrada.origemNome,
    tamanhoBytes: entrada.tamanhoBytes,
    autor: entrada.autor,
    hashAnterior: encadearApos(cadeia),
    sequencia: proximaSequenciaDaCadeia(lacresAtuais, periodo, entrada.sentido),
    seladoEm,
    tipoArtefato: entrada.tipoArtefato,
  });

  let gravado = lacre;

  set((estado) => {
    const definitivo = ajustarNaCadeia(lacre, estado.lacres, periodo);
    if (estado.lacres[definitivo.id]) {
      return estado;
    }
    gravado = definitivo;
    return { lacres: { ...estado.lacres, [definitivo.id]: definitivo } };
  });

  if (get().lacres[gravado.id] !== gravado) {
    return { sucesso: false, motivo: MOTIVO_LACRE_JA_EXISTE };
  }

  return { sucesso: true, lacre: gravado };
}

export const useEvidenciasStore = create<EstadoEvidencias>()(
  persist<EstadoEvidencias, [], [], EvidenciasPersistidas>(
    (set, get) => ({
      hidratado: false,
      ...estadoInicial(),

      registrarFornecimentoArquivo: async ({
        periodo,
        insumoId,
        arquivo,
        linhasAceitas,
        autor,
      }: EntradaFornecimentoArquivo) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const definicao = buscarInsumo(insumoId);
        if (!definicao) {
          return { sucesso: false, motivo: `Insumo desconhecido: ${insumoId}.` };
        }

        const lacresAtuais = get().lacres;
        const chave = {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId,
        };
        const cadeia = filtrarCadeia(Object.values(lacresAtuais), chave);

        const conteudo = await arquivo.arrayBuffer();

        const lacre = await construirLacre({
          sentido: "entrada",
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          periodoId: periodo.id,
          insumoId,
          conteudo,
          origemNome: arquivo.name,
          tamanhoBytes: arquivo.size,
          autor,
          hashAnterior: encadearApos(cadeia),
          sequencia: proximaSequenciaDaCadeia(lacresAtuais, periodo, "entrada"),
        });

        let gravado = lacre;

        set((estado) => {
          const definitivo = ajustarNaCadeia(lacre, estado.lacres, periodo);
          if (estado.lacres[definitivo.id]) {
            return estado;
          }
          gravado = definitivo;
          const doPeriodo = estado.fornecimentos[periodo.id] ?? {};
          return {
            lacres: { ...estado.lacres, [definitivo.id]: definitivo },
            fornecimentos: {
              ...estado.fornecimentos,
              [periodo.id]: {
                ...doPeriodo,
                [insumoId]: {
                  insumoId,
                  periodoId: periodo.id,
                  status: "fornecido",
                  lacreId: definitivo.id,
                  fornecidoEm: definitivo.seladoEm,
                  fornecidoPorUsuarioId: autor.usuarioId,
                  nomeArquivo: arquivo.name,
                  tamanhoBytes: arquivo.size,
                  linhasAceitas,
                  valoresFormulario: null,
                  camposFaltantes: [],
                },
              },
            },
          };
        });

        if (get().lacres[gravado.id] !== gravado) {
          return { sucesso: false, motivo: MOTIVO_LACRE_JA_EXISTE };
        }

        return { sucesso: true, lacre: gravado };
      },

      registrarFornecimentoFormulario: async ({
        periodo,
        insumoId,
        valores,
        autor,
      }: EntradaFornecimentoFormulario) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const definicao = buscarInsumo(insumoId);
        if (!definicao) {
          return { sucesso: false, motivo: `Insumo desconhecido: ${insumoId}.` };
        }

        const camposFaltantes = camposFaltantesDoFormulario(definicao, valores);
        const lacresAtuais = get().lacres;
        const chave = {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId,
        };
        const cadeia = filtrarCadeia(Object.values(lacresAtuais), chave);

        const serializado = JSON.stringify(
          {
            insumo: insumoId,
            periodo: periodo.id,
            competencia: periodo.competencia,
            valores,
          },
          null,
          2
        );

        const lacre = await construirLacre({
          sentido: "entrada",
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          periodoId: periodo.id,
          insumoId,
          conteudo: serializado,
          origemNome: `${definicao.rotulo} (formulário)`,
          tamanhoBytes: new TextEncoder().encode(serializado).byteLength,
          autor,
          hashAnterior: encadearApos(cadeia),
          sequencia: proximaSequenciaDaCadeia(lacresAtuais, periodo, "entrada"),
        });

        const lacreComResumo: RegistroLacre = {
          ...lacre,
          resumoConteudo: resumirValoresDeFormulario(valores),
        };

        let gravado = lacreComResumo;

        set((estado) => {
          const definitivo = ajustarNaCadeia(lacreComResumo, estado.lacres, periodo);
          if (estado.lacres[definitivo.id]) {
            return estado;
          }
          gravado = definitivo;
          const doPeriodo = estado.fornecimentos[periodo.id] ?? {};
          return {
            lacres: { ...estado.lacres, [definitivo.id]: definitivo },
            fornecimentos: {
              ...estado.fornecimentos,
              [periodo.id]: {
                ...doPeriodo,
                [insumoId]: {
                  insumoId,
                  periodoId: periodo.id,
                  status: camposFaltantes.length === 0 ? "fornecido" : "parcial",
                  lacreId: definitivo.id,
                  fornecidoEm: definitivo.seladoEm,
                  fornecidoPorUsuarioId: autor.usuarioId,
                  nomeArquivo: null,
                  tamanhoBytes: null,
                  linhasAceitas: null,
                  valoresFormulario: { ...valores },
                  camposFaltantes,
                },
              },
            },
          };
        });

        if (get().lacres[gravado.id] !== gravado) {
          return { sucesso: false, motivo: MOTIVO_LACRE_JA_EXISTE };
        }

        return { sucesso: true, lacre: gravado };
      },

      registrarEntregaAoCliente: async ({
        periodo,
        arquivo,
        autor,
      }: EntradaEntregaAoCliente) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const lacresAtuais = get().lacres;
        const chave = {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId: null,
        };
        const cadeia = filtrarCadeia(Object.values(lacresAtuais), chave);

        const conteudo = montarConteudoArquivoEntregue(arquivo, periodo);
        if (conteudo.trim().length === 0) {
          return { sucesso: false, motivo: MOTIVO_SEM_CONTEUDO_ENTREGUE };
        }

        const lacre = await construirLacre({
          sentido: "saida",
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          periodoId: periodo.id,
          insumoId: null,
          arquivoId: arquivo.id,
          conteudo,
          origemNome: arquivo.nomeArquivo,
          tamanhoBytes: tamanhoEmBytesDoConteudo(conteudo),
          autor,
          hashAnterior: encadearApos(cadeia),
          sequencia: proximaSequenciaDaCadeia(lacresAtuais, periodo, "saida"),
        });

        let gravado = lacre;

        set((estado) => {
          const definitivo = ajustarNaCadeia(lacre, estado.lacres, periodo);
          if (estado.lacres[definitivo.id]) {
            return estado;
          }
          gravado = definitivo;
          return { lacres: { ...estado.lacres, [definitivo.id]: definitivo } };
        });

        if (get().lacres[gravado.id] !== gravado) {
          return { sucesso: false, motivo: MOTIVO_LACRE_JA_EXISTE };
        }

        return { sucesso: true, lacre: gravado };
      },

      selarNovaVersaoArquivo: async ({
        periodo,
        arquivo,
        autor,
        origemNome,
      }: EntradaSelarNovaVersaoArquivo) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const existente = lacreDeSaidaDoArquivo(get().lacres, arquivo.id);
        if (existente) {
          return { sucesso: true, lacre: existente };
        }

        const lacresAtuais = get().lacres;
        const chave = {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId: null,
        };
        const cadeia = filtrarCadeia(Object.values(lacresAtuais), chave);
        const conteudo = arquivo.previewConteudo || arquivo.nomeArquivo;

        const lacre = await construirLacre({
          sentido: "saida",
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          periodoId: periodo.id,
          insumoId: null,
          arquivoId: arquivo.id,
          conteudo,
          origemNome: origemNome ?? arquivo.nomeArquivo,
          tamanhoBytes: arquivo.tamanhoBytes,
          autor,
          hashAnterior: encadearApos(cadeia),
          sequencia: proximaSequenciaDaCadeia(lacresAtuais, periodo, "saida"),
        });

        let gravado = lacre;

        set((estado) => {
          const definitivo = ajustarNaCadeia(lacre, estado.lacres, periodo);
          if (estado.lacres[definitivo.id]) {
            return estado;
          }
          gravado = definitivo;
          return { lacres: { ...estado.lacres, [definitivo.id]: definitivo } };
        });

        if (get().lacres[gravado.id] !== gravado) {
          return { sucesso: false, motivo: MOTIVO_LACRE_JA_EXISTE };
        }

        return { sucesso: true, lacre: gravado };
      },

      selarRetornoRegulador: async ({
        periodo,
        protocolo,
        rotuloArtefato,
        situacao,
        codigoRetorno,
        mensagemRetorno,
        identificador,
        dataInformada,
        anexo,
        autor,
      }: EntradaSelarRetornoRegulador) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const acessores: AcessoresEvidencias = { get, set };
        let anexoLacre: RegistroLacre | undefined;

        if (anexo) {
          const bytes = await anexo.arrayBuffer();
          const resultadoAnexo = await selarNaCadeia(acessores, {
            periodo,
            sentido: "entrada",
            tipoArtefato: "anexo_retorno",
            conteudo: bytes,
            origemNome: anexo.name,
            tamanhoBytes: anexo.size,
            autor,
          });
          if (!resultadoAnexo.sucesso || !resultadoAnexo.lacre) {
            return { sucesso: false, motivo: resultadoAnexo.motivo };
          }
          anexoLacre = resultadoAnexo.lacre;
        }

        const recibo = montarReciboRetorno({
          periodo,
          protocolo,
          rotuloArtefato,
          situacao,
          codigoRetorno,
          mensagemRetorno,
          identificador,
          dataInformada,
          anexoNome: anexo?.name ?? null,
          anexoTamanhoBytes: anexo?.size ?? null,
          anexoHash: anexoLacre?.hashSha256 ?? null,
          anexoLacreId: anexoLacre?.id ?? null,
          registradoEm: new Date().toISOString(),
          registradoPorUsuarioId: autor.usuarioId,
        });

        const resultadoRecibo = await selarNaCadeia(acessores, {
          periodo,
          sentido: "entrada",
          tipoArtefato: "recibo_retorno",
          conteudo: recibo,
          origemNome: `Recibo ${rotuloArtefato} — ${protocolo.numeroProtocolo}`,
          tamanhoBytes: tamanhoEmBytesDoConteudo(recibo),
          autor,
        });
        if (!resultadoRecibo.sucesso || !resultadoRecibo.lacre) {
          return { sucesso: false, motivo: resultadoRecibo.motivo, anexoLacre };
        }

        return { sucesso: true, anexoLacre, reciboLacre: resultadoRecibo.lacre };
      },

      selarArquivamento: async ({ periodo, arquivo, protocolo, arquivadoEm, autor }: EntradaSelarArquivamento) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const lacresAtuais = get().lacres;
        const existente = Object.values(lacresAtuais).find(
          (lacre) =>
            lacre.periodoId === periodo.id && lacre.tipoArtefato === "dossie_arquivamento"
        );
        if (existente) {
          return { sucesso: true, lacre: existente };
        }

        const cadeia = filtrarCadeia(Object.values(lacresAtuais), {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId: null,
        });

        const dossie = montarDossieArquivamento({
          periodo,
          arquivo,
          protocolo,
          arquivadoEm,
          arquivadoPorUsuarioId: autor.usuarioId,
          hashLacreAnterior: encadearApos(cadeia),
        });

        return selarNaCadeia(
          { get, set },
          {
            periodo,
            sentido: "saida",
            tipoArtefato: "dossie_arquivamento",
            conteudo: dossie,
            origemNome: `Dossiê de arquivamento — ${periodo.competenciaRotulo}`,
            tamanhoBytes: tamanhoEmBytesDoConteudo(dossie),
            autor,
          }
        );
      },

      selarEscalaComite: async ({ periodo, buscarArquivo, escaladoEm, autor }: EntradaSelarEscalaComite) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const lacresAtuais = get().lacres;
        const cadeia = filtrarCadeia(Object.values(lacresAtuais), {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId: null,
        });

        const dossie = montarDossieComite({
          periodo,
          buscarArquivo,
          escaladoEm,
          escaladoPorUsuarioId: autor.usuarioId,
          hashLacreAnterior: encadearApos(cadeia),
        });

        return selarNaCadeia(
          { get, set },
          {
            periodo,
            sentido: "saida",
            tipoArtefato: "dossie_comite",
            conteudo: dossie,
            origemNome: `Dossiê de escalonamento ao Comitê — ${periodo.competenciaRotulo}`,
            tamanhoBytes: tamanhoEmBytesDoConteudo(dossie),
            autor,
          }
        );
      },

      selarAtaComite: async ({
        periodo,
        buscarArquivo,
        desfecho,
        participantes,
        justificativa,
        planoCorrecao,
        estadoNovo,
        decididoEm,
        autor,
      }: EntradaSelarAtaComite) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const cadeia = filtrarCadeia(Object.values(get().lacres), {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId: null,
        });

        const ata = montarAtaComite({
          periodo,
          buscarArquivo,
          desfecho,
          participantes,
          justificativa,
          planoCorrecao,
          estadoAnterior: periodo.estado,
          estadoNovo,
          decididoEm,
          hashLacreAnterior: encadearApos(cadeia),
        });

        return selarNaCadeia(
          { get, set },
          {
            periodo,
            sentido: "saida",
            tipoArtefato: "ata_comite",
            conteudo: ata,
            origemNome: `Ata do Comitê de Qualidade — ${periodo.competenciaRotulo}`,
            tamanhoBytes: tamanhoEmBytesDoConteudo(ata),
            autor,
          }
        );
      },

      selarDocumentoFiscal: async ({
        periodo,
        arquivo,
        numeroDocumento,
        emitidoEm,
        cadastro,
        autor,
      }: EntradaSelarDocumentoFiscal) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const documento = montarDocumentoFiscal({
          periodo,
          arquivo,
          numeroDocumento,
          emitidoEm,
          emitidoPorUsuarioId: autor.usuarioId,
          cadastro,
        });

        return selarNaCadeia(
          { get, set },
          {
            periodo,
            sentido: "saida",
            tipoArtefato: "documento_fiscal",
            conteudo: documento,
            origemNome: `Documento fiscal ${numeroDocumento} — ${periodo.competenciaRotulo}`,
            tamanhoBytes: tamanhoEmBytesDoConteudo(documento),
            autor,
          }
        );
      },

      selarTransmissao: async ({
        periodo,
        objeto,
        numeroProtocolo,
        canalBcb,
        cadastro,
        responsavel,
        transmitidoEm,
        autor,
      }: EntradaSelarTransmissao) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const cadeia = filtrarCadeia(Object.values(get().lacres), {
          instituicaoId: periodo.instituicaoId,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          insumoId: null,
        });

        const comprovante = montarComprovanteTransmissao({
          periodo,
          objeto,
          numeroProtocolo,
          canalBcb,
          cadastro,
          responsavel,
          transmitidoEm,
          transmitidoPorUsuarioId: autor.usuarioId,
          hashLacreAnterior: encadearApos(cadeia),
        });

        return selarNaCadeia(
          { get, set },
          {
            periodo,
            sentido: "saida",
            tipoArtefato: "comprovante_transmissao",
            conteudo: comprovante,
            origemNome: `Comprovante de transmissão ${numeroProtocolo} — ${periodo.competenciaRotulo}`,
            tamanhoBytes: tamanhoEmBytesDoConteudo(comprovante),
            autor,
          }
        );
      },

      selarProtocoloManual: async ({
        periodo,
        numeroProtocolo,
        dataInformada,
        canalBcb,
        emissor,
        justificativa,
        motivoIndisponibilidade,
        objeto,
        anexo,
        autor,
      }: EntradaSelarProtocoloManual) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const acessores: AcessoresEvidencias = { get, set };
        let anexoLacre: RegistroLacre | undefined;

        if (anexo) {
          const bytes = await anexo.arrayBuffer();
          const resultadoAnexo = await selarNaCadeia(acessores, {
            periodo,
            sentido: "entrada",
            tipoArtefato: "anexo_protocolo_manual",
            conteudo: bytes,
            origemNome: anexo.name,
            tamanhoBytes: anexo.size,
            autor,
          });
          if (!resultadoAnexo.sucesso || !resultadoAnexo.lacre) {
            return { sucesso: false, motivo: resultadoAnexo.motivo };
          }
          anexoLacre = resultadoAnexo.lacre;
        }

        const recibo = montarReciboProtocoloManual({
          periodo,
          numeroProtocolo,
          dataInformada,
          canalBcb,
          emissor,
          justificativa,
          motivoIndisponibilidade,
          objeto,
          anexoNome: anexo?.name ?? null,
          anexoTamanhoBytes: anexo?.size ?? null,
          anexoHash: anexoLacre?.hashSha256 ?? null,
          anexoLacreId: anexoLacre?.id ?? null,
          registradoEm: new Date().toISOString(),
          registradoPorUsuarioId: autor.usuarioId,
        });

        const resultadoRecibo = await selarNaCadeia(acessores, {
          periodo,
          sentido: "entrada",
          tipoArtefato: "recibo_protocolo_manual",
          conteudo: recibo,
          origemNome: `Recibo do protocolo manual ${numeroProtocolo} — ${periodo.competenciaRotulo}`,
          tamanhoBytes: tamanhoEmBytesDoConteudo(recibo),
          autor,
        });
        if (!resultadoRecibo.sucesso || !resultadoRecibo.lacre) {
          return { sucesso: false, motivo: resultadoRecibo.motivo, anexoLacre };
        }

        return { sucesso: true, anexoLacre, reciboLacre: resultadoRecibo.lacre };
      },

      selarEncaminhamento: async ({
        periodo,
        emissor,
        observacao,
        objeto,
        autor,
      }: EntradaSelarEncaminhamento) => {
        if (!criptografiaDisponivel()) {
          return { sucesso: false, motivo: MOTIVO_SEM_CRIPTOGRAFIA };
        }

        const recibo = montarReciboEncaminhamento({
          periodo,
          emissor,
          observacao,
          objeto,
          registradoEm: new Date().toISOString(),
          registradoPorUsuarioId: autor.usuarioId,
        });

        return selarNaCadeia(
          { get, set },
          {
            periodo,
            sentido: "entrada",
            tipoArtefato: "recibo_encaminhamento",
            conteudo: recibo,
            origemNome: `Recibo de encaminhamento ao emissor ${emissor} — ${periodo.competenciaRotulo}`,
            tamanhoBytes: tamanhoEmBytesDoConteudo(recibo),
            autor,
          }
        );
      },

      registrarVerificacao: (lacreId: string, confere: boolean, hashCalculado: string) => {
        set((estado) => ({
          verificacoes: [
            { lacreId, verificadoEm: new Date().toISOString(), confere, hashCalculado },
            ...estado.verificacoes,
          ],
        }));
      },

      reiniciarEvidencias: () => {
        set({ ...estadoInicial() });
      },
    }),
    {
      name: NOME_ARMAZENAMENTO_EVIDENCIAS,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (estado) => ({
        lacres: estado.lacres,
        fornecimentos: estado.fornecimentos,
        verificacoes: estado.verificacoes,
      }),
      merge: (persistido, atual) => {
        const parcial = (persistido ?? {}) as Partial<EvidenciasPersistidas>;
        return {
          ...atual,
          ...parcial,
          lacres: { ...atual.lacres, ...(parcial.lacres ?? {}) },
          fornecimentos: { ...atual.fornecimentos, ...(parcial.fornecimentos ?? {}) },
          verificacoes: parcial.verificacoes ?? atual.verificacoes,
        };
      },
      onRehydrateStorage: () => () => {
        useEvidenciasStore.setState({ hidratado: true });
      },
    }
  )
);

export function useHidratarEvidencias(): boolean {
  const hidratado = useEvidenciasStore((estado) => estado.hidratado);

  useEffect(() => {
    const armazenamento = useEvidenciasStore.persist;

    if (!armazenamento) {
      useEvidenciasStore.setState({ hidratado: true });
      return;
    }

    if (!armazenamento.hasHydrated()) {
      void armazenamento.rehydrate();
    }
  }, []);

  return hidratado;
}

export { chaveDaCadeiaDe };
