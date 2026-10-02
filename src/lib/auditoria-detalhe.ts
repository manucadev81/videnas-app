import type { EstadoPeriodo, EventoAuditoria } from "@/lib/tipos";
import { formatarData, formatarDataHora, truncarHash } from "@/lib/formatadores";
import { rotularReferencia } from "@/lib/auditoria/referencia";
import { rotuloEstadoPeriodo } from "@/components/dominio/badge-status";

export interface DetalheEventoLegivel {
  resumo: string;
  linhas: string[];
}

function numero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

function rotularUsuarioId(usuarioId: string | null): string {
  return usuarioId ? rotularReferencia(usuarioId) : "—";
}

export function detalheLegivelDoEvento(evento: EventoAuditoria): DetalheEventoLegivel | null {
  const payload = evento.payload;

  if (evento.tipo === "APROVACAO_NEGADA") {
    const numeroNegativa = numero(payload.numeroNegativa);
    const limiar = numero(payload.limiarComite);
    const versao = numero(payload.versaoArquivo);
    const hash = texto(payload.hashSha256);
    const linhas: string[] = [];
    if (versao || hash) {
      linhas.push(
        `Arquivo negado: ${versao ? `v${versao}` : "versão não identificada"}${hash ? ` · hash ${truncarHash(hash)}` : ""}`
      );
    }
    const motivo = texto(payload.motivo);
    if (motivo) {
      linhas.push(`Motivo: ${motivo}`);
    }
    if (payload.escalouParaComite === true) {
      linhas.push("Esta negativa atingiu o limite e escalou o período ao Comitê de Qualidade.");
    }
    const cicloNegativa = numero(payload.cicloEnvio);
    if (cicloNegativa && cicloNegativa > 1) {
      linhas.push(`Ciclo de envio ${cicloNegativa} (${texto(payload.tipoRemessa) ?? "S"})`);
    }
    return {
      resumo: numeroNegativa
        ? `Negativa ${numeroNegativa}${limiar ? (numeroNegativa > limiar ? ` (limite ${limiar})` : ` de ${limiar}`) : ""}`
        : "Negativa sem numeração registrada",
      linhas,
    };
  }

  if (evento.tipo === "SUBSTITUICAO_INICIADA") {
    const cicloAnterior = numero(payload.cicloAnterior);
    const cicloNovo = numero(payload.cicloNovo);
    const linhas: string[] = [];
    const justificativa = texto(payload.justificativa);
    if (justificativa) {
      linhas.push(`Justificativa: ${justificativa}`);
    }
    const protocolo = texto(payload.protocoloSubstituido);
    linhas.push(`Protocolo substituído: ${protocolo ?? "não identificado"}`);
    const negativas = numero(payload.negativasCicloAnterior);
    if (negativas !== null) {
      linhas.push(
        `Contador de negativas zerado; ${negativas} negativa${negativas === 1 ? "" : "s"} do ciclo anterior ficam no histórico.`
      );
    }
    const lacre = texto(payload.lacreAnteriorId);
    const hashLacre = texto(payload.hashLacreAnterior);
    if (lacre) {
      linhas.push(`Cadeia de lacres continua após ${lacre}${hashLacre ? ` · hash ${truncarHash(hashLacre)}` : ""}`);
    }
    return {
      resumo: `Ciclo ${cicloAnterior ?? "?"} (${texto(payload.tipoRemessaAnterior) ?? "I"}) -> Ciclo ${cicloNovo ?? "?"} (${texto(payload.tipoRemessaNovo) ?? "S"})`,
      linhas,
    };
  }

  if (evento.tipo === "COMITE_QUALIDADE_ACIONADO") {
    const historico = Array.isArray(payload.historicoNegativas) ? payload.historicoNegativas : [];
    const linhas = historico.map((item) => {
      const registro = item as Record<string, unknown>;
      const n = numero(registro.numero);
      const versao = numero(registro.versaoArquivo);
      const hash = texto(registro.hashArquivo);
      const quando = texto(registro.ocorridoEm);
      return [
        `Negativa ${n ?? "?"}`,
        versao ? `v${versao}` : null,
        hash ? `hash ${truncarHash(hash)}` : null,
        texto(registro.usuarioNome),
        quando ? formatarDataHora(quando) : null,
        texto(registro.motivo),
      ]
        .filter(Boolean)
        .join(" · ");
    });
    const lacre = texto(payload.lacreDossieId);
    if (lacre) {
      linhas.push(`Dossiê lacrado: ${lacre}`);
    }
    const limiar = numero(payload.limiarComite);
    return {
      resumo: `Escalado após ${historico.length} negativa${historico.length === 1 ? "" : "s"}${limiar ? ` (limite ${limiar})` : ""}`,
      linhas,
    };
  }

  if (evento.tipo === "COMITE_QUALIDADE_DECIDIU") {
    const participantes = Array.isArray(payload.participantes) ? payload.participantes : [];
    const linhas: string[] = [];
    const rotuloDesfecho = texto(payload.rotuloDesfecho);
    if (rotuloDesfecho) {
      linhas.push(`Desfecho: ${rotuloDesfecho}`);
    }
    for (const item of participantes) {
      const registro = item as Record<string, unknown>;
      linhas.push(
        `${texto(registro.papel) ?? "Participante"}: ${texto(registro.nome) ?? rotularUsuarioId(texto(registro.usuarioId))}${
          texto(registro.perfilId) ? ` (${texto(registro.perfilId)})` : ""
        }`
      );
    }
    const quorum = texto(payload.quorum);
    if (quorum) {
      linhas.push(`Quórum: ${quorum}`);
    }
    const justificativa = texto(payload.justificativa);
    if (justificativa) {
      linhas.push(`Justificativa: ${justificativa}`);
    }
    const plano = texto(payload.planoCorrecao);
    if (plano) {
      linhas.push(`Plano de correção: ${plano}`);
    }
    const estadoAnterior = texto(payload.estadoAnterior);
    const estadoNovo = texto(payload.estadoNovo);
    if (estadoAnterior && estadoNovo) {
      linhas.push(
        `Estado: ${rotuloEstadoPeriodo(estadoAnterior as EstadoPeriodo)} -> ${rotuloEstadoPeriodo(estadoNovo as EstadoPeriodo)}`
      );
    }
    const lacre = texto(payload.lacreAtaId);
    const hashAta = texto(payload.hashAta);
    if (lacre) {
      linhas.push(`Ata lacrada: ${lacre}${hashAta ? ` · hash ${truncarHash(hashAta)}` : ""}`);
    }
    return {
      resumo:
        payload.desfecho === "negativa_superada"
          ? "Negativa superada, devolvida ao Responsável de Compliance"
          : "Negativa mantida, devolvida ao Executor com plano de correção",
      linhas,
    };
  }

  if (evento.tipo === "PERIODO_APROVADO" && payload.contratoCongelado) {
    const contrato = payload.contratoCongelado as Record<string, unknown>;
    const congeladoEm = texto(contrato.congeladoEm);
    const linhas = [
      `Contrato congelado${congeladoEm ? ` em ${formatarData(congeladoEm)}` : ""}`,
      `Emissão incluída: ${contrato.emissaoIncluida === true ? "sim" : "não"}`,
      `Transmissão incluída: ${contrato.transmissaoIncluida === true ? "sim" : "não"}`,
      `Responsável pela transmissão: ${contrato.responsavelTransmissao === "diretor" ? "Responsável de Compliance da instituição" : "Videnas"}`,
    ];
    const cadastro = texto(contrato.cadastroId);
    if (cadastro) {
      linhas.push(`Cadastro prévio de referência: ${cadastro}`);
    }
    return { resumo: "Período aprovado com o contrato vigente congelado", linhas };
  }

  if (evento.tipo === "DOCUMENTO_FISCAL_EMITIDO") {
    const linhas: string[] = [];
    const hash = texto(payload.hashDocumento);
    const lacre = texto(payload.lacreDocumentoId);
    const nome = texto(payload.nomeDocumento);
    if (nome) {
      linhas.push(`Documento: ${nome}`);
    }
    if (lacre) {
      linhas.push(`Lacre: ${lacre}${hash ? ` · hash ${truncarHash(hash)}` : ""}`);
    }
    const hashDps = texto(payload.hashArquivoDps);
    if (hashDps) {
      linhas.push(`DPS de origem: hash ${truncarHash(hashDps)}`);
    }
    return {
      resumo: `Documento fiscal ${texto(payload.numeroDocumento) ?? "sem número"} emitido`,
      linhas,
    };
  }

  if (evento.tipo === "TRANSMISSAO_REALIZADA") {
    const linhas: string[] = [];
    const responsavel = texto(payload.responsavelTransmissao);
    linhas.push(
      `Transmitido ${responsavel === "diretor" ? "pelo Responsável de Compliance da instituição" : "pela Videnas"}`
    );
    const cadastro = texto(payload.cadastroIdentificador) ?? texto(payload.cadastroId);
    if (cadastro) {
      linhas.push(`Cadastro prévio: ${cadastro}`);
    }
    if (texto(payload.tipoRemessa) === "S") {
      linhas.push(
        `Remessa de substituição (S), ciclo ${numero(payload.cicloEnvio) ?? "?"}: substitui o protocolo ${texto(payload.protocoloSubstituido) ?? "não identificado"}`
      );
    }
    const lacre = texto(payload.lacreComprovanteId);
    const hash = texto(payload.hashComprovante);
    if (lacre) {
      linhas.push(`Comprovante lacrado: ${lacre}${hash ? ` · hash ${truncarHash(hash)}` : ""}`);
    }
    return {
      resumo: `Protocolo ${texto(payload.protocolo) ?? "sem número"}${
        responsavel === "diretor" ? " (Compliance)" : " (Videnas)"
      }`,
      linhas,
    };
  }

  if (evento.tipo === "PROTOCOLO_MANUAL_REGISTRADO") {
    const linhas: string[] = [];
    const motivo = texto(payload.motivoTransmissaoManual);
    if (motivo) {
      linhas.push(`Transmissão automática indisponível: ${motivo}`);
    }
    const justificativa = texto(payload.justificativa);
    if (justificativa) {
      linhas.push(`Justificativa: ${justificativa}`);
    }
    if (texto(payload.tipoRemessa) === "S") {
      linhas.push(
        `Remessa de substituição (S), ciclo ${numero(payload.cicloEnvio) ?? "?"}: substitui o protocolo ${texto(payload.protocoloSubstituido) ?? "não identificado"}`
      );
    }
    const anexo = texto(payload.anexoNome);
    linhas.push(anexo ? `Comprovante anexado: ${anexo}` : "Sem comprovante anexado");
    const recibo = texto(payload.reciboLacreId);
    if (recibo) {
      linhas.push(`Recibo lacrado: ${recibo}`);
    }
    return {
      resumo: `Protocolo manual ${texto(payload.protocolo) ?? "sem número"}`,
      linhas,
    };
  }

  if (evento.tipo === "DPS_ENCAMINHADA_AO_EMISSOR" && texto(payload.reciboLacreId)) {
    return {
      resumo: `Encaminhada a ${texto(payload.emissor) ?? "emissor não informado"}`,
      linhas: [`Recibo lacrado: ${texto(payload.reciboLacreId)}`],
    };
  }

  if (evento.tipo === "MODULOS_CONTRATADOS_ALTERADOS" && payload.escopo === "contrato") {
    const antes = (payload.antes ?? {}) as Record<string, unknown>;
    const depois = (payload.depois ?? {}) as Record<string, unknown>;
    const campos: [string, string][] = [
      ["emissaoIncluida", "Emissão incluída"],
      ["transmissaoIncluida", "Transmissão incluída"],
      ["responsavelTransmissao", "Responsável pela transmissão"],
    ];
    const formatar = (valor: unknown) =>
      valor === true ? "sim" : valor === false ? "não" : valor === "diretor" ? "Compliance" : valor === "videnas" ? "Videnas" : "—";
    const linhas = campos
      .filter(([chave]) => antes[chave] !== depois[chave])
      .map(([chave, rotulo]) => `${rotulo}: ${formatar(antes[chave])} -> ${formatar(depois[chave])}`);
    return {
      resumo: `Contrato do módulo ${texto(payload.moduloId) ?? ""} alterado`.trim(),
      linhas,
    };
  }

  if (evento.tipo === "AREA_CLIENTE_NOTIFICADA") {
    const linhas = [`Contato: ${texto(payload.responsavelNome) ?? "—"} <${texto(payload.email) ?? "—"}>`];
    const motivo = texto(payload.motivo);
    if (motivo) {
      linhas.push(motivo);
    }
    linhas.push(payload.simulado === true ? "Notificação simulada: nenhum e-mail real foi enviado." : "Notificação enviada.");
    return { resumo: `Área ${texto(payload.areaNome) ?? "não identificada"} notificada`, linhas };
  }

  if (evento.tipo === "VALIDADOR_SORTEADO") {
    const elegiveis = Array.isArray(payload.elegiveis) ? payload.elegiveis : [];
    const nomes = elegiveis
      .map((item) => {
        const registro = (item ?? {}) as Record<string, unknown>;
        const nome = texto(registro.nome);
        const nivel = texto(registro.nivel);
        return nome ? (nivel ? `${nome} (${nivel})` : nome) : null;
      })
      .filter((nome): nome is string => nome !== null);
    const sorteadoNivel = texto(payload.sorteadoNivel);
    const linhas = [
      `Elegíveis: ${nomes.length > 0 ? nomes.join(", ") : "—"}`,
      "Critério: sorteio entre os validadores com acesso ao módulo e à instituição, exceto quem gerou o arquivo.",
    ];
    const hash = texto(payload.hashSha256);
    if (hash) {
      linhas.push(`Arquivo: hash ${truncarHash(hash)}`);
    }
    return {
      resumo: `Sorteado: ${texto(payload.sorteadoNome) ?? "—"}${sorteadoNivel ? ` (${sorteadoNivel})` : ""}`,
      linhas,
    };
  }

  if (evento.tipo === "CONFIG_INSTITUICAO_ALTERADA" && payload.escopo === "areas_cliente") {
    const alteradas = Array.isArray(payload.areasAlteradas) ? payload.areasAlteradas : [];
    return {
      resumo: `Áreas do cliente alteradas (${alteradas.length})`,
      linhas: alteradas.map((item) => String(item)),
    };
  }

  if (evento.tipo === "TRILHA_EXPORTADA" && numero(payload.quantidade) !== null) {
    const linhas = [`Arquivo: ${texto(payload.nomeArquivo) ?? "—"}`];
    const filtros = (payload.filtros ?? {}) as Record<string, unknown>;
    const filtrosAplicados = Object.entries(filtros)
      .filter(([, valor]) => valor !== null && valor !== "" && valor !== "todos")
      .map(([chave, valor]) => `${chave}=${String(valor)}`);
    linhas.push(filtrosAplicados.length > 0 ? `Filtros: ${filtrosAplicados.join("; ")}` : "Sem filtros adicionais");
    return { resumo: `${numero(payload.quantidade)} evento(s) exportado(s)`, linhas };
  }

  return null;
}
