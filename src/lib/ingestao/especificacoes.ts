import type { ModuloId } from "@/lib/tipos";

export type TipoCampo =
  | "texto"
  | "data"
  | "data_hora"
  | "documento"
  | "valor"
  | "quantidade"
  | "inteiro"
  | "booleano";

export interface EspecificacaoColuna {
  chave: string;
  rotulo: string;
  exemplo: string;
  tipo: TipoCampo;
  obrigatoria: boolean;
}

export interface EspecificacaoModulo {
  descricao: string;
  padraoNome: string;
  prefixoNome: string;
  extensoesAceitas: string[];
  extensoesNaoPrevisualizaveis: string[];
  delimitadoresAceitos: string[];
  tamanhoMinimoBytes: number;
  linhasMinimas: number;
  campoDataCompetencia: string | null;
  colunas: EspecificacaoColuna[];
}

export const ROTULO_DELIMITADOR: Record<string, string> = {
  ",": "vírgula (,)",
  ";": "ponto e vírgula (;)",
  "\t": "tabulação (TAB)",
  "|": "barra vertical (|)",
};

export const ESPECIFICACAO_MODULOS: Record<ModuloId, EspecificacaoModulo> = {
  acam212: {
    descricao: "Uma linha por operação de câmbio com ativo virtual realizada na competência.",
    padraoNome: "acam212_{instituicao}_{AAAAMM}.csv",
    prefixoNome: "acam212",
    extensoesAceitas: ["csv", "txt"],
    extensoesNaoPrevisualizaveis: [],
    delimitadoresAceitos: [",", ";"],
    tamanhoMinimoBytes: 120,
    linhasMinimas: 1,
    campoDataCompetencia: "data_hora",
    colunas: [
      {
        chave: "numero_controle",
        rotulo: "Número de controle",
        exemplo: "C212-2026-08-0000741",
        tipo: "texto",
        obrigatoria: true,
      },
      {
        chave: "data_hora",
        rotulo: "Data/hora",
        exemplo: "2026-08-14T10:32:00-03:00",
        tipo: "data_hora",
        obrigatoria: true,
      },
      {
        chave: "tipo_operacao",
        rotulo: "Tipo de operação",
        exemplo: "Pagamento internacional",
        tipo: "texto",
        obrigatoria: true,
      },
      {
        chave: "cliente_documento",
        rotulo: "Cliente (CPF/CNPJ)",
        exemplo: "318.447.902-15",
        tipo: "documento",
        obrigatoria: true,
      },
      { chave: "ativo_virtual", rotulo: "Ativo virtual", exemplo: "USDT", tipo: "texto", obrigatoria: true },
      { chave: "quantidade", rotulo: "Quantidade", exemplo: "48250.00000000", tipo: "quantidade", obrigatoria: true },
      { chave: "valor_brl", rotulo: "Valor em BRL", exemplo: "250137.65", tipo: "valor", obrigatoria: true },
      {
        chave: "valor_moeda_estrangeira",
        rotulo: "Valor em moeda estrangeira",
        exemplo: "48250.00",
        tipo: "valor",
        obrigatoria: true,
      },
      { chave: "taxa_cambio", rotulo: "Taxa de câmbio", exemplo: "5.1842", tipo: "valor", obrigatoria: true },
    ],
  },
  cadoc5711: {
    descricao: "Uma linha por posição de custódia diária por cliente, para cada data-base da competência.",
    padraoNome: "cadoc5711_{instituicao}_{AAAAMM}.csv",
    prefixoNome: "cadoc5711",
    extensoesAceitas: ["csv", "txt"],
    extensoesNaoPrevisualizaveis: [],
    delimitadoresAceitos: [",", ";", "\t"],
    tamanhoMinimoBytes: 90,
    linhasMinimas: 1,
    campoDataCompetencia: "data_base",
    colunas: [
      { chave: "data_base", rotulo: "Data-base", exemplo: "2026-08-14", tipo: "data", obrigatoria: true },
      {
        chave: "cliente_documento",
        rotulo: "Cliente (CPF/CNPJ)",
        exemplo: "22.905.663/0001-70",
        tipo: "documento",
        obrigatoria: true,
      },
      { chave: "ativo_virtual", rotulo: "Ativo", exemplo: "BTC", tipo: "texto", obrigatoria: true },
      { chave: "quantidade", rotulo: "Quantidade", exemplo: "3.41827500", tipo: "quantidade", obrigatoria: true },
      { chave: "valor_brl", rotulo: "Valor em BRL", exemplo: "1284902.17", tipo: "valor", obrigatoria: true },
    ],
  },
  cadoc5710: {
    descricao: "Uma linha por carteira/endereço com posição consolidada na data-base mensal.",
    padraoNome: "cadoc5710_{instituicao}_{AAAAMM}.csv",
    prefixoNome: "cadoc5710",
    extensoesAceitas: ["csv", "txt"],
    extensoesNaoPrevisualizaveis: [],
    delimitadoresAceitos: [",", ";"],
    tamanhoMinimoBytes: 140,
    linhasMinimas: 1,
    campoDataCompetencia: "data_base",
    colunas: [
      { chave: "data_base", rotulo: "Data-base", exemplo: "2026-08-31", tipo: "data", obrigatoria: true },
      {
        chave: "carteira_endereco",
        rotulo: "Carteira/Endereço",
        exemplo: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        tipo: "texto",
        obrigatoria: true,
      },
      { chave: "rede", rotulo: "Rede", exemplo: "Ethereum", tipo: "texto", obrigatoria: true },
      { chave: "ativo_virtual", rotulo: "Ativo", exemplo: "ETH", tipo: "texto", obrigatoria: true },
      { chave: "quantidade", rotulo: "Quantidade", exemplo: "2410.88000000", tipo: "quantidade", obrigatoria: true },
      { chave: "valor_brl", rotulo: "Valor em BRL", exemplo: "41220905.10", tipo: "valor", obrigatoria: true },
      {
        chave: "quantidade_staking",
        rotulo: "Quantidade em staking",
        exemplo: "1850.00000000",
        tipo: "quantidade",
        obrigatoria: false,
      },
      {
        chave: "recompensa_acumulada",
        rotulo: "Recompensa acumulada",
        exemplo: "6.42910000",
        tipo: "quantidade",
        obrigatoria: false,
      },
    ],
  },
  fiscal: {
    descricao: "Uma linha por serviço prestado (DPS) estruturado na competência.",
    padraoNome: "fiscal_{instituicao}_{AAAAMM}.csv",
    prefixoNome: "fiscal",
    extensoesAceitas: ["csv", "xlsx"],
    extensoesNaoPrevisualizaveis: ["xlsx"],
    delimitadoresAceitos: [",", ";"],
    tamanhoMinimoBytes: 150,
    linhasMinimas: 1,
    campoDataCompetencia: null,
    colunas: [
      { chave: "tomador", rotulo: "Tomador", exemplo: "Bluewave Tecnologia S.A.", tipo: "texto", obrigatoria: true },
      {
        chave: "tomador_documento",
        rotulo: "CNPJ do tomador",
        exemplo: "19.284.775/0001-33",
        tipo: "documento",
        obrigatoria: true,
      },
      { chave: "municipio", rotulo: "Município", exemplo: "São Paulo", tipo: "texto", obrigatoria: true },
      { chave: "codigo_ibge", rotulo: "Código IBGE", exemplo: "3550308", tipo: "inteiro", obrigatoria: true },
      { chave: "codigo_servico", rotulo: "Código do serviço", exemplo: "17.01", tipo: "texto", obrigatoria: true },
      {
        chave: "descricao",
        rotulo: "Descrição",
        exemplo: "Assessoria ou consultoria de qualquer natureza",
        tipo: "texto",
        obrigatoria: true,
      },
      { chave: "valor_servico", rotulo: "Valor do serviço", exemplo: "34500.00", tipo: "valor", obrigatoria: true },
      { chave: "aliquota_iss", rotulo: "Alíquota ISS", exemplo: "2.00", tipo: "valor", obrigatoria: true },
      { chave: "retencao", rotulo: "Retenção", exemplo: "Sim", tipo: "booleano", obrigatoria: true },
    ],
  },
};

export function buscarEspecificacao(moduloId: ModuloId): EspecificacaoModulo {
  return ESPECIFICACAO_MODULOS[moduloId];
}

export function extensoesParaAccept(moduloId: ModuloId): string {
  return ESPECIFICACAO_MODULOS[moduloId].extensoesAceitas.map((extensao) => `.${extensao}`).join(",");
}

export function listarExtensoes(moduloId: ModuloId): string {
  const extensoes = ESPECIFICACAO_MODULOS[moduloId].extensoesAceitas.map((extensao) => `.${extensao}`);
  if (extensoes.length === 1) return extensoes[0];
  return `${extensoes.slice(0, -1).join(", ")} ou ${extensoes.at(-1)}`;
}
