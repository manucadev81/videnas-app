import type { Acao, AcaoId, PerfilId, PeriodoObrigacao } from "@/lib/tipos";

export interface PerfilMetadados {
  id: PerfilId;
  rotulo: string;
  rotuloCompleto: string;
  descricao: string;
  lado: "cliente" | "videnas";
  corBadge: string;
  icone: string;
  rotasPermitidas: string[];
  acoesPermitidas: AcaoId[];
  multiTenant: boolean;
  contextoFixo: boolean;
}

const ROTAS_PUBLICAS = ["/", "/login"];

const ROTAS_MODULOS_REGULATORIOS = ["/app/acam212", "/app/cadoc"];

const ROTAS_CONFIGURACOES_TENANT = [
  "/app/configuracoes",
  "/app/configuracoes/instituicao",
  "/app/configuracoes/usuarios",
  "/app/configuracoes/dicionarios",
];

const ROTAS_SEM_DESCENDENTES = new Set(["/", "/app", "/app/configuracoes"]);

export const PERFIS: PerfilMetadados[] = [
  {
    id: "diretor",
    rotulo: "Diretor",
    rotuloCompleto: "Diretor / Compliance Responsável",
    descricao: "Aprova, responde perante o BCB e revisa exceções da instituição.",
    lado: "cliente",
    corBadge: "brand",
    icone: "ShieldCheck",
    rotasPermitidas: [
      ...ROTAS_PUBLICAS,
      "/selecionar-instituicao",
      "/onboarding",
      "/app",
      "/app/fornecimento",
      ...ROTAS_MODULOS_REGULATORIOS,
      "/app/fiscal",
      "/app/entregas",
      "/app/calendario",
      "/app/auditoria",
      "/app/evidencias",
      ...ROTAS_CONFIGURACOES_TENANT,
    ],
    acoesPermitidas: [
      "aprovar",
      "registrar_protocolo",
      "marcar_encaminhado",
      "tratar_excecao",
      "editar_config_instituicao",
      "gerenciar_usuarios",
      "exportar_auditoria",
      "baixar_arquivo",
      "baixar_comprovante",
      "verificar_integridade",
      "ver_evidencias",
    ],
    multiTenant: false,
    contextoFixo: false,
  },
  {
    id: "operacional",
    rotulo: "Operacional",
    rotuloCompleto: "Operacional / Suporte ao cliente",
    descricao:
      "Apoia o cliente no fornecimento: acompanha o que já foi entregue, orienta pendências, cobra prazos e trata exceções. Não sobe dados em nome do cliente.",
    lado: "cliente",
    corBadge: "brand",
    icone: "Boxes",
    rotasPermitidas: [
      ...ROTAS_PUBLICAS,
      "/selecionar-instituicao",
      "/onboarding",
      "/app",
      "/app/fornecimento",
      ...ROTAS_MODULOS_REGULATORIOS,
      "/app/fiscal",
      "/app/entregas",
      "/app/calendario",
      "/app/auditoria",
      ...ROTAS_CONFIGURACOES_TENANT,
    ],
    acoesPermitidas: [
      "baixar_arquivo",
      "tratar_excecao",
      "editar_dicionarios",
      "notificar_cliente",
      "gerenciar_usuarios",
    ],
    multiTenant: false,
    contextoFixo: false,
  },
  {
    id: "contador",
    rotulo: "Contador",
    rotuloCompleto: "Contador / Fiscal",
    descricao: "Valida alíquota, retenção e enquadramento tributário do módulo Fiscal.",
    lado: "cliente",
    corBadge: "candidate",
    icone: "Calculator",
    rotasPermitidas: [
      ...ROTAS_PUBLICAS,
      "/selecionar-instituicao",
      "/onboarding",
      "/app",
      "/app/fiscal",
      "/app/calendario",
    ],
    acoesPermitidas: ["validar_fiscal", "devolver_fiscal", "baixar_arquivo"],
    multiTenant: false,
    contextoFixo: false,
  },
  {
    id: "cliente",
    rotulo: "Cliente",
    rotuloCompleto: "Cliente / Fornecedor de dados",
    descricao:
      "Fornece os dados de origem de cada obrigação, acompanha o que ainda falta entregar e retira os arquivos lacrados pela Videnas.",
    lado: "cliente",
    corBadge: "brand",
    icone: "UploadCloud",
    rotasPermitidas: [
      ...ROTAS_PUBLICAS,
      "/app",
      "/app/fornecimento",
      "/app/entregas",
      "/app/calendario",
    ],
    acoesPermitidas: ["fornecer_dados", "baixar_comprovante", "baixar_arquivo", "verificar_integridade"],
    multiTenant: false,
    contextoFixo: true,
  },
  {
    id: "executor",
    rotulo: "Executor",
    rotuloCompleto: "Executor — Videnas",
    descricao:
      "Parte dos dados que o Cliente já forneceu para rodar a ingestão técnica e a geração dos arquivos. Nunca fornece dados nem libera.",
    lado: "videnas",
    corBadge: "violet",
    icone: "Cog",
    rotasPermitidas: [
      ...ROTAS_PUBLICAS,
      "/selecionar-instituicao",
      "/app",
      "/app/operacao",
      "/app/fornecimento",
      ...ROTAS_MODULOS_REGULATORIOS,
      "/app/fiscal",
      "/app/calendario",
      "/app/auditoria",
      "/app/evidencias",
      "/app/configuracoes",
      "/app/configuracoes/dicionarios",
    ],
    acoesPermitidas: [
      "gerar",
      "regerar",
      "enviar_validacao",
      "enviar_contador",
      "reabrir",
      "tratar_excecao",
      "editar_dicionarios",
      "trocar_tenant",
      "exportar_auditoria",
      "baixar_arquivo",
      "baixar_comprovante",
      "verificar_integridade",
      "ver_evidencias",
    ],
    multiTenant: true,
    contextoFixo: false,
  },
  {
    id: "validador",
    rotulo: "Validador",
    rotuloCompleto: "Validador — Videnas",
    descricao: "Confere a validação contra o schema oficial e libera o arquivo para o cliente. Nunca gera.",
    lado: "videnas",
    corBadge: "violet",
    icone: "BadgeCheck",
    rotasPermitidas: [
      ...ROTAS_PUBLICAS,
      "/selecionar-instituicao",
      "/app",
      "/app/operacao",
      ...ROTAS_MODULOS_REGULATORIOS,
      "/app/fiscal",
      "/app/calendario",
      "/app/auditoria",
      "/app/evidencias",
    ],
    acoesPermitidas: [
      "executar_validacao",
      "liberar",
      "registrar_retorno",
      "trocar_tenant",
      "exportar_auditoria",
      "baixar_arquivo",
      "baixar_comprovante",
      "verificar_integridade",
      "ver_evidencias",
    ],
    multiTenant: true,
    contextoFixo: false,
  },
  {
    id: "admin",
    rotulo: "Administrador",
    rotuloCompleto: "Administrador — Videnas",
    descricao:
      "Provisiona e administra os clientes da Videnas: cadastra o tenant, contrata módulos e convida os usuários iniciais. Não opera o pipeline regulatório.",
    lado: "videnas",
    corBadge: "violet",
    icone: "Building2",
    rotasPermitidas: [
      ...ROTAS_PUBLICAS,
      "/selecionar-instituicao",
      "/app",
      "/app/clientes",
      "/app/auditoria",
      "/app/evidencias",
    ],
    acoesPermitidas: [
      "provisionar_tenant",
      "gerenciar_clientes",
      "convidar_usuario_inicial",
      "suspender_tenant",
      "alterar_modulos_contratados",
      "trocar_tenant",
      "exportar_auditoria",
      "ver_evidencias",
      "verificar_integridade",
    ],
    multiTenant: true,
    contextoFixo: false,
  },
];

export const PERFIS_SIMULAVEIS: PerfilMetadados[] = PERFIS.filter((perfil) => !perfil.contextoFixo);

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
  return rotas.some((rota) => !ROTAS_SEM_DESCENDENTES.has(rota) && href.startsWith(`${rota}/`));
}

const ROTULOS_ACAO: Record<AcaoId, string> = {
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
  fornecer_dados: "Fornecer dados do período",
  baixar_comprovante: "Baixar comprovante lacrado",
  verificar_integridade: "Verificar integridade do arquivo",
  ver_evidencias: "Ver cadeia de custódia",
  notificar_cliente: "Notificar cliente do que falta",
  provisionar_tenant: "Cadastrar novo cliente",
  gerenciar_clientes: "Administrar carteira de clientes",
  convidar_usuario_inicial: "Convidar usuários iniciais do cliente",
  suspender_tenant: "Suspender / reativar cliente",
  alterar_modulos_contratados: "Alterar módulos contratados",
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
  { id: "fornecer_dados", estadosOrigem: ["aguardando_dados", "dados_ingeridos"], estadoDestino: null, variante: "primario" },
  { id: "baixar_comprovante", estadosOrigem: ["aguardando_dados", "dados_ingeridos", "gerado", "aguardando_contador", "em_validacao", "validado", "com_excecoes", "liberado", "aprovado", "entregue", "retorno_com_erro"], estadoDestino: null, variante: "ghost" },
  { id: "verificar_integridade", estadosOrigem: ["aguardando_dados", "dados_ingeridos", "gerado", "aguardando_contador", "em_validacao", "validado", "com_excecoes", "liberado", "aprovado", "entregue", "retorno_com_erro"], estadoDestino: null, variante: "ghost" },
  { id: "ver_evidencias", estadosOrigem: ["aguardando_dados", "dados_ingeridos", "gerado", "aguardando_contador", "em_validacao", "validado", "com_excecoes", "liberado", "aprovado", "entregue", "retorno_com_erro"], estadoDestino: null, variante: "ghost" },
  { id: "notificar_cliente", estadosOrigem: ["aguardando_dados", "dados_ingeridos"], estadoDestino: null, variante: "secundario" },
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

  if (acaoId === "fornecer_dados" && !["aguardando_dados", "dados_ingeridos"].includes(periodo.estado)) {
    return {
      permitido: false,
      visivel: true,
      motivo: "O período já foi gerado pela Videnas. Solicite a reabertura para reenviar dados.",
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
      motivo: "Disponível após a liberação pelo Validador Videnas.",
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
