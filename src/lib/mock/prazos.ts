import type { CriticidadePrazo, ModuloId, PrazoRegulatorio } from "@/lib/tipos";
import { periodos } from "@/lib/mock/periodos";

const BASE_NORMATIVA: Record<ModuloId, string> = {
  acam212: "Circular BCB 3.978, art. 6º",
  cadoc5711: "Circular BCB 3.966, art. 4º",
  cadoc5710: "Circular BCB 3.966, art. 9º",
  fiscal: "Convênio Nacional NFS-e — Nota Técnica 001/2025",
};

const DESCRICAO_MODULO: Record<ModuloId, string> = {
  acam212: "Entrega do ACAM212",
  cadoc5711: "Entrega do Cadoc 5711",
  cadoc5710: "Entrega do Cadoc 5710",
  fiscal: "Estruturação da DPS",
};

const CRITICIDADE_MODULO: Record<ModuloId, CriticidadePrazo> = {
  acam212: "alta",
  cadoc5711: "alta",
  cadoc5710: "alta",
  fiscal: "media",
};

const ANTECEDENCIA_MODULO: Record<ModuloId, number> = {
  acam212: 5,
  cadoc5711: 3,
  cadoc5710: 5,
  fiscal: 3,
};

export const prazosRegulatorios: PrazoRegulatorio[] = periodos.map((periodo) => ({
  id: `prz-${periodo.id.slice(4)}`,
  instituicaoId: periodo.instituicaoId,
  moduloId: periodo.moduloId,
  competencia: periodo.competencia,
  dataVencimento: periodo.prazoEntrega,
  descricao: `${DESCRICAO_MODULO[periodo.moduloId]} — competência ${periodo.competenciaRotulo.toLowerCase()}`,
  baseNormativa: BASE_NORMATIVA[periodo.moduloId],
  periodoId: periodo.id,
  criticidade: CRITICIDADE_MODULO[periodo.moduloId],
  diasAntecedenciaAlerta: ANTECEDENCIA_MODULO[periodo.moduloId],
}));

export function prazosPorInstituicao(instituicaoId: string): PrazoRegulatorio[] {
  return prazosRegulatorios.filter((prazo) => prazo.instituicaoId === instituicaoId);
}

export function buscarPrazo(id: string): PrazoRegulatorio | undefined {
  return prazosRegulatorios.find((prazo) => prazo.id === id);
}
