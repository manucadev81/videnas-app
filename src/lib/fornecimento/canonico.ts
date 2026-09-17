import type {
  FornecimentoInsumo,
  LinhaCanonica,
  ModeloCanonico,
  ModuloId,
  OperacaoCambio,
  PeriodoObrigacao,
  PosicaoCustodiaDiaria,
  PosicaoCustodiaMensal,
  ServicoPrestadoDPS,
} from "@/lib/tipos";
import { operacoesPorPeriodo } from "@/lib/mock/operacoes";
import { posicoesDiariasPorPeriodo, posicoesMensaisPorPeriodo } from "@/lib/mock/custodia";
import { servicosPorPeriodo } from "@/lib/mock/fiscal";
import { gerarRegistrosIngestao, type RegistrosPeriodo } from "@/lib/mock/previsualizacao";
import { formatarBRL, formatarData, formatarNumero } from "@/lib/formatadores";

export const LIMITE_LINHAS_AMOSTRA = 8;

export const COLUNAS_CANONICAS: Record<ModuloId, { chave: string; rotulo: string }[]> = {
  acam212: [
    { chave: "identificador", rotulo: "Identificador canônico" },
    { chave: "data_referencia", rotulo: "Data de referência" },
    { chave: "contraparte", rotulo: "Contraparte" },
    { chave: "documento", rotulo: "Documento" },
    { chave: "ativo", rotulo: "Ativo virtual" },
    { chave: "quantidade", rotulo: "Quantidade" },
    { chave: "valor_brl", rotulo: "Valor em BRL" },
    { chave: "natureza", rotulo: "Natureza da operação" },
  ],
  cadoc5711: [
    { chave: "identificador", rotulo: "Identificador canônico" },
    { chave: "data_referencia", rotulo: "Data-base" },
    { chave: "contraparte", rotulo: "Cliente" },
    { chave: "documento", rotulo: "Documento" },
    { chave: "ativo", rotulo: "Ativo virtual" },
    { chave: "quantidade", rotulo: "Quantidade custodiada" },
    { chave: "valor_brl", rotulo: "Valor em BRL" },
    { chave: "natureza", rotulo: "Tipo de custódia" },
  ],
  cadoc5710: [
    { chave: "identificador", rotulo: "Identificador canônico" },
    { chave: "data_referencia", rotulo: "Data-base" },
    { chave: "contraparte", rotulo: "Carteira" },
    { chave: "documento", rotulo: "Endereço / rede" },
    { chave: "ativo", rotulo: "Ativo virtual" },
    { chave: "quantidade", rotulo: "Saldo total" },
    { chave: "valor_brl", rotulo: "Valor em BRL" },
    { chave: "natureza", rotulo: "Titularidade" },
  ],
  fiscal: [
    { chave: "identificador", rotulo: "Identificador canônico" },
    { chave: "data_referencia", rotulo: "Data da prestação" },
    { chave: "contraparte", rotulo: "Tomador" },
    { chave: "documento", rotulo: "Documento" },
    { chave: "ativo", rotulo: "Código do serviço" },
    { chave: "quantidade", rotulo: "Alíquota ISS (%)" },
    { chave: "valor_brl", rotulo: "Valor do serviço" },
    { chave: "natureza", rotulo: "Enquadramento" },
  ],
};

const ROTULOS_TITULARIDADE: Record<PosicaoCustodiaMensal["titularidade"], string> = {
  propria: "Própria",
  de_cliente: "De cliente",
  terceiro: "De terceiro",
};

const ROTULOS_ENQUADRAMENTO: Record<string, string> = {
  tributado_prestador: "Tributado no prestador",
  tributado_tomador: "Tributado no tomador",
  imune: "Imune",
  isento: "Isento",
  nao_incidencia: "Não incidência",
};

function normalizarQuantidade(valor: string): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return valor;
  }
  return formatarNumero(numero, 8);
}

function linhaDeOperacao(operacao: OperacaoCambio): LinhaCanonica {
  return {
    chave: operacao.id,
    valores: {
      identificador: operacao.numeroControle,
      data_referencia: formatarData(operacao.dataOperacao),
      contraparte: operacao.clienteNome,
      documento: operacao.clienteDocumento,
      ativo: operacao.ativoVirtual,
      quantidade: normalizarQuantidade(operacao.quantidadeAtivo),
      valor_brl: formatarBRL(operacao.valorReais),
      natureza: operacao.naturezaOperacao,
    },
  };
}

function linhaDePosicaoDiaria(posicao: PosicaoCustodiaDiaria): LinhaCanonica {
  return {
    chave: posicao.id,
    valores: {
      identificador: posicao.id,
      data_referencia: formatarData(posicao.dataBase),
      contraparte: posicao.clienteNome,
      documento: posicao.clienteDocumento,
      ativo: posicao.ativoVirtual,
      quantidade: normalizarQuantidade(posicao.quantidadeCustodiada),
      valor_brl: formatarBRL(posicao.valorReais),
      natureza: posicao.tipoCustodia === "propria" ? "Própria" : "Terceirizada",
    },
  };
}

function linhaDePosicaoMensal(posicao: PosicaoCustodiaMensal): LinhaCanonica {
  return {
    chave: posicao.id,
    valores: {
      identificador: posicao.id,
      data_referencia: formatarData(posicao.dataBase),
      contraparte: posicao.carteiraApelido,
      documento: `${posicao.enderecoCarteira} · ${posicao.redeBlockchain}`,
      ativo: posicao.ativoVirtual,
      quantidade: normalizarQuantidade(posicao.saldoTotal),
      valor_brl: formatarBRL(posicao.valorReais),
      natureza: ROTULOS_TITULARIDADE[posicao.titularidade],
    },
  };
}

function linhaDeServico(servico: ServicoPrestadoDPS): LinhaCanonica {
  const aliquota = servico.aliquotaIssConfirmada ?? servico.aliquotaIssSugerida;
  return {
    chave: servico.id,
    valores: {
      identificador: servico.numeroDocumentoInterno,
      data_referencia: formatarData(servico.dataPrestacao),
      contraparte: servico.tomadorNome,
      documento: servico.tomadorDocumento,
      ativo: servico.codigoServico,
      quantidade: formatarNumero(aliquota, 2),
      valor_brl: formatarBRL(servico.valorServico),
      natureza: servico.enquadramento
        ? (ROTULOS_ENQUADRAMENTO[servico.enquadramento] ?? servico.enquadramento)
        : "A definir pelo contador",
    },
  };
}

export function registrosDoPeriodo(periodo: PeriodoObrigacao): RegistrosPeriodo {
  const estaticos: RegistrosPeriodo = {
    operacoes: operacoesPorPeriodo(periodo.id),
    posicoesDiarias: posicoesDiariasPorPeriodo(periodo.id),
    posicoesMensais: posicoesMensaisPorPeriodo(periodo.id),
    servicos: servicosPorPeriodo(periodo.id),
  };

  const possuiEstaticos =
    estaticos.operacoes.length > 0 ||
    estaticos.posicoesDiarias.length > 0 ||
    estaticos.posicoesMensais.length > 0 ||
    estaticos.servicos.length > 0;

  if (possuiEstaticos) {
    return estaticos;
  }

  return (
    gerarRegistrosIngestao(periodo).registros ?? {
      operacoes: [],
      posicoesDiarias: [],
      posicoesMensais: [],
      servicos: [],
    }
  );
}

function linhasDoModulo(moduloId: ModuloId, registros: RegistrosPeriodo): LinhaCanonica[] {
  if (moduloId === "acam212") {
    return registros.operacoes.map(linhaDeOperacao);
  }
  if (moduloId === "cadoc5711") {
    return registros.posicoesDiarias.map(linhaDePosicaoDiaria);
  }
  if (moduloId === "cadoc5710") {
    return registros.posicoesMensais.map(linhaDePosicaoMensal);
  }
  return registros.servicos.map(linhaDeServico);
}

function totalDeclaradoPelosLotes(periodo: PeriodoObrigacao): number {
  return periodo.lotes.reduce((total, lote) => total + lote.linhasResolvidas, 0);
}

function carimboDeGeracao(periodo: PeriodoObrigacao, fornecidos: number): string {
  const ultimoFornecimento = periodo.geradoEm ?? periodo.dataAbertura;
  return fornecidos > 0 ? ultimoFornecimento : periodo.dataAbertura;
}

export function modelarCanonicamente(
  periodo: PeriodoObrigacao,
  fornecimentos: Record<string, FornecimentoInsumo>,
  registrosOuAmostra?: RegistrosPeriodo | LinhaCanonica[] | null
): ModeloCanonico {
  const colunas = COLUNAS_CANONICAS[periodo.moduloId];

  const linhasCompletas = Array.isArray(registrosOuAmostra)
    ? registrosOuAmostra
    : linhasDoModulo(periodo.moduloId, registrosOuAmostra ?? registrosDoPeriodo(periodo));

  const fornecidos = Object.values(fornecimentos).filter(
    (fornecimento) => fornecimento.status === "fornecido"
  );

  const linhasDeclaradas = fornecidos.reduce(
    (total, fornecimento) => total + (fornecimento.linhasAceitas ?? 0),
    0
  );

  const totalLinhas = Math.max(
    linhasCompletas.length,
    linhasDeclaradas,
    totalDeclaradoPelosLotes(periodo)
  );

  return {
    moduloId: periodo.moduloId,
    periodoId: periodo.id,
    colunas,
    linhas: linhasCompletas.slice(0, LIMITE_LINHAS_AMOSTRA),
    totalLinhas,
    geradoEm: carimboDeGeracao(periodo, fornecidos.length),
  };
}
