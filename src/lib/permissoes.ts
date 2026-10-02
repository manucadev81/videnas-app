import type { Acao, AcaoId, EstadoPeriodo, ModuloId, PerfilId, PeriodoObrigacao } from "@/lib/tipos";
import {
  ROTULOS_COMPLETOS_APROVADOR,
  configuracaoFluxo,
  estadosOrigemDaSubstituicao,
  substituicaoHabilitada,
} from "@/lib/mock/configuracao-fluxo";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { avaliarParticipantesDoComite, type ImpedimentosComite } from "@/lib/comite";
import { avaliarAcaoDeEntrega, type AcaoDeEntrega } from "@/lib/contrato";
import { avaliarEnvioParaValidacao, avaliarValidadorDesignado } from "@/lib/validadores";

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
    rotulo: configuracaoFluxo.rotuloAprovador,
    rotuloCompleto: ROTULOS_COMPLETOS_APROVADOR[configuracaoFluxo.rotuloAprovador],
    descricao:
      "Na instituição cliente: aprova o que a Videnas já validou e acompanha a entrega ao órgão. Conforme o contrato e o cadastro prévio, a transmissão é feita pela Videnas ou pelo próprio Compliance; sem transmissão disponível, ele registra o protocolo manualmente.",
    lado: "cliente",
    corBadge: "brand",
    icone: "ShieldCheck",
    rotasPermitidas: [
      ...ROTAS_PUBLICAS,
      "/onboarding",
      "/app",
      ...ROTAS_MODULOS_REGULATORIOS,
      "/app/fiscal",
      "/app/entregas",
      "/app/calendario",
      "/app/auditoria",
      "/app/evidencias",
      "/app/configuracoes",
      "/app/configuracoes/instituicao",
    ],
    acoesPermitidas: [
      "aprovar",
      "negar_aprovacao",
      "transmitir",
      "marcar_encaminhado",
      "registrar_protocolo_manual",
      "arquivar",
      "exportar_auditoria",
      "baixar_arquivo",
      "baixar_comprovante",
      "verificar_integridade",
      "ver_evidencias",
    ],
    multiTenant: false,
    contextoFixo: true,
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
      "emitir_fiscal",
      "transmitir",
      "registrar_retorno",
      "arquivar",
      "reabrir",
      "iniciar_substituicao",
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
      "emitir_fiscal",
      "transmitir",
      "registrar_retorno",
      "arquivar",
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
      "Provisiona e administra os clientes da Videnas: cadastra o tenant, contrata módulos e convida os usuários iniciais. Não opera o pipeline regulatório; preside o Comitê de Qualidade e registra a decisão.",
    lado: "videnas",
    corBadge: "violet",
    icone: "Building2",
    rotasPermitidas: [
      ...ROTAS_PUBLICAS,
      "/selecionar-instituicao",
      "/app",
      "/app/clientes",
      ...ROTAS_MODULOS_REGULATORIOS,
      "/app/fiscal",
      "/app/auditoria",
      "/app/evidencias",
    ],
    acoesPermitidas: [
      "decidir_comite",
      "editar_areas_cliente",
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

export const PERFIS_SIMULAVEIS: PerfilMetadados[] = PERFIS.filter((perfil) => perfil.id !== "cliente");

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

export const ROTULOS_ACAO: Record<AcaoId, string> = {
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
  iniciar_substituicao: "Iniciar substituição (remessa S)",
  aprovar: "Aprovar e assumir responsabilidade",
  negar_aprovacao: "Devolver / negar aprovação",
  escalar_comite: "Escalar ao Comitê de Qualidade",
  decidir_comite: "Registrar decisão do Comitê de Qualidade",
  emitir_fiscal: "Emitir documento fiscal",
  transmitir: "Transmitir ao órgão",
  registrar_protocolo_manual: "Registrar protocolo manualmente",
  arquivar: "Arquivar período",
  baixar_arquivo: "Baixar arquivo",
  registrar_protocolo: "Registrar protocolo do BCB",
  marcar_encaminhado: "Marcar como encaminhado ao emissor",
  tratar_excecao: "Tratar exceção",
  editar_config_instituicao: "Editar dados da instituição",
  editar_areas_cliente: "Editar áreas do cliente",
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
  estadosOrigem: EstadoPeriodo[];
  estadoDestino: EstadoPeriodo | null;
  variante: Acao["variante"];
  modulos?: ModuloId[];
}

export const MOTIVO_SUBSTITUICAO_ARQUIVADO =
  "Período arquivado: o arquivamento é imutável e não admite remessa de substituição.";

const MODULOS_NAO_FISCAIS: ModuloId[] = ["acam212", "cadoc5711", "cadoc5710"];

const ACOES_DE_ENTREGA: AcaoId[] = [
  "emitir_fiscal",
  "transmitir",
  "registrar_protocolo_manual",
  "marcar_encaminhado",
];
const TODOS_ESTADOS_LEITURA: EstadoPeriodo[] = [
  "aguardando_dados",
  "dados_ingeridos",
  "gerado",
  "aguardando_contador",
  "em_validacao",
  "validado",
  "com_excecoes",
  "liberado",
  "aprovado",
  "devolvido_diretor",
  "em_comite_qualidade",
  "emitido_fiscal",
  "aguardando_retorno",
  "retorno_aceito",
  "retorno_com_ressalvas",
  "retorno_rejeitado",
  "arquivado",
];

const ACOES_LEITURA: AcaoId[] = [
  "baixar_arquivo",
  "baixar_comprovante",
  "verificar_integridade",
  "ver_evidencias",
  "exportar_auditoria",
];

const REGRAS_ACAO: RegraAcao[] = [
  { id: "gerar", estadosOrigem: ["dados_ingeridos"], estadoDestino: "gerado", variante: "primario" },
  { id: "regerar", estadosOrigem: ["com_excecoes", "devolvido_diretor"], estadoDestino: "gerado", variante: "secundario" },
  { id: "enviar_validacao", estadosOrigem: ["gerado"], estadoDestino: "em_validacao", variante: "primario", modulos: MODULOS_NAO_FISCAIS },
  { id: "enviar_contador", estadosOrigem: ["gerado"], estadoDestino: "aguardando_contador", variante: "primario", modulos: ["fiscal"] },
  { id: "validar_fiscal", estadosOrigem: ["aguardando_contador"], estadoDestino: "em_validacao", variante: "primario", modulos: ["fiscal"] },
  { id: "devolver_fiscal", estadosOrigem: ["aguardando_contador"], estadoDestino: "gerado", variante: "destrutivo-suave", modulos: ["fiscal"] },
  { id: "executar_validacao", estadosOrigem: ["em_validacao", "com_excecoes"], estadoDestino: "validado", variante: "primario" },
  { id: "liberar", estadosOrigem: ["validado"], estadoDestino: "liberado", variante: "primario" },
  { id: "aprovar", estadosOrigem: ["liberado"], estadoDestino: "aprovado", variante: "primario" },
  { id: "negar_aprovacao", estadosOrigem: ["liberado"], estadoDestino: "devolvido_diretor", variante: "destrutivo-suave" },
  { id: "escalar_comite", estadosOrigem: ["liberado"], estadoDestino: "em_comite_qualidade", variante: "destrutivo-suave" },
  { id: "decidir_comite", estadosOrigem: ["em_comite_qualidade"], estadoDestino: null, variante: "primario" },
  { id: "emitir_fiscal", estadosOrigem: ["aprovado"], estadoDestino: "emitido_fiscal", variante: "primario", modulos: ["fiscal"] },
  { id: "marcar_encaminhado", estadosOrigem: ["aprovado"], estadoDestino: "aguardando_retorno", variante: "primario", modulos: ["fiscal"] },
  { id: "transmitir", estadosOrigem: ["aprovado", "emitido_fiscal"], estadoDestino: "aguardando_retorno", variante: "primario" },
  { id: "registrar_protocolo", estadosOrigem: ["aprovado"], estadoDestino: "aguardando_retorno", variante: "primario", modulos: MODULOS_NAO_FISCAIS },
  { id: "registrar_protocolo_manual", estadosOrigem: ["aprovado", "emitido_fiscal"], estadoDestino: "aguardando_retorno", variante: "secundario" },
  { id: "registrar_retorno", estadosOrigem: ["aguardando_retorno"], estadoDestino: null, variante: "secundario" },
  { id: "reabrir", estadosOrigem: ["retorno_rejeitado", "retorno_com_ressalvas", "liberado", "aprovado"], estadoDestino: "dados_ingeridos", variante: "destrutivo-suave" },
  { id: "iniciar_substituicao", estadosOrigem: ["retorno_aceito"], estadoDestino: "dados_ingeridos", variante: "destrutivo-suave" },
  { id: "arquivar", estadosOrigem: ["retorno_aceito", "retorno_com_ressalvas"], estadoDestino: "arquivado", variante: "secundario" },
  { id: "baixar_arquivo", estadosOrigem: TODOS_ESTADOS_LEITURA.filter((estado) => estado !== "aguardando_dados" && estado !== "dados_ingeridos"), estadoDestino: null, variante: "ghost" },
  { id: "tratar_excecao", estadosOrigem: ["com_excecoes", "em_validacao"], estadoDestino: null, variante: "secundario" },
  { id: "exportar_auditoria", estadosOrigem: TODOS_ESTADOS_LEITURA, estadoDestino: null, variante: "ghost" },
  { id: "fornecer_dados", estadosOrigem: ["aguardando_dados", "dados_ingeridos"], estadoDestino: null, variante: "primario" },
  { id: "baixar_comprovante", estadosOrigem: TODOS_ESTADOS_LEITURA, estadoDestino: null, variante: "ghost" },
  { id: "verificar_integridade", estadosOrigem: TODOS_ESTADOS_LEITURA, estadoDestino: null, variante: "ghost" },
  { id: "ver_evidencias", estadosOrigem: TODOS_ESTADOS_LEITURA, estadoDestino: null, variante: "ghost" },
  { id: "notificar_cliente", estadosOrigem: ["aguardando_dados", "dados_ingeridos"], estadoDestino: null, variante: "secundario" },
];

function moduloPermiteAcao(regra: RegraAcao, moduloId: ModuloId): boolean {
  return !regra.modulos || regra.modulos.includes(moduloId);
}

function acaoOcultaPorConfiguracao(
  acaoId: AcaoId,
  periodo: PeriodoObrigacao,
  perfil: PerfilId
): boolean {
  switch (acaoId) {
    case "decidir_comite":
      return configuracaoFluxo.comiteQualidade?.decisorPerfilId !== perfil;
    case "registrar_protocolo":
      return true;
    case "emitir_fiscal":
    case "transmitir":
    case "registrar_protocolo_manual":
    case "marcar_encaminhado":
      return !avaliarAcaoDeEntrega(
        acaoId as AcaoDeEntrega,
        perfil,
        periodo,
        buscarInstituicao(periodo.instituicaoId)
      ).visivel;
    case "registrar_retorno":
      return !configuracaoFluxo.registroRetornoPerfis.includes(perfil);
    case "arquivar":
      return (
        !configuracaoFluxo.arquivamentoPerfis.includes(perfil) ||
        (periodo.estado === "retorno_com_ressalvas" &&
          !configuracaoFluxo.caminhosAposRessalvas?.includes("arquivar"))
      );
    case "iniciar_substituicao":
      return !substituicaoHabilitada(periodo.moduloId);
    case "reabrir":
      return (
        periodo.estado === "retorno_com_ressalvas" &&
        !configuracaoFluxo.caminhosAposRessalvas?.includes("reabrir")
      );
    default:
      return false;
  }
}

export function acoesDisponiveis(perfil: PerfilId, periodo: PeriodoObrigacao): Acao[] {
  const perfilMetadados = buscarPerfil(perfil);

  return REGRAS_ACAO.filter((regra) => perfilMetadados.acoesPermitidas.includes(regra.id))
    .filter((regra) => moduloPermiteAcao(regra, periodo.moduloId))
    .filter((regra) => !acaoOcultaPorConfiguracao(regra.id, periodo, perfil))
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
  impedimentosComite?: ImpedimentosComite;
  membroComiteId?: string;
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

  if (!moduloPermiteAcao(regra, periodo.moduloId)) {
    return { permitido: false, visivel: false };
  }

  if (acaoOcultaPorConfiguracao(acaoId, periodo, perfil)) {
    return { permitido: false, visivel: false };
  }

  if (
    periodo.estado === "em_comite_qualidade" &&
    acaoId !== "decidir_comite" &&
    !ACOES_LEITURA.includes(acaoId)
  ) {
    return { permitido: false, visivel: false };
  }

  if (acaoId === "iniciar_substituicao") {
    if (periodo.estado === "arquivado") {
      return {
        permitido: false,
        visivel: true,
        motivo: MOTIVO_SUBSTITUICAO_ARQUIVADO,
      };
    }
    if (!estadosOrigemDaSubstituicao(periodo.moduloId).includes(periodo.estado)) {
      return { permitido: false, visivel: false };
    }
  }

  if (!regra.estadosOrigem.includes(periodo.estado)) {
    return {
      permitido: false,
      visivel: true,
      motivo: "Ação indisponível no estado atual do período.",
    };
  }

  if (ACOES_DE_ENTREGA.includes(acaoId)) {
    const avaliacaoEntrega = avaliarAcaoDeEntrega(
      acaoId as AcaoDeEntrega,
      perfil,
      periodo,
      buscarInstituicao(periodo.instituicaoId),
      contexto.usuarioAtualId
    );
    if (!avaliacaoEntrega.permitido) {
      return {
        permitido: false,
        visivel: avaliacaoEntrega.visivel,
        motivo: avaliacaoEntrega.motivo ?? "Ação indisponível para este contrato.",
      };
    }
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

  if (acaoId === "enviar_validacao" || acaoId === "validar_fiscal") {
    const avaliacaoEnvio = avaliarEnvioParaValidacao(periodo);
    if (!avaliacaoEnvio.permitido) {
      return avaliacaoEnvio;
    }
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

  if (acaoId === "liberar" || acaoId === "executar_validacao") {
    const avaliacaoValidador = avaliarValidadorDesignado(periodo, contexto.usuarioAtualId);
    if (!avaliacaoValidador.permitido) {
      return avaliacaoValidador;
    }
  }

  if (
    acaoId === "arquivar" &&
    contexto.usuarioAtualId &&
    contexto.usuarioAtualId === periodo.geradoPorUsuarioId
  ) {
    return {
      permitido: false,
      visivel: true,
      motivo: "Quem gerou o arquivo não pode arquivá-lo. Segregação de funções obrigatória.",
    };
  }

  if (
    acaoId === "arquivar" &&
    contexto.usuarioAtualId &&
    contexto.usuarioAtualId === periodo.retornoRegistradoPorUsuarioId
  ) {
    return {
      permitido: false,
      visivel: true,
      motivo: "Quem registrou o retorno não pode arquivar o período. Segregação de funções obrigatória.",
    };
  }

  if (acaoId === "decidir_comite" && contexto.impedimentosComite) {
    const participacao = avaliarParticipantesDoComite(
      periodo,
      { presidenteId: contexto.usuarioAtualId, membroId: contexto.membroComiteId },
      contexto.impedimentosComite
    );
    if (!participacao.permitido) {
      return { permitido: false, visivel: true, motivo: participacao.motivo };
    }
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
