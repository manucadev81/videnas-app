import type {
  AcaoId,
  EstadoPeriodo,
  EventoAuditoria,
  ModuloId,
  PerfilId,
  SituacaoRetornoBcb,
  TipoEventoAuditoria,
} from "@/lib/tipos";

export const BOM_UTF8 = "﻿";

export const CABECALHO_TRILHA_CSV = [
  "data_hora_iso",
  "evento_id",
  "tipo_evento",
  "rotulo_tipo",
  "usuario_nome",
  "usuario_perfil",
  "lado",
  "instituicao_id",
  "instituicao",
  "periodo_id",
  "modulo",
  "competencia",
  "referencia",
  "hash_sha256",
  "resumo_payload",
] as const;

export interface ContextoExportacaoTrilha {
  rotulosTipo: Record<TipoEventoAuditoria, string>;
  rotuloPerfil: (perfilId: PerfilId) => string;
  rotuloModulo: (moduloId: ModuloId) => string;
  nomeInstituicao: (instituicaoId: string) => string;
  rotuloEstado: (estado: EstadoPeriodo) => string;
  rotuloAcao: (acaoId: AcaoId) => string;
}

const ROTULOS_SITUACAO_RETORNO: Record<SituacaoRetornoBcb, string> = {
  aguardando: "Aguardando retorno",
  aceito: "Aceito",
  aceito_com_ressalvas: "Aceito com ressalvas",
  rejeitado: "Rejeitado",
};

const INICIO_PERIGOSO = /^[=+\-@\t\r]/;

export function escaparCelulaCsv(valor: string): string {
  const seguro = INICIO_PERIGOSO.test(valor) ? `'${valor}` : valor;
  if (/[",\r\n;]/.test(seguro)) {
    return `"${seguro.replace(/"/g, '""')}"`;
  }
  return seguro;
}

function rotularValorBruto(chave: string, valor: string, contexto: ContextoExportacaoTrilha): string {
  const nome = chave.toLowerCase();
  if (nome.includes("estado")) {
    return contexto.rotuloEstado(valor as EstadoPeriodo) ?? valor;
  }
  if (nome.includes("perfil") || nome === "origem") {
    return contexto.rotuloPerfil(valor as PerfilId) ?? valor;
  }
  if (nome.startsWith("acao")) {
    return contexto.rotuloAcao(valor as AcaoId) ?? valor;
  }
  if (nome.startsWith("resultado") || nome.includes("situacao")) {
    return ROTULOS_SITUACAO_RETORNO[valor as SituacaoRetornoBcb] ?? valor;
  }
  if (nome === "moduloid") {
    return contexto.rotuloModulo(valor as ModuloId) ?? valor;
  }
  if (nome === "instituicaoid") {
    return contexto.nomeInstituicao(valor) || valor;
  }
  return valor;
}

function rotularValor(chave: string, valor: string, contexto: ContextoExportacaoTrilha): string {
  try {
    return rotularValorBruto(chave, valor, contexto) || valor;
  } catch {
    return valor;
  }
}

function rotularEstrutura(chave: string, valor: unknown, contexto: ContextoExportacaoTrilha): unknown {
  if (typeof valor === "string") {
    return rotularValor(chave, valor, contexto);
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => rotularEstrutura(chave, item, contexto));
  }
  if (valor && typeof valor === "object") {
    const origem = valor as Record<string, unknown>;
    const rotulado: Record<string, unknown> = {};
    for (const subchave of Object.keys(origem)) {
      rotulado[subchave] = rotularEstrutura(subchave, origem[subchave], contexto);
    }
    return rotulado;
  }
  return valor;
}

function valorParaResumo(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return "";
  }
  if (typeof valor === "string") {
    return valor;
  }
  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }
  return JSON.stringify(ordenarChaves(valor));
}

function ordenarChaves(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor.map(ordenarChaves);
  }
  if (valor && typeof valor === "object") {
    const origem = valor as Record<string, unknown>;
    const ordenado: Record<string, unknown> = {};
    for (const chave of Object.keys(origem).sort()) {
      ordenado[chave] = ordenarChaves(origem[chave]);
    }
    return ordenado;
  }
  return valor;
}

export function resumirPayload(
  payload: Record<string, unknown>,
  contexto: ContextoExportacaoTrilha
): string {
  return Object.keys(payload)
    .sort()
    .map((chave) => `${chave.replace(/Diretor/g, "Compliance")}=${valorParaResumo(rotularEstrutura(chave, payload[chave], contexto))}`)
    .join("; ");
}

function hashDoEvento(evento: EventoAuditoria): string {
  const candidatos = [evento.payload.hashSha256, evento.payload.hashDossie, evento.payload.hashAta];
  const encontrado = candidatos.find((item) => typeof item === "string" && item.length > 0);
  return typeof encontrado === "string" ? encontrado : "";
}

export function montarLinhaTrilha(evento: EventoAuditoria, contexto: ContextoExportacaoTrilha): string[] {
  return [
    evento.ocorridoEm,
    evento.id,
    evento.tipo,
    contexto.rotulosTipo[evento.tipo] ?? evento.rotuloTipo,
    evento.usuarioNome,
    contexto.rotuloPerfil(evento.perfilId),
    evento.lado === "videnas" ? "Videnas" : "Cliente",
    evento.instituicaoId,
    contexto.nomeInstituicao(evento.instituicaoId),
    evento.periodoId ?? "",
    evento.moduloId ? contexto.rotuloModulo(evento.moduloId) : "",
    evento.competencia ?? "",
    evento.referencia ?? "",
    hashDoEvento(evento),
    resumirPayload(evento.payload, contexto),
  ];
}

export function montarCsvTrilha(eventos: EventoAuditoria[], contexto: ContextoExportacaoTrilha): string {
  const linhas = [
    [...CABECALHO_TRILHA_CSV],
    ...eventos.map((evento) => montarLinhaTrilha(evento, contexto)),
  ];
  return BOM_UTF8 + linhas.map((linha) => linha.map(escaparCelulaCsv).join(",")).join("\r\n") + "\r\n";
}

function slugEscopo(escopo: string): string {
  const base = escopo
    .replace(/^inst-/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "todas";
}

export function nomeArquivoTrilha(escopo: string, dataIso: string): string {
  return `trilha-auditoria-${slugEscopo(escopo)}-${dataIso.slice(0, 10)}.csv`;
}

export function baixarCsv(nomeArquivo: string, conteudo: string): void {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const ancora = document.createElement("a");
  ancora.href = url;
  ancora.download = nomeArquivo;
  ancora.style.display = "none";
  document.body.appendChild(ancora);
  ancora.click();
  document.body.removeChild(ancora);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
