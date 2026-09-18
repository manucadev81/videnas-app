import type {
  FornecimentoInsumo,
  ModuloId,
  PerfilId,
  RegistroLacre,
  SentidoLacre,
} from "@/lib/tipos";
import { gerarHashDeterministico } from "@/lib/mock/hash";
import { IDENTIFICADOR_CHAVE_SIMULADA_PREFIXO } from "@/lib/evidencias/cripto";

const ALFABETO_BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64EstavelDeSemente(semente: string, comprimento: number): string {
  const hash = gerarHashDeterministico(semente);
  let saida = "";
  for (let indice = 0; indice < comprimento; indice += 1) {
    const par = hash.slice((indice * 2) % 64, ((indice * 2) % 64) + 2);
    const valor = Number.parseInt(par.padEnd(2, "0"), 16) % ALFABETO_BASE64.length;
    saida += ALFABETO_BASE64[valor];
  }
  return `${saida}==`;
}

interface SementeLacre {
  id: string;
  sentido: SentidoLacre;
  instituicaoId: string;
  moduloId: ModuloId;
  competencia: string;
  periodoId: string;
  insumoId: string | null;
  seladoEm: string;
  seladoPorUsuarioId: string;
  seladoPorNome: string;
  perfilId: PerfilId;
  origemNome: string;
  tamanhoBytes: number;
  resumoConteudo: string;
  encadeadoApos: string | null;
}

const SEMENTES: SementeLacre[] = [
  {
    id: "LCR-ENT-ACAM212-202607-0001",
    sentido: "entrada",
    instituicaoId: "inst-meridian",
    moduloId: "acam212",
    competencia: "2026-07",
    periodoId: "per-meridian-acam212-202607",
    insumoId: "acam212-operacoes-periodo",
    seladoEm: "2026-08-03T09:42:18-03:00",
    seladoPorUsuarioId: "usr-natalia",
    seladoPorNome: "Natália Queiroz",
    perfilId: "cliente",
    origemNome: "acam212_meridian_202607.csv",
    tamanhoBytes: 486_113,
    resumoConteudo:
      "numero_controle,data_hora,tipo_operacao,cliente_documento,ativo_virtual,quantidade,valor_brl ⏎ C212-2026-07-0000112,2026-07-01T09:14:00-03:00,Pagamento internacional,318.447.902-15,USDT,48250.00000000,250137.65",
    encadeadoApos: null,
  },
  {
    id: "LCR-ENT-ACAM212-202607-0002",
    sentido: "entrada",
    instituicaoId: "inst-meridian",
    moduloId: "acam212",
    competencia: "2026-07",
    periodoId: "per-meridian-acam212-202607",
    insumoId: "acam212-operacoes-periodo",
    seladoEm: "2026-08-04T15:07:53-03:00",
    seladoPorUsuarioId: "usr-natalia",
    seladoPorNome: "Natália Queiroz",
    perfilId: "cliente",
    origemNome: "acam212_meridian_202607_retificado.csv",
    tamanhoBytes: 489_620,
    resumoConteudo:
      "Reenvio com 9 operações corrigidas na taxa de câmbio. numero_controle,data_hora,tipo_operacao,cliente_documento,ativo_virtual,quantidade,valor_brl",
    encadeadoApos: "LCR-ENT-ACAM212-202607-0001",
  },
  {
    id: "LCR-SAI-ACAM212-202607-0001",
    sentido: "saida",
    instituicaoId: "inst-meridian",
    moduloId: "acam212",
    competencia: "2026-07",
    periodoId: "per-meridian-acam212-202607",
    insumoId: null,
    seladoEm: "2026-08-07T11:26:04-03:00",
    seladoPorUsuarioId: "usr-clarice",
    seladoPorNome: "Clarice Veloso",
    perfilId: "validador",
    origemNome: "ACAM212_meridian_202607_v2.xml",
    tamanhoBytes: 612_884,
    resumoConteudo:
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <ACAM212 versao=\"2.1\"> <Declarante><CNPJ>41288677000104</CNPJ></Declarante> <Competencia>2026-07</Competencia>",
    encadeadoApos: null,
  },
  {
    id: "LCR-ENT-CADOC5711-202607-0001",
    sentido: "entrada",
    instituicaoId: "inst-meridian",
    moduloId: "cadoc5711",
    competencia: "2026-07",
    periodoId: "per-meridian-cadoc5711-202607",
    insumoId: "cadoc5711-posicoes-clientes",
    seladoEm: "2026-08-05T08:31:47-03:00",
    seladoPorUsuarioId: "usr-natalia",
    seladoPorNome: "Natália Queiroz",
    perfilId: "cliente",
    origemNome: "cadoc5711_meridian_202607.csv",
    tamanhoBytes: 1_284_902,
    resumoConteudo:
      "data_base,cliente_documento,ativo_virtual,quantidade,valor_brl ⏎ 2026-07-01,318.447.902-15,BTC,3.41827500,1284902.17",
    encadeadoApos: null,
  },
  {
    id: "LCR-SAI-CADOC5711-202607-0001",
    sentido: "saida",
    instituicaoId: "inst-meridian",
    moduloId: "cadoc5711",
    competencia: "2026-07",
    periodoId: "per-meridian-cadoc5711-202607",
    insumoId: null,
    seladoEm: "2026-08-11T16:12:35-03:00",
    seladoPorUsuarioId: "usr-clarice",
    seladoPorNome: "Clarice Veloso",
    perfilId: "validador",
    origemNome: "CADOC5711_meridian_202607_v1.xml",
    tamanhoBytes: 1_903_441,
    resumoConteudo:
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <CADOC5711 versao=\"1.4\"> <Competencia>2026-07</Competencia> <DatasBase>21</DatasBase>",
    encadeadoApos: null,
  },
  {
    id: "LCR-ENT-CADOC5710-202607-0001",
    sentido: "entrada",
    instituicaoId: "inst-meridian",
    moduloId: "cadoc5710",
    competencia: "2026-07",
    periodoId: "per-meridian-cadoc5710-202607",
    insumoId: "cadoc5710-ativos-posicoes",
    seladoEm: "2026-08-06T10:04:09-03:00",
    seladoPorUsuarioId: "usr-natalia",
    seladoPorNome: "Natália Queiroz",
    perfilId: "cliente",
    origemNome: "cadoc5710_meridian_202607.csv",
    tamanhoBytes: 342_770,
    resumoConteudo:
      "data_base,carteira_endereco,rede,ativo_virtual,quantidade,valor_brl ⏎ 2026-07-31,0x7a3f…c41b,Ethereum,ETH,2410.88000000,41220905.10",
    encadeadoApos: null,
  },
  {
    id: "LCR-SAI-CADOC5710-202607-0001",
    sentido: "saida",
    instituicaoId: "inst-meridian",
    moduloId: "cadoc5710",
    competencia: "2026-07",
    periodoId: "per-meridian-cadoc5710-202607",
    insumoId: null,
    seladoEm: "2026-08-14T09:55:21-03:00",
    seladoPorUsuarioId: "usr-clarice",
    seladoPorNome: "Clarice Veloso",
    perfilId: "validador",
    origemNome: "CADOC5710_meridian_202607_v1.xml",
    tamanhoBytes: 501_338,
    resumoConteudo:
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <CADOC5710 versao=\"1.4\"> <DataBase>2026-07-31</DataBase> <Carteiras>14</Carteiras>",
    encadeadoApos: null,
  },
  {
    id: "LCR-ENT-CADOC5711-202605-0001",
    sentido: "entrada",
    instituicaoId: "inst-cofre-atlantico",
    moduloId: "cadoc5711",
    competencia: "2026-05",
    periodoId: "per-cofre-atlantico-cadoc5711-202605",
    insumoId: "cadoc5711-posicoes-clientes",
    seladoEm: "2026-06-04T14:19:02-03:00",
    seladoPorUsuarioId: "usr-diego",
    seladoPorNome: "Diego Vasconcelos",
    perfilId: "cliente",
    origemNome: "cadoc5711_cofre-atlantico_202605.csv",
    tamanhoBytes: 2_118_446,
    resumoConteudo:
      "data_base,cliente_documento,ativo_virtual,quantidade,valor_brl ⏎ 2026-05-02,27.884.110/0001-63,BTC,11.09220000,4180773.92",
    encadeadoApos: null,
  },
  {
    id: "LCR-SAI-CADOC5711-202605-0001",
    sentido: "saida",
    instituicaoId: "inst-cofre-atlantico",
    moduloId: "cadoc5711",
    competencia: "2026-05",
    periodoId: "per-cofre-atlantico-cadoc5711-202605",
    insumoId: null,
    seladoEm: "2026-06-10T17:44:50-03:00",
    seladoPorUsuarioId: "usr-clarice",
    seladoPorNome: "Clarice Veloso",
    perfilId: "validador",
    origemNome: "CADOC5711_cofre-atlantico_202605_v1.xml",
    tamanhoBytes: 3_006_729,
    resumoConteudo:
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <CADOC5711 versao=\"1.4\"> <Competencia>2026-05</Competencia> <Clientes>318</Clientes>",
    encadeadoApos: null,
  },
  {
    id: "LCR-ENT-CADOC5710-202606-0001",
    sentido: "entrada",
    instituicaoId: "inst-cofre-atlantico",
    moduloId: "cadoc5710",
    competencia: "2026-06",
    periodoId: "per-cofre-atlantico-cadoc5710-202606",
    insumoId: "cadoc5710-carteiras",
    seladoEm: "2026-07-06T09:12:40-03:00",
    seladoPorUsuarioId: "usr-diego",
    seladoPorNome: "Diego Vasconcelos",
    perfilId: "cliente",
    origemNome: "cadoc5710_carteiras_cofre-atlantico_202606.csv",
    tamanhoBytes: 88_402,
    resumoConteudo:
      "carteira_apelido,carteira_endereco,rede,titularidade ⏎ Cofre frio BTC 01,bc1qx…9v4k,Bitcoin,de_cliente",
    encadeadoApos: null,
  },
  {
    id: "LCR-ENT-CADOC5710-202606-0002",
    sentido: "entrada",
    instituicaoId: "inst-cofre-atlantico",
    moduloId: "cadoc5710",
    competencia: "2026-06",
    periodoId: "per-cofre-atlantico-cadoc5710-202606",
    insumoId: "cadoc5710-carteiras",
    seladoEm: "2026-07-08T11:38:15-03:00",
    seladoPorUsuarioId: "usr-diego",
    seladoPorNome: "Diego Vasconcelos",
    perfilId: "cliente",
    origemNome: "cadoc5710_carteiras_cofre-atlantico_202606_v2.csv",
    tamanhoBytes: 91_775,
    resumoConteudo:
      "Reenvio incluindo 3 endereços de custódia própria omitidos no primeiro arquivo. carteira_apelido,carteira_endereco,rede,titularidade",
    encadeadoApos: "LCR-ENT-CADOC5710-202606-0001",
  },
  {
    id: "LCR-SAI-CADOC5710-202606-0001",
    sentido: "saida",
    instituicaoId: "inst-cofre-atlantico",
    moduloId: "cadoc5710",
    competencia: "2026-06",
    periodoId: "per-cofre-atlantico-cadoc5710-202606",
    insumoId: null,
    seladoEm: "2026-07-15T13:02:58-03:00",
    seladoPorUsuarioId: "usr-clarice",
    seladoPorNome: "Clarice Veloso",
    perfilId: "validador",
    origemNome: "CADOC5710_cofre-atlantico_202606_v2.xml",
    tamanhoBytes: 744_129,
    resumoConteudo:
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <CADOC5710 versao=\"1.4\"> <DataBase>2026-06-30</DataBase> <Carteiras>27</Carteiras>",
    encadeadoApos: null,
  },
  {
    id: "LCR-ENT-ACAM212-202606-0001",
    sentido: "entrada",
    instituicaoId: "inst-pampulha",
    moduloId: "acam212",
    competencia: "2026-06",
    periodoId: "per-pampulha-acam212-202606",
    insumoId: "acam212-operacoes-periodo",
    seladoEm: "2026-07-02T16:48:31-03:00",
    seladoPorUsuarioId: "usr-camila",
    seladoPorNome: "Camila Andrade",
    perfilId: "cliente",
    origemNome: "acam212_pampulha_202606.csv",
    tamanhoBytes: 137_905,
    resumoConteudo:
      "numero_controle,data_hora,tipo_operacao,cliente_documento,ativo_virtual,quantidade,valor_brl ⏎ C212-2026-06-0000018,2026-06-02T10:05:00-03:00,Recebimento de exportação,11.902.447/0001-08,USDC,120000.00000000,621840.00",
    encadeadoApos: null,
  },
  {
    id: "LCR-SAI-ACAM212-202606-0001",
    sentido: "saida",
    instituicaoId: "inst-pampulha",
    moduloId: "acam212",
    competencia: "2026-06",
    periodoId: "per-pampulha-acam212-202606",
    insumoId: null,
    seladoEm: "2026-07-08T10:21:12-03:00",
    seladoPorUsuarioId: "usr-clarice",
    seladoPorNome: "Clarice Veloso",
    perfilId: "validador",
    origemNome: "ACAM212_pampulha_202606_v1.xml",
    tamanhoBytes: 188_446,
    resumoConteudo:
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <ACAM212 versao=\"2.1\"> <Declarante><CNPJ>11902447000108</CNPJ></Declarante> <Competencia>2026-06</Competencia>",
    encadeadoApos: null,
  },
];

const hashPorId = new Map<string, string>(
  SEMENTES.map((semente) => [semente.id, gerarHashDeterministico(`${semente.id}|${semente.origemNome}`)])
);

export const lacresSemente: RegistroLacre[] = SEMENTES.map((semente) => ({
  id: semente.id,
  sentido: semente.sentido,
  instituicaoId: semente.instituicaoId,
  moduloId: semente.moduloId,
  competencia: semente.competencia,
  periodoId: semente.periodoId,
  insumoId: semente.insumoId,
  arquivoId: null,
  hashSha256: hashPorId.get(semente.id) ?? gerarHashDeterministico(semente.id),
  algoritmoHash: "SHA-256",
  hashAnterior: semente.encadeadoApos ? (hashPorId.get(semente.encadeadoApos) ?? null) : null,
  seladoEm: semente.seladoEm,
  seladoPorUsuarioId: semente.seladoPorUsuarioId,
  seladoPorNome: semente.seladoPorNome,
  perfilId: semente.perfilId,
  origemNome: semente.origemNome,
  tamanhoBytes: semente.tamanhoBytes,
  envelopeCifrado: base64EstavelDeSemente(`envelope|${semente.id}`, 88),
  vetorInicializacao: base64EstavelDeSemente(`vetor|${semente.id}`, 16),
  identificadorChave: `${IDENTIFICADOR_CHAVE_SIMULADA_PREFIXO}:${semente.instituicaoId}:v1`,
  resumoConteudo: semente.resumoConteudo,
}));

function fornecimentoArquivo(
  periodoId: string,
  insumoId: string,
  nomeArquivo: string,
  tamanhoBytes: number,
  linhasAceitas: number,
  fornecidoEm: string,
  usuarioId: string,
  lacreId: string | null
): FornecimentoInsumo {
  return {
    insumoId,
    periodoId,
    status: "fornecido",
    lacreId,
    fornecidoEm,
    fornecidoPorUsuarioId: usuarioId,
    nomeArquivo,
    tamanhoBytes,
    linhasAceitas,
    valoresFormulario: null,
    camposFaltantes: [],
  };
}

function fornecimentoFormulario(
  periodoId: string,
  insumoId: string,
  valores: Record<string, string>,
  fornecidoEm: string,
  usuarioId: string
): FornecimentoInsumo {
  return {
    insumoId,
    periodoId,
    status: "fornecido",
    lacreId: null,
    fornecidoEm,
    fornecidoPorUsuarioId: usuarioId,
    nomeArquivo: null,
    tamanhoBytes: null,
    linhasAceitas: null,
    valoresFormulario: valores,
    camposFaltantes: [],
  };
}

export const fornecimentosSemente: Record<string, Record<string, FornecimentoInsumo>> = {
  "per-meridian-acam212-202607": {
    "acam212-cadastro-clientes": fornecimentoArquivo(
      "per-meridian-acam212-202607",
      "acam212-cadastro-clientes",
      "acam212_clientes_meridian_202607.csv",
      74_311,
      412,
      "2026-08-03T09:20:44-03:00",
      "usr-natalia",
      null
    ),
    "acam212-operacoes-periodo": fornecimentoArquivo(
      "per-meridian-acam212-202607",
      "acam212-operacoes-periodo",
      "acam212_meridian_202607_retificado.csv",
      489_620,
      1_842,
      "2026-08-04T15:07:53-03:00",
      "usr-natalia",
      "LCR-ENT-ACAM212-202607-0002"
    ),
    "acam212-saldos-encerramento": fornecimentoArquivo(
      "per-meridian-acam212-202607",
      "acam212-saldos-encerramento",
      "acam212_saldos_meridian_202607.csv",
      18_442,
      36,
      "2026-08-03T09:31:02-03:00",
      "usr-natalia",
      null
    ),
    "acam212-parametros-competencia": fornecimentoFormulario(
      "per-meridian-acam212-202607",
      "acam212-parametros-competencia",
      {
        responsavel_declaracao: "Ricardo Menezes",
        data_fechamento_contabil: "2026-08-02",
        houve_operacao_anulada: "sim",
        observacao: "Nove operações de julho foram retificadas na taxa de câmbio antes do envio final.",
      },
      "2026-08-04T15:12:30-03:00",
      "usr-natalia"
    ),
  },
  "per-meridian-cadoc5711-202608": {
    "cadoc5711-datas-base": fornecimentoFormulario(
      "per-meridian-cadoc5711-202608",
      "cadoc5711-datas-base",
      {
        primeira_data_base: "2026-08-03",
        ultima_data_base: "2026-08-31",
        dias_uteis_competencia: "21",
      },
      "2026-09-04T08:55:12-03:00",
      "usr-natalia"
    ),
    "cadoc5711-posicoes-clientes": fornecimentoArquivo(
      "per-meridian-cadoc5711-202608",
      "cadoc5711-posicoes-clientes",
      "cadoc5711_meridian_202608.csv",
      1_402_886,
      6_930,
      "2026-09-04T09:07:41-03:00",
      "usr-natalia",
      null
    ),
    "cadoc5711-conciliacao-custodia": fornecimentoFormulario(
      "per-meridian-cadoc5711-202608",
      "cadoc5711-conciliacao-custodia",
      {
        custodia_propria_percentual: "87,5",
        custodiante_terceiro: "Atlântico Custódia Digital Ltda.",
        conciliacao_conferida: "sim",
      },
      "2026-09-04T09:12:08-03:00",
      "usr-natalia"
    ),
  },
  "per-meridian-acam212-202609": {
    "acam212-cadastro-clientes": fornecimentoArquivo(
      "per-meridian-acam212-202609",
      "acam212-cadastro-clientes",
      "acam212_clientes_meridian_202609.csv",
      76_004,
      421,
      "2026-09-15T17:22:09-03:00",
      "usr-natalia",
      null
    ),
  },
};
