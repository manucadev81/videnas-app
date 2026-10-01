import type {
  ArquivoGerado,
  EventoAuditoria,
  PeriodoObrigacao,
  Usuario,
} from "@/lib/tipos";
import { configuracaoFluxo } from "@/lib/mock/configuracao-fluxo";
import { HOJE_ISO } from "@/lib/mock/periodos";
import { listarUsuarios } from "@/lib/mock/usuarios";

const MS_POR_DIA = 86_400_000;

const SUFIXO_SEGREGACAO = "Segregação de funções obrigatória.";

export const MOTIVO_GERADOR_IMPEDIDO = `Quem gerou uma versão negada do arquivo não pode participar do Comitê de Qualidade. ${SUFIXO_SEGREGACAO}`;
export const MOTIVO_LIBERADOR_IMPEDIDO = `Quem liberou uma versão negada do arquivo não pode participar do Comitê de Qualidade. ${SUFIXO_SEGREGACAO}`;
export const MOTIVO_DIRETOR_IMPEDIDO = `O Responsável de Compliance que negou a aprovação não pode participar do Comitê de Qualidade. ${SUFIXO_SEGREGACAO}`;
export const MOTIVO_CONTADOR_IMPEDIDO = `O Contador que devolveu a DPS não pode participar do Comitê de Qualidade. ${SUFIXO_SEGREGACAO}`;

export type ImpedimentosComite = Record<string, string>;

export interface ParticipantesComite {
  presidenteId: string;
  membroId: string;
}

function paraUtc(dataIso: string): number {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function paraDataIso(instante: number): string {
  return new Date(instante).toISOString().slice(0, 10);
}

function ehDiaUtil(instante: number): boolean {
  const diaSemana = new Date(instante).getUTCDay();
  return diaSemana !== 0 && diaSemana !== 6;
}

export function adicionarDiasUteis(dataIso: string, quantidade: number): string {
  let instante = paraUtc(dataIso);
  let restantes = quantidade;
  while (restantes > 0) {
    instante += MS_POR_DIA;
    if (ehDiaUtil(instante)) {
      restantes -= 1;
    }
  }
  return paraDataIso(instante);
}

export function diasUteisEntre(deIso: string, ateIso: string): number {
  const inicio = paraUtc(deIso);
  const fim = paraUtc(ateIso);
  if (fim <= inicio) {
    return 0;
  }
  let total = 0;
  for (let instante = inicio + MS_POR_DIA; instante <= fim; instante += MS_POR_DIA) {
    if (ehDiaUtil(instante)) {
      total += 1;
    }
  }
  return total;
}

export interface SituacaoPrazoComite {
  prazoIso: string;
  origem: "sla" | "prazo_regulatorio";
  diasUteisRestantes: number;
  vencido: boolean;
  diasParaPrazoRegulatorio: number;
  critico: boolean;
  texto: string;
}

export function situacaoPrazoComite(
  periodo: Pick<PeriodoObrigacao, "emComiteDesde" | "prazoEntrega">,
  hojeIso: string = HOJE_ISO
): SituacaoPrazoComite | null {
  const configuracao = configuracaoFluxo.comiteQualidade;
  if (!configuracao || !periodo.emComiteDesde) {
    return null;
  }

  const prazoSla = adicionarDiasUteis(
    periodo.emComiteDesde,
    configuracao.prazoDiasUteisAposEscalada
  );
  const prazoAntesDoRegulatorio = paraDataIso(
    paraUtc(periodo.prazoEntrega) - configuracao.prazoDiasAntesDoPrazoRegulatorio * MS_POR_DIA
  );
  const usaRegulatorio = prazoAntesDoRegulatorio < prazoSla;
  const prazoIso = usaRegulatorio ? prazoAntesDoRegulatorio : prazoSla;

  const vencido = prazoIso < hojeIso;
  const diasUteisRestantes = vencido
    ? -diasUteisEntre(prazoIso, hojeIso)
    : diasUteisEntre(hojeIso, prazoIso);
  const diasParaPrazoRegulatorio = Math.round(
    (paraUtc(periodo.prazoEntrega) - paraUtc(hojeIso)) / MS_POR_DIA
  );
  const critico = diasParaPrazoRegulatorio <= configuracao.destaqueCriticoDiasAntesDoPrazo;

  const modulo = Math.abs(diasUteisRestantes);
  const unidade = modulo === 1 ? "dia útil" : "dias úteis";
  const texto = vencido
    ? `vencido há ${modulo} ${unidade}`
    : diasUteisRestantes === 0
      ? "vence hoje"
      : `faltam ${modulo} ${unidade}`;

  return {
    prazoIso,
    origem: usaRegulatorio ? "prazo_regulatorio" : "sla",
    diasUteisRestantes,
    vencido,
    diasParaPrazoRegulatorio,
    critico,
    texto,
  };
}

function registrarImpedimento(
  impedimentos: ImpedimentosComite,
  usuarioId: string | null | undefined,
  motivo: string
) {
  if (usuarioId && !impedimentos[usuarioId]) {
    impedimentos[usuarioId] = motivo;
  }
}

export function impedimentosDoComite(
  periodo: PeriodoObrigacao,
  arquivos: Record<string, ArquivoGerado>,
  eventos: EventoAuditoria[]
): ImpedimentosComite {
  const impedimentos: ImpedimentosComite = {};
  const arquivosNegados = new Set<string>();
  const hashesNegados = new Set<string>();

  for (const negacao of periodo.negacoesAprovacao) {
    const arquivo = negacao.arquivoId ? arquivos[negacao.arquivoId] : undefined;
    if (negacao.arquivoId) {
      arquivosNegados.add(negacao.arquivoId);
    }
    if (arquivo) {
      hashesNegados.add(arquivo.hashSha256);
      registrarImpedimento(impedimentos, arquivo.geradoPorUsuarioId, MOTIVO_GERADOR_IMPEDIDO);
    }
    if (negacao.arquivoId && negacao.arquivoId === periodo.arquivoCorrenteId) {
      registrarImpedimento(impedimentos, periodo.geradoPorUsuarioId, MOTIVO_GERADOR_IMPEDIDO);
      registrarImpedimento(impedimentos, periodo.liberadoPorUsuarioId, MOTIVO_LIBERADOR_IMPEDIDO);
    }
  }

  for (const evento of eventos) {
    if (evento.periodoId !== periodo.id || evento.tipo !== "PERIODO_LIBERADO") {
      continue;
    }
    const arquivoDoEvento = evento.payload.arquivoId;
    const hashDoEvento = evento.payload.hashSha256 ?? evento.referencia;
    const negado =
      (typeof arquivoDoEvento === "string" && arquivosNegados.has(arquivoDoEvento)) ||
      (typeof hashDoEvento === "string" && hashesNegados.has(hashDoEvento));
    if (negado) {
      registrarImpedimento(impedimentos, evento.usuarioId, MOTIVO_LIBERADOR_IMPEDIDO);
    }
  }

  for (const negacao of periodo.negacoesAprovacao) {
    registrarImpedimento(
      impedimentos,
      negacao.usuarioId,
      negacao.origem === "contador" ? MOTIVO_CONTADOR_IMPEDIDO : MOTIVO_DIRETOR_IMPEDIDO
    );
  }

  return impedimentos;
}

export function perfilEhElegivelAoComite(perfilId: Usuario["perfilId"]): boolean {
  return configuracaoFluxo.comiteQualidade?.membrosPerfisElegiveis.includes(perfilId) ?? false;
}

export function membrosElegiveisAoComite(
  periodo: PeriodoObrigacao,
  presidenteId: string,
  impedimentos: ImpedimentosComite,
  usuarios: Usuario[] = listarUsuarios()
): Usuario[] {
  return usuarios.filter(
    (usuario) =>
      usuario.situacao === "ativo" &&
      usuario.lado === "videnas" &&
      usuario.id !== presidenteId &&
      perfilEhElegivelAoComite(usuario.perfilId) &&
      usuario.instituicaoIds.includes(periodo.instituicaoId) &&
      usuario.moduloIds.includes(periodo.moduloId) &&
      !impedimentos[usuario.id]
  );
}

export function usuariosImpedidosDoComite(
  impedimentos: ImpedimentosComite,
  usuarios: Usuario[] = listarUsuarios()
): Usuario[] {
  return usuarios.filter(
    (usuario) => usuario.lado === "videnas" && impedimentos[usuario.id] !== undefined
  );
}

export interface AvaliacaoParticipacaoComite {
  permitido: boolean;
  motivo?: string;
}

export function avaliarParticipantesDoComite(
  periodo: PeriodoObrigacao,
  participantes: Partial<ParticipantesComite>,
  impedimentos: ImpedimentosComite,
  usuarios: Usuario[] = listarUsuarios()
): AvaliacaoParticipacaoComite {
  const { presidenteId, membroId } = participantes;

  if (presidenteId && impedimentos[presidenteId]) {
    return { permitido: false, motivo: impedimentos[presidenteId] };
  }

  if (membroId === undefined) {
    return { permitido: true };
  }

  if (!membroId) {
    return { permitido: false, motivo: "Selecione o segundo membro do Comitê de Qualidade." };
  }
  if (membroId === presidenteId) {
    return {
      permitido: false,
      motivo: "O segundo membro precisa ser diferente de quem preside o Comitê de Qualidade.",
    };
  }
  if (impedimentos[membroId]) {
    return { permitido: false, motivo: impedimentos[membroId] };
  }

  const membro = usuarios.find((usuario) => usuario.id === membroId);
  if (
    !membro ||
    membro.situacao !== "ativo" ||
    membro.lado !== "videnas" ||
    !perfilEhElegivelAoComite(membro.perfilId) ||
    !membro.instituicaoIds.includes(periodo.instituicaoId) ||
    !membro.moduloIds.includes(periodo.moduloId)
  ) {
    return {
      permitido: false,
      motivo:
        "O segundo membro precisa ser da equipe Videnas (Administrador, Executor ou Validador) com acesso a esta instituição e módulo.",
    };
  }

  return { permitido: true };
}

export function descricaoQuorumComite(): string {
  const configuracao = configuracaoFluxo.comiteQualidade;
  const quorum = configuracao?.quorum ?? 2;
  return `${quorum} de ${quorum}${configuracao?.unanime === false ? "" : ", unânime"}`;
}
