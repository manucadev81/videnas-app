import type { ArquivoGerado, NegacaoAprovacao, OrigemNegacao, PeriodoObrigacao } from "@/lib/tipos";
import { configuracaoFluxo } from "@/lib/mock/configuracao-fluxo";
import { buscarUsuario } from "@/lib/mock/usuarios";

export interface RegistroHistoricoNegativa {
  numero: number;
  origem: OrigemNegacao;
  motivo: string;
  usuarioId: string;
  usuarioNome: string;
  ocorridoEm: string;
  arquivoId: string | null;
  versaoArquivo: number | null;
  hashArquivo: string | null;
}

export function limiarNegativas(): number {
  return configuracaoFluxo.limiarNegacoesComite;
}

export function contarNegativas(periodo: Pick<PeriodoObrigacao, "negacoesAprovacao">): number {
  return periodo.negacoesAprovacao.length;
}

export function proximaNegativaEscalaParaComite(
  periodo: Pick<PeriodoObrigacao, "negacoesAprovacao">
): boolean {
  return (
    configuracaoFluxo.escaladaComiteAutomaticaHabilitada &&
    contarNegativas(periodo) + 1 >= limiarNegativas()
  );
}

export function devolucaoContadorContaComoNegacao(): boolean {
  return configuracaoFluxo.devolucaoContadorContaComoNegacao === true;
}

export function devolucaoContadorEscalaParaComite(
  periodo: Pick<PeriodoObrigacao, "negacoesAprovacao">
): boolean {
  return (
    devolucaoContadorContaComoNegacao() &&
    configuracaoFluxo.escaladaComiteAutomaticaHabilitada &&
    contarNegativas(periodo) + 1 >= limiarNegativas()
  );
}

export function rotuloOrigemNegativa(origem: OrigemNegacao | undefined): string {
  return origem === "contador" ? "Devolução do Contador" : "Negação do Compliance";
}

export function rotuloContagemNegativas(numero: number): string {
  const limiar = limiarNegativas();
  return numero > limiar ? `Negativa ${numero} (limite ${limiar})` : `Negativa ${numero} de ${limiar}`;
}

export function rotuloTotalNegativas(total: number): string {
  const limiar = limiarNegativas();
  return total > limiar ? `${total} (limite ${limiar})` : `${total} de ${limiar}`;
}

export function montarHistoricoNegativas(
  negacoes: NegacaoAprovacao[],
  buscarArquivo: (arquivoId: string) => ArquivoGerado | undefined
): RegistroHistoricoNegativa[] {
  return negacoes.map((negacao, indice) => {
    const arquivo = negacao.arquivoId ? buscarArquivo(negacao.arquivoId) : undefined;
    return {
      numero: indice + 1,
      origem: negacao.origem ?? "diretor",
      motivo: negacao.motivo,
      usuarioId: negacao.usuarioId,
      usuarioNome: buscarUsuario(negacao.usuarioId)?.nome ?? negacao.usuarioId,
      ocorridoEm: negacao.ocorridoEm,
      arquivoId: negacao.arquivoId,
      versaoArquivo: arquivo?.versao ?? null,
      hashArquivo: arquivo?.hashSha256 ?? null,
    };
  });
}
