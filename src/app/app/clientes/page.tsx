"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, ChevronRight, Plus, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { useSessaoStore } from "@/lib/store/sessao";
import {
  CLASSE_STATUS_IMPLANTACAO,
  ROTULO_STATUS_IMPLANTACAO,
  diretorDoTenant,
  responsavelEnvioDoTenant,
  useTenantsStore,
} from "@/lib/store/tenants";
import { buscarModulo } from "@/lib/mock/modulos";
import { formatarCNPJ, formatarData } from "@/lib/formatadores";
import type { Instituicao, ModuloId, StatusImplantacao, TipoInstituicao, Usuario } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const TODOS = "todos";

const ROTULO_TIPO: Record<TipoInstituicao, string> = {
  exchange: "Exchange",
  custodiante: "Custodiante",
  mesa_otc: "Mesa de OTC",
};

const TODOS_MODULOS: ModuloId[] = ["acam212", "cadoc5711", "cadoc5710", "fiscal"];

const ORDEM_STATUS: StatusImplantacao[] = [
  "provisionado",
  "onboarding_em_andamento",
  "ativo",
  "suspenso",
];

function EsqueletoCarteira() {
  return (
    <div role="status" aria-label="Carregando carteira de clientes" className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default function ClientesPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const hidratado = useTenantsStore((estado) => estado.hidratado);
  const tenants = useTenantsStore((estado) => estado.tenants);
  const usuariosProvisionados = useTenantsStore((estado) => estado.usuariosProvisionados);
  const reiniciarTenants = useTenantsStore((estado) => estado.reiniciarTenants);

  const [dialogReiniciar, setDialogReiniciar] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState<StatusImplantacao | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<TipoInstituicao | typeof TODOS>(TODOS);
  const [moduloFiltro, setModuloFiltro] = useState<ModuloId | typeof TODOS>(TODOS);
  const [busca, setBusca] = useState("");

  const contagem = useMemo(() => {
    const base: Record<StatusImplantacao, number> = {
      provisionado: 0,
      onboarding_em_andamento: 0,
      ativo: 0,
      suspenso: 0,
    };
    for (const tenant of tenants) {
      base[tenant.statusImplantacao] += 1;
    }
    return base;
  }, [tenants]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = termo.replace(/\D/g, "");

    return tenants
      .filter((tenant) => (statusFiltro ? tenant.statusImplantacao === statusFiltro : true))
      .filter((tenant) => (tipoFiltro === TODOS ? true : tenant.tipo === tipoFiltro))
      .filter((tenant) =>
        moduloFiltro === TODOS ? true : tenant.modulosContratados.includes(moduloFiltro)
      )
      .filter((tenant) => {
        if (!termo) return true;
        return (
          tenant.nomeFantasia.toLowerCase().includes(termo) ||
          tenant.razaoSocial.toLowerCase().includes(termo) ||
          (digitos.length > 0 && tenant.cnpj.replace(/\D/g, "").includes(digitos))
        );
      })
      .sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia, "pt-BR"));
  }, [tenants, statusFiltro, tipoFiltro, moduloFiltro, busca]);

  if (perfilAtivo !== "admin") {
    return (
      <EstadoVazio
        titulo="Acesso não disponível"
        mensagem="A carteira de clientes é restrita ao perfil Administrador da Videnas."
        icone={Building2}
      />
    );
  }

  if (!hidratado) {
    return <EsqueletoCarteira />;
  }

  const filtroAtivo = Boolean(statusFiltro) || tipoFiltro !== TODOS || moduloFiltro !== TODOS || busca.trim().length > 0;

  const emImplantacao = contagem.provisionado + contagem.onboarding_em_andamento;

  const colunas: ColunaTabela<Instituicao>[] = [
    {
      id: "cliente",
      cabecalho: "Cliente",
      renderizar: (tenant) => (
        <Link
          href={`/app/clientes/${tenant.id}`}
          className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          <span className="block font-medium text-neutral-700">{tenant.nomeFantasia}</span>
          <span className="block text-xs text-neutral-500">{tenant.razaoSocial}</span>
        </Link>
      ),
    },
    { id: "cnpj", cabecalho: "CNPJ", renderizar: (tenant) => formatarCNPJ(tenant.cnpj) },
    { id: "tipo", cabecalho: "Tipo", renderizar: (tenant) => ROTULO_TIPO[tenant.tipo] },
    {
      id: "modulos",
      cabecalho: "Módulos",
      renderizar: (tenant) => (
        <span className="flex flex-wrap items-center gap-1.5">
          {tenant.modulosContratados.map((moduloId) => (
            <span key={moduloId} className="flex items-center gap-1">
              <span className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">
                {buscarModulo(moduloId).sigla}
              </span>
              {moduloId === "fiscal" ? <SeloCandidato tamanho="sm" /> : null}
            </span>
          ))}
        </span>
      ),
    },
    {
      id: "status",
      cabecalho: "Status de implantação",
      renderizar: (tenant) => (
        <span className={cn("status-badge", CLASSE_STATUS_IMPLANTACAO[tenant.statusImplantacao])}>
          {ROTULO_STATUS_IMPLANTACAO[tenant.statusImplantacao]}
        </span>
      ),
    },
    {
      id: "entrada",
      cabecalho: "Entrada",
      renderizar: (tenant) => formatarData(tenant.criadoEm.slice(0, 10)),
    },
    {
      id: "diretor",
      cabecalho: "Diretor",
      renderizar: (tenant) => <Contato usuario={diretorDoTenant(usuariosProvisionados, tenant.id)} />,
    },
    {
      id: "responsavel",
      cabecalho: "Responsável pelo envio",
      renderizar: (tenant) => {
        const responsavel = responsavelEnvioDoTenant(usuariosProvisionados, tenant.id);
        if (!responsavel) {
          return <span className="text-xs text-neutral-400">Não designado</span>;
        }
        return <Contato usuario={responsavel} />;
      },
    },
    {
      id: "acoes",
      cabecalho: "Ações",
      alinhamento: "right",
      renderizar: (tenant) => (
        <Button
          render={<Link href={`/app/clientes/${tenant.id}`} />}
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
          aria-label={`Abrir a ficha do cliente ${tenant.nomeFantasia}`}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  function confirmarReinicio() {
    reiniciarTenants();
    setStatusFiltro(null);
    setTipoFiltro(TODOS);
    setModuloFiltro(TODOS);
    setBusca("");
    setDialogReiniciar(false);
    toast.success("Dados da demonstração reiniciados. A carteira voltou à semente original.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-1.5 font-display text-2xl font-bold text-neutral-700">
            Carteira de clientes
            <BadgeAjuda chave="nav.clientes" tamanho="sm" />
          </h1>
          <p className="text-sm text-neutral-500">
            {tenants.length} {tenants.length === 1 ? "cliente" : "clientes"} · {contagem.ativo}{" "}
            {contagem.ativo === 1 ? "ativo" : "ativos"} · {emImplantacao} em implantação ·{" "}
            {contagem.suspenso} {contagem.suspenso === 1 ? "suspenso" : "suspensos"}
          </p>
        </div>
        <div data-tour="clientes-novo">
          <Button render={<Link href="/app/clientes/novo" />} nativeButton={false}>
            <Plus className="size-4" aria-hidden="true" />
            Cadastrar novo cliente
          </Button>
        </div>
      </header>

      <div data-tour="clientes-contadores" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ORDEM_STATUS.map((status) => {
          const selecionado = statusFiltro === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={selecionado}
              onClick={() => setStatusFiltro(selecionado ? null : status)}
              className={cn(
                "rounded-md border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700",
                selecionado
                  ? "border-brand-700 bg-brand-50"
                  : "border-neutral-200 bg-white hover:border-brand-300"
              )}
            >
              <span className="block text-xs text-neutral-500">
                {ROTULO_STATUS_IMPLANTACAO[status]}
              </span>
              <span className="block text-xl font-bold text-neutral-700">{contagem[status]}</span>
            </button>
          );
        })}
      </div>

      <div data-tour="clientes-filtros" className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome fantasia, razão social ou CNPJ"
            aria-label="Buscar cliente por nome fantasia, razão social ou CNPJ"
            className="pl-8"
          />
        </div>
        <Select
          value={tipoFiltro}
          onValueChange={(valor) => setTipoFiltro((valor as TipoInstituicao | typeof TODOS) ?? TODOS)}
        >
          <SelectTrigger aria-label="Filtrar por tipo de instituição" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os tipos</SelectItem>
            <SelectItem value="exchange">Exchange</SelectItem>
            <SelectItem value="custodiante">Custodiante</SelectItem>
            <SelectItem value="mesa_otc">Mesa de OTC</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={moduloFiltro}
          onValueChange={(valor) => setModuloFiltro((valor as ModuloId | typeof TODOS) ?? TODOS)}
        >
          <SelectTrigger aria-label="Filtrar por módulo contratado" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os módulos</SelectItem>
            {TODOS_MODULOS.map((moduloId) => (
              <SelectItem key={moduloId} value={moduloId}>
                {buscarModulo(moduloId).nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        data-tour="clientes-tabela"
        className="overflow-x-auto rounded-lg border border-neutral-200 bg-white"
      >
        <TabelaDados
          colunas={colunas}
          dados={filtrados}
          chave={(tenant) => tenant.id}
          tituloVazio={filtroAtivo ? "Nenhum cliente com estes filtros" : "Nenhum cliente cadastrado"}
          mensagemVazia={
            filtroAtivo
              ? "Ajuste a busca, o status, o tipo ou o módulo contratado para ver outros clientes."
              : "Use o botão Cadastrar novo cliente para provisionar o primeiro tenant da Videnas."
          }
        />
      </div>

      <footer className="flex justify-end border-t border-neutral-200 pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => setDialogReiniciar(true)}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Reiniciar dados da demonstração
        </Button>
      </footer>

      <Dialog open={dialogReiniciar} onOpenChange={setDialogReiniciar}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reiniciar os dados da demonstração?</DialogTitle>
            <DialogDescription>
              Os clientes cadastrados nesta sessão são descartados, junto com os usuários iniciais
              provisionados para eles — e os CNPJs usados voltam a ficar livres. A semente da
              demonstração (Meridian Digital Assets, Cofre Atlântico e Pampulha Capital) volta ao
              estado original.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="button" variant="destructive" onClick={confirmarReinicio}>
              Reiniciar demonstração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Contato({ usuario }: { usuario: Usuario | undefined }) {
  if (!usuario) {
    return <span className="text-neutral-400">—</span>;
  }
  return (
    <span className="block">
      <span className="block text-neutral-700">{usuario.nome}</span>
      <span className="block text-xs text-neutral-500">{usuario.email}</span>
    </span>
  );
}
