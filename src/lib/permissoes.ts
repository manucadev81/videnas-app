import type { Acao, AcaoId, PerfilId, PeriodoObrigacao } from "@/lib/tipos";

export interface PerfilMetadados {
  id: PerfilId;
  rotulo: string;
  rotuloCompleto: string;
  descricao: string;
  lado: "cliente" | "sentinellus";
  corBadge: string;
  icone: string;
  rotasPermitidas: string[];
  acoesPermitidas: AcaoId[];
  multiTenant: boolean;
}

const ROTAS_COMUNS = [
  "/",
  "/login",
  "/selecionar-instituicao",
  "/app",
  "/app/fiscal",
  "/app/calendario",
  "/app/auditoria",
  "/app/configuracoes",
];

const ROTAS_REGULATORIAS = ["/app/acam212", "/app/cadoc"];

export const PERFIS: PerfilMetadados[] = [
  {
    id: "diretor",
    rotulo: "Diretor",
    rotuloCompleto: "Diretor / Compliance Responsável",
    descricao: "Aprova, responde perante o BCB e revisa exceções da instituição.",
    lado: "cliente",
    corBadge: "brand",
    icone: "ShieldCheck",
    rotasPermitidas: [...ROTAS_COMUNS, ...ROTAS_REGULATORIAS, "/onboarding"],
    acoesPermitidas: [
      "aprovar",
      "baixar_arquivo",
      "registrar_protocolo",
      "marcar_encaminhado",
      "tratar_excecao",
      "editar_config_instituicao",
      "gerenciar_usuarios",
      "editar_dicionarios",
      "exportar_auditoria",
    ],
    multiTenant: false,
  },
  {
    id: "operacional",
    rotulo: "Operacional",
    rotuloCompleto: "Operacional / Backoffice",
    descricao: "Alimenta os dados do dia a dia e sobe os arquivos de origem.",
    lado: "cliente",
    corBadge: "brand",
    icone: "Boxes",
    rotasPermitidas: [...ROTAS_COMUNS, ...ROTAS_REGULATORIAS, "/onboarding"],
    acoesPermitidas: ["subir_dados", "remover_lote", "baixar_arquivo", "tratar_excecao", "editar_dicionarios"],
    multiTenant: false,
  },
  {
    id: "contador",
    rotulo: "Contador",
    rotuloCompleto: "Contador / Fiscal",
    descricao: "Valida alíquota, retenção e enquadramento tributário do módulo Fiscal.",
    lado: "cliente",
    corBadge: "candidate",
    icone: "Calculator",
    rotasPermitidas: ["/", "/login", "/selecionar-instituicao", "/app", "/app/fiscal", "/app/calendario", "/app/auditoria", "/app/configuracoes", "/onboarding"],
    acoesPermitidas: ["validar_fiscal", "devolver_fiscal", "baixar_arquivo", "tratar_excecao", "editar_dicionarios"],
    multiTenant: false,
  },
  {
    id: "executor",
    rotulo: "Executor",
    rotuloCompleto: "Executor — Sentinellus",
    descricao: "Roda a ingestão e a geração dos arquivos e estruturas. Nunca libera.",
    lado: "sentinellus",
    corBadge: "violet",
    icone: "Cog",
    rotasPermitidas: [...ROTAS_COMUNS, ...ROTAS_REGULATORIAS, "/onboarding", "/app/operacao"],
    acoesPermitidas: [
      "subir_dados",
      "remover_lote",
      "gerar",
      "regerar",
      "enviar_validacao",
      "enviar_contador",
      "reabrir",
      "baixar_arquivo",
      "tratar_excecao",
      "editar_dicionarios",
      "trocar_tenant",
      "exportar_auditoria",
    ],
    multiTenant: true,
  },
  {
    id: "validador",
    rotulo: "Validador",
    rotuloCompleto: "Validador — Sentinellus",
    descricao: "Confere a validação contra o schema oficial e libera o arquivo para o cliente. Nunca gera.",
    lado: "sentinellus",
    corBadge: "violet",
    icone: "BadgeCheck",
    rotasPermitidas: [...ROTAS_COMUNS, ...ROTAS_REGULATORIAS, "/onboarding", "/app/operacao"],
    acoesPermitidas: [
      "executar_validacao",
      "liberar",
      "registrar_retorno",
      "reabrir",
      "baixar_arquivo",
      "registrar_protocolo",
      "tratar_excecao",
      "trocar_tenant",
      "exportar_auditoria",
    ],
    multiTenant: true,
  },
];

export function buscarPerfil(perfilId: PerfilId): PerfilMetadados {
  const perfil = PERFIS.find((item) => item.id === perfilId);
  if (!perfil) {
    throw new Error(`Perfil não encontrado: ${perfilId}`);
  }
  return perfil;
}

export function rotasPermitidas(perfil: PerfilId): string[] {
  return buscarPerfil(perfil).rotasPermitidas;
}

export function podeVerRota(perfil: PerfilId, href: string): boolean {
  const rotas = rotasPermitidas(perfil);
  if (rotas.includes(href)) {
    return true;
  }
  return rotas.some((rota) => rota !== "/" && href.startsWith(`${rota}/`));
}

const ROTULOS_ACAO: Record<AcaoId, string> = {
  subir_dados: "Enviar dados do período",
  remover_lote: "Remover lote",
  gerar: "Gerar arquivo",
  regerar: "Gerar novamente",
  enviar_validacao: "Enviar para validação",
  enviar_contador: "Enviar ao contador",
  validar_fiscal: "Confirmar enquadramento fiscal",
  devolver_fiscal: "Devolver para correção",
  executar_validacao: "Executar validação de schema",
  liberar: "Liberar para o cliente",
  registrar_retorno: "Registrar retorno do BCB",
  reabrir: "Reabrir período para correção",
  aprovar: "Aprovar e assumir responsabilidade",
  baixar_arquivo: "Baixar arquivo",
  registrar_protocolo: "Registrar protocolo do BCB",
  marcar_encaminhado: "Marcar como encaminhado ao emissor",
  tratar_excecao: "Tratar exceção",
  editar_config_instituicao: "Editar dados da instituição",
  gerenciar_usuarios: "Convidar / editar usuário",
  editar_dicionarios: "Editar dicionários",
  trocar_tenant: "Trocar de instituição",
  exportar_auditoria: "Exportar trilha (CSV)",
};

interface RegraAcao {
  id: AcaoId;
  estadosOrigem: PeriodoObrigacao["estado"][];
  estadoDestino: PeriodoObrigacao["estado"] | null;
  variante: Acao["variante"];
  somenteFiscal?: boolean;
  excetoFiscal?: boolean;
}

const REGRAS_ACAO: RegraAcao[] = [
  { id: "subir_dados", estadosOrigem: ["aguardando_dados", "dados_ingeridos"], estadoDestino: "dados_ingeridos", variante: "primario" },
  { id: "gerar", estadosOrigem: ["dados_ingeridos"], estadoDestino: "gerado", variante: "primario" },
  { id: "regerar", estadosOrigem: ["com_excecoes"], estadoDestino: "gerado", variante: "secundario" },
  { id: "enviar_validacao", estadosOrigem: ["gerado"], estadoDestino: "em_validacao", variante: "primario", excetoFiscal: true },
  { id: "enviar_contador", estadosOrigem: ["gerado"], estadoDestino: "aguardando_contador", variante: "primario", somenteFiscal: true },
  { id: "validar_fiscal", estadosOrigem: ["aguardando_contador"], estadoDestino: "em_validacao", variante: "primario", somenteFiscal: true },
  { id: "devolver_fiscal", estadosOrigem: ["aguardando_contador"], estadoDestino: "gerado", variante: "destrutivo-suave", somenteFiscal: true },
  { id: "executar_validacao", estadosOrigem: ["em_validacao", "com_excecoes"], estadoDestino: "validado", variante: "primario" },
  { id: "liberar", estadosOrigem: ["validado"], estadoDestino: "liberado", variante: "primario" },
  { id: "aprovar", estadosOrigem: ["liberado"], estadoDestino: "aprovado", variante: "primario" },
  { id: "registrar_protocolo", estadosOrigem: ["aprovado"], estadoDestino: "entregue", variante: "primario", excetoFiscal: true },
  { id: "marcar_encaminhado", estadosOrigem: ["aprovado"], estadoDestino: "entregue", variante: "primario", somenteFiscal: true },
  { id: "registrar_retorno", estadosOrigem: ["entregue"], estadoDestino: "retorno_com_erro", variante: "secundario" },
  { id: "reabrir", estadosOrigem: ["retorno_com_erro", "liberado", "aprovado"], estadoDestino: "dados_ingeridos", variante: "destrutivo-suave" },
  { id: "baixar_arquivo", estadosOrigem: ["gerado", "em_validacao", "validado", "com_excecoes", "liberado", "aprovado", "entregue", "retorno_com_erro"], estadoDestino: null, variante: "ghost" },
  { id: "tratar_excecao", estadosOrigem: ["com_excecoes", "em_validacao"], estadoDestino: null, variante: "secundario" },
  { id: "exportar_auditoria", estadosOrigem: ["aguardando_dados", "dados_ingeridos", "gerado", "aguardando_contador", "em_validacao", "validado", "com_excecoes", "liberado", "aprovado", "entregue", "retorno_com_erro"], estadoDestino: null, variante: "ghost" },
];

export function acoesDisponiveis(perfil: PerfilId, periodo: PeriodoObrigacao): Acao[] {
  const perfilMetadados = buscarPerfil(perfil);
  const ehFiscal = periodo.moduloId === "fiscal";

  return REGRAS_ACAO.filter((regra) => perfilMetadados.acoesPermitidas.includes(regra.id))
    .filter((regra) => (regra.somenteFiscal ? ehFiscal : true))
    .filter((regra) => (regra.excetoFiscal ? !ehFiscal : true))
    .filter((regra) => regra.estadosOrigem.includes(periodo.estado))
    .map((regra) => ({
      id: regra.id,
      rotulo:
        regra.id === "executar_validacao" && periodo.estado === "com_excecoes"
          ? "Reprocessar validação"
          : ROTULOS_ACAO[regra.id],
      estadoDestino: regra.estadoDestino,
      variante: regra.variante,
    }));
}

export interface AvaliacaoAcao {
  permitido: boolean;
  visivel: boolean;
  motivo?: string;
}

export interface ContextoAvaliacaoAcao {
  usuarioAtualId?: string;
  excecoesBloqueantesAbertas?: number;
}

export function podeExecutar(
  perfil: PerfilId,
  acaoId: AcaoId,
  periodo: PeriodoObrigacao,
  contexto: ContextoAvaliacaoAcao = {}
): AvaliacaoAcao {
  const perfilMetadados = buscarPerfil(perfil);

  if (!perfilMetadados.acoesPermitidas.includes(acaoId)) {
    return { permitido: false, visivel: false, motivo: `Ação indisponível para o perfil ${perfilMetadados.rotulo}.` };
  }

  const regra = REGRAS_ACAO.find((item) => item.id === acaoId);
  if (!regra) {
    return { permitido: false, visivel: false };
  }

  const ehFiscal = periodo.moduloId === "fiscal";
  if (regra.somenteFiscal && !ehFiscal) {
    return { permitido: false, visivel: false };
  }
  if (regra.excetoFiscal && ehFiscal) {
    return { permitido: false, visivel: false };
  }

  if (!regra.estadosOrigem.includes(periodo.estado)) {
    return {
      permitido: false,
      visivel: true,
      motivo: "Ação indisponível no estado atual do período.",
    };
  }

  if (acaoId === "gerar" && periodo.lotes.length === 0) {
    return {
      permitido: false,
      visivel: true,
      motivo: "Nenhum lote de dados foi recebido para esta competência.",
    };
  }

  if (acaoId === "subir_dados" && !["aguardando_dados", "dados_ingeridos"].includes(periodo.estado)) {
    return {
      permitido: false,
      visivel: true,
      motivo: "O período já foi gerado. Peça a reabertura ao time Sentinellus.",
    };
  }

  if (acaoId === "validar_fiscal" && periodo.estado !== "aguardando_contador") {
    return {
      permitido: false,
      visivel: true,
      motivo: "A DPS ainda não foi estruturada e enviada para sua análise.",
    };
  }

  if (acaoId === "aprovar" && periodo.estado !== "liberado") {
    return {
      permitido: false,
      visivel: true,
      motivo: "Disponível após a liberação pelo Validador Sentinellus.",
    };
  }

  if (
    acaoId === "liberar" &&
    contexto.usuarioAtualId &&
    contexto.usuarioAtualId === periodo.geradoPorUsuarioId
  ) {
    return {
      permitido: false,
      visivel: true,
      motivo: "Quem gerou o arquivo não pode liberá-lo. Segregação de funções obrigatória.",
    };
  }

  if (
    acaoId === "executar_validacao" &&
    periodo.estado === "com_excecoes" &&
    (contexto.excecoesBloqueantesAbertas ?? 0) > 0
  ) {
    return {
      permitido: false,
      visivel: true,
      motivo: `Existem ${contexto.excecoesBloqueantesAbertas} exceções bloqueantes pendentes de tratamento.`,
    };
  }

  return { permitido: true, visivel: true };
}
