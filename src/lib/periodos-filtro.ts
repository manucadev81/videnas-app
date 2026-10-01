import type { EstadoPeriodo } from "@/lib/tipos";

export function visivelNaListagem(
  estado: EstadoPeriodo,
  filtroEstado: EstadoPeriodo | "todos",
  mostrarArquivados: boolean
): boolean {
  if (estado !== "arquivado") {
    return true;
  }
  return mostrarArquivados || filtroEstado === "arquivado";
}
