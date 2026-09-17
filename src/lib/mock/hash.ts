export function gerarHashDeterministico(semente: string): string {
  const alfabeto = "0123456789abcdef";
  let estado = 0;
  for (let indice = 0; indice < semente.length; indice += 1) {
    estado = (estado * 31 + semente.charCodeAt(indice)) >>> 0;
  }
  let saida = "";
  for (let posicao = 0; posicao < 64; posicao += 1) {
    estado = (estado * 1103515245 + 12345 + posicao) >>> 0;
    saida += alfabeto[estado % 16];
  }
  return saida;
}
