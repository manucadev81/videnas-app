import type { EventoAuditoria, TipoEventoAuditoria } from "@/lib/tipos";
import { arquivos, periodos, protocolos, validacoes } from "@/lib/mock/periodos";
import { excecoes } from "@/lib/mock/excecoes";
import { buscarUsuario } from "@/lib/mock/usuarios";

const ROTULOS_TIPO: Record<TipoEventoAuditoria, string> = {
  PERIODO_CRIADO: "Período criado",
  INGESTAO_CONCLUIDA: "Ingestão concluída",
  INGESTAO_COMPLEMENTAR: "Ingestão complementar",
  LOTE_REMOVIDO: "Lote removido",
  ARQUIVO_GERADO: "Arquivo gerado",
  ARQUIVO_REGERADO: "Arquivo regerado",
  ENVIADO_PARA_VALIDACAO: "Enviado para validação",
  DPS_ENVIADA_AO_CONTADOR: "DPS enviada ao contador",
  ENQUADRAMENTO_FISCAL_CONFIRMADO: "Enquadramento fiscal confirmado",
  DPS_DEVOLVIDA_PELO_CONTADOR: "DPS devolvida pelo contador",
  VALIDACAO_CONCLUIDA: "Validação concluída",
  VALIDACAO_COM_EXCECOES: "Validação com exceções",
  EXCECAO_ABERTA: "Exceção aberta",
  EXCECAO_TRATADA: "Exceção tratada",
  REPROCESSAMENTO_SOLICITADO: "Reprocessamento solicitado",
  PERIODO_LIBERADO: "Período liberado",
  PERIODO_APROVADO: "Período aprovado",
  ENTREGA_REGISTRADA: "Entrega registrada",
  DPS_ENCAMINHADA_AO_EMISSOR: "DPS encaminhada ao emissor",
  RETORNO_BCB_ACEITO: "Retorno do BCB aceito",
  RETORNO_BCB_REJEITADO: "Retorno do BCB rejeitado",
  PERIODO_REABERTO: "Período reaberto",
  HASH_REVERIFICADO: "Hash reverificado",
  USUARIO_CONVIDADO: "Usuário convidado",
  PERFIL_ALTERADO: "Perfil alterado",
  DICIONARIO_ATUALIZADO: "Dicionário atualizado",
  CONFIG_INSTITUICAO_ALTERADA: "Configuração da instituição alterada",
  TRILHA_EXPORTADA: "Trilha exportada",
  INSUMO_FORNECIDO: "Insumo fornecido pelo cliente",
  LOTE_SELADO: "Lote selado criptograficamente",
  ENTREGA_DISPONIBILIZADA: "Entrega disponibilizada ao cliente",
  LACRE_VERIFICADO: "Integridade do lacre verificada",
  COMPROVANTE_EMITIDO: "Comprovante emitido",
  CLIENTE_NOTIFICADO: "Cliente notificado sobre pendências",
  TENANT_PROVISIONADO: "Cliente provisionado",
  CONVITE_INICIAL_ENVIADO: "Convite inicial enviado",
  TENANT_SUSPENSO: "Cliente suspenso",
  TENANT_REATIVADO: "Cliente reativado",
  MODULOS_CONTRATADOS_ALTERADOS: "Módulos contratados alterados",
  ONBOARDING_CONCLUIDO: "Onboarding concluído",
};

function redeAcesso(lado: "cliente" | "videnas"): { ip: string; userAgent: string } {
  return lado === "videnas"
    ? { ip: "10.20.4.18", userAgent: "Chrome 141 · Ubuntu 24.04" }
    : { ip: "201.17.88.203", userAgent: "Chrome 141 · macOS 26" };
}

let contador = 0;

function criarEvento(
  parcial: Omit<EventoAuditoria, "id" | "rotuloTipo" | "ip" | "userAgent" | "usuarioNome" | "perfilId" | "lado">
): EventoAuditoria {
  contador += 1;
  const usuario = buscarUsuario(parcial.usuarioId);
  const lado = usuario?.lado ?? "videnas";
  const acesso = redeAcesso(lado);
  return {
    ...parcial,
    id: `evt-${contador.toString(16).padStart(8, "0")}`,
    rotuloTipo: ROTULOS_TIPO[parcial.tipo],
    usuarioNome: usuario?.nome ?? "Sistema Videnas",
    perfilId: usuario?.perfilId ?? "executor",
    lado,
    ...acesso,
  };
}

const eventos: EventoAuditoria[] = [];

for (const periodo of periodos) {
  eventos.push(
    criarEvento({
      ocorridoEm: periodo.dataAbertura,
      instituicaoId: periodo.instituicaoId,
      periodoId: periodo.id,
      moduloId: periodo.moduloId,
      competencia: periodo.competencia,
      tipo: "PERIODO_CRIADO",
      usuarioId: "usr-tomoe",
      referencia: null,
      payload: { competencia: periodo.competencia, moduloId: periodo.moduloId },
    })
  );

  for (const lote of periodo.lotes) {
    eventos.push(
      criarEvento({
        ocorridoEm: lote.recebidoEm,
        instituicaoId: periodo.instituicaoId,
        periodoId: periodo.id,
        moduloId: periodo.moduloId,
        competencia: periodo.competencia,
        tipo: "INGESTAO_CONCLUIDA",
        usuarioId: lote.recebidoPorUsuarioId,
        referencia: lote.id,
        payload: {
          loteId: lote.id,
          arquivoOrigem: lote.nomeArquivo,
          linhasRecebidas: lote.linhasRecebidas,
          linhasResolvidas: lote.linhasResolvidas,
          linhasComPendencia: lote.linhasComPendencia,
        },
      })
    );
  }

  if (periodo.contadorConfirmadoEm && periodo.contadorUsuarioId) {
    eventos.push(
      criarEvento({
        ocorridoEm: periodo.contadorConfirmadoEm,
        instituicaoId: periodo.instituicaoId,
        periodoId: periodo.id,
        moduloId: periodo.moduloId,
        competencia: periodo.competencia,
        tipo: "ENQUADRAMENTO_FISCAL_CONFIRMADO",
        usuarioId: periodo.contadorUsuarioId,
        referencia: null,
        payload: {
          usuarioId: periodo.contadorUsuarioId,
          dpsConfirmadas: periodo.totaisResumo.dps ?? null,
          observacao: "Enquadramento tributário revisado e confirmado.",
        },
      })
    );
  }
}

for (const arquivo of arquivos) {
  const periodo = periodos.find((item) => item.id === arquivo.periodoId);
  if (!periodo) continue;
  eventos.push(
    criarEvento({
      ocorridoEm: arquivo.geradoEm,
      instituicaoId: periodo.instituicaoId,
      periodoId: periodo.id,
      moduloId: periodo.moduloId,
      competencia: periodo.competencia,
      tipo: arquivo.versao > 1 ? "ARQUIVO_REGERADO" : "ARQUIVO_GERADO",
      usuarioId: arquivo.geradoPorUsuarioId,
      referencia: arquivo.hashSha256,
      payload: {
        arquivoId: arquivo.id,
        nomeArquivo: arquivo.nomeArquivo,
        hashSha256: arquivo.hashSha256,
        tamanhoBytes: arquivo.tamanhoBytes,
        schema: arquivo.schema,
        versaoSchema: arquivo.versaoSchema,
        registros: arquivo.quantidadeRegistros,
      },
    })
  );
}

for (const validacao of validacoes) {
  const periodo = periodos.find((item) => item.id === validacao.periodoId);
  if (!periodo) continue;
  eventos.push(
    criarEvento({
      ocorridoEm: validacao.executadaEm,
      instituicaoId: periodo.instituicaoId,
      periodoId: periodo.id,
      moduloId: periodo.moduloId,
      competencia: periodo.competencia,
      tipo: validacao.totalErros > 0 ? "VALIDACAO_COM_EXCECOES" : "VALIDACAO_CONCLUIDA",
      usuarioId: validacao.executadaPorUsuarioId,
      referencia: validacao.arquivoId,
      payload: {
        arquivoId: validacao.arquivoId,
        schema: validacao.schema,
        versaoSchema: validacao.versaoSchema,
        erros: validacao.totalErros,
        avisos: validacao.totalAvisos,
        duracaoMs: validacao.duracaoMs,
      },
    })
  );
}

for (const periodo of periodos) {
  if (periodo.liberadoEm && periodo.liberadoPorUsuarioId) {
    const arquivoCorrente = arquivos.find((item) => item.id === periodo.arquivoCorrenteId);
    eventos.push(
      criarEvento({
        ocorridoEm: periodo.liberadoEm,
        instituicaoId: periodo.instituicaoId,
        periodoId: periodo.id,
        moduloId: periodo.moduloId,
        competencia: periodo.competencia,
        tipo: "PERIODO_LIBERADO",
        usuarioId: periodo.liberadoPorUsuarioId,
        referencia: arquivoCorrente?.hashSha256 ?? null,
        payload: {
          usuarioValidador: periodo.liberadoPorUsuarioId,
          usuarioExecutor: periodo.geradoPorUsuarioId,
          hashSha256: arquivoCorrente?.hashSha256 ?? null,
          segregacaoOk: periodo.liberadoPorUsuarioId !== periodo.geradoPorUsuarioId,
        },
      })
    );
  }

  if (periodo.aprovadoEm && periodo.aprovadoPorUsuarioId) {
    const arquivoCorrente = arquivos.find((item) => item.id === periodo.arquivoCorrenteId);
    eventos.push(
      criarEvento({
        ocorridoEm: periodo.aprovadoEm,
        instituicaoId: periodo.instituicaoId,
        periodoId: periodo.id,
        moduloId: periodo.moduloId,
        competencia: periodo.competencia,
        tipo: "PERIODO_APROVADO",
        usuarioId: periodo.aprovadoPorUsuarioId,
        referencia: arquivoCorrente?.hashSha256 ?? null,
        payload: {
          usuarioDiretor: periodo.aprovadoPorUsuarioId,
          textoCiencia:
            "Declaro que revisei o conteúdo deste arquivo e assumo a responsabilidade pela obrigação perante o órgão competente.",
          hashSha256: arquivoCorrente?.hashSha256 ?? null,
        },
      })
    );
  }

  if (periodo.entregueEm && periodo.protocoloId) {
    const protocolo = protocolos.find((item) => item.id === periodo.protocoloId);
    if (protocolo) {
      eventos.push(
        criarEvento({
          ocorridoEm: periodo.entregueEm,
          instituicaoId: periodo.instituicaoId,
          periodoId: periodo.id,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          tipo: periodo.moduloId === "fiscal" ? "DPS_ENCAMINHADA_AO_EMISSOR" : "ENTREGA_REGISTRADA",
          usuarioId: protocolo.registradoPorUsuarioId,
          referencia: protocolo.numeroProtocolo,
          payload:
            periodo.moduloId === "fiscal"
              ? {
                  emissor: protocolo.canalEnvio,
                  quantidadeDps: periodo.totaisResumo.dps ?? null,
                  valorTotal: periodo.totaisResumo.valorServicos ?? null,
                  observacao: "Encaminhamento registrado na trilha de auditoria.",
                }
              : {
                  protocoloBcb: protocolo.numeroProtocolo,
                  dataHoraEnvio: protocolo.dataHoraEnvio,
                  canal: protocolo.canalEnvio,
                  reciboHash: protocolo.reciboHash,
                },
        })
      );
    }
  }
}

for (const protocolo of protocolos) {
  if (protocolo.situacaoRetorno === "rejeitado" && protocolo.dataRetorno) {
    const periodo = periodos.find((item) => item.id === protocolo.periodoId);
    if (periodo) {
      eventos.push(
        criarEvento({
          ocorridoEm: protocolo.dataRetorno,
          instituicaoId: periodo.instituicaoId,
          periodoId: periodo.id,
          moduloId: periodo.moduloId,
          competencia: periodo.competencia,
          tipo: "RETORNO_BCB_REJEITADO",
          usuarioId: "usr-clarice",
          referencia: protocolo.numeroProtocolo,
          payload: {
            protocoloBcb: protocolo.numeroProtocolo,
            codigoRetorno: protocolo.codigoRetorno,
            mensagemRetorno: protocolo.mensagemRetorno,
          },
        })
      );
    }
  }
}

for (const excecao of excecoes) {
  const periodo = periodos.find((item) => item.id === excecao.periodoId);
  if (!periodo) continue;
  eventos.push(
    criarEvento({
      ocorridoEm: excecao.abertaEm,
      instituicaoId: periodo.instituicaoId,
      periodoId: periodo.id,
      moduloId: periodo.moduloId,
      competencia: periodo.competencia,
      tipo: "EXCECAO_ABERTA",
      usuarioId: excecao.abertaPorUsuarioId,
      referencia: excecao.codigo,
      payload: { codigo: excecao.codigo, severidade: excecao.severidade, titulo: excecao.titulo },
    })
  );

  if (excecao.tratadaEm && excecao.tratadaPorUsuarioId) {
    eventos.push(
      criarEvento({
        ocorridoEm: excecao.tratadaEm,
        instituicaoId: periodo.instituicaoId,
        periodoId: periodo.id,
        moduloId: periodo.moduloId,
        competencia: periodo.competencia,
        tipo: "EXCECAO_TRATADA",
        usuarioId: excecao.tratadaPorUsuarioId,
        referencia: excecao.codigo,
        payload: { codigo: excecao.codigo, status: excecao.status, justificativa: excecao.justificativa },
      })
    );
  }
}

eventos.push(
  criarEvento({
    ocorridoEm: "2026-08-25T11:20:00-03:00",
    instituicaoId: "inst-pampulha",
    periodoId: null,
    moduloId: null,
    competencia: null,
    tipo: "USUARIO_CONVIDADO",
    usuarioId: "usr-sergio",
    referencia: "usr-amanda",
    payload: { convidadoNome: "Amanda Rios", perfil: "operacional", modulos: ["acam212", "fiscal"] },
  }),
  criarEvento({
    ocorridoEm: "2026-09-01T09:10:00-03:00",
    instituicaoId: "inst-meridian",
    periodoId: null,
    moduloId: "acam212",
    competencia: null,
    tipo: "DICIONARIO_ATUALIZADO",
    usuarioId: "usr-paula",
    referencia: null,
    payload: { dicionario: "ativos_virtuais", linhaAlterada: "SOL", campo: "codigoOficial" },
  }),
  criarEvento({
    ocorridoEm: "2026-09-05T16:45:00-03:00",
    instituicaoId: "inst-cofre-atlantico",
    periodoId: null,
    moduloId: "fiscal",
    competencia: null,
    tipo: "DICIONARIO_ATUALIZADO",
    usuarioId: "usr-joao",
    referencia: null,
    payload: { dicionario: "fiscal", municipio: "4205407", campo: "codigoServico" },
  }),
  criarEvento({
    ocorridoEm: "2026-08-10T10:00:00-03:00",
    instituicaoId: "inst-meridian",
    periodoId: null,
    moduloId: null,
    competencia: null,
    tipo: "CONFIG_INSTITUICAO_ALTERADA",
    usuarioId: "usr-ricardo",
    referencia: null,
    payload: { campo: "responsavelBcb.telefone", valorAnterior: "(11) 3045-8800", valorNovo: "(11) 3045-8812" },
  }),
  criarEvento({
    ocorridoEm: "2026-09-16T07:30:00-03:00",
    instituicaoId: "inst-meridian",
    periodoId: "per-meridian-acam212-202607",
    moduloId: "acam212",
    competencia: "2026-07",
    tipo: "HASH_REVERIFICADO",
    usuarioId: "usr-clarice",
    referencia: "7b3e11d0",
    payload: { arquivoId: "arq-meridian-acam212-202607-v1", resultado: "integro" },
  }),
  criarEvento({
    ocorridoEm: "2026-09-15T17:00:00-03:00",
    instituicaoId: "inst-cofre-atlantico",
    periodoId: null,
    moduloId: null,
    competencia: null,
    tipo: "TRILHA_EXPORTADA",
    usuarioId: "usr-helena",
    referencia: null,
    payload: { filtro: { modulo: "cadoc5711", periodo: "últimos 30 dias" }, formato: "csv" },
  })
);

eventos.sort((a, b) => (a.ocorridoEm < b.ocorridoEm ? -1 : a.ocorridoEm > b.ocorridoEm ? 1 : 0));

export const eventosAuditoria: EventoAuditoria[] = eventos;

export function eventosPorInstituicao(instituicaoId: string): EventoAuditoria[] {
  return eventosAuditoria.filter((evento) => evento.instituicaoId === instituicaoId);
}

export function eventosPorPeriodo(periodoId: string): EventoAuditoria[] {
  return eventosAuditoria.filter((evento) => evento.periodoId === periodoId);
}

export function ultimosEventos(quantidade: number): EventoAuditoria[] {
  return [...eventosAuditoria].sort((a, b) => (a.ocorridoEm < b.ocorridoEm ? 1 : -1)).slice(0, quantidade);
}
