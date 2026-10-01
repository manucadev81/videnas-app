import type { EventoAuditoria } from "@/lib/tipos";
import { formatarDataHora, truncarHash } from "@/lib/formatadores";

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
    return {
      resumo: numeroNegativa
        ? `Negativa ${numeroNegativa}${limiar ? (numeroNegativa > limiar ? ` (limite ${limiar})` : ` de ${limiar}`) : ""}`
        : "Negativa sem numeração registrada",
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
        `${texto(registro.papel) ?? "Participante"}: ${texto(registro.nome) ?? texto(registro.usuarioId) ?? "—"}${
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
      linhas.push(`Estado: ${estadoAnterior} -> ${estadoNovo}`);
    }
    const lacre = texto(payload.lacreAtaId);
    const hashAta = texto(payload.hashAta);
    if (lacre) {
      linhas.push(`Ata lacrada: ${lacre}${hashAta ? ` · hash ${truncarHash(hashAta)}` : ""}`);
    }
    return {
      resumo:
        payload.desfecho === "negativa_superada"
          ? "Negativa superada, devolvida ao Diretor"
          : "Negativa mantida, devolvida ao Executor com plano de correção",
      linhas,
    };
  }

  return null;
}
