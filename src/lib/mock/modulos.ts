import type { Modulo, ModuloId } from "@/lib/tipos";

export const modulos: Modulo[] = [
  {
    id: "acam212",
    sigla: "C212",
    nome: "ACAM212",
    nomeCompleto: "ACAM212 — Operações de câmbio com ativos virtuais",
    descricaoCurta:
      "Declaração mensal ao Banco Central do Brasil das operações de câmbio com ativos virtuais.",
    orgaoDestino: "Banco Central do Brasil",
    cadencia: "mensal",
    diaPrazo: 10,
    schema: "ACAM212",
    versaoSchema: "2.1",
    etapas: ["ingestao", "geracao", "validacao", "auditoria", "entrega"],
    candidato: false,
    cor: "indigo",
    rota: "/app/acam212",
  },
  {
    id: "cadoc5711",
    sigla: "5711",
    nome: "Cadoc 5711",
    nomeCompleto: "Cadoc 5711 — Posição de custódia diária por cliente",
    descricaoCurta: "Posição diária de custódia consolidada e enviada mensalmente por cliente.",
    orgaoDestino: "Banco Central do Brasil",
    cadencia: "diaria_consolidada_mensal",
    diaPrazo: 15,
    schema: "CADOC5711",
    versaoSchema: "1.4",
    etapas: ["ingestao", "geracao", "validacao", "auditoria", "entrega"],
    candidato: false,
    cor: "cyan",
    rota: "/app/cadoc",
  },
  {
    id: "cadoc5710",
    sigla: "5710",
    nome: "Cadoc 5710",
    nomeCompleto: "Cadoc 5710 — Posição de custódia mensal por carteira",
    descricaoCurta:
      "Posição mensal agregada por carteira/endereço, incluindo saldo em staking.",
    orgaoDestino: "Banco Central do Brasil",
    cadencia: "mensal",
    diaPrazo: 20,
    schema: "CADOC5710",
    versaoSchema: "1.4",
    etapas: ["ingestao", "geracao", "validacao", "auditoria", "entrega"],
    candidato: false,
    cor: "teal",
    rota: "/app/cadoc",
  },
  {
    id: "fiscal",
    sigla: "DPS",
    nome: "Fiscal",
    nomeCompleto: "Fiscal — NFS-e / DPS",
    descricaoCurta:
      "Estruturação da Declaração de Prestação de Serviços (DPS) para validação do contador.",
    orgaoDestino: "Emissor definido pelo cliente",
    cadencia: "mensal",
    diaPrazo: 5,
    schema: "DPS",
    versaoSchema: "1.0",
    etapas: ["ingestao", "geracao", "contador", "validacao", "auditoria", "entrega"],
    candidato: true,
    cor: "violet",
    rota: "/app/fiscal",
  },
];

export function buscarModulo(id: ModuloId): Modulo {
  const modulo = modulos.find((item) => item.id === id);
  if (!modulo) {
    throw new Error(`Módulo não encontrado: ${id}`);
  }
  return modulo;
}
