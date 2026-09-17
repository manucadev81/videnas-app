const DELIMITADORES_CANDIDATOS = [";", ",", "\t", "|"];
const CARACTERE_SUBSTITUICAO = "\uFFFD";

export function normalizarChave(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function removerMarcaDeOrdem(texto: string): string {
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
}

export function possuiCaractereInvalido(texto: string): boolean {
  return texto.includes(CARACTERE_SUBSTITUICAO);
}

export function obterExtensao(nomeArquivo: string): string {
  const partes = nomeArquivo.split(".");
  return partes.length > 1 ? (partes.at(-1) ?? "").toLowerCase() : "";
}

export function obterNomeBase(nomeArquivo: string): string {
  const partes = nomeArquivo.split(".");
  return partes.length > 1 ? partes.slice(0, -1).join(".") : nomeArquivo;
}

export function dividirLinha(linha: string, delimitador: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let indice = 0; indice < linha.length; indice += 1) {
    const caractere = linha[indice];
    if (caractere === '"') {
      if (dentroDeAspas && linha[indice + 1] === '"') {
        atual += '"';
        indice += 1;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
      continue;
    }
    if (caractere === delimitador && !dentroDeAspas) {
      campos.push(atual.trim());
      atual = "";
      continue;
    }
    atual += caractere;
  }

  campos.push(atual.trim());
  return campos;
}

export function detectarDelimitador(linhaCabecalho: string): string | null {
  let melhor: string | null = null;
  let melhorContagem = 0;

  for (const candidato of DELIMITADORES_CANDIDATOS) {
    const contagem = dividirLinha(linhaCabecalho, candidato).length - 1;
    if (contagem > melhorContagem) {
      melhor = candidato;
      melhorContagem = contagem;
    }
  }

  return melhor;
}

export function separarLinhas(conteudo: string): { numero: number; texto: string }[] {
  return conteudo
    .split(/\r\n|\n|\r/)
    .map((texto, indice) => ({ numero: indice + 1, texto }));
}

export function ehDataIso(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (mes < 1 || mes > 12) return false;
  const limite = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return dia >= 1 && dia <= limite;
}

export function ehDataBrasileira(valor: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return false;
  const [dia, mes, ano] = valor.split("/").map(Number);
  return ehDataIso(`${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
}

export function ehDataHoraIso(valor: string): boolean {
  const correspondencia = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(:\d{2})?(Z|[+-]\d{2}:\d{2})?$/.exec(valor);
  if (!correspondencia) return false;
  if (!ehDataIso(correspondencia[1])) return false;
  const hora = Number(correspondencia[2]);
  const minuto = Number(correspondencia[3]);
  return hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59;
}

export function competenciaDaData(valor: string): string | null {
  if (ehDataIso(valor)) return valor.slice(0, 7);
  if (ehDataBrasileira(valor)) {
    const [, mes, ano] = valor.split("/");
    return `${ano}-${mes}`;
  }
  if (ehDataHoraIso(valor)) return valor.slice(0, 7);
  return null;
}

export function converterNumero(valor: string): number | null {
  const limpo = valor.replace(/\s/g, "");
  if (limpo.length === 0) return null;

  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(limpo) || /^-?\d+,\d+$/.test(limpo)) {
    const numero = Number(limpo.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(numero) ? numero : null;
  }

  if (/^-?\d+(\.\d+)?$/.test(limpo)) {
    const numero = Number(limpo);
    return Number.isFinite(numero) ? numero : null;
  }

  return null;
}

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function ehDocumentoValido(valor: string): boolean {
  const digitos = apenasDigitos(valor);
  if (digitos.length !== 11 && digitos.length !== 14) return false;
  return !/^(\d)\1+$/.test(digitos);
}

export function rotuloDocumento(valor: string): string {
  return apenasDigitos(valor).length === 11 ? "CPF" : "CNPJ";
}

export function ehBooleanoReconhecido(valor: string): boolean {
  return ["sim", "nao", "não", "true", "false", "1", "0", "s", "n"].includes(valor.trim().toLowerCase());
}
