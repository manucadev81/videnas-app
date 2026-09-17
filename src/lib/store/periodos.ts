"use client";

import { create } from "zustand";
import type {
  AcaoId,
  ArquivoGerado,
  CanalEnvioBcb,
  Excecao,
  EventoAuditoria,
  PerfilId,
  PeriodoObrigacao,
  ProtocoloBCB,
  TipoEventoAuditoria,
  ValidacaoItem,
  ValidacaoResultado,
} from "@/lib/tipos";
import {
  arquivos as arquivosMock,
  periodos as periodosMock,
  protocolos as protocolosMock,
  validacoes as validacoesMock,
} from "@/lib/mock/periodos";
import { excecoes as excecoesMock } from "@/lib/mock/excecoes";
import { eventosAuditoria as eventosMock } from "@/lib/mock/auditoria";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { gerarHashDeterministico } from "@/lib/mock/hash";
import { formatarTamanhoArquivo } from "@/lib/formatadores";
import {
  podeExecutar as avaliarAcao,
  type AvaliacaoAcao,
} from "@/lib/permissoes";

export interface AutorAcao {
  usuarioId: string;
  perfilId: PerfilId;
}

export interface ResultadoAcao {
  sucesso: boolean;
  motivo?: string;
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
  };
}

let contadorEventoRuntime = 0;
let contadorExcecaoRuntime = 0;

function novoEventoId(): string {
  contadorEventoRuntime += 1;
  return `evt-rt-${contadorEventoRuntime.toString(16).padStart(6, "0")}`;
}

function novoIdExcecao(): string {
  contadorExcecaoRuntime += 1;
  return `exc-rt-${contadorExcecaoRuntime.toString(16).padStart(4, "0")}`;
}

function construirEvento(
  autor: AutorAcao,
  periodo: PeriodoObrigacao,
  tipo: TipoEventoAuditoria,
  rotuloTipo: string,
  referencia: string | null,
  payload: Record<string, unknown>
): EventoAuditoria {
  const usuario = buscarUsuario(autor.usuarioId);
  const lado = usuario?.lado ?? "sentinellus";
  return {
    id: novoEventoId(),
    ocorridoEm: new Date().toISOString(),
    instituicaoId: periodo.instituicaoId,
    periodoId: periodo.id,
    moduloId: periodo.moduloId,
    competencia: periodo.competencia,
    tipo,
    rotuloTipo,
    usuarioId: autor.usuarioId,
    usuarioNome: usuario?.nome ?? "Usuário da demonstração",
    perfilId: autor.perfilId,
    lado,
    referencia,
    payload,
    ip: lado === "sentinellus" ? "10.20.4.18" : "201.17.88.203",
    userAgent: lado === "sentinellus" ? "Chrome 141 · Ubuntu 24.04" : "Chrome 141 · macOS 26",
  };
}

export interface EstadoPeriodosStore {
  periodos: Record<string, PeriodoObrigacao>;
  arquivos: Record<string, ArquivoGerado>;
  validacoes: Record<string, ValidacaoResultado>;
  protocolos: Record<string, ProtocoloBCB>;
  excecoes: Record<string, Excecao>;
  eventos: EventoAuditoria[];

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

  registrarEntrega: (
    periodoId: string,
    autor: AutorAcao,
    dados: {
      numeroProtocolo?: string;
      canalEnvio?: CanalEnvioBcb;
      emissor?: string;
      observacao?: string;
    }
  ) => ResultadoAcao;

  registrarRetorno: (
    periodoId: string,
    autor: AutorAcao,
    situacao: "aceito" | "aceito_com_ressalvas" | "rejeitado",
    codigoRetorno: string,
    mensagemRetorno: string
  ) => ResultadoAcao;

  reabrir: (periodoId: string, autor: AutorAcao, motivo: string) => ResultadoAcao;

  tratarExcecao: (
    periodoId: string,
    autor: AutorAcao,
    excecaoId: string,
    acao: "tratada" | "aceita_com_justificativa",
    justificativa: string
  ) => ResultadoAcao;

  excecoesBloqueantesAbertas: (periodoId: string) => number;

  podeExecutar: (
    perfil: PerfilId,
    acaoId: AcaoId,
    periodoId: string,
    usuarioAtualId?: string
  ) => AvaliacaoAcao;

  reiniciarMock: () => void;
}

export const usePeriodosStore = create<EstadoPeriodosStore>((set, get) => ({
  ...estadoInicial(),

  ingerirDados: (periodoId, autor, lote) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };

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

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: periodo.estado === "aguardando_dados" ? "dados_ingeridos" : periodo.estado,
      lotes: [...periodo.lotes, novoLote],
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
          }
        : {
            arquivoId,
            nomeArquivo: arquivo.nomeArquivo,
            hashSha256: arquivo.hashSha256,
            tamanhoBytes,
            schema: modulo.schema,
            versaoSchema: modulo.versaoSchema,
            registros: quantidadeRegistros,
          }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      arquivos: { ...estado.arquivos, [arquivoId]: arquivo },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  enviarParaValidacao: (periodoId, autor) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    const arquivo = get().arquivos[periodo.arquivoCorrenteId ?? ""];

    const periodoAtualizado: PeriodoObrigacao = { ...periodo, estado: "em_validacao" };
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
      eventos: [...estado.eventos, evento],
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
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: decisao === "confirmado" ? "em_validacao" : "gerado",
      contadorStatus: decisao === "confirmado" ? "confirmado" : "devolvido",
      contadorConfirmadoEm: decisao === "confirmado" ? agora : periodo.contadorConfirmadoEm,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      decisao === "confirmado" ? "ENQUADRAMENTO_FISCAL_CONFIRMADO" : "DPS_DEVOLVIDA_PELO_CONTADOR",
      decisao === "confirmado" ? "Enquadramento fiscal confirmado" : "DPS devolvida pelo contador",
      null,
      decisao === "confirmado"
        ? { usuarioId: autor.usuarioId, observacao: observacao ?? null }
        : { motivo: observacao }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento],
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
      hashSha256: arquivo?.hashSha256 ?? null,
      segregacaoOk: true,
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
      return { sucesso: false, motivo: "Disponível após a liberação pelo Validador Sentinellus." };
    }

    const arquivo = get().arquivos[periodo.arquivoCorrenteId ?? ""];
    const agora = new Date().toISOString();
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "aprovado",
      aprovadoPorUsuarioId: autor.usuarioId,
      aprovadoEm: agora,
    };

    const evento = construirEvento(autor, periodoAtualizado, "PERIODO_APROVADO", "Período aprovado", arquivo?.hashSha256 ?? null, {
      usuarioDiretor: autor.usuarioId,
      textoCiencia,
      hashSha256: arquivo?.hashSha256 ?? null,
    });

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  registrarEntrega: (periodoId, autor, dados) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (periodo.estado !== "aprovado") {
      return { sucesso: false, motivo: "Ação indisponível no estado atual do período." };
    }

    const ehFiscal = periodo.moduloId === "fiscal";
    const agora = new Date().toISOString();
    const protocoloId = `prot-rt-${periodoId.slice(4)}-${Date.now()}`;
    const protocolo: ProtocoloBCB = {
      id: protocoloId,
      periodoId,
      numeroProtocolo: dados.numeroProtocolo ?? `ENC-DPS-${periodo.competencia.replace("-", "")}`,
      dataHoraEnvio: agora,
      canalEnvio: dados.canalEnvio ?? "outro",
      registradoPorUsuarioId: autor.usuarioId,
      reciboHash: gerarHashDeterministico(`recibo-${protocoloId}`),
      situacaoRetorno: "aguardando",
      codigoRetorno: null,
      mensagemRetorno: null,
      dataRetorno: null,
      observacao: dados.observacao ?? null,
    };

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "entregue",
      protocoloId,
      entregueEm: agora,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      ehFiscal ? "DPS_ENCAMINHADA_AO_EMISSOR" : "ENTREGA_REGISTRADA",
      ehFiscal ? "DPS encaminhada ao emissor" : "Entrega registrada",
      protocolo.numeroProtocolo,
      ehFiscal
        ? { emissor: dados.emissor ?? "Não informado", observacao: dados.observacao ?? null }
        : { protocoloBcb: protocolo.numeroProtocolo, dataHoraEnvio: agora, canal: protocolo.canalEnvio, reciboHash: protocolo.reciboHash }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      protocolos: { ...estado.protocolos, [protocoloId]: protocolo },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  registrarRetorno: (periodoId, autor, situacao, codigoRetorno, mensagemRetorno) => {
    const periodo = get().periodos[periodoId];
    if (!periodo || !periodo.protocoloId) return { sucesso: false, motivo: "Período sem protocolo registrado." };
    const protocolo = get().protocolos[periodo.protocoloId];
    if (!protocolo) return { sucesso: false, motivo: "Protocolo não encontrado." };

    const agora = new Date().toISOString();
    const protocoloAtualizado: ProtocoloBCB = {
      ...protocolo,
      situacaoRetorno: situacao,
      codigoRetorno,
      mensagemRetorno,
      dataRetorno: agora,
    };

    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: situacao === "rejeitado" ? "retorno_com_erro" : periodo.estado,
    };

    const evento = construirEvento(
      autor,
      periodoAtualizado,
      situacao === "rejeitado" ? "RETORNO_BCB_REJEITADO" : "RETORNO_BCB_ACEITO",
      situacao === "rejeitado" ? "Retorno do BCB rejeitado" : "Retorno do BCB aceito",
      protocolo.numeroProtocolo,
      { protocoloBcb: protocolo.numeroProtocolo, codigoRetorno, mensagemRetorno }
    );

    set((estado) => ({
      periodos: { ...estado.periodos, [periodoId]: periodoAtualizado },
      protocolos: { ...estado.protocolos, [protocolo.id]: protocoloAtualizado },
      eventos: [...estado.eventos, evento],
    }));

    return { sucesso: true };
  },

  reabrir: (periodoId, autor, motivo) => {
    const periodo = get().periodos[periodoId];
    if (!periodo) return { sucesso: false, motivo: "Período não encontrado." };
    if (!["retorno_com_erro", "liberado", "aprovado"].includes(periodo.estado)) {
      return { sucesso: false, motivo: "Ação indisponível no estado atual do período." };
    }
    if (!motivo || motivo.trim().length < 10) {
      return { sucesso: false, motivo: "Descreva o motivo da reabertura." };
    }

    const estadoAnterior = periodo.estado;
    const periodoAtualizado: PeriodoObrigacao = {
      ...periodo,
      estado: "dados_ingeridos",
      liberadoPorUsuarioId: null,
      liberadoEm: null,
      aprovadoPorUsuarioId: null,
      aprovadoEm: null,
      entregueEm: null,
    };

    const evento = construirEvento(autor, periodoAtualizado, "PERIODO_REABERTO", "Período reaberto", null, {
      estadoAnterior,
      motivo,
      usuarioSolicitante: autor.usuarioId,
    });

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
    });
  },

  reiniciarMock: () => set(estadoInicial()),
}));
