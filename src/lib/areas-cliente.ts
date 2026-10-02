import type {
  AreaCliente,
  EtapaId,
  Instituicao,
  MapeamentoAreasCliente,
  ModuloId,
  TipoAreaCliente,
} from "@/lib/tipos";
import { configuracaoFluxo, type GatilhoNotificacaoArea } from "@/lib/mock/configuracao-fluxo";
import { listarInstituicoes } from "@/lib/mock/instituicoes";

export const TIPOS_AREA_CLIENTE: TipoAreaCliente[] = ["controles_internos", "custodia", "contabil"];

export const ROTULO_TIPO_AREA: Record<TipoAreaCliente, string> = {
  controles_internos: "Controles internos",
  custodia: "Custódia",
  contabil: "Contábil",
};

export const ROTULO_ETAPA_AREA: Record<EtapaId, string> = {
  ingestao: "Ingestão",
  geracao: "Geração",
  contador: "Contador",
  validacao: "Validação",
  auditoria: "Auditoria",
  entrega: "Entrega",
};

export const ROTULO_GATILHO_AREA: Record<GatilhoNotificacaoArea, string> = {
  aprovacao: "aprovação do período",
  arquivamento: "arquivamento do período",
};

export const TAMANHO_MINIMO_NOME_RESPONSAVEL = 3;

export function emailAreaPlausivel(email: string): boolean {
  const valor = email.trim();
  const posicaoArroba = valor.indexOf("@");
  if (posicaoArroba <= 0 || valor.indexOf("@", posicaoArroba + 1) !== -1) {
    return false;
  }
  const dominio = valor.slice(posicaoArroba + 1);
  const posicaoPonto = dominio.indexOf(".");
  return posicaoPonto > 0 && posicaoPonto < dominio.length - 1 && !/\s/.test(valor);
}

export function areaCadastrada(area: AreaCliente): boolean {
  return area.responsavelNome.trim().length > 0 && area.email.trim().length > 0;
}

export function areasDaInstituicao(instituicao: Instituicao | undefined): AreaCliente[] {
  return (instituicao?.areasCliente ?? []).filter(areaCadastrada);
}

export function areaVazia(tipo: TipoAreaCliente, instituicaoId: string): AreaCliente {
  return {
    id: `area-${instituicaoId.replace(/^inst-/, "")}-${tipo}`,
    tipo,
    nome: ROTULO_TIPO_AREA[tipo],
    responsavelNome: "",
    email: "",
    telefone: "",
  };
}

export function descricaoAreaPorId(areaId: string): string {
  for (const instituicao of listarInstituicoes()) {
    const area = (instituicao.areasCliente ?? []).find((item) => item.id === areaId);
    if (area) {
      return area.responsavelNome.trim() ? `${area.nome} (${area.responsavelNome})` : area.nome;
    }
  }
  return "";
}

export function areasParaEdicao(instituicao: Instituicao): AreaCliente[] {
  return TIPOS_AREA_CLIENTE.map((tipo) => {
    const existente = (instituicao.areasCliente ?? []).find((area) => area.tipo === tipo);
    return existente ? { ...existente, telefone: existente.telefone ?? "" } : areaVazia(tipo, instituicao.id);
  });
}

export interface ErrosArea {
  nome?: string;
  responsavelNome?: string;
  email?: string;
}

export function validarArea(area: AreaCliente): ErrosArea {
  const preenchida =
    area.responsavelNome.trim().length > 0 ||
    area.email.trim().length > 0 ||
    (area.telefone ?? "").trim().length > 0;
  if (!preenchida) {
    return {};
  }
  const erros: ErrosArea = {};
  if (!area.nome.trim()) {
    erros.nome = "Informe o nome da área.";
  }
  if (area.responsavelNome.trim().length < TAMANHO_MINIMO_NOME_RESPONSAVEL) {
    erros.responsavelNome = "Informe o nome do contato da área.";
  }
  if (!emailAreaPlausivel(area.email)) {
    erros.email = "Informe um e-mail válido.";
  }
  return erros;
}

export function areaTemErro(erros: ErrosArea): boolean {
  return Boolean(erros.nome || erros.responsavelNome || erros.email);
}

export function normalizarAreasParaSalvar(areas: AreaCliente[]): AreaCliente[] {
  return areas
    .filter((area) => {
      const erros = validarArea(area);
      return !areaTemErro(erros) && areaCadastrada(area);
    })
    .map((area) => {
      const telefone = (area.telefone ?? "").trim();
      return {
        id: area.id,
        tipo: area.tipo,
        nome: area.nome.trim(),
        responsavelNome: area.responsavelNome.trim(),
        email: area.email.trim().toLowerCase(),
        ...(telefone ? { telefone } : {}),
      };
    });
}

export function mapeamentoDaInstituicao(instituicao: Instituicao | undefined): MapeamentoAreasCliente {
  return instituicao?.mapeamentoAreas ?? {};
}

export function tiposMapeadosDoModulo(
  instituicao: Instituicao | undefined,
  moduloId: ModuloId
): TipoAreaCliente[] {
  const porEtapa = mapeamentoDaInstituicao(instituicao)[moduloId] ?? {};
  const tipos = new Set<TipoAreaCliente>();
  for (const lista of Object.values(porEtapa)) {
    for (const tipo of lista ?? []) {
      tipos.add(tipo);
    }
  }
  return TIPOS_AREA_CLIENTE.filter((tipo) => tipos.has(tipo));
}

export interface ResponsabilidadeEtapa {
  etapaId: EtapaId;
  tipos: TipoAreaCliente[];
}

export function responsabilidadePorEtapa(
  instituicao: Instituicao | undefined,
  moduloId: ModuloId,
  etapas: EtapaId[]
): ResponsabilidadeEtapa[] {
  const porEtapa = mapeamentoDaInstituicao(instituicao)[moduloId] ?? {};
  return etapas
    .map((etapaId) => ({ etapaId, tipos: porEtapa[etapaId] ?? [] }))
    .filter((item) => item.tipos.length > 0);
}

export function normalizarMapeamento(
  mapeamento: MapeamentoAreasCliente,
  modulos: ModuloId[]
): MapeamentoAreasCliente {
  const normalizado: MapeamentoAreasCliente = {};
  for (const moduloId of modulos) {
    const porEtapa = mapeamento[moduloId] ?? {};
    const etapasNormalizadas: Partial<Record<EtapaId, TipoAreaCliente[]>> = {};
    for (const etapaId of Object.keys(porEtapa) as EtapaId[]) {
      const tipos = TIPOS_AREA_CLIENTE.filter((tipo) => porEtapa[etapaId]?.includes(tipo));
      if (tipos.length > 0) {
        etapasNormalizadas[etapaId] = tipos;
      }
    }
    if (Object.keys(etapasNormalizadas).length > 0) {
      normalizado[moduloId] = etapasNormalizadas;
    }
  }
  return normalizado;
}

export function descreverMapeamentoModulo(
  mapeamento: MapeamentoAreasCliente,
  moduloId: ModuloId
): string {
  const porEtapa = mapeamento[moduloId] ?? {};
  const linhas = (Object.keys(ROTULO_ETAPA_AREA) as EtapaId[])
    .filter((etapaId) => (porEtapa[etapaId] ?? []).length > 0)
    .map((etapaId) => `${ROTULO_ETAPA_AREA[etapaId]}: ${(porEtapa[etapaId] ?? []).map((tipo) => ROTULO_TIPO_AREA[tipo]).join(", ")}`);
  return linhas.length > 0 ? linhas.join("; ") : "sem área mapeada";
}

export function areasMapeadasDoModulo(
  instituicao: Instituicao | undefined,
  moduloId: ModuloId
): AreaCliente[] {
  const tipos = tiposMapeadosDoModulo(instituicao, moduloId);
  return areasDaInstituicao(instituicao).filter((area) => tipos.includes(area.tipo));
}

export function areasDestinatarias(
  instituicao: Instituicao | undefined,
  moduloId: ModuloId
): AreaCliente[] {
  if (configuracaoFluxo.areasCliente.destinatariosNotificacao === "areas_mapeadas") {
    return areasMapeadasDoModulo(instituicao, moduloId);
  }
  return areasDaInstituicao(instituicao);
}

export function gatilhoNotifica(gatilho: GatilhoNotificacaoArea): boolean {
  const config = configuracaoFluxo.areasCliente;
  return config.notificacaoHabilitada && config.eventosNotificados.includes(gatilho);
}
