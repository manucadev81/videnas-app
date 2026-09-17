export interface AtivoDicionario {
  id: string;
  codigoInterno: string;
  simbolo: string;
  nome: string;
  codigoOficial: string;
  rede: string;
  decimais: number;
  ativo: boolean;
}

export interface ContaDicionario {
  id: string;
  apelido: string;
  endereco: string;
  rede: string;
  titularidade: "propria" | "de_cliente" | "terceiro";
  custodia: "propria" | "terceirizada";
  ativaDesde: string;
  ativo: boolean;
}

export interface ClienteDicionario {
  id: string;
  nome: string;
  documento: string;
  tipo: "PF" | "PJ";
  paisResidencia: string;
  situacaoKyc: "completo" | "pendente" | "vencido";
  ultimaAtualizacao: string;
  ativo: boolean;
}

export interface FiscalDicionario {
  id: string;
  codigoServico: string;
  descricao: string;
  municipio: string;
  aliquotaIss: number;
  retencaoPadrao: boolean;
  regime: string;
  ativo: boolean;
}

export interface PaisMoedaDicionario {
  id: string;
  codigoPais: string;
  pais: string;
  moeda: string;
  sigla: string;
}

export const ATIVOS_VIRTUAIS_SEED: AtivoDicionario[] = [
  { id: "at-btc", codigoInterno: "BTC_SPOT", simbolo: "BTC", nome: "Bitcoin", codigoOficial: "VC0001", rede: "Bitcoin", decimais: 8, ativo: true },
  { id: "at-eth", codigoInterno: "ETH_SPOT", simbolo: "ETH", nome: "Ethereum", codigoOficial: "VC0002", rede: "Ethereum", decimais: 18, ativo: true },
  { id: "at-usdt", codigoInterno: "USDT_ERC20", simbolo: "USDT", nome: "Tether", codigoOficial: "VC0107", rede: "Ethereum", decimais: 6, ativo: true },
  { id: "at-usdc", codigoInterno: "USDC_ERC20", simbolo: "USDC", nome: "USD Coin", codigoOficial: "VC0108", rede: "Ethereum", decimais: 6, ativo: true },
  { id: "at-sol", codigoInterno: "SOL_SPOT", simbolo: "SOL", nome: "Solana", codigoOficial: "VC0031", rede: "Solana", decimais: 9, ativo: true },
  { id: "at-ada", codigoInterno: "ADA_SPOT", simbolo: "ADA", nome: "Cardano", codigoOficial: "VC0018", rede: "Cardano", decimais: 6, ativo: true },
  { id: "at-xrp", codigoInterno: "XRP_SPOT", simbolo: "XRP", nome: "XRP", codigoOficial: "VC0005", rede: "XRP Ledger", decimais: 6, ativo: true },
  { id: "at-matic", codigoInterno: "MATIC_SPOT", simbolo: "MATIC", nome: "Polygon", codigoOficial: "VC0042", rede: "Polygon", decimais: 18, ativo: true },
  { id: "at-link", codigoInterno: "LINK_SPOT", simbolo: "LINK", nome: "Chainlink", codigoOficial: "VC0056", rede: "Ethereum", decimais: 18, ativo: true },
];

export const CONTAS_CARTEIRAS_SEED: ContaDicionario[] = [
  { id: "ct-01", apelido: "Cold Wallet BTC 01", endereco: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", rede: "Bitcoin", titularidade: "propria", custodia: "propria", ativaDesde: "2026-03-20", ativo: true },
  { id: "ct-02", apelido: "Cold Wallet ETH 02", endereco: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", rede: "Ethereum", titularidade: "de_cliente", custodia: "propria", ativaDesde: "2026-04-02", ativo: true },
  { id: "ct-03", apelido: "Wallet Stellar 01", endereco: "GAXLW3TZ4ZPEKJ4M6A2KLFZ5YHQR3TSK5HFJDNPX4LXKQ6RCBDN3P4CJ", rede: "Stellar", titularidade: "propria", custodia: "propria", ativaDesde: "2026-05-11", ativo: true },
  { id: "ct-04", apelido: "Wallet Solana 01", endereco: "4Nd1mYtMUfM2iF4xyCUqTqjVrRFwGJ1uH7cXfVNvqsQ2", rede: "Solana", titularidade: "de_cliente", custodia: "propria", ativaDesde: "2026-05-28", ativo: true },
];

export const CLIENTES_KYC_SEED: ClienteDicionario[] = [
  { id: "cl-01", nome: "Fernanda Castilho Lopes", documento: "318.447.902-15", tipo: "PF", paisResidencia: "Brasil", situacaoKyc: "completo", ultimaAtualizacao: "2026-07-14", ativo: true },
  { id: "cl-02", nome: "Vertax Comércio Digital Ltda", documento: "22.905.663/0001-70", tipo: "PJ", paisResidencia: "Brasil", situacaoKyc: "completo", ultimaAtualizacao: "2026-06-02", ativo: true },
  { id: "cl-03", nome: "Bluewave Tecnologia S.A.", documento: "19.284.775/0001-33", tipo: "PJ", paisResidencia: "Brasil", situacaoKyc: "pendente", ultimaAtualizacao: "2026-08-30", ativo: true },
];

export const FISCAL_SEED: FiscalDicionario[] = [
  { id: "fs-01", codigoServico: "17.01", descricao: "Assessoria ou consultoria de qualquer natureza", municipio: "São Paulo/SP — 3550308", aliquotaIss: 2.0, retencaoPadrao: true, regime: "Lucro Presumido", ativo: true },
  { id: "fs-02", codigoServico: "17.01", descricao: "Assessoria ou consultoria de qualquer natureza", municipio: "Rio de Janeiro/RJ — 3304557", aliquotaIss: 3.0, retencaoPadrao: true, regime: "Lucro Presumido", ativo: true },
  { id: "fs-03", codigoServico: "17.01", descricao: "Assessoria ou consultoria de qualquer natureza", municipio: "Belo Horizonte/MG — 3106200", aliquotaIss: 2.5, retencaoPadrao: false, regime: "Simples Nacional", ativo: true },
];

export const PAISES_MOEDAS_SEED: PaisMoedaDicionario[] = [
  { id: "pm-01", codigoPais: "249", pais: "Estados Unidos", moeda: "Dólar americano", sigla: "USD" },
  { id: "pm-02", codigoPais: "158", pais: "Suíça", moeda: "Franco suíço", sigla: "CHF" },
  { id: "pm-03", codigoPais: "251", pais: "Zona do Euro", moeda: "Euro", sigla: "EUR" },
  { id: "pm-04", codigoPais: "399", pais: "Reino Unido", moeda: "Libra esterlina", sigla: "GBP" },
];

export interface UsuarioConfiguracao {
  id: string;
  nome: string;
  email: string;
  perfil: "diretor" | "operacional" | "contador";
  modulos: string[];
  situacao: "ativo" | "convite_pendente" | "desativado";
}
