import type {
  ArquivoGerado,
  NegacaoAprovacao,
  OrigemNegacao,
  PeriodoObrigacao,
  TipoRemessa,
} from "@/lib/tipos";
import { configuracaoFluxo } from "@/lib/mock/configuracao-fluxo";
import { buscarUsuario } from "@/lib/mock/usuarios";

export interface RegistroHistoricoNegativa {
  numero: number;
  ciclo: number;
  tipoRemessa: TipoRemessa;
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

type PeriodoComNegativas = Pick<PeriodoObrigacao, "negacoesAprovacao" | "cicloEnvio">;

export function cicloDoPeriodo(periodo: Pick<PeriodoObrigacao, "cicloEnvio">): number {
  return periodo.cicloEnvio ?? 1;
}

export function cicloDaNegativa(negacao: Pick<NegacaoAprovacao, "cicloEnvio">): number {
  return negacao.cicloEnvio ?? 1;
}

export function tipoRemessaDoCiclo(ciclo: number): TipoRemessa {
  return ciclo > 1 ? "S" : "I";
}

export function tipoRemessaDoPeriodo(
  periodo: Pick<PeriodoObrigacao, "cicloEnvio" | "tipoRemessa">
): TipoRemessa {
  return periodo.tipoRemessa ?? tipoRemessaDoCiclo(cicloDoPeriodo(periodo));
}

export function rotuloCiclo(ciclo: number, tipo: TipoRemessa = tipoRemessaDoCiclo(ciclo)): string {
  return `Ciclo ${ciclo} (${tipo})`;
}

export function negativasDoCiclo(
  periodo: PeriodoComNegativas,
  ciclo: number = cicloDoPeriodo(periodo)
): NegacaoAprovacao[] {
  return periodo.negacoesAprovacao.filter((negacao) => cicloDaNegativa(negacao) === ciclo);
}

export function contarNegativas(periodo: PeriodoComNegativas): number {
  return configuracaoFluxo.contagemNegacoes === "por_periodo"
    ? periodo.negacoesAprovacao.length
    : negativasDoCiclo(periodo).length;
}

export function contarNegativasTotal(periodo: Pick<PeriodoObrigacao, "negacoesAprovacao">): number {
  return periodo.negacoesAprovacao.length;
}

export function proximaNegativaEscalaParaComite(periodo: PeriodoComNegativas): boolean {
  return (
    configuracaoFluxo.escaladaComiteAutomaticaHabilitada &&
    contarNegativas(periodo) + 1 >= limiarNegativas()
  );
}

export function devolucaoContadorContaComoNegacao(): boolean {
  return configuracaoFluxo.devolucaoContadorContaComoNegacao === true;
}

export function devolucaoContadorEscalaParaComite(periodo: PeriodoComNegativas): boolean {
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
  const sequenciaPorCiclo = new Map<number, number>();
  return negacoes.map((negacao) => {
    const ciclo = cicloDaNegativa(negacao);
    const chaveSequencia = configuracaoFluxo.contagemNegacoes === "por_periodo" ? 0 : ciclo;
    const numero = (sequenciaPorCiclo.get(chaveSequencia) ?? 0) + 1;
    sequenciaPorCiclo.set(chaveSequencia, numero);
    const arquivo = negacao.arquivoId ? buscarArquivo(negacao.arquivoId) : undefined;
    return {
      numero,
      ciclo,
      tipoRemessa: tipoRemessaDoCiclo(ciclo),
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
