"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookMarked,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileSpreadsheet,
  Plus,
  Receipt,
  ShieldCheck,
  SkipForward,
  Trash2,
  UploadCloud,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { useHidratarSessao, useSessaoStore } from "@/lib/store/sessao";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { formatarCNPJ } from "@/lib/formatadores";
import { cn } from "@/lib/utils";
import type { ModuloId, PerfilId, TipoInstituicao } from "@/lib/tipos";

const TOTAL_PASSOS = 7;

const ROTULO_TIPO_INSTITUICAO: Record<TipoInstituicao, string> = {
  exchange: "Exchange",
  custodiante: "Custodiante",
  mesa_otc: "Mesa de OTC",
};

const PERFIS_CLIENTE: { id: PerfilId; rotulo: string }[] = [
  { id: "diretor", rotulo: "Diretor / Compliance Responsável" },
  { id: "operacional", rotulo: "Operacional / Backoffice" },
  { id: "contador", rotulo: "Contador / Fiscal" },
];

const REGIMES_TRIBUTARIOS = ["Simples Nacional", "Lucro Presumido", "Lucro Real"];

const TITULARIDADES_CONTA = [
  { id: "propria", rotulo: "Própria" },
  { id: "de_cliente", rotulo: "De cliente" },
  { id: "terceiro", rotulo: "Terceiro" },
];

interface EnderecoForm {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

interface ResponsavelForm {
  nome: string;
  cpf: string;
  cargo: string;
  email: string;
}

interface InstituicaoForm {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  tipo: TipoInstituicao;
  codigoRegistroBcb: string;
  endereco: EnderecoForm;
  responsavel: ResponsavelForm;
}

interface ModulosForm {
  acam212: boolean;
  cadoc5711: boolean;
  cadoc5710: boolean;
  fiscal: boolean;
  cienciaFiscal: boolean;
}

interface UsuarioWizard {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilId;
}

interface AtivoWizard {
  id: string;
  codigoInterno: string;
  simbolo: string;
  nome: string;
  codigoOficial: string;
  rede: string;
  decimais: string;
}

interface ContaWizard {
  id: string;
  apelido: string;
  endereco: string;
  rede: string;
  titularidade: "propria" | "de_cliente" | "terceiro";
}

interface DadosFiscaisForm {
  municipio: string;
  codigoIbge: string;
  codigoServico: string;
  aliquotaIss: string;
  regime: string;
}

const ATIVOS_IMPORTADOS: Omit<AtivoWizard, "id">[] = [
  { codigoInterno: "BTC_SPOT", simbolo: "BTC", nome: "Bitcoin", codigoOficial: "VC0001", rede: "Bitcoin", decimais: "8" },
  { codigoInterno: "ETH_SPOT", simbolo: "ETH", nome: "Ethereum", codigoOficial: "VC0002", rede: "Ethereum", decimais: "18" },
  { codigoInterno: "USDT_ERC20", simbolo: "USDT", nome: "Tether", codigoOficial: "VC0107", rede: "Ethereum", decimais: "6" },
  { codigoInterno: "USDC_ERC20", simbolo: "USDC", nome: "USD Coin", codigoOficial: "VC0108", rede: "Ethereum", decimais: "6" },
  { codigoInterno: "SOL_SPOT", simbolo: "SOL", nome: "Solana", codigoOficial: "VC0031", rede: "Solana", decimais: "9" },
  { codigoInterno: "ADA_SPOT", simbolo: "ADA", nome: "Cardano", codigoOficial: "VC0018", rede: "Cardano", decimais: "6" },
  { codigoInterno: "XRP_SPOT", simbolo: "XRP", nome: "XRP", codigoOficial: "VC0005", rede: "XRP Ledger", decimais: "6" },
  { codigoInterno: "MATIC_SPOT", simbolo: "MATIC", nome: "Polygon", codigoOficial: "VC0042", rede: "Polygon", decimais: "18" },
  { codigoInterno: "LINK_SPOT", simbolo: "LINK", nome: "Chainlink", codigoOficial: "VC0056", rede: "Ethereum", decimais: "18" },
  { codigoInterno: "BNB_SPOT", simbolo: "BNB", nome: "BNB", codigoOficial: "VC0012", rede: "BNB Smart Chain", decimais: "18" },
  { codigoInterno: "DOT_SPOT", simbolo: "DOT", nome: "Polkadot", codigoOficial: "VC0037", rede: "Polkadot", decimais: "10" },
  { codigoInterno: "AVAX_SPOT", simbolo: "AVAX", nome: "Avalanche", codigoOficial: "VC0049", rede: "Avalanche", decimais: "18" },
];

function novoId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 9)}`;
}

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

function EsqueletoOnboarding() {
  return (
    <div
      role="status"
      aria-label="Carregando configuração guiada do ambiente"
      className="mx-auto flex min-h-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-6"
    >
      <div className="space-y-3">
        <Skeleton className="h-7 w-80" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="flex flex-1 flex-col gap-6 md:flex-row">
        <div className="flex w-full shrink-0 flex-row gap-2 overflow-x-auto md:w-64 md:flex-col md:overflow-visible">
          {Array.from({ length: TOTAL_PASSOS }).map((_, indice) => (
            <Skeleton key={indice} className="h-10 min-w-56 shrink-0 rounded-md md:min-w-0" />
          ))}
        </div>

        <div className="min-w-0 flex-1 space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const hidratado = useHidratarSessao();

  if (!hidratado) {
    return <EsqueletoOnboarding />;
  }

  return <OnboardingWizard />;
}

function OnboardingWizard() {
  const router = useRouter();
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const instituicaoAtiva =
    instituicaoAtivaId && instituicaoAtivaId !== "todas" ? buscarInstituicao(instituicaoAtivaId) : undefined;

  const [passoAtual, setPassoAtual] = useState(1);
  const [passosConcluidos, setPassosConcluidos] = useState<Set<number>>(new Set());
  const [maxPassoAlcancado, setMaxPassoAlcancado] = useState(1);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [instituicaoForm, setInstituicaoForm] = useState<InstituicaoForm>({
    razaoSocial: instituicaoAtiva?.razaoSocial ?? "",
    nomeFantasia: instituicaoAtiva?.nomeFantasia ?? "",
    cnpj: instituicaoAtiva?.cnpj ?? "",
    tipo: instituicaoAtiva?.tipo ?? "exchange",
    codigoRegistroBcb: instituicaoAtiva ? `CNPJ-BASE ${somenteDigitos(instituicaoAtiva.cnpj).slice(0, 8)}` : "",
    endereco: {
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      municipio: instituicaoAtiva?.municipio ?? "",
      uf: instituicaoAtiva?.uf ?? "",
      cep: instituicaoAtiva?.cep ?? "",
    },
    responsavel: {
      nome: instituicaoAtiva?.responsavelBcb.nome ?? "",
      cpf: instituicaoAtiva?.responsavelBcb.cpf ?? "",
      cargo: instituicaoAtiva?.responsavelBcb.cargo ?? "",
      email: instituicaoAtiva?.responsavelBcb.email ?? "",
    },
  });

  const [modulosForm, setModulosForm] = useState<ModulosForm>({
    acam212: instituicaoAtiva?.modulosContratados.includes("acam212") ?? true,
    cadoc5711: instituicaoAtiva?.modulosContratados.includes("cadoc5711") ?? false,
    cadoc5710: instituicaoAtiva?.modulosContratados.includes("cadoc5710") ?? false,
    fiscal: instituicaoAtiva?.modulosContratados.includes("fiscal") ?? false,
    cienciaFiscal: false,
  });

  const [usuarios, setUsuarios] = useState<UsuarioWizard[]>([]);
  const [novoUsuario, setNovoUsuario] = useState({ nome: "", email: "", perfil: "operacional" as PerfilId });

  const [ativos, setAtivos] = useState<AtivoWizard[]>([]);
  const [novoAtivo, setNovoAtivo] = useState({ codigoInterno: "", simbolo: "", nome: "", codigoOficial: "", rede: "", decimais: "8" });

  const [contas, setContas] = useState<ContaWizard[]>([]);
  const [novaConta, setNovaConta] = useState({ apelido: "", endereco: "", rede: "", titularidade: "propria" as ContaWizard["titularidade"] });

  const [dadosFiscais, setDadosFiscais] = useState<DadosFiscaisForm>({
    municipio: instituicaoAtiva?.municipio ?? "",
    codigoIbge: instituicaoAtiva?.codigoIbge ?? "",
    codigoServico: "17.01",
    aliquotaIss: "2,00",
    regime: "Lucro Presumido",
  });

  const modulosSelecionados = useMemo(
    () =>
      (Object.entries(modulosForm) as [keyof ModulosForm, boolean][])
        .filter(([chave, valor]) => chave !== "cienciaFiscal" && valor)
        .map(([chave]) => chave as ModuloId),
    [modulosForm]
  );

  function limparErros() {
    setErros({});
  }

  function validarPasso(passo: number): boolean {
    limparErros();
    const novosErros: Record<string, string> = {};

    if (passo === 1) {
      if (!instituicaoForm.razaoSocial.trim()) novosErros.razaoSocial = "Informe a razão social.";
      if (!instituicaoForm.nomeFantasia.trim()) novosErros.nomeFantasia = "Informe o nome fantasia.";
      if (somenteDigitos(instituicaoForm.cnpj).length !== 14) novosErros.cnpj = "CNPJ deve ter 14 dígitos.";
      if (!instituicaoForm.endereco.municipio.trim()) novosErros.municipio = "Informe o município.";
      if (!instituicaoForm.endereco.uf.trim()) novosErros.uf = "Informe a UF.";
      if (!instituicaoForm.responsavel.nome.trim()) novosErros.responsavelNome = "Informe o nome do responsável.";
      if (somenteDigitos(instituicaoForm.responsavel.cpf).length !== 11) novosErros.responsavelCpf = "CPF deve ter 11 dígitos.";
      if (!instituicaoForm.responsavel.email.trim()) novosErros.responsavelEmail = "Informe o e-mail do responsável.";
    }

    if (passo === 2) {
      if (!modulosForm.acam212 && !modulosForm.cadoc5711 && !modulosForm.cadoc5710 && !modulosForm.fiscal) {
        novosErros.modulos = "Selecione ao menos um módulo.";
      }
      if (modulosForm.fiscal && !modulosForm.cienciaFiscal) {
        novosErros.cienciaFiscal = "Confirme que leu o aviso do módulo Fiscal para continuar.";
      }
    }

    if (passo === 3) {
      const temDiretor = usuarios.some((usuario) => usuario.perfil === "diretor");
      const temOperacional = usuarios.some((usuario) => usuario.perfil === "operacional");
      const temContador = usuarios.some((usuario) => usuario.perfil === "contador");
      if (!temDiretor) novosErros.usuarios = "É necessário ao menos 1 usuário com o perfil Diretor / Compliance.";
      else if (!temOperacional) novosErros.usuarios = "É necessário ao menos 1 usuário com o perfil Operacional / Backoffice.";
      else if (modulosForm.fiscal && !temContador)
        novosErros.usuarios = "O módulo Fiscal está ativo: é necessário ao menos 1 usuário com o perfil Contador / Fiscal.";
    }

    if (passo === 4 && ativos.length === 0) {
      novosErros.ativos = "Adicione ao menos um ativo virtual ao dicionário.";
    }

    if (passo === 5 && contas.length === 0) {
      novosErros.contas = "Adicione ao menos uma conta ou carteira ao dicionário.";
    }

    if (passo === 6 && modulosForm.fiscal) {
      if (!dadosFiscais.municipio.trim()) novosErros.dadosFiscaisMunicipio = "Informe o município padrão.";
      if (!dadosFiscais.codigoServico.trim()) novosErros.dadosFiscaisServico = "Informe o código de serviço padrão.";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function avancar() {
    if (!validarPasso(passoAtual)) return;
    setPassosConcluidos((atual) => new Set(atual).add(passoAtual));
    const proximo = Math.min(passoAtual + 1, TOTAL_PASSOS);
    setPassoAtual(proximo);
    setMaxPassoAlcancado((atual) => Math.max(atual, proximo));
    limparErros();
  }

  function pular() {
    limparErros();
    const proximo = Math.min(passoAtual + 1, TOTAL_PASSOS);
    setPassoAtual(proximo);
    setMaxPassoAlcancado((atual) => Math.max(atual, proximo));
  }

  function voltar() {
    limparErros();
    setPassoAtual((atual) => Math.max(1, atual - 1));
  }

  function irParaPasso(passo: number) {
    if (passo > maxPassoAlcancado) return;
    limparErros();
    setPassoAtual(passo);
  }

  function adicionarUsuario() {
    if (!novoUsuario.nome.trim() || !novoUsuario.email.trim()) {
      toast.error("Informe nome e e-mail para adicionar o usuário.");
      return;
    }
    setUsuarios((atual) => [...atual, { id: novoId("usr"), ...novoUsuario }]);
    setNovoUsuario({ nome: "", email: "", perfil: "operacional" });
  }

  function removerUsuario(id: string) {
    setUsuarios((atual) => atual.filter((usuario) => usuario.id !== id));
  }

  function adicionarAtivo() {
    if (!novoAtivo.codigoInterno.trim() || !novoAtivo.codigoOficial.trim()) {
      toast.error("Informe ao menos o código interno e o código oficial do ativo.");
      return;
    }
    setAtivos((atual) => [...atual, { id: novoId("ativo"), ...novoAtivo }]);
    setNovoAtivo({ codigoInterno: "", simbolo: "", nome: "", codigoOficial: "", rede: "", decimais: "8" });
  }

  function removerAtivo(id: string) {
    setAtivos((atual) => atual.filter((ativo) => ativo.id !== id));
  }

  function importarCsvAtivos() {
    setAtivos(ATIVOS_IMPORTADOS.map((ativo) => ({ id: novoId("ativo"), ...ativo })));
    toast.success("12 ativos importados do arquivo de exemplo.");
  }

  function adicionarConta() {
    if (!novaConta.apelido.trim() || !novaConta.endereco.trim()) {
      toast.error("Informe ao menos o apelido e o endereço da conta ou carteira.");
      return;
    }
    setContas((atual) => [...atual, { id: novoId("conta"), ...novaConta }]);
    setNovaConta({ apelido: "", endereco: "", rede: "", titularidade: "propria" });
  }

  function removerConta(id: string) {
    setContas((atual) => atual.filter((conta) => conta.id !== id));
  }

  function concluir() {
    toast.success("Ambiente configurado. Você já pode acompanhar seus prazos regulatórios.");
    router.push("/app");
  }

  const progresso = Math.round((passosConcluidos.size / TOTAL_PASSOS) * 100);

  const ETAPAS_SIDEBAR = [
    { numero: 1, titulo: "Instituição", icone: Building2 },
    { numero: 2, titulo: "Módulos contratados", icone: ShieldCheck },
    { numero: 3, titulo: "Usuários e papéis", icone: Users },
    { numero: 4, titulo: "Ativos virtuais", icone: BookMarked },
    { numero: 5, titulo: "Contas e carteiras", icone: Wallet },
    { numero: 6, titulo: "Dados fiscais básicos", icone: Receipt },
    { numero: 7, titulo: "Revisão e conclusão", icone: CheckCircle2 },
  ];

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-700">Configuração guiada do ambiente</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {passosConcluidos.size} de {TOTAL_PASSOS} concluídas · {progresso}%
        </p>
        <Progress value={progresso} className="mt-3" aria-label="Progresso do onboarding" />
      </div>

      <div className="flex flex-1 flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-64">
          <nav aria-label="Etapas do onboarding" className="flex flex-row gap-2 overflow-x-auto md:flex-col md:overflow-visible">
            {ETAPAS_SIDEBAR.map((etapa) => {
              const concluida = passosConcluidos.has(etapa.numero);
              const atual = etapa.numero === passoAtual;
              const alcancavel = etapa.numero <= maxPassoAlcancado;
              const Icone = etapa.icone;

              return (
                <button
                  key={etapa.numero}
                  type="button"
                  onClick={() => irParaPasso(etapa.numero)}
                  disabled={!alcancavel}
                  className={cn(
                    "flex min-w-56 shrink-0 items-center gap-2.5 rounded-md border-l-3 border-transparent px-3 py-2.5 text-left text-sm transition-colors md:min-w-0",
                    atual && "border-brand-700 bg-brand-50 text-brand-700 font-medium",
                    !atual && alcancavel && "text-neutral-600 hover:bg-neutral-100",
                    !alcancavel && "cursor-not-allowed text-neutral-300"
                  )}
                >
                  {concluida ? (
                    <Check className="size-4 shrink-0 text-status-success-text" aria-hidden="true" />
                  ) : (
                    <Icone className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="flex-1">{etapa.titulo}</span>
                  {!concluida && !atual ? <Circle className="size-2 shrink-0 fill-current text-neutral-300" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white p-6">
          {passoAtual === 1 ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-neutral-700">Dados da instituição</h2>
                <p className="text-sm text-neutral-500">Identificação cadastral e responsável perante o Banco Central.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Razão social" erro={erros.razaoSocial}>
                  <Input
                    value={instituicaoForm.razaoSocial}
                    onChange={(evento) => setInstituicaoForm((atual) => ({ ...atual, razaoSocial: evento.target.value }))}
                    aria-invalid={Boolean(erros.razaoSocial)}
                  />
                </Campo>
                <Campo label="Nome fantasia" erro={erros.nomeFantasia}>
                  <Input
                    value={instituicaoForm.nomeFantasia}
                    onChange={(evento) => setInstituicaoForm((atual) => ({ ...atual, nomeFantasia: evento.target.value }))}
                    aria-invalid={Boolean(erros.nomeFantasia)}
                  />
                </Campo>
                <Campo label="CNPJ" erro={erros.cnpj}>
                  <Input
                    value={instituicaoForm.cnpj}
                    onChange={(evento) => setInstituicaoForm((atual) => ({ ...atual, cnpj: formatarCNPJ(evento.target.value) }))}
                    placeholder="00.000.000/0000-00"
                    aria-invalid={Boolean(erros.cnpj)}
                  />
                </Campo>
                <Campo label="Tipo de instituição">
                  <Select
                    value={instituicaoForm.tipo}
                    onValueChange={(valor) => setInstituicaoForm((atual) => ({ ...atual, tipo: valor as TipoInstituicao }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(ROTULO_TIPO_INSTITUICAO) as [TipoInstituicao, string][]).map(([valor, rotulo]) => (
                        <SelectItem key={valor} value={valor}>
                          {rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo label="Código SPSAV / registro no BCB">
                  <Input
                    value={instituicaoForm.codigoRegistroBcb}
                    onChange={(evento) => setInstituicaoForm((atual) => ({ ...atual, codigoRegistroBcb: evento.target.value }))}
                  />
                </Campo>
              </div>

              <fieldset className="space-y-4">
                <legend className="font-display text-sm font-bold text-neutral-700">Endereço</legend>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo label="Logradouro" className="sm:col-span-2">
                    <Input
                      value={instituicaoForm.endereco.logradouro}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, endereco: { ...atual.endereco, logradouro: evento.target.value } }))
                      }
                    />
                  </Campo>
                  <Campo label="Número">
                    <Input
                      value={instituicaoForm.endereco.numero}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, endereco: { ...atual.endereco, numero: evento.target.value } }))
                      }
                    />
                  </Campo>
                  <Campo label="Complemento">
                    <Input
                      value={instituicaoForm.endereco.complemento}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, endereco: { ...atual.endereco, complemento: evento.target.value } }))
                      }
                    />
                  </Campo>
                  <Campo label="Bairro">
                    <Input
                      value={instituicaoForm.endereco.bairro}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, endereco: { ...atual.endereco, bairro: evento.target.value } }))
                      }
                    />
                  </Campo>
                  <Campo label="Município" erro={erros.municipio}>
                    <Input
                      value={instituicaoForm.endereco.municipio}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, endereco: { ...atual.endereco, municipio: evento.target.value } }))
                      }
                      aria-invalid={Boolean(erros.municipio)}
                    />
                  </Campo>
                  <Campo label="UF" erro={erros.uf}>
                    <Input
                      value={instituicaoForm.endereco.uf}
                      maxLength={2}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({
                          ...atual,
                          endereco: { ...atual.endereco, uf: evento.target.value.toUpperCase() },
                        }))
                      }
                      aria-invalid={Boolean(erros.uf)}
                    />
                  </Campo>
                  <Campo label="CEP">
                    <Input
                      value={instituicaoForm.endereco.cep}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, endereco: { ...atual.endereco, cep: evento.target.value } }))
                      }
                      placeholder="00000-000"
                    />
                  </Campo>
                </div>
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="font-display text-sm font-bold text-neutral-700">Responsável perante o BCB</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Nome" erro={erros.responsavelNome}>
                    <Input
                      value={instituicaoForm.responsavel.nome}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, responsavel: { ...atual.responsavel, nome: evento.target.value } }))
                      }
                      aria-invalid={Boolean(erros.responsavelNome)}
                    />
                  </Campo>
                  <Campo label="CPF" erro={erros.responsavelCpf}>
                    <Input
                      value={instituicaoForm.responsavel.cpf}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, responsavel: { ...atual.responsavel, cpf: evento.target.value } }))
                      }
                      placeholder="000.000.000-00"
                      aria-invalid={Boolean(erros.responsavelCpf)}
                    />
                  </Campo>
                  <Campo label="Cargo">
                    <Input
                      value={instituicaoForm.responsavel.cargo}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, responsavel: { ...atual.responsavel, cargo: evento.target.value } }))
                      }
                    />
                  </Campo>
                  <Campo label="E-mail" erro={erros.responsavelEmail}>
                    <Input
                      type="email"
                      value={instituicaoForm.responsavel.email}
                      onChange={(evento) =>
                        setInstituicaoForm((atual) => ({ ...atual, responsavel: { ...atual.responsavel, email: evento.target.value } }))
                      }
                      aria-invalid={Boolean(erros.responsavelEmail)}
                    />
                  </Campo>
                </div>
              </fieldset>
            </div>
          ) : null}

          {passoAtual === 2 ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-neutral-700">Módulos contratados</h2>
                <p className="text-sm text-neutral-500">Selecione os módulos regulatórios que esta instituição vai operar.</p>
              </div>

              <div className="space-y-3">
                <ItemModulo
                  titulo="ACAM212"
                  descricao="Declaração mensal ao Banco Central das operações de câmbio com ativos virtuais."
                  checked={modulosForm.acam212}
                  onCheckedChange={(valor) => setModulosForm((atual) => ({ ...atual, acam212: valor }))}
                />
                <ItemModulo
                  titulo="Cadoc 5711"
                  descricao="Posição de custódia diária por cliente, consolidada e enviada mensalmente."
                  checked={modulosForm.cadoc5711}
                  onCheckedChange={(valor) => setModulosForm((atual) => ({ ...atual, cadoc5711: valor }))}
                />
                <ItemModulo
                  titulo="Cadoc 5710"
                  descricao="Posição de custódia mensal agregada por carteira, incluindo saldo em staking."
                  checked={modulosForm.cadoc5710}
                  onCheckedChange={(valor) => setModulosForm((atual) => ({ ...atual, cadoc5710: valor }))}
                />
                <ItemModulo
                  titulo="Fiscal (NFS-e / DPS)"
                  descricao="Estruturação da DPS para validação do contador responsável."
                  candidato
                  checked={modulosForm.fiscal}
                  onCheckedChange={(valor) => setModulosForm((atual) => ({ ...atual, fiscal: valor, cienciaFiscal: valor ? atual.cienciaFiscal : false }))}
                />

                {modulosForm.fiscal ? (
                  <div className="space-y-3 rounded-lg border border-status-warning-border bg-status-warning-bg p-4">
                    <BannerPosicionamento variante="atencao" />
                    <label className="flex items-start gap-2 text-sm text-status-warning-text">
                      <Checkbox
                        checked={modulosForm.cienciaFiscal}
                        onCheckedChange={(valor) => setModulosForm((atual) => ({ ...atual, cienciaFiscal: valor === true }))}
                        aria-invalid={Boolean(erros.cienciaFiscal)}
                      />
                      Li e estou ciente.
                    </label>
                    {erros.cienciaFiscal ? <p className="text-xs text-status-error-text">{erros.cienciaFiscal}</p> : null}
                  </div>
                ) : null}
              </div>

              {erros.modulos ? <p className="text-xs text-status-error-text">{erros.modulos}</p> : null}
            </div>
          ) : null}

          {passoAtual === 3 ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-neutral-700">Usuários e papéis</h2>
                <p className="text-sm text-neutral-500">
                  Adicione ao menos 1 usuário Diretor e 1 Operacional
                  {modulosForm.fiscal ? " e 1 Contador, já que o módulo Fiscal está ativo" : ""}. Executor e Validador são
                  papéis exclusivos da Videnas.
                </p>
              </div>

              <div className="grid gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
                <Input
                  placeholder="Nome"
                  aria-label="Nome do novo usuário"
                  value={novoUsuario.nome}
                  onChange={(evento) => setNovoUsuario((atual) => ({ ...atual, nome: evento.target.value }))}
                />
                <Input
                  placeholder="E-mail"
                  type="email"
                  aria-label="E-mail do novo usuário"
                  value={novoUsuario.email}
                  onChange={(evento) => setNovoUsuario((atual) => ({ ...atual, email: evento.target.value }))}
                />
                <Select value={novoUsuario.perfil} onValueChange={(valor) => setNovoUsuario((atual) => ({ ...atual, perfil: valor as PerfilId }))}>
                  <SelectTrigger aria-label="Perfil do novo usuário">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERFIS_CLIENTE.map((perfil) => (
                      <SelectItem key={perfil.id} value={perfil.id}>
                        {perfil.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={adicionarUsuario}>
                  <Plus className="size-4" aria-hidden="true" />
                  Adicionar
                </Button>
              </div>

              <ListaSimples vazio="Nenhum usuário adicionado ainda.">
                {usuarios.map((usuario) => (
                  <li key={usuario.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-neutral-700">{usuario.nome}</p>
                      <p className="text-xs text-neutral-500">
                        {usuario.email} · {PERFIS_CLIENTE.find((perfil) => perfil.id === usuario.perfil)?.rotulo}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${usuario.nome}`} onClick={() => removerUsuario(usuario.id)}>
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ListaSimples>

              {erros.usuarios ? <p className="text-xs text-status-error-text">{erros.usuarios}</p> : null}
            </div>
          ) : null}

          {passoAtual === 4 ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-neutral-700">Dicionário de ativos virtuais</h2>
                  <p className="text-sm text-neutral-500">Mapeie o código interno do cliente para o código oficial na tabela do BCB.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={importarCsvAtivos}>
                  <FileSpreadsheet className="size-4" aria-hidden="true" />
                  Importar CSV
                </Button>
              </div>

              <div className="grid gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-6">
                <Input placeholder="Código interno" aria-label="Código interno" value={novoAtivo.codigoInterno} onChange={(e) => setNovoAtivo((a) => ({ ...a, codigoInterno: e.target.value }))} />
                <Input placeholder="Símbolo" aria-label="Símbolo" value={novoAtivo.simbolo} onChange={(e) => setNovoAtivo((a) => ({ ...a, simbolo: e.target.value }))} />
                <Input placeholder="Nome" aria-label="Nome do ativo" value={novoAtivo.nome} onChange={(e) => setNovoAtivo((a) => ({ ...a, nome: e.target.value }))} />
                <Input placeholder="Código oficial" aria-label="Código oficial BCB" value={novoAtivo.codigoOficial} onChange={(e) => setNovoAtivo((a) => ({ ...a, codigoOficial: e.target.value }))} />
                <Input placeholder="Rede" aria-label="Rede" value={novoAtivo.rede} onChange={(e) => setNovoAtivo((a) => ({ ...a, rede: e.target.value }))} />
                <div className="flex gap-2">
                  <Input placeholder="Decimais" aria-label="Decimais" value={novoAtivo.decimais} onChange={(e) => setNovoAtivo((a) => ({ ...a, decimais: e.target.value }))} />
                  <Button type="button" size="icon" aria-label="Adicionar ativo" onClick={adicionarAtivo}>
                    <Plus className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <TabelaSimples
                cabecalhos={["Código interno", "Símbolo", "Nome", "Código oficial", "Rede", "Decimais", ""]}
                vazio="Nenhum ativo cadastrado ainda."
                linhas={ativos.map((ativo) => [
                  ativo.codigoInterno,
                  ativo.simbolo,
                  ativo.nome,
                  ativo.codigoOficial,
                  ativo.rede,
                  ativo.decimais,
                  <Button key="remover" type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${ativo.codigoInterno}`} onClick={() => removerAtivo(ativo.id)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>,
                ])}
              />

              {erros.ativos ? <p className="text-xs text-status-error-text">{erros.ativos}</p> : null}
            </div>
          ) : null}

          {passoAtual === 5 ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-neutral-700">Dicionário de contas e carteiras</h2>
                <p className="text-sm text-neutral-500">Cadastre as contas e carteiras usadas nas posições de custódia.</p>
              </div>

              <div className="grid gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-5">
                <Input placeholder="Apelido" aria-label="Apelido da conta" value={novaConta.apelido} onChange={(e) => setNovaConta((a) => ({ ...a, apelido: e.target.value }))} />
                <Input placeholder="Endereço" aria-label="Endereço" className="sm:col-span-2" value={novaConta.endereco} onChange={(e) => setNovaConta((a) => ({ ...a, endereco: e.target.value }))} />
                <Input placeholder="Rede" aria-label="Rede da conta" value={novaConta.rede} onChange={(e) => setNovaConta((a) => ({ ...a, rede: e.target.value }))} />
                <div className="flex gap-2">
                  <Select value={novaConta.titularidade} onValueChange={(valor) => setNovaConta((a) => ({ ...a, titularidade: valor as ContaWizard["titularidade"] }))}>
                    <SelectTrigger aria-label="Titularidade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TITULARIDADES_CONTA.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" aria-label="Adicionar conta" onClick={adicionarConta}>
                    <Plus className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <TabelaSimples
                cabecalhos={["Apelido", "Endereço", "Rede", "Titularidade", ""]}
                vazio="Nenhuma conta ou carteira cadastrada ainda."
                linhas={contas.map((conta) => [
                  conta.apelido,
                  <span key="endereco" className="font-mono text-xs">
                    {conta.endereco}
                  </span>,
                  conta.rede,
                  TITULARIDADES_CONTA.find((t) => t.id === conta.titularidade)?.rotulo ?? conta.titularidade,
                  <Button key="remover" type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${conta.apelido}`} onClick={() => removerConta(conta.id)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>,
                ])}
              />

              {erros.contas ? <p className="text-xs text-status-error-text">{erros.contas}</p> : null}
            </div>
          ) : null}

          {passoAtual === 6 ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-neutral-700">Dados fiscais básicos</h2>
                <p className="text-sm text-neutral-500">
                  Parâmetros padrão usados para sugerir alíquota e enquadramento. O contador da instituição sempre
                  revisa e confirma antes da liberação.
                </p>
              </div>

              {!modulosForm.fiscal ? (
                <p className="rounded-md bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
                  O módulo Fiscal não foi contratado na etapa 2. Estes dados ficam disponíveis caso ele seja ativado
                  futuramente.
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Município de prestação padrão" erro={erros.dadosFiscaisMunicipio}>
                  <Input value={dadosFiscais.municipio} onChange={(e) => setDadosFiscais((a) => ({ ...a, municipio: e.target.value }))} />
                </Campo>
                <Campo label="Código IBGE">
                  <Input value={dadosFiscais.codigoIbge} onChange={(e) => setDadosFiscais((a) => ({ ...a, codigoIbge: e.target.value }))} />
                </Campo>
                <Campo label="Código de serviço padrão (LC 116)" erro={erros.dadosFiscaisServico}>
                  <Input value={dadosFiscais.codigoServico} onChange={(e) => setDadosFiscais((a) => ({ ...a, codigoServico: e.target.value }))} />
                </Campo>
                <Campo label="Alíquota ISS padrão (%)">
                  <Input value={dadosFiscais.aliquotaIss} onChange={(e) => setDadosFiscais((a) => ({ ...a, aliquotaIss: e.target.value }))} />
                </Campo>
                <Campo label="Regime tributário">
                  <Select value={dadosFiscais.regime} onValueChange={(valor) => setDadosFiscais((a) => ({ ...a, regime: valor ?? a.regime }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIMES_TRIBUTARIOS.map((regime) => (
                        <SelectItem key={regime} value={regime}>
                          {regime}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Campo>
              </div>
            </div>
          ) : null}

          {passoAtual === 7 ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-neutral-700">Ambiente pronto</h2>
                <p className="text-sm text-neutral-500">Revise o que foi configurado antes de ir para o painel.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ResumoCard icone={Building2} titulo="Instituição">
                  {instituicaoForm.nomeFantasia || "—"} · {instituicaoForm.cnpj || "CNPJ não informado"} ·{" "}
                  {ROTULO_TIPO_INSTITUICAO[instituicaoForm.tipo]}
                </ResumoCard>
                <ResumoCard icone={ShieldCheck} titulo="Módulos contratados">
                  {modulosSelecionados.length > 0 ? modulosSelecionados.join(", ").toUpperCase() : "Nenhum módulo selecionado"}
                </ResumoCard>
                <ResumoCard icone={Users} titulo="Usuários">
                  {usuarios.length} {usuarios.length === 1 ? "usuário adicionado" : "usuários adicionados"}
                </ResumoCard>
                <ResumoCard icone={BookMarked} titulo="Ativos virtuais">
                  {ativos.length} {ativos.length === 1 ? "ativo mapeado" : "ativos mapeados"}
                </ResumoCard>
                <ResumoCard icone={Wallet} titulo="Contas e carteiras">
                  {contas.length} {contas.length === 1 ? "conta cadastrada" : "contas cadastradas"}
                </ResumoCard>
                <ResumoCard icone={Receipt} titulo="Dados fiscais">
                  {modulosForm.fiscal
                    ? `${dadosFiscais.municipio || "—"} · serviço ${dadosFiscais.codigoServico} · ISS ${dadosFiscais.aliquotaIss}%`
                    : "Módulo Fiscal não contratado"}
                </ResumoCard>
              </div>

              <BannerPosicionamento />

              <Button type="button" size="lg" className="w-full sm:w-auto" onClick={concluir}>
                Ir para o painel
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null}

          {passoAtual < 7 ? (
            <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4">
              <Button type="button" variant="outline" onClick={voltar} disabled={passoAtual === 1}>
                <ChevronLeft className="size-4" aria-hidden="true" />
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={pular}>
                  <SkipForward className="size-4" aria-hidden="true" />
                  Pular por enquanto
                </Button>
                <Button type="button" onClick={avancar}>
                  Salvar e continuar
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Campo({
  label,
  erro,
  className,
  children,
}: {
  label: string;
  erro?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const id = useMemo(() => `campo-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, [label]);
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })
        : children}
      {erro ? <p className="text-xs text-status-error-text">{erro}</p> : null}
    </div>
  );
}

function ItemModulo({
  titulo,
  descricao,
  checked,
  onCheckedChange,
  candidato,
}: {
  titulo: string;
  descricao: string;
  checked: boolean;
  onCheckedChange: (valor: boolean) => void;
  candidato?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors",
        checked ? "border-brand-700 bg-brand-50" : "border-neutral-200 bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        <UploadCloud className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-neutral-700">
            {titulo}
            {candidato ? <span className="status-badge status-badge-candidate text-[11px]">Candidato</span> : null}
          </p>
          <p className="text-xs text-neutral-500">{descricao}</p>
        </div>
      </div>
      <Checkbox checked={checked} onCheckedChange={(valor) => onCheckedChange(valor === true)} aria-label={`Ativar módulo ${titulo}`} />
    </label>
  );
}

function ListaSimples({ vazio, children }: { vazio: string; children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
      {items.length === 0 ? <li className="px-4 py-6 text-center text-sm text-neutral-400">{vazio}</li> : items}
    </ul>
  );
}

function TabelaSimples({
  cabecalhos,
  linhas,
  vazio,
}: {
  cabecalhos: string[];
  linhas: React.ReactNode[][];
  vazio: string;
}) {
  if (linhas.length === 0) {
    return <p className="rounded-lg border border-neutral-200 px-4 py-6 text-center text-sm text-neutral-400">{vazio}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50">
          <tr>
            {cabecalhos.map((cabecalho) => (
              <th key={cabecalho} className="px-3 py-2 font-semibold text-neutral-700">
                {cabecalho}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {linhas.map((linha, indice) => (
            <tr key={indice}>
              {linha.map((celula, indiceCelula) => (
                <td key={indiceCelula} className="px-3 py-2 text-neutral-600">
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResumoCard({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof Building2;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4">
      <Icone className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
      <div>
        <p className="text-sm font-bold text-neutral-700">{titulo}</p>
        <p className="text-xs text-neutral-500">{children}</p>
      </div>
    </div>
  );
}
