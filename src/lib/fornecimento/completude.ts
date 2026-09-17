import type {
  FornecimentoInsumo,
  InsumoDefinicao,
  PendenciaFornecimento,
  PeriodoObrigacao,
  ResultadoCompletude,
  StatusCanonicoLote,
} from "@/lib/tipos";
import { buscarInsumos, insumosObrigatorios } from "@/lib/fornecimento/insumos";
import { HOJE_ISO } from "@/lib/mock/periodos";

export function diferencaEmDiasIso(dataFinalIso: string, dataInicialIso: string): number {
  const umDiaEmMs = 24 * 60 * 60 * 1000;
  const final = Date.UTC(
    Number(dataFinalIso.slice(0, 4)),
    Number(dataFinalIso.slice(5, 7)) - 1,
    Number(dataFinalIso.slice(8, 10))
  );
  const inicial = Date.UTC(
    Number(dataInicialIso.slice(0, 4)),
    Number(dataInicialIso.slice(5, 7)) - 1,
    Number(dataInicialIso.slice(8, 10))
  );
  return Math.round((final - inicial) / umDiaEmMs);
}

export function valorPreenchido(valor: string | undefined | null): boolean {
  return typeof valor === "string" && valor.trim().length > 0;
}

export function camposFaltantesDoFormulario(
  definicao: InsumoDefinicao,
  valores: Record<string, string> | null | undefined
): string[] {
  if (!definicao.camposFormulario) {
    return [];
  }
  return definicao.camposFormulario
    .filter((campo) => campo.obrigatorio)
    .filter((campo) => !valorPreenchido(valores?.[campo.chave]))
    .map((campo) => campo.chave);
}

export function rotulosDosCampos(definicao: InsumoDefinicao, chaves: string[]): string[] {
  if (!definicao.camposFormulario) {
    return chaves;
  }
  return chaves.map((chave) => {
    const campo = definicao.camposFormulario?.find((item) => item.chave === chave);
    return campo ? campo.rotulo : chave;
  });
}

export function insumoEstaCompleto(
  definicao: InsumoDefinicao,
  fornecimento: FornecimentoInsumo | undefined
): boolean {
  if (!fornecimento) {
    return false;
  }
  if (fornecimento.status !== "fornecido") {
    return false;
  }
  if (definicao.tipo === "formulario") {
    return camposFaltantesDoFormulario(definicao, fornecimento.valoresFormulario).length === 0;
  }
  return true;
}

function motivoDaPendencia(
  definicao: InsumoDefinicao,
  fornecimento: FornecimentoInsumo | undefined,
  faltantes: string[]
): string {
  if (!fornecimento) {
    return definicao.tipo === "arquivo"
      ? "Nenhum arquivo foi enviado para este insumo nesta competência."
      : "O formulário ainda não foi preenchido nesta competência.";
  }
  if (fornecimento.status === "rejeitado") {
    return "O último envio foi recusado na conferência de layout. Corrija a origem e envie novamente.";
  }
  if (faltantes.length > 0) {
    const rotulos = rotulosDosCampos(definicao, faltantes);
    return `Faltam preencher: ${rotulos.join(", ")}.`;
  }
  if (fornecimento.status === "parcial") {
    return "O envio ficou incompleto e precisa ser concluído.";
  }
  return "Insumo pendente de fornecimento.";
}

export function pendenciasDoCliente(
  periodo: PeriodoObrigacao,
  fornecimentos: Record<string, FornecimentoInsumo>
): PendenciaFornecimento[] {
  const pendencias: PendenciaFornecimento[] = [];

  for (const definicao of buscarInsumos(periodo.moduloId)) {
    const fornecimento = fornecimentos[definicao.id];
    const faltantes =
      definicao.tipo === "formulario"
        ? camposFaltantesDoFormulario(definicao, fornecimento?.valoresFormulario)
        : [];

    if (insumoEstaCompleto(definicao, fornecimento)) {
      continue;
    }

    if (!definicao.obrigatorio && !fornecimento) {
      continue;
    }

    pendencias.push({
      insumoId: definicao.id,
      rotulo: definicao.rotulo,
      motivo: motivoDaPendencia(definicao, fornecimento, faltantes),
      camposFaltantes: faltantes,
      comoFornecer: definicao.comoFornecer,
    });
  }

  return pendencias;
}

export function calcularCompletude(
  periodo: PeriodoObrigacao,
  fornecimentos: Record<string, FornecimentoInsumo>,
  hojeIso: string = HOJE_ISO
): ResultadoCompletude {
  const obrigatorios = insumosObrigatorios(periodo.moduloId);
  const totalObrigatorios = obrigatorios.length;
  const totalFornecidos = obrigatorios.filter((definicao) =>
    insumoEstaCompleto(definicao, fornecimentos[definicao.id])
  ).length;

  const percentual =
    totalObrigatorios === 0 ? 100 : Math.round((totalFornecidos / totalObrigatorios) * 100);

  const completo = totalFornecidos === totalObrigatorios;
  const statusCanonico: StatusCanonicoLote = !completo
    ? "incompleto"
    : periodo.estado === "aguardando_dados"
      ? "completo_aguardando_modelagem"
      : "modelado_canonicamente";

  const diasParaPrazo = diferencaEmDiasIso(periodo.prazoEntrega, hojeIso);
  const atrasado = diasParaPrazo < 0 && periodo.estado !== "entregue";

  return {
    periodoId: periodo.id,
    moduloId: periodo.moduloId,
    totalObrigatorios,
    totalFornecidos,
    percentual,
    statusCanonico,
    pendencias: pendenciasDoCliente(periodo, fornecimentos),
    prazoEntrega: periodo.prazoEntrega,
    diasParaPrazo,
    atrasado,
  };
}

export const ROTULOS_STATUS_CANONICO: Record<StatusCanonicoLote, string> = {
  incompleto: "Incompleto",
  completo_aguardando_modelagem: "Completo — aguardando modelagem",
  modelado_canonicamente: "Modelado canonicamente",
};

export const ROTULOS_STATUS_INSUMO: Record<FornecimentoInsumo["status"], string> = {
  pendente: "Pendente",
  parcial: "Parcial",
  fornecido: "Fornecido",
  rejeitado: "Rejeitado",
};
