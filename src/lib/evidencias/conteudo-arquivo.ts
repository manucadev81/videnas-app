import type {
  ArquivoGerado,
  FormatoArquivo,
  ModuloId,
  OperacaoCambio,
  PeriodoObrigacao,
  PosicaoCustodiaDiaria,
  PosicaoCustodiaMensal,
  ServicoPrestadoDPS,
} from "@/lib/tipos";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { registrosDoPeriodo } from "@/lib/fornecimento/canonico";
import type { RegistrosPeriodo } from "@/lib/mock/previsualizacao";

export const LIMITE_REGISTROS_DOCUMENTO = 12;

export const NOTA_EXTRATO_DEMONSTRACAO =
  "Extrato de demonstração da Videnas: o cabeçalho declara o total apurado na competência e o corpo traz os primeiros registros do lote, com a mesma estrutura do arquivo regulatório. O conteúdo é determinístico — o mesmo período gera sempre exatamente os mesmos bytes, e é sobre esses bytes que o hash SHA-256 do lacre de entrega é calculado.";

type ValorCampo = string | number | boolean;

interface RegistroDocumento {
  elemento: string;
  campos: Record<string, ValorCampo>;
}

export interface ContextoConteudoArquivo {
  instituicaoRazaoSocial: string;
  instituicaoCnpj: string;
  moduloNome: string;
  orgaoDestino: string;
}

export function contextoConteudoDoPeriodo(periodo: PeriodoObrigacao): ContextoConteudoArquivo {
  const instituicao = buscarInstituicao(periodo.instituicaoId);
  const modulo = buscarModulo(periodo.moduloId);

  return {
    instituicaoRazaoSocial: instituicao?.razaoSocial ?? periodo.instituicaoId,
    instituicaoCnpj: (instituicao?.cnpj ?? "").replace(/\D/g, ""),
    moduloNome: modulo.nome,
    orgaoDestino: modulo.orgaoDestino,
  };
}

export function tipoMimeDoFormato(formato: FormatoArquivo): string {
  return formato === "json" ? "application/json" : "application/xml";
}

function decimal(valor: number, casas = 2): string {
  return Number.isFinite(valor) ? valor.toFixed(casas) : (0).toFixed(casas);
}

function escaparXml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function emPascalCase(chave: string): string {
  return chave.charAt(0).toUpperCase() + chave.slice(1);
}

function registroDeOperacao(operacao: OperacaoCambio, sequencial: number): RegistroDocumento {
  return {
    elemento: "Operacao",
    campos: {
      sequencial,
      numeroControle: operacao.numeroControle,
      grupo: operacao.grupo,
      naturezaOperacao: operacao.naturezaOperacao,
      dataOperacao: operacao.dataOperacao,
      clienteDocumento: operacao.clienteDocumento,
      clienteTipo: operacao.clienteTipo,
      codigoPais: operacao.codigoPais,
      moeda: operacao.moeda,
      valorMoedaEstrangeira: decimal(operacao.valorMoedaEstrangeira),
      taxaCambio: decimal(operacao.taxaCambio, 4),
      valorReais: decimal(operacao.valorReais),
      codigoAtivoOficial: operacao.codigoAtivoOficial,
      ativoVirtual: operacao.ativoVirtual,
      quantidadeAtivo: operacao.quantidadeAtivo,
    },
  };
}

function registroDePosicaoDiaria(
  posicao: PosicaoCustodiaDiaria,
  sequencial: number
): RegistroDocumento {
  return {
    elemento: "PosicaoDiaria",
    campos: {
      sequencial,
      identificador: posicao.id,
      dataBase: posicao.dataBase,
      clienteDocumento: posicao.clienteDocumento,
      clienteTipo: posicao.clienteTipo,
      paisResidencia: posicao.paisResidencia,
      codigoAtivoOficial: posicao.codigoAtivoOficial,
      ativoVirtual: posicao.ativoVirtual,
      quantidadeCustodiada: posicao.quantidadeCustodiada,
      cotacaoDataBase: decimal(posicao.cotacaoDataBase),
      valorReais: decimal(posicao.valorReais),
      tipoCustodia: posicao.tipoCustodia,
      custodianteTerceiro: posicao.custodianteTerceiro ?? "",
    },
  };
}

function registroDePosicaoMensal(
  posicao: PosicaoCustodiaMensal,
  sequencial: number
): RegistroDocumento {
  return {
    elemento: "PosicaoMensal",
    campos: {
      sequencial,
      identificador: posicao.id,
      dataBase: posicao.dataBase,
      enderecoCarteira: posicao.enderecoCarteira,
      redeBlockchain: posicao.redeBlockchain,
      titularidade: posicao.titularidade,
      codigoAtivoOficial: posicao.codigoAtivoOficial,
      ativoVirtual: posicao.ativoVirtual,
      saldoTotal: posicao.saldoTotal,
      cotacaoDataBase: decimal(posicao.cotacaoDataBase),
      valorReais: decimal(posicao.valorReais),
      possuiStaking: posicao.possuiStaking,
      saldoEmStaking: posicao.staking?.saldoEmStaking ?? "0.00000000",
      protocoloStaking: posicao.staking?.protocolo ?? "",
      recompensasPeriodo: posicao.staking?.recompensasPeriodo ?? "0.00000000",
    },
  };
}

function registroDeServico(servico: ServicoPrestadoDPS, sequencial: number): RegistroDocumento {
  return {
    elemento: "Servico",
    campos: {
      sequencial,
      numeroDocumentoInterno: servico.numeroDocumentoInterno,
      dataPrestacao: servico.dataPrestacao,
      tomadorDocumento: servico.tomadorDocumento,
      tomadorTipo: servico.tomadorTipo,
      tomadorCodigoIbge: servico.tomadorCodigoIbge,
      codigoIbgePrestacao: servico.codigoIbgePrestacao,
      codigoServico: servico.codigoServico,
      valorServico: decimal(servico.valorServico),
      deducoes: decimal(servico.deducoes),
      baseCalculo: decimal(servico.baseCalculo),
      aliquotaIss: decimal(servico.aliquotaIssConfirmada ?? servico.aliquotaIssSugerida),
      valorIss: decimal(servico.valorIss),
      retencaoNaFonte: servico.retencaoNaFonte,
      valorRetido: decimal(servico.valorRetido),
      enquadramento: servico.enquadramento ?? "a_definir",
    },
  };
}

function registrosDoDocumento(
  moduloId: ModuloId,
  registros: RegistrosPeriodo
): RegistroDocumento[] {
  if (moduloId === "acam212") {
    return registros.operacoes
      .slice(0, LIMITE_REGISTROS_DOCUMENTO)
      .map((operacao, indice) => registroDeOperacao(operacao, indice + 1));
  }
  if (moduloId === "cadoc5711") {
    return registros.posicoesDiarias
      .slice(0, LIMITE_REGISTROS_DOCUMENTO)
      .map((posicao, indice) => registroDePosicaoDiaria(posicao, indice + 1));
  }
  if (moduloId === "cadoc5710") {
    return registros.posicoesMensais
      .slice(0, LIMITE_REGISTROS_DOCUMENTO)
      .map((posicao, indice) => registroDePosicaoMensal(posicao, indice + 1));
  }
  return registros.servicos
    .slice(0, LIMITE_REGISTROS_DOCUMENTO)
    .map((servico, indice) => registroDeServico(servico, indice + 1));
}

function nomeDoBlocoDeRegistros(moduloId: ModuloId): string {
  if (moduloId === "acam212") return "Operacoes";
  if (moduloId === "cadoc5711") return "PosicoesDiarias";
  if (moduloId === "cadoc5710") return "PosicoesMensais";
  return "Servicos";
}

function montarXml(
  arquivo: ArquivoGerado,
  periodo: PeriodoObrigacao,
  contexto: ContextoConteudoArquivo,
  registros: RegistroDocumento[]
): string {
  const raiz = arquivo.schema;
  const bloco = nomeDoBlocoDeRegistros(periodo.moduloId);

  const linhas: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${raiz} versao="${escaparXml(arquivo.versaoSchema)}">`,
    "  <Cabecalho>",
    "    <Declarante>",
    `      <CNPJ>${escaparXml(contexto.instituicaoCnpj)}</CNPJ>`,
    `      <RazaoSocial>${escaparXml(contexto.instituicaoRazaoSocial)}</RazaoSocial>`,
    "    </Declarante>",
    `    <Competencia>${escaparXml(periodo.competencia)}</Competencia>`,
    `    <OrgaoDestino>${escaparXml(contexto.orgaoDestino)}</OrgaoDestino>`,
    `    <Schema nome="${escaparXml(arquivo.schema)}" versao="${escaparXml(arquivo.versaoSchema)}" />`,
    `    <Arquivo identificador="${escaparXml(arquivo.id)}" nome="${escaparXml(arquivo.nomeArquivo)}" versao="${arquivo.versao}" geradoEm="${escaparXml(arquivo.geradoEm)}" />`,
    `    <TotaisDeclarados registros="${arquivo.quantidadeRegistros}" registrosNesteDocumento="${registros.length}" />`,
    "  </Cabecalho>",
    `  <${bloco} quantidade="${registros.length}">`,
  ];

  for (const registro of registros) {
    linhas.push(`    <${registro.elemento}>`);
    for (const [chave, valor] of Object.entries(registro.campos)) {
      const nome = emPascalCase(chave);
      linhas.push(`      <${nome}>${escaparXml(String(valor))}</${nome}>`);
    }
    linhas.push(`    </${registro.elemento}>`);
  }

  linhas.push(
    `  </${bloco}>`,
    "  <Rodape>",
    `    <Observacao>${escaparXml(NOTA_EXTRATO_DEMONSTRACAO)}</Observacao>`,
    "  </Rodape>",
    `</${raiz}>`,
    ""
  );

  return linhas.join("\n");
}

function montarJson(
  arquivo: ArquivoGerado,
  periodo: PeriodoObrigacao,
  contexto: ContextoConteudoArquivo,
  registros: RegistroDocumento[]
): string {
  const documento = {
    schema: arquivo.schema,
    versaoSchema: arquivo.versaoSchema,
    cabecalho: {
      declarante: {
        cnpj: contexto.instituicaoCnpj,
        razaoSocial: contexto.instituicaoRazaoSocial,
      },
      competencia: periodo.competencia,
      orgaoDestino: contexto.orgaoDestino,
      arquivo: {
        identificador: arquivo.id,
        nome: arquivo.nomeArquivo,
        versao: arquivo.versao,
        geradoEm: arquivo.geradoEm,
      },
      totaisDeclarados: {
        registros: arquivo.quantidadeRegistros,
        registrosNesteDocumento: registros.length,
      },
    },
    registros: registros.map((registro) => registro.campos),
    observacao: NOTA_EXTRATO_DEMONSTRACAO,
  };

  return `${JSON.stringify(documento, null, 2)}\n`;
}

export function montarConteudoArquivoEntregue(
  arquivo: ArquivoGerado,
  periodo: PeriodoObrigacao,
  contexto: ContextoConteudoArquivo = contextoConteudoDoPeriodo(periodo)
): string {
  const registros = registrosDoDocumento(periodo.moduloId, registrosDoPeriodo(periodo));

  if (arquivo.formato === "json") {
    return montarJson(arquivo, periodo, contexto, registros);
  }

  return montarXml(arquivo, periodo, contexto, registros);
}

export function tamanhoEmBytesDoConteudo(conteudo: string): number {
  return new TextEncoder().encode(conteudo).byteLength;
}

export function previaDoConteudoArquivoEntregue(
  arquivo: ArquivoGerado,
  periodo: PeriodoObrigacao,
  limiteLinhas = 24
): string {
  const linhas = montarConteudoArquivoEntregue(arquivo, periodo).split("\n");
  if (linhas.length <= limiteLinhas) {
    return linhas.join("\n");
  }
  return [...linhas.slice(0, limiteLinhas), `… (+${linhas.length - limiteLinhas} linhas)`].join(
    "\n"
  );
}
