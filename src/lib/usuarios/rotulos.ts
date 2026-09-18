import type { SituacaoUsuario } from "@/lib/tipos";

export const ROTULO_SITUACAO: Record<SituacaoUsuario, string> = {
  ativo: "Ativo",
  convite_pendente: "Convite pendente",
  desativado: "Desativado",
};

export const CLASSE_SITUACAO: Record<SituacaoUsuario, string> = {
  ativo: "status-badge-success",
  convite_pendente: "status-badge-warning",
  desativado: "status-badge-neutral",
};
