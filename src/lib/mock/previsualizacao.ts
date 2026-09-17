import type {
  OperacaoCambio,
  PeriodoObrigacao,
  PosicaoCustodiaDiaria,
  PosicaoCustodiaMensal,
  ServicoPrestadoDPS,
} from "@/lib/tipos";
import { operacoesCambio } from "@/lib/mock/operacoes";
import { posicoesCustodiaDiaria, posicoesCustodiaMensal } from "@/lib/mock/custodia";
import { servicosPrestadosDPS } from "@/lib/mock/fiscal";
import { HOJE_ISO, periodos } from "@/lib/mock/periodos";

export interface RegistrosPeriodo {
  operacoes: OperacaoCambio[];
  posicoesDiarias: PosicaoCustodiaDiaria[];
  posicoesMensais: PosicaoCustodiaMensal[];
  servicos: ServicoPrestadoDPS[];
}

export interface ResultadoIngestaoSimulada {
  registros: RegistrosPeriodo | null;
  totaisResumo: Record<string, number | string>;
}

const LIMITE_LINHAS_PREVIA = 20;
const LIMITE_CLIENTES_DIARIOS = 3;

const instituicaoPorPeriodo = new Map(periodos.map((periodo) => [periodo.id, periodo.instituicaoId]));

function registrosVazios(): RegistrosPeriodo {
  return { operacoes: [], posicoesDiarias: [], posicoesMensais: [], servicos: [] };
}

function sementeDeTexto(texto: string): number {
  let estado = 7;
  for (let indice = 0; indice < texto.length; indice += 1) {
    estado = (estado * 31 + texto.charCodeAt(indice)) >>> 0;
  }
  return estado;
}

function fatorVariacao(indice: number, semente: number): number {
  return 1 + (((indice * 37 + semente) % 23) - 11) / 100;
}

function arredondar(valor: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

function partesCompetencia(competencia: string): { ano: number; mes: number } {
  const [ano, mes] = competencia.split("-").map(Number);
  return { ano, mes };
}

function diasNoMes(competencia: string): number {
  const { ano, mes } = partesCompetencia(competencia);
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function dataDaCompetencia(competencia: string, dia: number): string {
  const limite = diasNoMes(competencia);
  const diaValido = Math.min(Math.max(dia, 1), limite);
  return `${competencia}-${String(diaValido).padStart(2, "0")}`;
}

function ultimoDiaDisponivel(competencia: string): number {
  const total = diasNoMes(competencia);
  if (competencia === HOJE_ISO.slice(0, 7)) {
    return Math.max(1, Math.min(total, Number(HOJE_ISO.slice(8, 10))));
  }
  return total;
}

function diaDistribuido(indice: number, quantidade: number, competencia: string): number {
  const total = ultimoDiaDisponivel(competencia);
  if (quantidade <= 1) return total;
  return 1 + Math.round((indice * (total - 1)) / (quantidade - 1));
}

function datasBaseSequenciais(competencia: string, quantidade: number): string[] {
  const total = Math.max(1, Math.min(quantidade, ultimoDiaDisponivel(competencia)));
  return Array.from({ length: total }, (_, indice) => dataDaCompetencia(competencia, indice + 1));
}

function ordenarModelos<T extends { periodoId: string }>(linhas: T[], periodo: PeriodoObrigacao): T[] {
  const mesmaInstituicao: T[] = [];
  const outrasInstituicoes: T[] = [];
  for (const linha of linhas) {
    if (linha.periodoId === periodo.id) continue;
    if (instituicaoPorPeriodo.get(linha.periodoId) === periodo.instituicaoId) {
      mesmaInstituicao.push(linha);
    } else {
      outrasInstituicoes.push(linha);
    }
  }
  return [...mesmaInstituicao, ...outrasInstituicoes];
}

function preferir<T>(preferidos: T[], alternativos: T[]): T[] {
  return preferidos.length > 0 ? preferidos : alternativos;
}

function sufixoPeriodo(periodo: PeriodoObrigacao): string {
  return periodo.id.replace(/^per-/, "");
}

function sufixoHexadecimal(semente: string, tamanho: number): string {
  const alfabeto = "0123456789abcdef";
  let estado = sementeDeTexto(semente) || 1;
  let saida = "";
  for (let indice = 0; indice < tamanho; indice += 1) {
    estado = (estado ^ (estado << 13)) >>> 0;
    estado = (estado ^ (estado >>> 17)) >>> 0;
    estado = (estado ^ (estado << 5)) >>> 0;
    saida += alfabeto[estado % 16];
  }
  return saida;
}

function variarEndereco(endereco: string, semente: string): string {
  if (endereco.length <= 8) return endereco;
  return `${endereco.slice(0, endereco.length - 6)}${sufixoHexadecimal(semente, 6)}`;
}

function linhasResolvidasDoPeriodo(periodo: PeriodoObrigacao): number {
  return periodo.lotes.reduce((total, lote) => total + lote.linhasResolvidas, 0);
}

export function possuiRegistrosEstaticos(periodo: PeriodoObrigacao): boolean {
  if (periodo.moduloId === "acam212") {
    return operacoesCambio.some((linha) => linha.periodoId === periodo.id);
  }
  if (periodo.moduloId === "cadoc5711") {
    return posicoesCustodiaDiaria.some((linha) => linha.periodoId === periodo.id);
  }
  if (periodo.moduloId === "cadoc5710") {
    return posicoesCustodiaMensal.some((linha) => linha.periodoId === periodo.id);
  }
  return servicosPrestadosDPS.some((linha) => linha.periodoId === periodo.id);
}

function gerarOperacoes(periodo: PeriodoObrigacao, linhas: number): ResultadoIngestaoSimulada {
  const disponiveis = ordenarModelos(operacoesCambio, periodo);
  const modelos = preferir(
    disponiveis.filter((op) => op.kycResolvido && !op.operacaoAnuladaRef && op.paisContraparte !== ""),
    disponiveis
  );
  if (modelos.length === 0) {
    return { registros: null, totaisResumo: periodo.totaisResumo };
  }

  const semente = sementeDeTexto(periodo.id);
  const quantidade = Math.max(1, Math.min(linhas, LIMITE_LINHAS_PREVIA));
  const { ano, mes } = partesCompetencia(periodo.competencia);
  const sufixo = sufixoPeriodo(periodo);

  const operacoes: OperacaoCambio[] = Array.from({ length: quantidade }, (_, indice) => {
    const modelo = modelos[indice % modelos.length];
    const fator = fatorVariacao(indice, semente);
    const sequencial = indice + 1;
    const valorMoedaEstrangeira = arredondar(modelo.valorMoedaEstrangeira * fator);
    const valorReais =
      modelo.valorMoedaEstrangeira > 0
        ? arredondar(valorMoedaEstrangeira * modelo.taxaCambio)
        : arredondar(modelo.valorReais * fator);

    return {
      ...modelo,
      id: `op-${sufixo}-${String(sequencial).padStart(6, "0")}`,
      periodoId: periodo.id,
      numeroControle: `C212-${ano}-${String(mes).padStart(2, "0")}-${String(sequencial).padStart(7, "0")}`,
      dataOperacao: dataDaCompetencia(periodo.competencia, diaDistribuido(indice, quantidade, periodo.competencia)),
      kycResolvido: true,
      valorMoedaEstrangeira,
      valorReais,
      quantidadeAtivo: (Number(modelo.quantidadeAtivo) * fator).toFixed(8),
      operacaoAnuladaRef: null,
    };
  });

  const grupoG10 = Math.round(linhas * 0.62);
  const grupoG20 = Math.round(linhas * 0.22);
  const grupoG30 = Math.round(linhas * 0.12);
  const grupoG90 = Math.max(0, linhas - grupoG10 - grupoG20 - grupoG30);

  return {
    registros: { ...registrosVazios(), operacoes },
    totaisResumo: {
      operacoes: linhas,
      grupoG01: 1,
      grupoG10,
      grupoG20,
      grupoG30,
      grupoG40: 12,
      grupoG90,
    },
  };
}

function gerarPosicoesDiarias(periodo: PeriodoObrigacao, linhas: number): ResultadoIngestaoSimulada {
  const disponiveis = ordenarModelos(posicoesCustodiaDiaria, periodo);
  const comSaldo = preferir(
    disponiveis.filter((posicao) => Number(posicao.quantidadeCustodiada) > 0),
    disponiveis
  );
  if (comSaldo.length === 0) {
    return { registros: null, totaisResumo: periodo.totaisResumo };
  }

  const chavesVistas = new Set<string>();
  const distintos: PosicaoCustodiaDiaria[] = [];
  for (const posicao of comSaldo) {
    const chave = `${posicao.clienteDocumento}-${posicao.ativoVirtual}`;
    if (chavesVistas.has(chave)) continue;
    chavesVistas.add(chave);
    distintos.push(posicao);
  }

  const esperadasConfiguradas = Number(periodo.totaisResumo.datasBaseEsperadas);
  const esperadas = Number.isFinite(esperadasConfiguradas) && esperadasConfiguradas > 0 ? esperadasConfiguradas : 22;
  const datas = datasBaseSequenciais(periodo.competencia, esperadas);
  const clientesPorData = Math.max(
    1,
    Math.min(LIMITE_CLIENTES_DIARIOS, distintos.length, Math.round(linhas / Math.max(1, datas.length)))
  );
  const modelos = distintos.slice(0, clientesPorData);
  const semente = sementeDeTexto(periodo.id);
  const sufixo = sufixoPeriodo(periodo);

  const posicoesDiarias: PosicaoCustodiaDiaria[] = [];
  datas.forEach((dataBase, indiceData) => {
    modelos.forEach((modelo, indiceCliente) => {
      const indice = indiceData * modelos.length + indiceCliente;
      const fator = fatorVariacao(indice, semente);
      const quantidadeCustodiada = Number(modelo.quantidadeCustodiada) * fator;
      const cotacaoDataBase = arredondar(modelo.cotacaoDataBase * fatorVariacao(indiceData, semente));
      posicoesDiarias.push({
        ...modelo,
        id: `pos5711-${sufixo}-${dataBase.replace(/-/g, "")}-${String(indiceCliente + 1).padStart(2, "0")}`,
        periodoId: periodo.id,
        dataBase,
        quantidadeCustodiada: quantidadeCustodiada.toFixed(8),
        cotacaoDataBase,
        valorReais: arredondar(quantidadeCustodiada * cotacaoDataBase),
      });
    });
  });

  const clientesDistintos = Math.max(
    modelos.length,
    Math.round(linhas / Math.max(1, datas.length)) || modelos.length
  );

  return {
    registros: { ...registrosVazios(), posicoesDiarias },
    totaisResumo: {
      datasBaseRecebidas: datas.length,
      datasBaseEsperadas: esperadas,
      clientesDistintos,
      ativos: new Set(posicoesDiarias.map((posicao) => posicao.ativoVirtual)).size,
    },
  };
}

function gerarPosicoesMensais(periodo: PeriodoObrigacao, linhas: number): ResultadoIngestaoSimulada {
  const modelos = ordenarModelos(posicoesCustodiaMensal, periodo);
  if (modelos.length === 0) {
    return { registros: null, totaisResumo: periodo.totaisResumo };
  }

  const semente = sementeDeTexto(periodo.id);
  const quantidade = Math.max(1, Math.min(linhas, LIMITE_LINHAS_PREVIA));
  const dataBase = dataDaCompetencia(periodo.competencia, ultimoDiaDisponivel(periodo.competencia));
  const sufixo = sufixoPeriodo(periodo);

  const posicoesMensais: PosicaoCustodiaMensal[] = Array.from({ length: quantidade }, (_, indice) => {
    const modelo = modelos[indice % modelos.length];
    const ciclo = Math.floor(indice / modelos.length);
    const fator = fatorVariacao(indice, semente);
    const saldoTotal = Number(modelo.saldoTotal) * fator;
    const cotacaoDataBase = arredondar(modelo.cotacaoDataBase * fatorVariacao(indice + 3, semente));
    const identificador = `pos5710-${sufixo}-${String(indice + 1).padStart(4, "0")}`;

    return {
      ...modelo,
      id: identificador,
      periodoId: periodo.id,
      dataBase,
      carteiraApelido: ciclo === 0 ? modelo.carteiraApelido : `${modelo.carteiraApelido} (${ciclo + 1})`,
      enderecoCarteira: ciclo === 0 ? modelo.enderecoCarteira : variarEndereco(modelo.enderecoCarteira, identificador),
      saldoTotal: saldoTotal.toFixed(8),
      cotacaoDataBase,
      valorReais: arredondar(saldoTotal * cotacaoDataBase),
      staking: modelo.staking
        ? {
            ...modelo.staking,
            saldoEmStaking: (Number(modelo.staking.saldoEmStaking) * fator).toFixed(8),
            recompensasPeriodo: (Number(modelo.staking.recompensasPeriodo) * fator).toFixed(8),
            valorRecompensasReais: arredondar(modelo.staking.valorRecompensasReais * fator),
            valorEmStakingReais: arredondar(Number(modelo.staking.saldoEmStaking) * fator * cotacaoDataBase),
          }
        : null,
    };
  });

  return {
    registros: { ...registrosVazios(), posicoesMensais },
    totaisResumo: {
      carteiras: posicoesMensais.length,
      ativos: new Set(posicoesMensais.map((posicao) => posicao.ativoVirtual)).size,
      carteirasComStaking: posicoesMensais.filter((posicao) => posicao.possuiStaking).length,
    },
  };
}

function gerarServicos(periodo: PeriodoObrigacao, linhas: number): ResultadoIngestaoSimulada {
  const modelos = ordenarModelos(servicosPrestadosDPS, periodo);
  if (modelos.length === 0) {
    return { registros: null, totaisResumo: periodo.totaisResumo };
  }

  const semente = sementeDeTexto(periodo.id);
  const quantidade = Math.max(1, Math.min(linhas, LIMITE_LINHAS_PREVIA));
  const { ano, mes } = partesCompetencia(periodo.competencia);
  const mesFormatado = String(mes).padStart(2, "0");
  const sufixo = sufixoPeriodo(periodo);

  const servicos: ServicoPrestadoDPS[] = Array.from({ length: quantidade }, (_, indice) => {
    const modelo = modelos[indice % modelos.length];
    const fator = fatorVariacao(indice, semente);
    const sequencial = indice + 1;
    const valorServico = arredondar(modelo.valorServico * fator);
    const baseCalculo = valorServico;
    const valorIss = arredondar((baseCalculo * modelo.aliquotaIssSugerida) / 100);

    return {
      ...modelo,
      id: `dps-${sufixo}-${String(sequencial).padStart(4, "0")}`,
      periodoId: periodo.id,
      numeroDocumentoInterno: `DPS-${ano}-${mesFormatado}-${String(sequencial).padStart(4, "0")}`,
      dataPrestacao: dataDaCompetencia(periodo.competencia, diaDistribuido(indice, quantidade, periodo.competencia)),
      discriminacao: modelo.discriminacao.replace(/competência \d{2}\/\d{4}/, `competência ${mesFormatado}/${ano}`),
      valorServico,
      deducoes: 0,
      baseCalculo,
      aliquotaIssConfirmada: null,
      valorIss,
      valorRetido: modelo.retencaoNaFonte ? valorIss : 0,
      enquadramento: modelo.enquadramento ?? "tributado_prestador",
      statusContador: "pendente",
      observacaoContador: null,
      emissorDestino: null,
    };
  });

  const escala = linhas / servicos.length;
  const somaServicos = servicos.reduce((total, servico) => total + servico.valorServico, 0);
  const somaIss = servicos.reduce((total, servico) => total + servico.valorIss, 0);
  const somaRetido = servicos.reduce((total, servico) => total + servico.valorRetido, 0);

  return {
    registros: { ...registrosVazios(), servicos },
    totaisResumo: {
      dps: linhas,
      valorServicos: arredondar(somaServicos * escala),
      valorIss: arredondar(somaIss * escala),
      valorRetido: arredondar(somaRetido * escala),
    },
  };
}

export function gerarRegistrosIngestao(periodo: PeriodoObrigacao): ResultadoIngestaoSimulada {
  const linhas = linhasResolvidasDoPeriodo(periodo);
  if (linhas <= 0 || possuiRegistrosEstaticos(periodo)) {
    return { registros: null, totaisResumo: periodo.totaisResumo };
  }

  if (periodo.moduloId === "acam212") return gerarOperacoes(periodo, linhas);
  if (periodo.moduloId === "cadoc5711") return gerarPosicoesDiarias(periodo, linhas);
  if (periodo.moduloId === "cadoc5710") return gerarPosicoesMensais(periodo, linhas);
  return gerarServicos(periodo, linhas);
}
