import { ESPECIFICACAO_MODULOS } from "@/lib/ingestao/especificacoes";
import type { ModuloId } from "@/lib/tipos";

export {
  ESPECIFICACAO_MODULOS,
  ROTULO_DELIMITADOR,
  buscarEspecificacao,
  extensoesParaAccept,
  listarExtensoes,
} from "@/lib/ingestao/especificacoes";
export type {
  EspecificacaoColuna,
  EspecificacaoModulo,
  TipoCampo,
} from "@/lib/ingestao/especificacoes";

export { prevalidarArquivo } from "@/lib/ingestao/prevalidacao";
export type {
  ContextoPreValidacao,
  NaoConformidade,
  ResultadoPreValidacao,
  ResumoPreValidacao,
  SeveridadeNaoConformidade,
} from "@/lib/ingestao/prevalidacao";

export function slugInstituicao(instituicaoId: string): string {
  return instituicaoId.replace(/^inst-/, "");
}

export function conteudoModeloCsv(moduloId: ModuloId): string {
  const especificacao = ESPECIFICACAO_MODULOS[moduloId];
  const cabecalho = especificacao.colunas.map((coluna) => coluna.chave).join(",");
  const linhaExemplo = especificacao.colunas
    .map((coluna) => (coluna.exemplo.includes(",") ? `"${coluna.exemplo}"` : coluna.exemplo))
    .join(",");
  return `${cabecalho}\n${linhaExemplo}\n`;
}

export function nomeModeloCsv(moduloId: ModuloId, instituicaoId: string, competencia: string): string {
  const especificacao = ESPECIFICACAO_MODULOS[moduloId];
  return `${especificacao.prefixoNome}_${slugInstituicao(instituicaoId)}_${competencia.replace("-", "")}.csv`;
}
