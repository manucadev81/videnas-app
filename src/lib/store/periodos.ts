"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AcaoId,
  ArquivoGerado,
  CanalEnvioBcb,
  DecisaoComiteQualidade,
  DesfechoComite,
  EstadoPeriodo,
  Excecao,
  EventoAuditoria,
  ModuloId,
  NegacaoAprovacao,
  PerfilId,
  PeriodoObrigacao,
  ProtocoloBCB,
  ResponsavelTransmissao,
  RetornoRegulador,
  SubstituicaoCiclo,
  TipoEventoAuditoria,
  ValidacaoItem,
  ValidacaoResultado,
} from "@/lib/tipos";
import {
  arquivos as arquivosMock,
  HOJE_ISO,
  periodos as periodosMock,
  protocolos as protocolosMock,
  validacoes as validacoesMock,
} from "@/lib/mock/periodos";
import { excecoes as excecoesMock } from "@/lib/mock/excecoes";
import { eventosAuditoria as eventosMock } from "@/lib/mock/auditoria";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { gerarRegistrosIngestao, type RegistrosPeriodo } from "@/lib/mock/previsualizacao";
import { gerarHashDeterministico } from "@/lib/mock/hash";
import { formatarTamanhoArquivo } from "@/lib/formatadores";
import {
  podeExecutar as avaliarAcao,
  type AvaliacaoAcao,
} from "@/lib/permissoes";
import {
  calcularRetencaoAte,
  configuracaoFluxo,
  type GatilhoNotificacaoArea,
  DESFECHOS_COMITE,
  retornoSomentePosicionamento,
  rotuloRetornoDoModulo,
} from "@/lib/mock/configuracao-fluxo";
import { areasDestinatarias, gatilhoNotifica, ROTULO_GATILHO_AREA } from "@/lib/areas-cliente";
import {
  MENSAGEM_SEM_VALIDADOR_ELEGIVEL,
  avaliarValidadorDesignado,
  nivelDoUsuario,
  sortearValidador,
  validadoresElegiveis,
} from "@/lib/validadores";
import { descricaoQuorumComite, impedimentosDoComite } from "@/lib/comite";
import {
  avaliarDisponibilidadeDoPeriodo,
  congelarContrato,
  validarEntradaEncaminhamento,
  validarEntradaProtocoloManual,
} from "@/lib/contrato";
import {
  cicloDoPeriodo,
  contarNegativas,
  contarNegativasTotal,
  devolucaoContadorContaComoNegacao,
  devolucaoContadorEscalaParaComite,
  limiarNegativas,
  montarHistoricoNegativas,
  negativasDoCiclo,
  proximaNegativaEscalaParaComite,
  rotuloCiclo,
  tipoRemessaDoPeriodo,
} from "@/lib/negacoes";

export interface AutorAcao {
  usuarioId: string;
  perfilId: PerfilId;
}

export interface ResultadoAcao {
  sucesso: boolean;
  motivo?: string;
  notificacoes?: string[];
}

export interface DadosRetornoRegulador {
  identificador?: string | null;
  dataInformada?: string | null;
  anexoNome?: string | null;
  anexoTamanhoBytes?: number | null;
  anexoHash?: string | null;
  anexoLacreId?: string | null;
  reciboLacreId?: string | null;
  reciboHash?: string | null;
}

export interface DadosArquivamento {
  lacreId: string;
  hashDossie: string;
  arquivadoEm: string;
}

export interface DadosEscalaComite {
  ocorridoEm: string;
  lacreId: string;
  hashDossie: string;
}

export interface DadosDecisaoComite {
  membroId: string;
  desfecho: DesfechoComite;
  justificativa: string;
  planoCorrecao?: string | null;
  decididoEm: string;
  lacreId?: string | null;
  hashAta?: string | null;
}

export interface DadosEmissaoFiscal {
  numeroDocumento: string;
  nomeArquivo: string;
  hashDocumento: string;
  lacreId: string;
  emitidoEm: string;
}

export interface DadosTransmissao {
  numeroProtocolo: string;
  cadastroId: string;
  responsavel: ResponsavelTransmissao;
  lacreId: string;
  hashComprovante: string;
  hashObjeto: string;
  transmitidoEm: string;
}

export interface DadosProtocoloManual {
  numeroProtocolo: string;
  dataInformada: string;
  canalBcb: CanalEnvioBcb | null;
  emissor: string | null;
  justificativa: string;
  anexoNome: string | null;
  anexoHash: string | null;
  anexoLacreId: string | null;
  reciboLacreId: string;
  reciboHash: string;
}

export interface DadosEncaminhamento {
  emissor: string;
  observacao: string | null;
  reciboLacreId: string;
  reciboHash: string;
}

export interface DadosSubstituicao {
  lacreAnteriorId: string | null;
  hashLacreAnterior: string | null;
}

export const TAMANHO_MINIMO_TEXTO_COMITE = 10;
export const TAMANHO_MINIMO_JUSTIFICATIVA_SUBSTITUICAO = 10;

export const CODIGO_RETORNO_NAO_APROVADO = "RETORNO_NAO_APROVADO";
export const DESCRICAO_RETORNO_NAO_APROVADO =
  "O regulador/emissor informou que o documento não foi aprovado.";

export function validarEntradaRetorno(
  situacao: "aceito" | "aceito_com_ressalvas" | "rejeitado",
  codigoRetorno: string,
  mensagemRetorno: string,
  somentePosicionamento = false
): ResultadoAcao {
  if (somentePosicionamento) {
    return situacao === "aceito_com_ressalvas"
      ? { sucesso: false, motivo: "Este módulo registra apenas se o retorno foi aprovado ou não." }
      : { sucesso: true };
  }
  if (!codigoRetorno.trim()) {
    return { sucesso: false, motivo: "Informe o código de retorno recebido." };
  }
  if (!mensagemRetorno.trim()) {
    return { sucesso: false, motivo: "Descreva a mensagem de retorno recebida." };
  }
  if (situacao === "aceito_com_ressalvas" && mensagemRetorno.trim().length < 10) {
    return { sucesso: false, motivo: "Descreva a ressalva recebida com pelo menos 10 caracteres." };
  }
  return { sucesso: true };
}

function camposRemessaDoProtocolo(periodo: PeriodoObrigacao): Pick<
  ProtocoloBCB,
  "cicloEnvio" | "tipoRemessa" | "protocoloSubstituido"
> {
  const tipoRemessa = tipoRemessaDoPeriodo(periodo);
  return {
    cicloEnvio: cicloDoPeriodo(periodo),
    tipoRemessa,
    protocoloSubstituido:
      tipoRemessa === "S" ? (periodo.substituicoes?.at(-1)?.protocoloSubstituido ?? null) : null,
  };
}

function paraRecord<T>(lista: T[], chave: (item: T) => string): Record<string, T> {
  const registro: Record<string, T> = {};
  for (const item of lista) {
    registro[chave(item)] = item;
  }
  return registro;
}

function estadoInicial() {
  return {
    periodos: paraRecord(periodosMock, (periodo) => periodo.id),
    arquivos: paraRecord(arquivosMock, (arquivo) => arquivo.id),
    validacoes: paraRecord(validacoesMock, (validacao) => validacao.id),
    protocolos: paraRecord(protocolosMock, (protocolo) => protocolo.id),
    excecoes: paraRecord(excecoesMock, (excecao) => excecao.id),
    eventos: [...eventosMock],
    registros: {} as Record<string, RegistrosPeriodo>,
  };
}

let contadorEventoRuntime = 0;
let contadorExcecaoRuntime = 0;

const PREFIXO_SESSAO_RUNTIME = Date.now().toString(36);

function novoEventoId(): string {
  contadorEventoRuntime += 1;
  return `evt-rt-${PREFIXO_SESSAO_RUNTIME}-${contadorEventoRuntime.toString(16).padStart(6, "0")}`;
}

function novoIdExcecao(): string {
  contadorExcecaoRuntime += 1;
  return `exc-rt-${PREFIXO_SESSAO_RUNTIME}-${contadorExcecaoRuntime.toString(16).padStart(4, "0")}`;
}

interface EscopoEvento {
  instituicaoId: string;
  periodoId: string | null;
  moduloId: ModuloId | null;
  competencia: string | null;
}

function construirEventoBase(
  autor: AutorAcao,
  escopo: EscopoEvento,
  tipo: TipoEventoAuditoria,
  rotuloTipo: string,
  referencia: string | null,
  payload: Record<string, unknown>
): EventoAuditoria {
  const usuario = buscarUsuario(autor.usuarioId);
  const lado = usuario?.lado ?? "videnas";
  return {
    id: novoEventoId(),
    ocorridoEm: new Date().toISOString(),
    instituicaoId: escopo.instituicaoId,
    periodoId: escopo.periodoId,
    moduloId: escopo.moduloId,
    competencia: escopo.competencia,
    tipo,
    rotuloTipo,
    usuarioId: autor.usuarioId,
    usuarioNome: usuario?.nome ?? "Usuário da demonstração",
    perfilId: autor.perfilId,
    lado,
    referencia,
    payload,
    ip: lado === "videnas" ? "10.20.4.18" : "201.17.88.203",
    userAgent: lado === "videnas" ? "Chrome 141 · Ubuntu 24.04" : "Chrome 141 · macOS 26",
  };
}

function construirEvento(
  autor: AutorAcao,
  periodo: PeriodoObrigacao,
  tipo: TipoEventoAuditoria,
  rotuloTipo: string,
  referencia: string | null,
  payload: Record<string, unknown>
): EventoAuditoria {
  const tipoRemessa = tipoRemessaDoPeriodo(periodo);
  const protocoloSubstituido = periodo.substituicoes?.at(-1)?.protocoloSubstituido ?? null;
  return construirEventoBase(
    autor,
    {
      instituicaoId: periodo.instituicaoId,
      periodoId: periodo.id,
      moduloId: periodo.moduloId,
      competencia: periodo.competencia,
    },
    tipo,
    rotuloTipo,
    referencia,
    {
      cicloEnvio: cicloDoPeriodo(periodo),
      tipoRemessa,
      ...(tipoRemessa === "S" ? { protocoloSubstituido } : {}),
      ...payload,
    }
  );
}

function construirNotificacoesDeAreas(
  autor: AutorAcao,
  periodo: PeriodoObrigacao,
  gatilho: GatilhoNotificacaoArea
): { eventos: EventoAuditoria[]; destinatarios: string[] } {
  if (!gatilhoNotifica(gatilho)) {
    return { eventos: [], destinatarios: [] };
  }
  const areas = areasDestinatarias(buscarInstituicao(periodo.instituicaoId), periodo.moduloId);
  const eventos = areas.map((area) =>
    construirEvento(autor, periodo, "AREA_CLIENTE_NOTIFICADA", "Área do cliente notificada", area.id, {
      areaId: area.id,
      tipoArea: area.tipo,
      areaNome: area.nome,
      responsavelNome: area.responsavelNome,
      email: area.email,
      gatilho,
      motivo: `Notificação por ${ROTULO_GATILHO_AREA[gatilho]}`,
      periodoId: periodo.id,
      moduloId: periodo.moduloId,
      competencia: periodo.competencia,
      simulado: true,
    })
  );
  return { eventos, destinatarios: areas.map((area) => `${area.nome} <${area.email}>`) };
}

function designarValidadorPorSorteio(
  autor: AutorAcao,
  periodo: PeriodoObrigacao,
  arquivo: ArquivoGerado | undefined,
  agora: string
): { periodo: PeriodoObrigacao; evento: EventoAuditoria } | null {
  const elegiveis = validadoresElegiveis(periodo);
  const sorteado = sortearValidador(elegiveis);
  if (!sorteado) {
    return null;
  }
  const periodoDesignado: PeriodoObrigacao = {
    ...periodo,
    validadorDesignadoId: sorteado.id,
    designadoEm: agora,
    criterioDesignacao: "sorteio",
    liberadoPorUsuarioId: null,
    liberadoEm: null,
  };
  const evento = construirEvento(
    autor,
    periodoDesignado,
    "VALIDADOR_SORTEADO",
    "Validador sorteado",
    sorteado.id,
    {
      criterio: "sorteio",
      elegiveis: elegiveis.map((usuario) => ({
        usuarioId: usuario.id,
        nome: usuario.nome,
        nivel: usuario.nivelValidador ?? null,
      })),
      sorteadoUsuarioId: sorteado.id,
      sorteadoNome: sorteado.nome,
      sorteadoNivel: sorteado.nivelValidador ?? null,
      geradoPorUsuarioId: periodo.geradoPorUsuarioId,
      arquivoId: arquivo?.id ?? null,
      hashSha256: arquivo?.hashSha256 ?? null,
    }
  );
  return { periodo: periodoDesignado, evento };
}

export interface ResultadoAberturaCompetencias {
  sucesso: boolean;
  motivo?: string;
  periodosCriados: string[];
}

const MESES_COMPETENCIA = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function rotuloCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  const nomeMes = MESES_COMPETENCIA[(Number(mes) || 1) - 1] ?? mes;
  return `${nomeMes}/${ano}`;
}

const TOTAIS_INICIAIS: Record<ModuloId, Record<string, number>> = {
  acam212: { operacoes: 0 },
  cadoc5711: { datasBaseRecebidas: 0, datasBaseEsperadas: 16, clientesDistintos: 0, ativos: 0 },
  cadoc5710: { carteiras: 0, ativos: 0, carteirasComStaking: 0 },
  fiscal: { dps: 0, valorServicos: 0, valorIss: 0, valorRetido: 0 },
};

function prazoDaCompetencia(competencia: string, diaPrazo: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const mesSeguinte = mes === 12 ? 1 : mes + 1;
  const anoPrazo = mes === 12 ? ano + 1 : ano;
  return `${anoPrazo}-${mesSeguinte.toString().padStart(2, "0")}-${diaPrazo
    .toString()
    .padStart(2, "0")}`;
}

export interface EntradaEventoAdministrativo {
  autor: AutorAcao;
  instituicaoId: string;
  tipo: TipoEventoAuditoria;
  rotuloTipo: string;
  referencia: string | null;
  payload: Record<string, unknown>;
}

export interface EstadoPeriodosStore {
  hidratado: boolean;
  periodos: Record<string, PeriodoObrigacao>;
  arquivos: Record<string, ArquivoGerado>;
  validacoes: Record<string, ValidacaoResultado>;
  protocolos: Record<string, ProtocoloBCB>;
  excecoes: Record<string, Excecao>;
  eventos: EventoAuditoria[];
  registros: Record<string, RegistrosPeriodo>;

  ingerirDados: (
    periodoId: string,
    autor: AutorAcao,
    lote: {
      nomeArquivo: string;
      tamanhoBytes: number;
      linhasRecebidas: number;
      linhasResolvidas: number;
      linhasComPendencia: number;
      canal?: "upload" | "sftp" | "api";
    }
  ) => ResultadoAcao;

  gerarArquivo: (periodoId: string, autor: AutorAcao) => ResultadoAcao;

  enviarParaValidacao: (periodoId: string, autor: AutorAcao) => ResultadoAcao;

  enviarAoContador: (periodoId: string, autor: AutorAcao) => ResultadoAcao;

  validarContador: (
    periodoId: string,
    autor: AutorAcao,
    decisao: "confirmado" | "devolvido",
    observacao?: string
  ) => ResultadoAcao;

  reprocessar: (
    periodoId: string,
    autor: AutorAcao,
    resultado?: { totalAvisos?: number; itens?: ValidacaoItem[] }
  ) => ResultadoAcao;

  liberar: (periodoId: string, autor: AutorAcao) => ResultadoAcao;

  aprovar: (periodoId: string, autor: AutorAcao, textoCiencia: string) => ResultadoAcao;

  negarAprovacao: (
    periodoId: string,
    autor: AutorAcao,
    motivo: string,
    dados?: DadosEscalaComite
  ) => ResultadoAcao;

  validarDecisaoComite: (
    periodoId: string,
    autor: AutorAcao,
    dados: Omit<DadosDecisaoComite, "decididoEm" | "lacreId" | "hashAta">
  ) => ResultadoAcao;

  decidirComite: (periodoId: string, autor: AutorAcao, dados: DadosDecisaoComite) => ResultadoAcao;

  emitirFiscal: (periodoId: string, autor: AutorAcao, dados: DadosEmissaoFiscal) => ResultadoAcao;

  transmitir: (periodoId: string, autor: AutorAcao, dados: DadosTransmissao) => ResultadoAcao;

  registrarProtocoloManual: (
    periodoId: string,
    autor: AutorAcao,
    dados: DadosProtocoloManual
  ) => ResultadoAcao;

  marcarEncaminhado: (periodoId: string, autor: AutorAcao, dados: DadosEncaminhamento) => ResultadoAcao;

  registrarRetorno: (
    periodoId: string,
    autor: AutorAcao,
    situacao: "aceito" | "aceito_com_ressalvas" | "rejeitado",
    codigoRetorno: string,
    mensagemRetorno: string,
    dados?: DadosRetornoRegulador
  ) => ResultadoAcao;

  arquivar: (periodoId: string, autor: AutorAcao, dados: DadosArquivamento) => ResultadoAcao;

  reabrir: (periodoId: string, autor: AutorAcao, motivo: string) => ResultadoAcao;

  iniciarSubstituicao: (
    periodoId: string,
    autor: AutorAcao,
    justificativa: string,
    dados?: DadosSubstituicao
  ) => ResultadoAcao;

  tratarExcecao: (
    periodoId: string,
    autor: AutorAcao,
    excecaoId: string,
    acao: "tratada" | "aceita_com_justificativa",
    justificativa: string
  ) => ResultadoAcao;

  notificarCliente: (
    periodoId: string,
    autor: AutorAcao,
    quantidadePendencias: number
  ) => ResultadoAcao;

  registrarEventoAdministrativo: (entrada: EntradaEventoAdministrativo) => void;

  abrirCompetenciasIniciais: (
    instituicaoId: string,
    modulos: ModuloId[],
    autor: AutorAcao
  ) => ResultadoAberturaCompetencias;

  excecoesBloqueantesAbertas: (periodoId: string) => number;

  podeExecutar: (
    perfil: PerfilId,
    acaoId: AcaoId,
    periodoId: string,
    usuarioAtualId?: string
  ) => AvaliacaoAcao;

  reiniciarMock: () => void;
}

type PeriodosPersistidos = Pick<
  EstadoPeriodosStore,
  "periodos" | "arquivos" | "validacoes" | "protocolos" | "excecoes" | "eventos" | "registros"
>;

export const NOME_ARMAZENAMENTO_PERIODOS = "videnas-periodos";
const VERSAO_ARMAZENAMENTO_PERIODOS = 14;

export const usePeriodosStore = create<EstadoPeriodosStore>()(
  persist<EstadoPeriodosStore, [], [], PeriodosPersistidos>(
    (set, get) => ({
      hidratado: false,
      ...estadoInicial(),

  ingerirDados: (periodoId, autor, lote) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (periodo.estado === "arquivado") {
      return { sucesso: false, motivo: "Período arquivado: somente leitura." };
    }

    const complementar = periodo.lotes.length > 0;
    const novoLote = {
      id: `lote-${periodoId.slice(4)}-${(periodo.lotes.length + 1).toString().padStart(2, "0")}`,
      nomeArquivo: lote.nomeArquivo,
      tamanhoBytes: lote.tamanhoBytes,
      recebidoEm: new Date().toISOString(),
      recebidoPorUsuarioId: autor.usuarioId,
      canal: lote.canal ?? ("upload" as const),
      linhasRecebidas: lote.linhasRecebidas,
      linhasResolvidas: lote.linhasResolvidas,
      linhasComPendencia: lote.linhasComPendencia,
      situacao: "processado" as const,
    };

    const periodoComLote: PeriodoObrigacao = {
      ...periodo,
      estado: periodo.estado === "aguardando_dados" ? "dados_ingeridos" : periodo.estado,
      lotes: [...periodo.lotes, novoLote],
    };

    const simulacao = gerarRegistrosIngestao(periodoComLote);

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodoComLote,
      totaisResumo: simulacao.totaisResumo,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      complementar ? "INGESTAO_COMPLEMENTAR" : "INGESTAO_CONCLUIDA",
      complementar ? "Ingestão complementar" : "Ingestão concluída",
      novoLote.id,
      {
        loteId: novoLote.id,
        arquivoOrigem: novoLote.nomeArquivo,
        linhasRecebidas: novoLote.linhasRecebidas,
        linhasResolvidas: novoLote.linhasResolvidas,
        linhasComPendencia: novoLote.linhasComPendencia,
      }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      registros: simulacao.registros
        ? { ...estado.registros, [periodoId]: simulacao.registros }
        : estado.registros,
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  gerarArquivo: (periodoId, autor) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (periodo.lotes.length === 0) {
      return { sucesso: false, motivo: "Nenhum lote de dados foi recebido para esta competência." };
    }

    const modulo = buscarModulo(periodo.moduloId);
    const instituicao = buscarInstituicao(periodo.instituicaoId);
    const cnpjSemMascara = (instituicao?.cnpj ?? "").replace(/\D/g, "");
    const versao = periodo.arquivoIds.length + 1;
    const competenciaCompacta = periodo.competencia.replace("-", "");
    const quantidadeRegistros = periodo.lotes.reduce((total, lote) => total + lote.linhasResolvidas, 0);
    const tamanhoBytes = quantidadeRegistros * 2100 + 48000;
    const arquivoId = `arq-${periodoId.slice(4)}-v${versao}`;

    const arquivo: ArquivoGerado = {
      id: arquivoId,
      periodoId,
      versao,
      nomeArquivo: `${modulo.schema}_${cnpjSemMascara}_${competenciaCompacta}_v${versao}.xml`,
      formato: "xml",
      hashSha256: gerarHashDeterministico(`${arquivoId}-${Date.now()}`),
      algoritmoHash: "SHA-256",
      tamanhoBytes,
      tamanhoLegivel: formatarTamanhoArquivo(tamanhoBytes),
      schema: modulo.schema,
      versaoSchema: modulo.versaoSchema,
      quantidadeRegistros,
      geradoEm: new Date().toISOString(),
      geradoPorUsuarioId: autor.usuarioId,
      situacao: "corrente",
      previewConteudo: `<${modulo.schema} versao="${modulo.versaoSchema}">\n  <Cabecalho competencia="${periodo.competencia}" registros="${quantidadeRegistros}" />\n</${modulo.schema}>`,
      urlDownload: "#mock-download",
    };

    const arquivoAnteriorId = periodo.arquivoCorrenteId;
    const estadoAnterior = periodo.estado;
    const ultimaNegacao =
      estadoAnterior === "devolvido_diretor" && periodo.negacoesAprovacao.length > 0
        ? periodo.negacoesAprovacao[periodo.negacoesAprovacao.length - 1]
        : null;

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "gerado",
      arquivoCorrenteId: arquivoId,
      arquivoIds: [...periodo.arquivoIds, arquivoId],
      geradoPorUsuarioId: autor.usuarioId,
      geradoEm: arquivo.geradoEm,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      versao > 1 ? "ARQUIVO_REGERADO" : "ARQUIVO_GERADO",
      versao > 1 ? "Arquivo regerado" : "Arquivo gerado",
      arquivo.hashSha256,
      versao > 1
        ? {
            arquivoIdAnterior: arquivoAnteriorId,
            arquivoIdNovo: arquivoId,
            hashNovo: arquivo.hashSha256,
            estadoAnterior,
            estadoNovo: "gerado",
            ...(ultimaNegacao
              ? {
                  negacaoReferenciada: {
                    motivo: ultimaNegacao.motivo,
                    ocorridoEm: ultimaNegacao.ocorridoEm,
                    indice: periodo.negacoesAprovacao.length - 1,
                  },
                }
              : {}),
          }
        : {
            arquivoId,
            nomeArquivo: arquivo.nomeArquivo,
            hashSha256: arquivo.hashSha256,
            tamanhoBytes,
            schema: modulo.schema,
            versaoSchema: modulo.versaoSchema,
            registros: quantidadeRegistros,
            estadoAnterior,
            estadoNovo: "gerado",
          }
    );

    set((estado) => {
      const arquivosAtualizados = { ...estado.arquivos, [arquivoId]: arquivo };
      if (arquivoAnteriorId && arquivosAtualizados[arquivoAnteriorId]) {
        arquivosAtualizados[arquivoAnteriorId] = {
          ...arquivosAtualizados[arquivoAnteriorId],
          situacao: "substituida",
        };
      }
      return {
        periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
        arquivos: arquivosAtualizados,
        eventos: [...estado.eventos, evento],
      };
    });

    return { sucesso: true };
  },

  enviarParaValidacao: (periodoId, autor) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const arquivo = get().arquivos[periodo.arquivoCorrenteId ?? ""];

    const designacao = designarValidadorPorSorteio(autor, periodo, arquivo, new Date().toISOString());
    if (!designacao) {
      return { sucesso: false, motivo: MENSAGEM_SEM_VALIDADOR_ELEGIVEL };
    }
    const periodoAtualizado: PeriodoObrigacao = { ...designacao.periodo, estado: "em_validacao" };
    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "ENVIADO_PARA_VALIDACAO",
      "Enviado para validação",
      arquivo?.hashSha256 ?? null,
      { arquivoId: arquivo?.id ?? null, hashSha256: arquivo?.hashSha256 ?? null }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento, designacao.evento],
    }));

    return { sucesso: true };
  },

  enviarAoContador: (periodoId, autor) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "aguardando_contador",
      contadorStatus: "pendente",
    };
    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "DPS_ENVIADA_AO_CONTADOR",
      "DPS enviada ao contador",
      null,
      { quantidadeDps: periodo.totaisResumo.dps ?? null, valorTotalServicos: periodo.totaisResumo.valorServicos ?? null }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  validarContador: (periodoId, autor, decisao, observacao) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (periodo.estado !== "aguardando_contador") {
      return { sucesso: false, motivo: "A DPS ainda não foi estruturada e enviada para sua análise." };
    }
    if (decisao === "devolvido" && (!observacao || observacao.trim().length < 20)) {
      return { sucesso: false, motivo: "Descreva o motivo da devolução com pelo menos 20 caracteres." };
    }

    const agora = new Date().toISOString();
    const contaComoNegacao = decisao === "devolvido" && devolucaoContadorContaComoNegacao();
    const escalaParaComite = contaComoNegacao && devolucaoContadorEscalaParaComite(periodo);
    const numeroNegativa = contarNegativas(periodo) + 1;
    const arquivoCorrente = get().arquivos[periodo.arquivoCorrenteId ?? ""];
    const estadoNovo: EstadoPeriodo =
      decisao === "confirmado" ? "em_validacao" : escalaParaComite ? "em_comite_qualidade" : "gerado";
    const designacao =
      decisao === "confirmado" ? designarValidadorPorSorteio(autor, periodo, arquivoCorrente, agora) : null;
    if (decisao === "confirmado" && !designacao) {
      return { sucesso: false, motivo: MENSAGEM_SEM_VALIDADOR_ELEGIVEL };
    }
    const periodoAtualizado: PeriodoObrigacao = {
      ...(designacao?.periodo ?? periodo),
      estado: estadoNovo,
      contadorStatus: decisao === "confirmado" ? "confirmado" : "devolvido",
      contadorConfirmadoEm: decisao === "confirmado" ? agora : periodo.contadorConfirmadoEm,
      negacoesAprovacao: contaComoNegacao
        ? [
            ...periodo.negacoesAprovacao,
            {
              origem: "contador",
              cicloEnvio: cicloDoPeriodo(periodo),
              motivo: observacao ?? "",
              usuarioId: autor.usuarioId,
              ocorridoEm: agora,
              arquivoId: arquivoCorrente?.id ?? null,
            },
          ]
        : periodo.negacoesAprovacao,
      emComiteDesde: escalaParaComite ? agora : periodo.emComiteDesde,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      decisao === "confirmado" ? "ENQUADRAMENTO_FISCAL_CONFIRMADO" : "DPS_DEVOLVIDA_PELO_CONTADOR",
      decisao === "confirmado" ? "Enquadramento fiscal confirmado" : "DPS devolvida pelo contador",
      null,
      decisao === "confirmado"
        ? { usuarioId: autor.usuarioId, observacao: observacao ?? null }
        : {
            motivo: observacao,
            contaComoNegacao,
            numeroNegativa: contaComoNegacao ? numeroNegativa : null,
            limiarComite: contaComoNegacao ? limiarNegativas() : null,
            escalouParaComite: escalaParaComite,
            estadoAnterior: "aguardando_contador",
            estadoNovo,
          }
    );

    const eventoComite = escalaParaComite
      ? construirEvento(
          autor,
          periodoAtualizado,
          "COMITE_QUALIDADE_ACIONADO",
          "Comitê de Qualidade acionado",
          arquivoCorrente?.hashSha256 ?? null,
          {
            origem: "contador",
            numeroNegativa,
            limiarComite: limiarNegativas(),
            historicoNegativas: montarHistoricoNegativas(
              negativasDoCiclo(periodoAtualizado),
              (arquivoId) => get().arquivos[arquivoId]
            ),
            lacreDossieId: null,
            hashDossie: null,
            estadoAnterior: "aguardando_contador",
            estadoNovo,
          }
        )
      : null;

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [
        ...estado.eventos,
        evento,
        ...(designacao ? [designacao.evento] : []),
        ...(eventoComite ? [eventoComite] : []),
      ],
    }));

    return { sucesso: true };
  },

  reprocessar: (periodoId, autor, resultado) => {
    const estadoAtual = get();
    const periodo = estadoAtual.periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (!["em_validacao", "com_excecoes"].includes(periodo.estado)) {
      return { sucesso: false, motivo: "Ação indisponível no estado atual do período." };
    }
    const avaliacaoDesignado = avaliarValidadorDesignado(periodo, autor.usuarioId);
    if (!avaliacaoDesignado.permitido) {
      return { sucesso: false, motivo: avaliacaoDesignado.motivo ?? "Ação indisponível no estado atual do período." };
    }
    if (periodo.estado === "com_excecoes" && get().excecoesBloqueantesAbertas(periodoId) > 0) {
      return {
        sucesso: false,
        motivo: `Existem ${get().excecoesBloqueantesAbertas(periodoId)} exceções bloqueantes pendentes de tratamento.`,
      };
    }

    const arquivo = estadoAtual.arquivos[periodo.arquivoCorrenteId ?? ""];
    const modulo = buscarModulo(periodo.moduloId);
    const itens = resultado?.itens ?? [];
    const totalErros = itens.filter((item) => item.severidade === "bloqueante").length;
    const totalAvisos = resultado?.totalAvisos ?? itens.filter((item) => item.severidade === "aviso").length;
    const validacaoId = `val-rt-${periodoId.slice(4)}-${Date.now()}`;

    const validacao: ValidacaoResultado = {
      id: validacaoId,
      periodoId,
      arquivoId: arquivo?.id ?? "",
      schema: modulo.schema,
      versaoSchema: modulo.versaoSchema,
      executadaEm: new Date().toISOString(),
      executadaPorUsuarioId: autor.usuarioId,
      duracaoMs: 900 + (arquivo?.quantidadeRegistros ?? 0),
      totalErros,
      totalAvisos,
      resultado: totalErros > 0 ? "reprovado" : "aprovado",
      itens,
      regrasDeterministicas: [{ regra: "Aderência ao schema oficial", aprovada: totalErros === 0 }],
    };

    const novasExcecoes: Excecao[] = itens
      .filter((item) => item.severidade === "bloqueante")
      .map((item) => ({
        id: novoIdExcecao(),
        periodoId,
        instituicaoId: periodo.instituicaoId,
        moduloId: periodo.moduloId,
        origem: "validacao",
        codigo: item.codigo,
        severidade: "bloqueante",
        titulo: item.mensagem.slice(0, 80),
        descricao: item.mensagem,
        abertaEm: new Date().toISOString(),
        abertaPorUsuarioId: autor.usuarioId,
        responsavelAtualPerfil: "executor",
        status: "aberta",
        justificativa: null,
        tratadaPorUsuarioId: null,
        tratadaEm: null,
        registroRefId: item.registroRefId,
      }));

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: totalErros > 0 ? "com_excecoes" : "validado",
      validacaoId,
      excecaoIds: [...periodo.excecaoIds, ...novasExcecoes.map((excecao) => excecao.id)],
    };

    const eventosNovos: EventoAuditoria[] = [];
    if (periodo.estado === "com_excecoes") {
      eventosNovos.push(
        construirEvento(autor, periodoAtualizado, "REPROCESSAMENTO_SOLICITADO", "Reprocessamento solicitado", null, {
          excecoesTratadas: periodo.excecaoIds,
        })
      );
    }
    eventosNovos.push(
      construirEvento(
        autor,
        periodoAtualizado,
        totalErros > 0 ? "VALIDACAO_COM_EXCECOES" : "VALIDACAO_CONCLUIDA",
        totalErros > 0 ? "Validação com exceções" : "Validação concluída",
        arquivo?.id ?? null,
        { arquivoId: arquivo?.id ?? null, schema: modulo.schema, erros: totalErros, avisos: totalAvisos, duracaoMs: validacao.duracaoMs }
      )
    );
    for (const excecao of novasExcecoes) {
      eventosNovos.push(
        construirEvento(autor, periodoAtualizado, "EXCECAO_ABERTA", "Exceção aberta", excecao.codigo, {
          codigo: excecao.codigo,
          severidade: excecao.severidade,
          titulo: excecao.titulo,
        })
      );
    }

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      validacoes: { ...estado.validacoes, [validacaoId]: validacao },
      excecoes: {
        ...estado.excecoes,
        ...paraRecord(novasExcecoes, (excecao) => excecao.id),
      },
      eventos: [...estado.eventos, ...eventosNovos],
    }));

    return { sucesso: true };
  },

  liberar: (periodoId, autor) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (periodo.estado !== "validado") {
      return { sucesso: false, motivo: "Ação indisponível no estado atual do período." };
    }
    if (autor.usuarioId === periodo.geradoPorUsuarioId) {
      return {
        sucesso: false,
        motivo: "Quem gerou o arquivo não pode liberá-lo. Segregação de funções obrigatória.",
      };
    }

    const avaliacaoValidador = avaliarAcao(autor.perfilId, "liberar", periodo, {
      usuarioAtualId: autor.usuarioId,
    });
    if (!avaliacaoValidador.permitido) {
      return {
        sucesso: false,
        motivo: avaliacaoValidador.motivo ?? "Ação indisponível no estado atual do período.",
      };
    }

    const arquivo = get().arquivos[periodo.arquivoCorrenteId ?? ""];
    const agora = new Date().toISOString();
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "liberado",
      liberadoPorUsuarioId: autor.usuarioId,
      liberadoEm: agora,
    };

    const evento = construirEvento(autor, periodoAtualizado, "PERIODO_LIBERADO", "Período liberado", arquivo?.hashSha256 ?? null, {
      usuarioValidador: autor.usuarioId,
      usuarioExecutor: periodo.geradoPorUsuarioId,
      arquivoId: arquivo?.id ?? null,
      hashSha256: arquivo?.hashSha256 ?? null,
      segregacaoOk: true,
      nivelValidador: nivelDoUsuario(autor.usuarioId),
      validadorDesignadoId: periodo.validadorDesignadoId ?? null,
      criterioDesignacao: periodo.criterioDesignacao ?? null,
    });

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  aprovar: (periodoId, autor, textoCiencia) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (periodo.estado !== "liberado") {
      return { sucesso: false, motivo: "Disponível após a liberação pelo Validador Videnas." };
    }
    const arquivo = get().arquivos[periodo.arquivoCorrenteId ?? ""];
    const agora = new Date().toISOString();
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "aprovado",
      aprovadoPorUsuarioId: autor.usuarioId,
      aprovadoEm: agora,
      contratoCongelado: congelarContrato(buscarInstituicao(periodo.instituicaoId), periodo.moduloId, agora),
    };

    const evento = construirEvento(autor, periodoAtualizado, "PERIODO_APROVADO", "Período aprovado", arquivo?.hashSha256 ?? null, {
      usuarioDiretor: autor.usuarioId,
      textoCiencia,
      hashSha256: arquivo?.hashSha256 ?? null,
      moduloId: periodo.moduloId,
      arquivoVersao: arquivo?.versao ?? null,
      estadoAnterior: "liberado",
      estadoNovo: "aprovado",
      contratoCongelado: periodoAtualizado.contratoCongelado,
    });
    const notificacoes = construirNotificacoesDeAreas(autor, periodoAtualizado, "aprovacao");

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento, ...notificacoes.eventos],
    }));

    return { sucesso: true, notificacoes: notificacoes.destinatarios };
  },

  emitirFiscal: (periodoId, autor, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const avaliacao = avaliarAcao(autor.perfilId, "emitir_fiscal", periodo, {
      usuarioAtualId: autor.usuarioId,
    });
    if (!avaliacao.permitido) {
      return { sucesso: false, motivo: avaliacao.motivo ?? "Ação indisponível no estado atual do período." };
    }

    const arquivo = get().arquivos[periodo.arquivoCorrenteId ?? ""];
    const disponibilidade = avaliarDisponibilidadeDoPeriodo(
      periodo,
      buscarInstituicao(periodo.instituicaoId)
    );
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "emitido_fiscal",
      emitidoFiscalEm: dados.emitidoEm,
      documentoFiscal: {
        numero: dados.numeroDocumento,
        nomeArquivo: dados.nomeArquivo,
        hashSha256: dados.hashDocumento,
        lacreId: dados.lacreId,
        emitidoPorUsuarioId: autor.usuarioId,
        emitidoEm: dados.emitidoEm,
      },
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "DOCUMENTO_FISCAL_EMITIDO",
      "Documento fiscal emitido",
      dados.numeroDocumento,
      {
        numeroDocumento: dados.numeroDocumento,
        nomeDocumento: dados.nomeArquivo,
        lacreDocumentoId: dados.lacreId,
        hashDocumento: dados.hashDocumento,
        hashSha256: dados.hashDocumento,
        hashArquivoDps: arquivo?.hashSha256 ?? null,
        arquivoId: arquivo?.id ?? null,
        cadastroId: disponibilidade.cadastro?.id ?? null,
        estadoAnterior: "aprovado",
        estadoNovo: "emitido_fiscal",
      }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  transmitir: (periodoId, autor, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const avaliacao = avaliarAcao(autor.perfilId, "transmitir", periodo, {
      usuarioAtualId: autor.usuarioId,
    });
    if (!avaliacao.permitido) {
      return { sucesso: false, motivo: avaliacao.motivo ?? "Ação indisponível no estado atual do período." };
    }

    const disponibilidade = avaliarDisponibilidadeDoPeriodo(
      periodo,
      buscarInstituicao(periodo.instituicaoId)
    );
    if (
      !disponibilidade.disponivel ||
      !disponibilidade.cadastro ||
      disponibilidade.cadastro.id !== dados.cadastroId ||
      disponibilidade.responsavel !== dados.responsavel
    ) {
      return {
        sucesso: false,
        motivo: disponibilidade.motivo ?? "O contrato ou o cadastro prévio mudou. Reabra o diálogo e tente de novo.",
      };
    }
    if (dados.numeroProtocolo.trim().length < 6) {
      return { sucesso: false, motivo: "Protocolo de transmissão inválido." };
    }

    const protocoloId = `prot-rt-${periodoId.slice(4)}-${Date.now()}`;
    const canal: CanalEnvioBcb = disponibilidade.cadastro.canal ?? "outro";
    const protocolo: ProtocoloBCB = {
      id: protocoloId,
      periodoId,
      numeroProtocolo: dados.numeroProtocolo,
      dataHoraEnvio: dados.transmitidoEm,
      canalEnvio: canal,
      registradoPorUsuarioId: autor.usuarioId,
      reciboHash: dados.hashComprovante,
      situacaoRetorno: "aguardando",
      codigoRetorno: null,
      mensagemRetorno: null,
      dataRetorno: null,
      observacao: null,
      origem: dados.responsavel === "diretor" ? "transmissao_diretor" : "transmissao_videnas",
      cadastroId: disponibilidade.cadastro.id,
      emissor: disponibilidade.cadastro.emissor,
      comprovanteLacreId: dados.lacreId,
      comprovanteHash: dados.hashComprovante,
      ...camposRemessaDoProtocolo(periodo),
    };

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "aguardando_retorno",
      protocoloId,
      entregueEm: dados.transmitidoEm,
      transmitidoEm: dados.transmitidoEm,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "TRANSMISSAO_REALIZADA",
      "Transmissão realizada",
      protocolo.numeroProtocolo,
      {
        protocolo: protocolo.numeroProtocolo,
        canal: canal,
        emissor: disponibilidade.cadastro.emissor,
        cadastroId: disponibilidade.cadastro.id,
        cadastroIdentificador: disponibilidade.cadastro.identificador,
        responsavelTransmissao: dados.responsavel,
        lacreComprovanteId: dados.lacreId,
        hashComprovante: dados.hashComprovante,
        hashSha256: dados.hashObjeto,
        transmitidoEm: dados.transmitidoEm,
        estadoAnterior: periodo.estado,
        estadoNovo: "aguardando_retorno",
      }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      protocolos: { ...estado.protocolos, [protocoloId]: protocolo },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  registrarProtocoloManual: (periodoId, autor, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const avaliacao = avaliarAcao(autor.perfilId, "registrar_protocolo_manual", periodo, {
      usuarioAtualId: autor.usuarioId,
    });
    if (!avaliacao.permitido) {
      return { sucesso: false, motivo: avaliacao.motivo ?? "Ação indisponível no estado atual do período." };
    }
    const validacao = validarEntradaProtocoloManual(periodo.moduloId, {
      justificativa: dados.justificativa,
      numeroProtocolo: dados.numeroProtocolo,
      dataInformada: dados.dataInformada,
      canal: dados.canalBcb,
      emissor: dados.emissor ?? "",
    });
    if (!validacao.sucesso) {
      return { sucesso: false, motivo: validacao.motivo };
    }

    const disponibilidade = avaliarDisponibilidadeDoPeriodo(
      periodo,
      buscarInstituicao(periodo.instituicaoId)
    );
    const agora = new Date().toISOString();
    const protocoloId = `prot-rt-${periodoId.slice(4)}-${Date.now()}`;
    const dataHoraEnvio = `${dados.dataInformada}T12:00:00-03:00`;
    const protocolo: ProtocoloBCB = {
      id: protocoloId,
      periodoId,
      numeroProtocolo: dados.numeroProtocolo.trim(),
      dataHoraEnvio,
      canalEnvio: dados.canalBcb ?? "outro",
      registradoPorUsuarioId: autor.usuarioId,
      reciboHash: dados.reciboHash,
      situacaoRetorno: "aguardando",
      codigoRetorno: null,
      mensagemRetorno: null,
      dataRetorno: null,
      observacao: dados.justificativa.trim(),
      origem: "manual",
      cadastroId: disponibilidade.cadastro?.id ?? null,
      emissor: dados.emissor?.trim() || null,
      comprovanteLacreId: dados.reciboLacreId,
      comprovanteHash: dados.reciboHash,
      ...camposRemessaDoProtocolo(periodo),
    };

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "aguardando_retorno",
      protocoloId,
      entregueEm: agora,
      transmitidoEm: dataHoraEnvio,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "PROTOCOLO_MANUAL_REGISTRADO",
      "Protocolo manual registrado",
      protocolo.numeroProtocolo,
      {
        protocolo: protocolo.numeroProtocolo,
        dataInformada: dados.dataInformada,
        canal: dados.canalBcb,
        emissor: protocolo.emissor,
        justificativa: dados.justificativa.trim(),
        motivoTransmissaoManual: disponibilidade.motivo,
        anexoNome: dados.anexoNome,
        anexoHash: dados.anexoHash,
        anexoLacreId: dados.anexoLacreId,
        reciboLacreId: dados.reciboLacreId,
        reciboHash: dados.reciboHash,
        estadoAnterior: periodo.estado,
        estadoNovo: "aguardando_retorno",
      }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      protocolos: { ...estado.protocolos, [protocoloId]: protocolo },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  marcarEncaminhado: (periodoId, autor, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const avaliacao = avaliarAcao(autor.perfilId, "marcar_encaminhado", periodo, {
      usuarioAtualId: autor.usuarioId,
    });
    if (!avaliacao.permitido) {
      return { sucesso: false, motivo: avaliacao.motivo ?? "Ação indisponível no estado atual do período." };
    }
    const validacao = validarEntradaEncaminhamento(dados.emissor);
    if (!validacao.sucesso) {
      return { sucesso: false, motivo: validacao.motivo };
    }

    const agora = new Date().toISOString();
    const protocoloId = `prot-rt-${periodoId.slice(4)}-${Date.now()}`;
    const protocolo: ProtocoloBCB = {
      id: protocoloId,
      periodoId,
      numeroProtocolo: `ENC-DPS-${periodo.competencia.replace("-", "")}`,
      dataHoraEnvio: agora,
      canalEnvio: "outro",
      registradoPorUsuarioId: autor.usuarioId,
      reciboHash: dados.reciboHash,
      situacaoRetorno: "aguardando",
      codigoRetorno: null,
      mensagemRetorno: null,
      dataRetorno: null,
      observacao: dados.observacao,
      origem: "encaminhamento",
      emissor: dados.emissor.trim(),
      comprovanteLacreId: dados.reciboLacreId,
      comprovanteHash: dados.reciboHash,
      ...camposRemessaDoProtocolo(periodo),
    };

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "aguardando_retorno",
      protocoloId,
      entregueEm: agora,
      transmitidoEm: agora,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "DPS_ENCAMINHADA_AO_EMISSOR",
      "DPS encaminhada ao emissor",
      protocolo.numeroProtocolo,
      {
        emissor: protocolo.emissor,
        observacao: dados.observacao,
        reciboLacreId: dados.reciboLacreId,
        reciboHash: dados.reciboHash,
        estadoAnterior: "aprovado",
        estadoNovo: "aguardando_retorno",
      }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      protocolos: { ...estado.protocolos, [protocoloId]: protocolo },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  registrarRetorno: (periodoId, autor, situacao, codigoRetorno, mensagemRetorno, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (periodo.estado !== "aguardando_retorno") {
      return { sucesso: false, motivo: "Ação indisponível no estado atual do período." };
    }
    if (!periodo.protocoloId) return { sucesso: false, motivo: "Período sem protocolo registrado." };
    const protocolo = get().protocolos[periodo.protocoloId];
    if (!protocolo) return { sucesso: false, motivo: "Protocolo não encontrado." };
    const somentePosicionamento = retornoSomentePosicionamento(periodo.moduloId);
    const validacaoEntrada = validarEntradaRetorno(situacao, codigoRetorno, mensagemRetorno, somentePosicionamento);
    if (!validacaoEntrada.sucesso) return validacaoEntrada;

    const agora = new Date().toISOString();
    const rotuloArtefato = rotuloRetornoDoModulo(periodo.moduloId);
    const retornoRegulador: RetornoRegulador = {
      rotuloArtefato,
      identificador: dados?.identificador?.trim() || null,
      dataInformada: dados?.dataInformada || null,
      anexoNome: dados?.anexoNome ?? null,
      anexoTamanhoBytes: dados?.anexoTamanhoBytes ?? null,
      anexoHash: dados?.anexoHash ?? null,
      anexoLacreId: dados?.anexoLacreId ?? null,
      reciboLacreId: dados?.reciboLacreId ?? null,
    };
    const protocoloAtualizado: ProtocoloBCB = {
      ...protocolo,
      situacaoRetorno: situacao,
      codigoRetorno: somentePosicionamento ? null : codigoRetorno,
      mensagemRetorno: somentePosicionamento ? null : mensagemRetorno,
      dataRetorno: agora,
      retornoRegulador,
    };

    const novoEstado: EstadoPeriodo =
      situacao === "aceito"
        ? "retorno_aceito"
        : situacao === "aceito_com_ressalvas"
          ? "retorno_com_ressalvas"
          : "retorno_rejeitado";

    const excecaoRetorno: Excecao | null =
      situacao === "rejeitado"
        ? {
            id: novoIdExcecao(),
            periodoId,
            instituicaoId: periodo.instituicaoId,
            moduloId: periodo.moduloId,
            origem: "retorno_bcb",
            codigo: somentePosicionamento ? CODIGO_RETORNO_NAO_APROVADO : codigoRetorno.trim(),
            severidade: "bloqueante",
            titulo: `Retorno rejeitado (${rotuloArtefato})`,
            descricao: somentePosicionamento ? DESCRICAO_RETORNO_NAO_APROVADO : mensagemRetorno.trim(),
            abertaEm: agora,
            abertaPorUsuarioId: autor.usuarioId,
            responsavelAtualPerfil: "executor",
            status: "aberta",
            justificativa: null,
            tratadaPorUsuarioId: null,
            tratadaEm: null,
            registroRefId: protocolo.id,
          }
        : null;

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: novoEstado,
      retornoSituacao: situacao,
      retornoRegistradoPorUsuarioId: autor.usuarioId,
      excecaoIds: excecaoRetorno ? [...periodo.excecaoIds, excecaoRetorno.id] : periodo.excecaoIds,
    };

    const tipoEvento: TipoEventoAuditoria =
      situacao === "aceito"
        ? "RETORNO_ACEITO"
        : situacao === "aceito_com_ressalvas"
          ? "RETORNO_ACEITO_COM_RESSALVAS"
          : "RETORNO_REJEITADO";
    const rotuloTipo =
      situacao === "aceito"
        ? "Retorno aceito"
        : situacao === "aceito_com_ressalvas"
          ? "Retorno aceito com ressalvas"
          : "Retorno rejeitado";

    const arquivoCorrente = get().arquivos[periodo.arquivoCorrenteId ?? ""];

    const evento = construirEvento(autor, periodoAtualizado, tipoEvento, rotuloTipo, protocolo.numeroProtocolo, {
      protocoloBcb: protocolo.numeroProtocolo,
      artefatoRetorno: rotuloArtefato,
      identificadorRetorno: retornoRegulador.identificador,
      dataRetornoInformada: retornoRegulador.dataInformada,
      ...(somentePosicionamento
        ? { aprovado: situacao === "aceito" }
        : { codigoRetorno, mensagemRetorno }),
      resultado: situacao,
      hashSha256: arquivoCorrente?.hashSha256 ?? null,
      anexoNome: retornoRegulador.anexoNome,
      anexoHash: retornoRegulador.anexoHash,
      anexoLacreId: retornoRegulador.anexoLacreId,
      reciboLacreId: retornoRegulador.reciboLacreId,
      reciboHash: dados?.reciboHash ?? null,
      excecaoId: excecaoRetorno?.id ?? null,
      estadoAnterior: periodo.estado,
      estadoNovo: novoEstado,
    });

    const eventoExcecao = excecaoRetorno
      ? construirEvento(autor, periodoAtualizado, "EXCECAO_ABERTA", "Exceção aberta", excecaoRetorno.codigo, {
          codigo: excecaoRetorno.codigo,
          origem: "retorno_bcb",
          severidade: excecaoRetorno.severidade,
          protocoloBcb: protocolo.numeroProtocolo,
        })
      : null;

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      protocolos: { ...estado.protocolos, [protocolo.id]: protocoloAtualizado },
      excecoes: excecaoRetorno ? { ...estado.excecoes, [excecaoRetorno.id]: excecaoRetorno } : estado.excecoes,
      eventos: eventoExcecao ? [...estado.eventos, evento, eventoExcecao] : [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  arquivar: (periodoId, autor, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const avaliacao = avaliarAcao(autor.perfilId, "arquivar", periodo, {
      usuarioAtualId: autor.usuarioId,
    });
    if (!avaliacao.permitido) {
      return { sucesso: false, motivo: avaliacao.motivo ?? "Ação indisponível no estado atual do período." };
    }

    const protocolo = periodo.protocoloId ? get().protocolos[periodo.protocoloId] : undefined;
    const arquivoCorrente = get().arquivos[periodo.arquivoCorrenteId ?? ""];
    const retencaoAte = calcularRetencaoAte(dados.arquivadoEm);
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "arquivado",
      arquivadoEm: dados.arquivadoEm,
      arquivadoPorUsuarioId: autor.usuarioId,
      arquivamentoLacreId: dados.lacreId,
      retencaoAte,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "PERIODO_ARQUIVADO",
      "Período arquivado",
      dados.hashDossie,
      {
        lacreArquivamentoId: dados.lacreId,
        hashDossie: dados.hashDossie,
        hashSha256: arquivoCorrente?.hashSha256 ?? null,
        protocoloBcb: protocolo?.numeroProtocolo ?? null,
        resultadoRetorno: protocolo?.situacaoRetorno ?? null,
        retencaoAte,
        estadoAnterior: periodo.estado,
        estadoNovo: "arquivado",
      }
    );
    const notificacoes = construirNotificacoesDeAreas(autor, periodoAtualizado, "arquivamento");

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento, ...notificacoes.eventos],
    }));

    return { sucesso: true, notificacoes: notificacoes.destinatarios };
  },

  negarAprovacao: (periodoId, autor, motivo, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const avaliacao = avaliarAcao(autor.perfilId, "negar_aprovacao", periodo, {
      usuarioAtualId: autor.usuarioId,
    });
    if (!avaliacao.permitido) {
      return { sucesso: false, motivo: avaliacao.motivo ?? "Ação indisponível no estado atual do período." };
    }
    if (periodo.estado !== "liberado") {
      return { sucesso: false, motivo: "Ação indisponível no estado atual do período." };
    }
    if (!motivo || motivo.trim().length < 10) {
      return { sucesso: false, motivo: "Descreva o motivo da negação com pelo menos 10 caracteres." };
    }

    const arquivo = get().arquivos[periodo.arquivoCorrenteId ?? ""];
    const agora = dados?.ocorridoEm ?? new Date().toISOString();
    const numeroNegativa = contarNegativas(periodo) + 1;
    const limiar = limiarNegativas();
    const escalaParaComite = proximaNegativaEscalaParaComite(periodo);
    const negacao: NegacaoAprovacao = {
      cicloEnvio: cicloDoPeriodo(periodo),
      motivo,
      usuarioId: autor.usuarioId,
      ocorridoEm: agora,
      arquivoId: arquivo?.id ?? null,
    };

    const estadoNovo: EstadoPeriodo = escalaParaComite ? "em_comite_qualidade" : "devolvido_diretor";
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: estadoNovo,
      negacoesAprovacao: [...periodo.negacoesAprovacao, negacao],
      emComiteDesde: escalaParaComite ? agora : periodo.emComiteDesde,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "APROVACAO_NEGADA",
      "Aprovação negada pelo Compliance",
      arquivo?.hashSha256 ?? null,
      {
        motivo,
        numeroNegativa,
        limiarComite: limiar,
        escalouParaComite: escalaParaComite,
        arquivoId: arquivo?.id ?? null,
        versaoArquivo: arquivo?.versao ?? null,
        hashSha256: arquivo?.hashSha256 ?? null,
        estadoAnterior: "liberado",
        estadoNovo,
      }
    );

    const eventoComite = escalaParaComite
      ? construirEvento(
          autor,
          periodoAtualizado,
          "COMITE_QUALIDADE_ACIONADO",
          "Comitê de Qualidade acionado",
          dados?.hashDossie ?? arquivo?.hashSha256 ?? null,
          {
            numeroNegativa,
            limiarComite: limiar,
            historicoNegativas: montarHistoricoNegativas(
              negativasDoCiclo(periodoAtualizado),
              (arquivoId) => get().arquivos[arquivoId]
            ),
            lacreDossieId: dados?.lacreId ?? null,
            hashDossie: dados?.hashDossie ?? null,
            estadoAnterior: "liberado",
            estadoNovo,
          }
        )
      : null;

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: eventoComite ? [...estado.eventos, evento, eventoComite] : [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  validarDecisaoComite: (periodoId, autor, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const impedimentosComite = impedimentosDoComite(periodo, get().arquivos, get().eventos);
    const avaliacao = avaliarAcao(autor.perfilId, "decidir_comite", periodo, {
      usuarioAtualId: autor.usuarioId,
      impedimentosComite,
      membroComiteId: dados.membroId,
    });
    if (!avaliacao.permitido) {
      return { sucesso: false, motivo: avaliacao.motivo ?? "Ação indisponível no estado atual do período." };
    }
    if (periodo.estado !== "em_comite_qualidade") {
      return { sucesso: false, motivo: "Ação indisponível no estado atual do período." };
    }
    const configuracao = configuracaoFluxo.comiteQualidade;
    if (!configuracao || !configuracao.desfechosPermitidos.includes(dados.desfecho)) {
      return { sucesso: false, motivo: "Desfecho não permitido pela configuração do Comitê." };
    }
    if (!dados.justificativa || dados.justificativa.trim().length < TAMANHO_MINIMO_TEXTO_COMITE) {
      return {
        sucesso: false,
        motivo: `Descreva a justificativa com pelo menos ${TAMANHO_MINIMO_TEXTO_COMITE} caracteres.`,
      };
    }
    if (
      DESFECHOS_COMITE[dados.desfecho].exigePlanoCorrecao &&
      (!dados.planoCorrecao || dados.planoCorrecao.trim().length < TAMANHO_MINIMO_TEXTO_COMITE)
    ) {
      return {
        sucesso: false,
        motivo: `Descreva o plano de correção com pelo menos ${TAMANHO_MINIMO_TEXTO_COMITE} caracteres.`,
      };
    }
    return { sucesso: true };
  },

  decidirComite: (periodoId, autor, dados) => {
    const validacao = get().validarDecisaoComite(periodoId, autor, dados);
    if (!validacao.sucesso) return validacao;
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };

    const definicao = DESFECHOS_COMITE[dados.desfecho];
    const estadoNovo: EstadoPeriodo = definicao.estadoDestino;
    const arquivo = get().arquivos[periodo.arquivoCorrenteId ?? ""];
    const planoCorrecao = definicao.exigePlanoCorrecao ? (dados.planoCorrecao ?? "").trim() : null;
    const justificativa = dados.justificativa.trim();
    const decisao: DecisaoComiteQualidade = {
      id: `dec-${periodoId.slice(4)}-${(periodo.decisoesComite?.length ?? 0) + 1}`,
      desfecho: dados.desfecho,
      presidenteId: autor.usuarioId,
      membroId: dados.membroId,
      justificativa,
      planoCorrecao,
      escaladoEm: periodo.emComiteDesde,
      decididoEm: dados.decididoEm,
      arquivoId: arquivo?.id ?? null,
      estadoNovo,
      lacreAtaId: dados.lacreId ?? null,
      hashAta: dados.hashAta ?? null,
    };

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: estadoNovo,
      emComiteDesde: null,
      decisoesComite: [...(periodo.decisoesComite ?? []), decisao],
    };

    const presidente = buscarUsuario(autor.usuarioId);
    const membro = buscarUsuario(dados.membroId);
    const participantes = [
      {
        usuarioId: autor.usuarioId,
        nome: presidente?.nome ?? autor.usuarioId,
        perfilId: presidente?.perfilId ?? autor.perfilId,
        papel: "Presidente",
      },
      {
        usuarioId: dados.membroId,
        nome: membro?.nome ?? dados.membroId,
        perfilId: membro?.perfilId ?? null,
        papel: "Membro",
      },
    ];

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "COMITE_QUALIDADE_DECIDIU",
      "Comitê de Qualidade decidiu",
      dados.hashAta ?? null,
      {
        desfecho: dados.desfecho,
        rotuloDesfecho: definicao.rotulo,
        participantes,
        quorum: descricaoQuorumComite(),
        justificativa,
        planoCorrecao,
        numeroNegativas: contarNegativas(periodo),
        escaladoEm: periodo.emComiteDesde,
        arquivoId: arquivo?.id ?? null,
        versaoArquivo: arquivo?.versao ?? null,
        hashSha256: arquivo?.hashSha256 ?? null,
        lacreAtaId: dados.lacreId ?? null,
        hashAta: dados.hashAta ?? null,
        estadoAnterior: "em_comite_qualidade",
        estadoNovo,
      }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  reabrir: (periodoId, autor, motivo) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (
      !["retorno_rejeitado", "retorno_com_ressalvas", "liberado", "aprovado"].includes(periodo.estado)
    ) {
      return { sucesso: false, motivo: "Ação indisponível no estado atual do período." };
    }
    if (
      periodo.estado === "retorno_com_ressalvas" &&
      !configuracaoFluxo.caminhosAposRessalvas?.includes("reabrir")
    ) {
      return {
        sucesso: false,
        motivo: "A reabertura após retorno com ressalvas não está habilitada na configuração do fluxo.",
      };
    }
    if (!motivo || motivo.trim().length < 10) {
      return { sucesso: false, motivo: "Descreva o motivo da reabertura." };
    }

    const estadoAnterior = periodo.estado;
    const agora = new Date().toISOString();
    const reabreDoRetorno =
      estadoAnterior === "retorno_rejeitado" || estadoAnterior === "retorno_com_ressalvas";
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "dados_ingeridos",
      liberadoPorUsuarioId: null,
      liberadoEm: null,
      aprovadoPorUsuarioId: null,
      aprovadoEm: null,
      contratoCongelado: null,
      entregueEm: null,
      transmitidoEm: reabreDoRetorno ? null : periodo.transmitidoEm,
      retornoSituacao: reabreDoRetorno ? null : periodo.retornoSituacao,
    };

    const excecoesDoRetorno = reabreDoRetorno
      ? Object.values(get().excecoes).filter(
          (excecao) =>
            excecao.periodoId === periodoId &&
            excecao.origem === "retorno_bcb" &&
            (excecao.status === "aberta" || excecao.status === "em_tratamento")
        )
      : [];

    const evento = construirEvento(autor, periodoAtualizado, "PERIODO_REABERTO", "Período reaberto", null, {
      estadoAnterior,
      motivo,
      usuarioSolicitante: autor.usuarioId,
      excecoesDoRetornoEncerradas: excecoesDoRetorno.map((excecao) => excecao.id),
    });

    set((estado) => {
      const excecoesAtualizadas = { ...estado.excecoes };
      for (const excecao of excecoesDoRetorno) {
        excecoesAtualizadas[excecao.id] = {
          ...excecao,
          status: "tratada",
          justificativa: `Período reaberto para correção: ${motivo.trim()}`,
          tratadaPorUsuarioId: autor.usuarioId,
          tratadaEm: agora,
        };
      }
      return {
        periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
        excecoes: excecoesAtualizadas,
        eventos: [...estado.eventos, evento],
      };
    });

    return { sucesso: true };
  },

  iniciarSubstituicao: (periodoId, autor, justificativa, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const avaliacao = avaliarAcao(autor.perfilId, "iniciar_substituicao", periodo, {
      usuarioAtualId: autor.usuarioId,
    });
    if (!avaliacao.permitido) {
      return { sucesso: false, motivo: avaliacao.motivo ?? "Ação indisponível no estado atual do período." };
    }
    const motivo = justificativa.trim();
    if (motivo.length < TAMANHO_MINIMO_JUSTIFICATIVA_SUBSTITUICAO) {
      return {
        sucesso: false,
        motivo: `Descreva a justificativa da substituição com pelo menos ${TAMANHO_MINIMO_JUSTIFICATIVA_SUBSTITUICAO} caracteres.`,
      };
    }

    const agora = new Date().toISOString();
    const cicloAnterior = cicloDoPeriodo(periodo);
    const cicloNovo = cicloAnterior + 1;
    const protocoloSubstituido = periodo.protocoloId ? get().protocolos[periodo.protocoloId] : undefined;
    const arquivoSubstituido = get().arquivos[periodo.arquivoCorrenteId ?? ""];
    const registro: SubstituicaoCiclo = {
      cicloAnterior,
      cicloNovo,
      protocoloSubstituidoId: protocoloSubstituido?.id ?? null,
      protocoloSubstituido: protocoloSubstituido?.numeroProtocolo ?? null,
      arquivoSubstituidoId: arquivoSubstituido?.id ?? null,
      justificativa: motivo,
      iniciadaEm: agora,
      iniciadaPorUsuarioId: autor.usuarioId,
    };
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "dados_ingeridos",
      cicloEnvio: cicloNovo,
      tipoRemessa: "S",
      substituicoes: [...(periodo.substituicoes ?? []), registro],
      liberadoPorUsuarioId: null,
      liberadoEm: null,
      aprovadoPorUsuarioId: null,
      aprovadoEm: null,
      contratoCongelado: null,
      protocoloId: null,
      entregueEm: null,
      transmitidoEm: null,
      retornoSituacao: null,
      retornoRegistradoPorUsuarioId: null,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      "SUBSTITUICAO_INICIADA",
      "Substituição iniciada (remessa S)",
      registro.protocoloSubstituido,
      {
        cicloAnterior,
        cicloNovo,
        rotuloCicloAnterior: rotuloCiclo(cicloAnterior),
        rotuloCicloNovo: rotuloCiclo(cicloNovo, "S"),
        tipoRemessaAnterior: tipoRemessaDoPeriodo(periodo),
        tipoRemessaNovo: "S",
        justificativa: motivo,
        protocoloSubstituido: registro.protocoloSubstituido,
        protocoloSubstituidoId: registro.protocoloSubstituidoId,
        arquivoSubstituidoId: registro.arquivoSubstituidoId,
        hashArquivoSubstituido: arquivoSubstituido?.hashSha256 ?? null,
        negativasCicloAnterior: negativasDoCiclo(periodo, cicloAnterior).length,
        negativasTotal: contarNegativasTotal(periodo),
        contadorZerado: true,
        lacreAnteriorId: dados?.lacreAnteriorId ?? null,
        hashLacreAnterior: dados?.hashLacreAnterior ?? null,
        estadoAnterior: periodo.estado,
        estadoNovo: "dados_ingeridos",
      }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  tratarExcecao: (periodoId, autor, excecaoId, acao, justificativa) => {
    const excecao = get().excecoes[excecaoId];
    const periodo = get().periodos[periodoId];
    if (!excecao || !periodo) return { sucesso: false, motivo: "Exceção ou período não encontrado." };
    if (periodo.estado === "arquivado") {
      return { sucesso: false, motivo: "Período arquivado: somente leitura." };
    }

    const agora = new Date().toISOString();
    const excecaoAtualizada: Excecao = {
      ...excecao,
      status: acao,
      justificativa,
      tratadaPorUsuarioId: autor.usuarioId,
      tratadaEm: agora,
    };

    const evento = construirEvento(autor, periodo, "EXCECAO_TRATADA", "Exceção tratada", excecao.codigo, {
      codigo: excecao.codigo,
      status: acao,
      justificativa,
    });

    set((estado) => ({
      excecoes: { ...estado.excecoes, [excecaoId]: excecaoAtualizada },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  notificarCliente: (periodoId, autor, quantidadePendencias) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };

    const evento = construirEvento(
      autor,
      periodo,
      "CLIENTE_NOTIFICADO",
      "Cliente notificado sobre pendências",
      null,
      { quantidadePendencias }
    );

    set((estado) => ({
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  registrarEventoAdministrativo: ({ autor, instituicaoId, tipo, rotuloTipo, referencia, payload }) => {
    const evento = construirEventoBase(
      autor,
      { instituicaoId, periodoId: null, moduloId: null, competencia: null },
      tipo,
      rotuloTipo,
      referencia,
      payload
    );

    set((estado) => ({ eventos: [...estado.eventos, evento] }));
  },

  abrirCompetenciasIniciais: (instituicaoId, modulos, autor) => {
    if (!instituicaoId || instituicaoId === "todas") {
      return { sucesso: false, motivo: "Instituição não identificada.", periodosCriados: [] };
    }
    if (modulos.length === 0) {
      return {
        sucesso: false,
        motivo: "Nenhum módulo contratado para abrir competências.",
        periodosCriados: [],
      };
    }

    const competencia = HOJE_ISO.slice(0, 7);
    const sufixoId = competencia.replace("-", "");
    const slugTenant = instituicaoId.startsWith("inst-") ? instituicaoId.slice(5) : instituicaoId;
    const agora = `${competencia}-01T00:00:00-03:00`;
    const existentes = Object.values(get().periodos);

    const novos: PeriodoObrigacao[] = [];

    for (const moduloId of new Set(modulos)) {
      const jaExiste = existentes.some(
        (periodo) =>
          periodo.instituicaoId === instituicaoId &&
          periodo.moduloId === moduloId &&
          periodo.competencia === competencia
      );
      if (jaExiste) {
        continue;
      }

      const modulo = buscarModulo(moduloId);

      novos.push({
        id: `per-${slugTenant}-${moduloId}-${sufixoId}`,
        instituicaoId,
        moduloId,
        competencia,
        competenciaRotulo: rotuloCompetencia(competencia),
        estado: "aguardando_dados",
        prazoEntrega: prazoDaCompetencia(competencia, modulo.diaPrazo),
        dataAbertura: agora,
        lotes: [],
        arquivoCorrenteId: null,
        arquivoIds: [],
        validacaoId: null,
        protocoloId: null,
        excecaoIds: [],
        totaisResumo: { ...TOTAIS_INICIAIS[moduloId] },
        geradoPorUsuarioId: null,
        geradoEm: null,
        liberadoPorUsuarioId: null,
        liberadoEm: null,
        aprovadoPorUsuarioId: null,
        aprovadoEm: null,
        entregueEm: null,
        contadorStatus: "nao_aplicavel",
        contadorUsuarioId: null,
        contadorConfirmadoEm: null,
        negacoesAprovacao: [],
        cicloEnvio: 1,
        tipoRemessa: "I",
        emComiteDesde: null,
        emitidoFiscalEm: null,
        transmitidoEm: null,
        retornoSituacao: null,
        arquivadoEm: null,
        arquivadoPorUsuarioId: null,
        retencaoAte: null,
      });
    }

    if (novos.length === 0) {
      return { sucesso: true, periodosCriados: [] };
    }

    const eventos = novos.map((periodo) =>
      construirEvento(autor, periodo, "PERIODO_CRIADO", "Período criado", null, {
        competencia: periodo.competencia,
        moduloId: periodo.moduloId,
        prazoEntrega: periodo.prazoEntrega,
      })
    );

    set((estado) => ({
      periodos: {
        ...estado.periodos,
        ...paraRecord(novos, (periodo) => periodo.id),
      },
      eventos: [...estado.eventos, ...eventos],
    }));

    return { sucesso: true, periodosCriados: novos.map((periodo) => periodo.id) };
  },

  excecoesBloqueantesAbertas: (periodoId) => {
    const excecoes = Object.values(get().excecoes);
    return excecoes.filter(
      (excecao) =>
        excecao.periodoId === periodoId &&
        excecao.severidade === "bloqueante" &&
        excecao.status !== "tratada" &&
        excecao.status !== "aceita_com_justificativa"
    ).length;
  },

  podeExecutar: (perfil, acaoId, periodoId, usuarioAtualId) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { permitido: false, visivel: false };
    return avaliarAcao(perfil, acaoId, periodo, {
      usuarioAtualId,
      excecoesBloqueantesAbertas: get().excecoesBloqueantesAbertas(periodoId),
      impedimentosComite:
        acaoId === "decidir_comite"
          ? impedimentosDoComite(periodo, get().arquivos, get().eventos)
          : undefined,
    });
  },

      reiniciarMock: () => set(estadoInicial()),
    }),
    {
      name: NOME_ARMAZENAMENTO_PERIODOS,
      version: VERSAO_ARMAZENAMENTO_PERIODOS,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (estado) => ({
        periodos: estado.periodos,
        arquivos: estado.arquivos,
        validacoes: estado.validacoes,
        protocolos: estado.protocolos,
        excecoes: estado.excecoes,
        eventos: estado.eventos,
        registros: estado.registros,
      }),
      migrate: (persistido, versao) => {
        if (versao !== VERSAO_ARMAZENAMENTO_PERIODOS) {
          return estadoInicial() as PeriodosPersistidos;
        }
        return persistido as PeriodosPersistidos;
      },
      merge: (persistido, atual) => {
        const parcial = (persistido ?? {}) as Partial<PeriodosPersistidos>;
        return {
          ...atual,
          ...parcial,
          periodos: { ...atual.periodos, ...(parcial.periodos ?? {}) },
          arquivos: { ...atual.arquivos, ...(parcial.arquivos ?? {}) },
          validacoes: { ...atual.validacoes, ...(parcial.validacoes ?? {}) },
          protocolos: { ...atual.protocolos, ...(parcial.protocolos ?? {}) },
          excecoes: { ...atual.excecoes, ...(parcial.excecoes ?? {}) },
          eventos: parcial.eventos ?? atual.eventos,
          registros: { ...atual.registros, ...(parcial.registros ?? {}) },
        };
      },
      onRehydrateStorage: () => () => {
        usePeriodosStore.setState({ hidratado: true });
      },
    }
  )
);

export function useHidratarPeriodos(): boolean {
  const hidratado = usePeriodosStore((estado) => estado.hidratado);

  useEffect(() => {
    const armazenamento = usePeriodosStore.persist;

    if (!armazenamento) {
      usePeriodosStore.setState({ hidratado: true });
      return;
    }

    if (!armazenamento.hasHydrated()) {
      void armazenamento.rehydrate();
    }
  }, []);

  return hidratado;
}
