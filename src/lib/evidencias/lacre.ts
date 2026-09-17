import type { ModuloId, PerfilId, RegistroLacre, SentidoLacre } from "@/lib/tipos";
import {
  ALGORITMO_HASH,
  AVISO_SIMULACAO_ENVELOPE,
  calcularHashSha256,
  selarEnvelope,
} from "@/lib/evidencias/cripto";

export const ROTULOS_SENTIDO_LACRE: Record<SentidoLacre, string> = {
  entrada: "Entrada — dado recebido do cliente",
  saida: "Saída — arquivo devolvido pela Videnas",
};

const PREFIXO_SENTIDO: Record<SentidoLacre, string> = {
  entrada: "ENT",
  saida: "SAI",
};

const LIMITE_RESUMO_CONTEUDO = 200;

const contadoresDeSequencia = new Map<string, number>();

export interface AutorLacre {
  usuarioId: string;
  nome: string;
  perfilId: PerfilId;
}

export interface EntradaConstrucaoLacre {
  sentido: SentidoLacre;
  instituicaoId: string;
  moduloId: ModuloId;
  competencia: string;
  periodoId: string;
  insumoId: string | null;
  arquivoId?: string | null;
  conteudo: string | ArrayBuffer;
  origemNome: string;
  tamanhoBytes: number;
  autor: AutorLacre;
  hashAnterior: string | null;
  sequencia?: number;
  seladoEm?: string;
}

export interface ChaveCadeia {
  instituicaoId: string;
  moduloId: ModuloId;
  competencia: string;
  insumoId: string | null;
}

export function chaveDaCadeia(lacre: RegistroLacre): string {
  return [lacre.instituicaoId, lacre.moduloId, lacre.competencia, lacre.insumoId ?? "-"].join("|");
}

export function chaveDaCadeiaDe(chave: ChaveCadeia): string {
  return [chave.instituicaoId, chave.moduloId, chave.competencia, chave.insumoId ?? "-"].join("|");
}

export function filtrarCadeia(lacres: RegistroLacre[], chave: ChaveCadeia): RegistroLacre[] {
  const alvo = chaveDaCadeiaDe(chave);
  return lacres
    .filter((lacre) => chaveDaCadeia(lacre) === alvo)
    .sort((a, b) => a.seladoEm.localeCompare(b.seladoEm));
}

export function encadearApos(lacresExistentes: RegistroLacre[], chave?: ChaveCadeia): string | null {
  const candidatos = chave ? filtrarCadeia(lacresExistentes, chave) : [...lacresExistentes];
  if (candidatos.length === 0) {
    return null;
  }
  const ordenados = chave
    ? candidatos
    : candidatos.sort((a, b) => a.seladoEm.localeCompare(b.seladoEm));
  return ordenados[ordenados.length - 1].hashSha256;
}

function proximaSequencia(prefixo: string, sequencia?: number): number {
  if (typeof sequencia === "number" && Number.isFinite(sequencia)) {
    return Math.max(1, Math.trunc(sequencia));
  }
  const atual = (contadoresDeSequencia.get(prefixo) ?? 0) + 1;
  contadoresDeSequencia.set(prefixo, atual);
  return atual;
}

export function montarIdentificadorLacre(
  sentido: SentidoLacre,
  moduloId: ModuloId,
  competencia: string,
  sequencia: number
): string {
  const competenciaCompacta = competencia.replace(/-/g, "");
  const ordem = String(sequencia).padStart(4, "0");
  return `LCR-${PREFIXO_SENTIDO[sentido]}-${moduloId.toUpperCase()}-${competenciaCompacta}-${ordem}`;
}

export function sanitizarResumo(texto: string, limite: number = LIMITE_RESUMO_CONTEUDO): string {
  const limpo = texto
    .replace(/\r/g, " ")
    .replace(/\n/g, " ⏎ ")
    .replace(/\s+/g, " ")
    .trim();
  if (limpo.length <= limite) {
    return limpo;
  }
  return `${limpo.slice(0, limite)}…`;
}

export function resumirValoresDeFormulario(valores: Record<string, string>): string {
  const partes = Object.entries(valores)
    .filter(([, valor]) => typeof valor === "string" && valor.trim().length > 0)
    .map(([chave, valor]) => `${chave}=${valor.trim()}`);
  return sanitizarResumo(partes.join("; "));
}

function conteudoComoTexto(conteudo: string | ArrayBuffer): string {
  if (typeof conteudo === "string") {
    return conteudo;
  }
  return new TextDecoder().decode(new Uint8Array(conteudo));
}

export async function construirLacre(entrada: EntradaConstrucaoLacre): Promise<RegistroLacre> {
  const hashSha256 = await calcularHashSha256(
    typeof entrada.conteudo === "string" ? entrada.conteudo : new Uint8Array(entrada.conteudo)
  );

  const texto = conteudoComoTexto(entrada.conteudo);
  const envelope = await selarEnvelope(entrada.instituicaoId, texto);

  const prefixo = `${entrada.sentido}|${entrada.moduloId}|${entrada.competencia}`;
  const sequencia = proximaSequencia(prefixo, entrada.sequencia);

  return {
    id: montarIdentificadorLacre(
      entrada.sentido,
      entrada.moduloId,
      entrada.competencia,
      sequencia
    ),
    sentido: entrada.sentido,
    instituicaoId: entrada.instituicaoId,
    moduloId: entrada.moduloId,
    competencia: entrada.competencia,
    periodoId: entrada.periodoId,
    insumoId: entrada.insumoId,
    arquivoId: entrada.arquivoId ?? null,
    hashSha256,
    algoritmoHash: ALGORITMO_HASH,
    hashAnterior: entrada.hashAnterior,
    seladoEm: entrada.seladoEm ?? new Date().toISOString(),
    seladoPorUsuarioId: entrada.autor.usuarioId,
    seladoPorNome: entrada.autor.nome,
    perfilId: entrada.autor.perfilId,
    origemNome: entrada.origemNome,
    tamanhoBytes: entrada.tamanhoBytes,
    envelopeCifrado: envelope.envelopeCifrado,
    vetorInicializacao: envelope.vetorInicializacao,
    identificadorChave: envelope.identificadorChave,
    resumoConteudo: sanitizarResumo(texto),
  };
}

export interface ContextoComprovante {
  instituicaoNome: string;
  instituicaoCnpj?: string;
  moduloNome: string;
  competenciaRotulo: string;
  insumoRotulo?: string | null;
  observacao?: string;
}

export interface ComprovanteLacre {
  nomeArquivo: string;
  conteudo: string;
}

export function montarComprovante(
  lacre: RegistroLacre,
  contexto: ContextoComprovante
): ComprovanteLacre {
  const documento = {
    documento: "Comprovante de lacre criptográfico — Videnas",
    emitidoEm: new Date().toISOString(),
    lacre: {
      identificador: lacre.id,
      sentido: lacre.sentido,
      sentidoDescricao: ROTULOS_SENTIDO_LACRE[lacre.sentido],
      seladoEm: lacre.seladoEm,
      origemNome: lacre.origemNome,
      tamanhoBytes: lacre.tamanhoBytes,
      resumoConteudo: lacre.resumoConteudo,
    },
    instituicao: {
      identificador: lacre.instituicaoId,
      nome: contexto.instituicaoNome,
      cnpj: contexto.instituicaoCnpj ?? null,
    },
    obrigacao: {
      modulo: contexto.moduloNome,
      moduloIdentificador: lacre.moduloId,
      competencia: lacre.competencia,
      competenciaRotulo: contexto.competenciaRotulo,
      periodoIdentificador: lacre.periodoId,
      insumoIdentificador: lacre.insumoId,
      insumoRotulo: contexto.insumoRotulo ?? null,
    },
    autor: {
      usuarioIdentificador: lacre.seladoPorUsuarioId,
      nome: lacre.seladoPorNome,
      perfil: lacre.perfilId,
    },
    integridade: {
      algoritmoHash: lacre.algoritmoHash,
      hash: lacre.hashSha256,
      hashAnterior: lacre.hashAnterior,
      encadeado: lacre.hashAnterior !== null,
    },
    envelope: {
      identificadorChave: lacre.identificadorChave,
      vetorInicializacao: lacre.vetorInicializacao,
      envelopeCifrado: lacre.envelopeCifrado,
    },
    observacao: contexto.observacao ?? null,
    comoConferir:
      "Calcule o SHA-256 do arquivo original e compare com o campo integridade.hash. Se o valor bater, o arquivo é exatamente o mesmo que foi lacrado na data e hora registradas acima.",
    aviso: AVISO_SIMULACAO_ENVELOPE,
  };

  return {
    nomeArquivo: `comprovante-envio-${lacre.id}.json`,
    conteudo: JSON.stringify(documento, null, 2),
  };
}

export interface ResultadoVerificacaoIntegridade {
  confere: boolean;
  hashCalculado: string;
}

export async function verificarIntegridade(
  arquivo: File,
  hashEsperado: string
): Promise<ResultadoVerificacaoIntegridade> {
  const conteudo = await arquivo.arrayBuffer();
  const hashCalculado = await calcularHashSha256(new Uint8Array(conteudo));
  return {
    confere: hashCalculado.toLowerCase() === hashEsperado.trim().toLowerCase(),
    hashCalculado,
  };
}
