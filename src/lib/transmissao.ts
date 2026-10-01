import type { ModuloId } from "@/lib/tipos";
import { buscarModulo } from "@/lib/mock/modulos";

function sufixoDoInstante(instante: Date): string {
  return instante.getTime().toString(36).toUpperCase();
}

export function gerarNumeroProtocoloTransmissao(
  moduloId: ModuloId,
  competencia: string,
  instante: Date
): string {
  const sigla = buscarModulo(moduloId).schema;
  return `TRX-${sigla}-${competencia.replace("-", "")}-${sufixoDoInstante(instante)}`;
}

export function gerarNumeroDocumentoFiscal(competencia: string, instante: Date): string {
  return `NFSE-DEMO-${competencia.replace("-", "")}-${sufixoDoInstante(instante)}`;
}

export function nomeArquivoDocumentoFiscal(numeroDocumento: string): string {
  return `${numeroDocumento}.xml`;
}
