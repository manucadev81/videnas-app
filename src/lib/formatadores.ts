const MESES_EXTENSO = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatarBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-").map(Number);
  const referencia = new Date(Date.UTC(ano, (mes ?? 1) - 1, dia ?? 1));
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(referencia);
}

export function formatarDataHora(dataIso: string): string {
  const referencia = new Date(dataIso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(referencia);
}

export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const unidades = ["KB", "MB", "GB"];
  let valor = bytes / 1024;
  let indice = 0;
  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice += 1;
  }
  return `${valor.toFixed(2).replace(".", ",")} ${unidades[indice]}`;
}

export function truncarHash(hash: string, inicio = 8, fim = 8): string {
  if (hash.length <= inicio + fim) {
    return hash;
  }
  return `${hash.slice(0, inicio)}…${hash.slice(-fim)}`;
}

export function formatarCNPJ(cnpj: string): string {
  const digitos = cnpj.replace(/\D/g, "");
  if (digitos.length !== 14) {
    return cnpj;
  }
  return digitos.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
}

export function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const indice = (mes ?? 1) - 1;
  const nomeMes = MESES_EXTENSO[indice] ?? competencia;
  return `${nomeMes} de ${ano}`;
}

export function formatarCompetenciaCurta(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  const nomeMes = MESES_EXTENSO[(Number(mes) || 1) - 1] ?? mes;
  return `${nomeMes.slice(0, 3)}/${ano}`;
}

export function formatarNumero(valor: number, casasDecimais = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(valor);
}
