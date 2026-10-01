import type { Instituicao, MapeamentoAreasCliente, ModuloId } from "@/lib/tipos";
import {
  definirRegistroInstituicoes,
  encontrarInstituicaoRegistrada,
  listarInstituicoesRegistradas,
} from "@/lib/tenants/registro";

const MAPEAMENTO_INFORMADO_PELO_CLIENTE: MapeamentoAreasCliente = {
  acam212: { ingestao: ["contabil"], entrega: ["controles_internos"] },
  cadoc5711: { ingestao: ["custodia"], entrega: ["controles_internos"] },
  cadoc5710: { ingestao: ["custodia"], entrega: ["controles_internos"] },
  fiscal: { contador: ["contabil"], entrega: ["controles_internos"] },
};

function mapeamentoInformado(modulos: ModuloId[]): MapeamentoAreasCliente {
  const mapeamento: MapeamentoAreasCliente = {};
  for (const moduloId of modulos) {
    mapeamento[moduloId] = MAPEAMENTO_INFORMADO_PELO_CLIENTE[moduloId];
  }
  return mapeamento;
}

export const instituicoesSemente: Instituicao[] = [
  {
    id: "inst-meridian",
    razaoSocial: "Meridian Digital Assets Ltda",
    nomeFantasia: "Meridian",
    cnpj: "41.872.309/0001-64",
    tipo: "exchange",
    inscricaoMunicipal: "1.284.917-3",
    municipio: "São Paulo",
    uf: "SP",
    codigoIbge: "3550308",
    cep: "04538-133",
    situacaoRegulatoria: "Em processo de autorização — Res. BCB 519/2025",
    responsavelBcb: {
      nome: "Ricardo Menezes",
      cpf: "285.914.377-06",
      cargo: "Responsável de Compliance",
      email: "ricardo.menezes@meridiandigital.com.br",
      telefone: "(11) 3045-8812",
    },
    modulosContratados: ["acam212", "cadoc5711", "cadoc5710", "fiscal"],
    onboardingConcluido: true,
    etapaOnboardingAtual: 6,
    criadoEm: "2026-03-11T14:22:00-03:00",
    statusImplantacao: "ativo",
    areasCliente: [
      {
        id: "area-meridian-controles_internos",
        tipo: "controles_internos",
        nome: "Controles internos",
        responsavelNome: "Luciana Pacheco",
        email: "luciana.pacheco@meridiandigital.com.br",
        telefone: "(11) 3045-8820",
      },
      {
        id: "area-meridian-custodia",
        tipo: "custodia",
        nome: "Custódia",
        responsavelNome: "Fábio Albuquerque",
        email: "fabio.albuquerque@meridiandigital.com.br",
      },
      {
        id: "area-meridian-contabil",
        tipo: "contabil",
        nome: "Contábil",
        responsavelNome: "Renata Siqueira",
        email: "renata.siqueira@meridiandigital.com.br",
      },
    ],
    mapeamentoAreas: mapeamentoInformado(["acam212", "cadoc5711", "cadoc5710", "fiscal"]),
    contrato: {
      modulos: {
        acam212: { emissaoIncluida: false, transmissaoIncluida: true, responsavelTransmissao: "videnas" },
        cadoc5711: { emissaoIncluida: false, transmissaoIncluida: true, responsavelTransmissao: "videnas" },
        cadoc5710: { emissaoIncluida: false, transmissaoIncluida: true, responsavelTransmissao: "videnas" },
        fiscal: { emissaoIncluida: true, transmissaoIncluida: true, responsavelTransmissao: "videnas" },
      },
      cadastros: [
        {
          id: "cad-meridian-sta",
          moduloIds: ["acam212", "cadoc5711"],
          canal: "sisbacen",
          emissor: null,
          responsavel: "videnas",
          status: "ativo",
          identificador: "STA-VID-0041872",
          registradoEm: "2026-03-20",
          validoAte: "2027-03-20",
        },
        {
          id: "cad-meridian-sta-5710",
          moduloIds: ["cadoc5710"],
          canal: "sisbacen",
          emissor: null,
          responsavel: "videnas",
          status: "ativo",
          identificador: "STA-VID-0041873",
          registradoEm: "2025-08-15",
          validoAte: "2026-08-15",
        },
        {
          id: "cad-meridian-nfse-sp",
          moduloIds: ["fiscal"],
          canal: null,
          emissor: "NFS-e Prefeitura de São Paulo",
          responsavel: "videnas",
          status: "ativo",
          identificador: "NFSE-SP-VID-90214",
          registradoEm: "2026-03-25",
          validoAte: "2027-03-25",
        },
      ],
    },
  },
  {
    id: "inst-cofre-atlantico",
    razaoSocial: "Cofre Atlântico Custódia de Ativos Digitais S.A.",
    nomeFantasia: "Cofre Atlântico",
    cnpj: "28.554.117/0001-05",
    tipo: "custodiante",
    inscricaoMunicipal: "0.774.302-9",
    municipio: "Rio de Janeiro",
    uf: "RJ",
    codigoIbge: "3304557",
    cep: "22250-040",
    situacaoRegulatoria: "Em processo de autorização — Res. BCB 519/2025",
    responsavelBcb: {
      nome: "Helena Drummond",
      cpf: "402.117.885-30",
      cargo: "Responsável de Compliance",
      email: "helena.drummond@cofreatlantico.com.br",
      telefone: "(21) 3987-2245",
    },
    modulosContratados: ["cadoc5711", "cadoc5710", "fiscal"],
    onboardingConcluido: true,
    etapaOnboardingAtual: 6,
    criadoEm: "2026-03-18T09:40:00-03:00",
    statusImplantacao: "ativo",
    areasCliente: [
      {
        id: "area-cofre-atlantico-controles_internos",
        tipo: "controles_internos",
        nome: "Controles internos",
        responsavelNome: "Marcelo Teixeira",
        email: "marcelo.teixeira@cofreatlantico.com.br",
        telefone: "(21) 3987-2250",
      },
      {
        id: "area-cofre-atlantico-custodia",
        tipo: "custodia",
        nome: "Custódia",
        responsavelNome: "Otávio Ramos",
        email: "otavio.ramos@cofreatlantico.com.br",
      },
      {
        id: "area-cofre-atlantico-contabil",
        tipo: "contabil",
        nome: "Contábil",
        responsavelNome: "Simone Castelo",
        email: "simone.castelo@cofreatlantico.com.br",
      },
    ],
    mapeamentoAreas: mapeamentoInformado(["cadoc5711", "cadoc5710", "fiscal"]),
    contrato: {
      modulos: {
        cadoc5711: { emissaoIncluida: false, transmissaoIncluida: true, responsavelTransmissao: "diretor" },
        cadoc5710: { emissaoIncluida: false, transmissaoIncluida: false, responsavelTransmissao: "videnas" },
        fiscal: { emissaoIncluida: false, transmissaoIncluida: false, responsavelTransmissao: "videnas" },
      },
      cadastros: [
        {
          id: "cad-cofre-sta-diretor",
          moduloIds: ["cadoc5711"],
          canal: "sisbacen",
          emissor: null,
          responsavel: "diretor",
          status: "ativo",
          identificador: "STA-HDRUMMOND-0192",
          registradoEm: "2026-04-02",
          validoAte: "2027-04-02",
        },
      ],
    },
  },
  {
    id: "inst-pampulha",
    razaoSocial: "Pampulha Capital Mesa de Ativos Ltda",
    nomeFantasia: "Pampulha Capital",
    cnpj: "55.903.226/0001-18",
    tipo: "mesa_otc",
    inscricaoMunicipal: "2.910.744-1",
    municipio: "Belo Horizonte",
    uf: "MG",
    codigoIbge: "3106200",
    cep: "30140-071",
    situacaoRegulatoria: "Cadastro em análise — Res. BCB 519/2025",
    responsavelBcb: {
      nome: "Sérgio Bittencourt",
      cpf: "119.446.203-72",
      cargo: "Responsável de Compliance",
      email: "sergio.bittencourt@pampulhacapital.com.br",
      telefone: "(31) 3221-6690",
    },
    modulosContratados: ["acam212", "fiscal"],
    onboardingConcluido: false,
    etapaOnboardingAtual: 4,
    criadoEm: "2026-08-25T11:05:00-03:00",
    statusImplantacao: "onboarding_em_andamento",
    areasCliente: [
      {
        id: "area-pampulha-controles_internos",
        tipo: "controles_internos",
        nome: "Controles internos",
        responsavelNome: "Henrique Lacerda",
        email: "henrique.lacerda@pampulhacapital.com.br",
        telefone: "(31) 3221-6700",
      },
      {
        id: "area-pampulha-custodia",
        tipo: "custodia",
        nome: "Custódia",
        responsavelNome: "Daniela Moura",
        email: "daniela.moura@pampulhacapital.com.br",
      },
      {
        id: "area-pampulha-contabil",
        tipo: "contabil",
        nome: "Contábil",
        responsavelNome: "Paulo Vasconcellos",
        email: "paulo.vasconcellos@pampulhacapital.com.br",
      },
    ],
    mapeamentoAreas: mapeamentoInformado(["acam212", "fiscal"]),
    contrato: {
      modulos: {
        acam212: { emissaoIncluida: false, transmissaoIncluida: true, responsavelTransmissao: "videnas" },
        fiscal: { emissaoIncluida: false, transmissaoIncluida: false, responsavelTransmissao: "videnas" },
      },
      cadastros: [
        {
          id: "cad-pampulha-sta",
          moduloIds: ["acam212"],
          canal: "sisbacen",
          emissor: null,
          responsavel: "videnas",
          status: "pendente",
          identificador: null,
          registradoEm: "2026-08-26",
          validoAte: null,
        },
      ],
    },
  },
];

definirRegistroInstituicoes(instituicoesSemente);

export function listarInstituicoes(): Instituicao[] {
  const registradas = listarInstituicoesRegistradas();
  return registradas.length > 0 ? registradas : instituicoesSemente;
}

export function buscarInstituicao(id: string): Instituicao | undefined {
  return (
    encontrarInstituicaoRegistrada(id) ??
    instituicoesSemente.find((instituicao) => instituicao.id === id)
  );
}
