import type { ModuloId, StatusCanonicoLote, StatusInsumo } from "@/lib/tipos";

export const INSUMO_PRINCIPAL_POR_MODULO: Record<ModuloId, string> = {
  acam212: "acam212-operacoes-periodo",
  cadoc5711: "cadoc5711-posicoes-clientes",
  cadoc5710: "cadoc5710-ativos-posicoes",
  fiscal: "fiscal-dps-emitidas",
};

export const EXTENSOES_INSUMO_AUXILIAR = ["csv", "txt", "xlsx"];

export const TAMANHO_MINIMO_INSUMO_AUXILIAR_BYTES = 64;

export const CLASSE_STATUS_CANONICO: Record<StatusCanonicoLote, string> = {
  incompleto: "status-badge-warning",
  completo_aguardando_modelagem: "status-badge-info",
  modelado_canonicamente: "status-badge-success",
};

export const CLASSE_STATUS_INSUMO: Record<StatusInsumo, string> = {
  pendente: "status-badge-neutral",
  parcial: "status-badge-warning",
  fornecido: "status-badge-success",
  rejeitado: "status-badge-error",
};

export function idAncoraInsumo(insumoId: string): string {
  return `insumo-${insumoId}`;
}

export function descreverContagemPrazo(diasParaPrazo: number, atrasado: boolean): string {
  if (diasParaPrazo === 0) {
    return "vence hoje";
  }
  if (diasParaPrazo > 0) {
    return diasParaPrazo === 1 ? "falta 1 dia" : `faltam ${diasParaPrazo} dias`;
  }
  const dias = Math.abs(diasParaPrazo);
  const quantidade = dias === 1 ? "1 dia" : `${dias} dias`;
  return atrasado ? `vencido há ${quantidade}` : `prazo encerrado há ${quantidade}`;
}

export function extensaoDoArquivo(nomeArquivo: string): string {
  const partes = nomeArquivo.toLowerCase().split(".");
  return partes.length > 1 ? (partes.pop() ?? "") : "";
}
