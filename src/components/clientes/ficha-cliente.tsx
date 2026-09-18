"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Building2, RefreshCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { BadgeStatus } from "@/components/dominio/badge-status";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { BadgeSentido } from "@/components/evidencias/badge-sentido";
import { useSessaoStore } from "@/lib/store/sessao";
import {
  CLASSE_STATUS_IMPLANTACAO,
  ROTULO_STATUS_IMPLANTACAO,
  buscarTenant,
  usuariosDoTenant,
  useTenantsStore,
} from "@/lib/store/tenants";
import { usePeriodosStore } from "@/lib/store/periodos";
import { lacresDaInstituicao, useEvidenciasStore } from "@/lib/store/evidencias";
import { buscarModulo } from "@/lib/mock/modulos";
import { calcularPeriodoDerivado, HOJE_ISO } from "@/lib/mock/periodos";
import { buscarPerfil } from "@/lib/permissoes";
import { CLASSE_SITUACAO, ROTULO_SITUACAO } from "@/lib/usuarios/rotulos";
import {
  formatarCNPJ,
  formatarCompetencia,
  formatarData,
  formatarDataHora,
  truncarHash,
} from "@/lib/formatadores";
import type { ModuloId, TipoInstituicao, Usuario } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const TODOS_MODULOS: ModuloId[] = ["acam212", "cadoc5711", "cadoc5710", "fiscal"];

const ROTULO_TIPO: Record<TipoInstituicao, string> = {
  exchange: "Exchange",
  custodiante: "Custodiante",
  mesa_otc: "Mesa de OTC",
};

function EsqueletoFicha() {
  return (
    <div role="status" aria-label="Carregando ficha do cliente" className="space-y-6">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export function FichaCliente({ tenantId }: { tenantId: string }) {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);

  const hidratado = useTenantsStore((estado) => estado.hidratado);
  const tenants = useTenantsStore((estado) => estado.tenants);
  const usuariosProvisionados = useTenantsStore((estado) => estado.usuariosProvisionados);
  const alterarModulosContratados = useTenantsStore((estado) => estado.alterarModulosContratados);
  const alterarStatusTenant = useTenantsStore((estado) => estado.alterarStatusTenant);
  const enviarConviteInicial = useTenantsStore((estado) => estado.enviarConviteInicial);
  const reenviarConvite = useTenantsStore((estado) => estado.reenviarConvite);

  const periodosStore = usePeriodosStore((estado) => estado.periodos);
  const evidenciasHidratadas = useEvidenciasStore((estado) => estado.hidratado);
  const lacres = useEvidenciasStore((estado) => estado.lacres);

  const [dialogSuspender, setDialogSuspender] = useState(false);
  const [dialogReativar, setDialogReativar] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erroMotivo, setErroMotivo] = useState<string | null>(null);

  const tenant = buscarTenant(tenants, tenantId);

  const usuarios = useMemo(
    () => usuariosDoTenant(usuariosProvisionados, tenantId),
    [usuariosProvisionados, tenantId]
  );

  const competenciaCorrente = HOJE_ISO.slice(0, 7);

  const periodosCorrentes = useMemo(() => {
    if (!tenant) return [];
    return tenant.modulosContratados
      .map((moduloId) =>
        Object.values(periodosStore).find(
          (periodo) =>
            periodo.instituicaoId === tenantId &&
            periodo.moduloId === moduloId &&
            periodo.competencia === competenciaCorrente
        )
      )
      .filter((periodo): periodo is NonNullable<typeof periodo> => Boolean(periodo));
  }, [tenant, periodosStore, tenantId, competenciaCorrente]);

  const lacresRecentes = useMemo(
    () => lacresDaInstituicao(lacres, tenantId).slice(0, 5),
    [lacres, tenantId]
  );

  if (perfilAtivo !== "admin") {
    return (
      <EstadoVazio
        titulo="Acesso não disponível"
        mensagem="A ficha do cliente é restrita ao perfil Administrador da Videnas."
        icone={Building2}
      />
    );
  }

  if (!hidratado) {
    return <EsqueletoFicha />;
  }

  if (!tenant) {
    return (
      <EstadoVazio
        titulo="Cliente não encontrado"
        mensagem="Nenhum cliente da carteira corresponde a este identificador. Ele pode ter sido cadastrado em outra sessão da demonstração."
        icone={Building2}
      />
    );
  }

  const autor = { usuarioId: usuarioId ?? "usr-marina", perfilId: "admin" as const };

  function alternarModulo(moduloId: ModuloId, ativo: boolean) {
    if (!tenant) return;
    const proximos = ativo
      ? [...tenant.modulosContratados, moduloId]
      : tenant.modulosContratados.filter((item) => item !== moduloId);

    const resultado = alterarModulosContratados(tenant.id, proximos, autor);
    if (!resultado.sucesso) {
      toast.error(resultado.motivo ?? "Não foi possível alterar os módulos contratados.");
      return;
    }
    toast.success(
      ativo
        ? `${buscarModulo(moduloId).nome} passou a ser um módulo contratado deste cliente.`
        : `${buscarModulo(moduloId).nome} deixou de ser um módulo contratado deste cliente.`
    );
  }

  function convidarNovamente() {
    if (!tenant) return;
    const diretor = usuarios.find((usuario) => usuario.perfilId === "diretor");

    if (tenant.statusImplantacao === "provisionado") {
      const resultado = enviarConviteInicial(tenant.id, autor);
      if (!resultado.sucesso) {
        toast.error(resultado.motivo ?? "Não foi possível enviar o convite inicial.");
        return;
      }
      toast.success(
        diretor
          ? `Convite simulado enviado. Para entrar como Diretor desta instituição na demonstração, use ${diretor.email} no login.`
          : "Convite simulado enviado."
      );
      return;
    }

    if (!diretor) {
      toast.error("Este cliente não tem um Diretor cadastrado para receber o convite.");
      return;
    }

    const resultado = reenviarConvite(tenant.id, diretor.id, autor);
    if (!resultado.sucesso) {
      toast.error(resultado.motivo ?? "Não foi possível reenviar o convite.");
      return;
    }
    toast.info(`Convite reenviado para ${diretor.email} (simulação).`);
  }

  function reenviarPara(usuario: Usuario) {
    if (!tenant) return;
    const resultado = reenviarConvite(tenant.id, usuario.id, autor);
    if (!resultado.sucesso) {
      toast.error(resultado.motivo ?? "Não foi possível reenviar o convite.");
      return;
    }
    toast.info(`Convite reenviado para ${usuario.email} (simulação).`);
  }

  function confirmarSuspensao() {
    if (!tenant) return;
    if (motivo.trim().length < 10) {
      setErroMotivo("Descreva o motivo da suspensão com pelo menos 10 caracteres.");
      return;
    }

    const resultado = alterarStatusTenant(tenant.id, "suspenso", autor, motivo);
    if (!resultado.sucesso) {
      setErroMotivo(resultado.motivo ?? "Não foi possível suspender este cliente.");
      return;
    }

    setDialogSuspender(false);
    setMotivo("");
    setErroMotivo(null);
    toast.success(`${tenant.nomeFantasia} foi suspensa. A trilha de auditoria foi preservada.`);
  }

  function confirmarReativacao() {
    if (!tenant) return;
    const resultado = alterarStatusTenant(tenant.id, "ativo", autor);
    if (!resultado.sucesso) {
      toast.error(resultado.motivo ?? "Não foi possível reativar este cliente.");
      return;
    }
    setDialogReativar(false);
    toast.success(`${tenant.nomeFantasia} foi reativada.`);
  }

  const colunasUsuarios: ColunaTabela<Usuario>[] = [
    {
      id: "nome",
      cabecalho: "Nome",
      renderizar: (usuario) => (
        <span className="font-medium text-neutral-700">{usuario.nome}</span>
      ),
    },
    { id: "email", cabecalho: "E-mail", renderizar: (usuario) => usuario.email },
    {
      id: "perfil",
      cabecalho: "Perfil",
      renderizar: (usuario) => buscarPerfil(usuario.perfilId).rotuloCompleto,
    },
    { id: "cargo", cabecalho: "Cargo", renderizar: (usuario) => usuario.cargo || "—" },
    {
      id: "modulos",
      cabecalho: "Módulos",
      renderizar: (usuario) =>
        usuario.moduloIds.length > 0
          ? usuario.moduloIds.map((moduloId) => buscarModulo(moduloId).sigla).join(", ")
          : "—",
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      renderizar: (usuario) => (
        <span className={cn("status-badge", CLASSE_SITUACAO[usuario.situacao])}>
          {ROTULO_SITUACAO[usuario.situacao]}
        </span>
      ),
    },
    {
      id: "acoes",
      cabecalho: "Ações",
      alinhamento: "right",
      renderizar: (usuario) =>
        usuario.situacao === "convite_pendente" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Reenviar convite para ${usuario.nome}`}
            onClick={() => reenviarPara(usuario)}
          >
            <RefreshCcw className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <span className="text-xs text-neutral-300">—</span>
        ),
    },
  ];

  const podeConvidar =
    tenant.statusImplantacao === "provisionado" ||
    tenant.statusImplantacao === "onboarding_em_andamento";

  return (
    <div className="space-y-6">
      <Link
        href="/app/clientes"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para a carteira
      </Link>

      <section
        data-tour="cliente-detalhe-cabecalho"
        className="rounded-xl border border-neutral-200 bg-white p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-700">
              {tenant.nomeFantasia}
            </h1>
            <p className="text-sm text-neutral-500">{tenant.razaoSocial}</p>
            <p className="text-sm text-neutral-500">{formatarCNPJ(tenant.cnpj)}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="flex items-center gap-1.5">
              <span
                className={cn("status-badge", CLASSE_STATUS_IMPLANTACAO[tenant.statusImplantacao])}
              >
                {ROTULO_STATUS_IMPLANTACAO[tenant.statusImplantacao]}
              </span>
              <BadgeAjuda chave="cliente.status-implantacao" tamanho="sm" align="end" />
            </span>
            <p className="text-xs text-neutral-500">
              Entrada na carteira: {formatarData(tenant.criadoEm.slice(0, 10))}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-neutral-700">Dados cadastrais</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Dado rotulo="Razão social" valor={tenant.razaoSocial} />
          <Dado rotulo="Nome fantasia" valor={tenant.nomeFantasia} />
          <Dado rotulo="CNPJ" valor={formatarCNPJ(tenant.cnpj)} />
          <Dado rotulo="Tipo" valor={ROTULO_TIPO[tenant.tipo]} />
          <Dado rotulo="Inscrição municipal" valor={tenant.inscricaoMunicipal} />
          <Dado rotulo="Município / UF" valor={`${tenant.municipio} / ${tenant.uf}`} />
          <Dado rotulo="CEP" valor={tenant.cep} />
          <Dado rotulo="Código IBGE" valor={tenant.codigoIbge} />
          <Dado rotulo="Situação regulatória" valor={tenant.situacaoRegulatoria} />
          <Dado rotulo="Responsável perante o BCB" valor={tenant.responsavelBcb.nome} />
          <Dado rotulo="Cargo do responsável" valor={tenant.responsavelBcb.cargo} />
          <Dado rotulo="E-mail do responsável" valor={tenant.responsavelBcb.email} />
        </dl>
      </section>

      <section
        data-tour="cliente-detalhe-modulos"
        className="rounded-xl border border-neutral-200 bg-white p-6"
      >
        <h2 className="font-display text-lg font-bold text-neutral-700">Módulos contratados</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Alterar os módulos aqui muda o escopo contratado do cliente e fica registrado na trilha de
          auditoria. O cliente precisa ter ao menos um módulo contratado.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TODOS_MODULOS.map((moduloId) => {
            const modulo = buscarModulo(moduloId);
            const ativo = tenant.modulosContratados.includes(moduloId);
            const id = `cliente-modulo-${moduloId}`;
            return (
              <div
                key={moduloId}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md border p-3",
                  ativo ? "border-brand-700 bg-brand-50" : "border-neutral-200"
                )}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-neutral-700">
                      {modulo.nome}
                    </Label>
                    {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {ativo ? "Contratado" : "Não contratado"} · prazo dia {modulo.diaPrazo}
                  </span>
                </span>
                <Switch
                  id={id}
                  checked={ativo}
                  onCheckedChange={(valor) => alternarModulo(moduloId, valor === true)}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section
        data-tour="cliente-detalhe-usuarios"
        className="rounded-xl border border-neutral-200 bg-white p-6"
      >
        <h2 className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
          Usuários e papéis do tenant
          <BadgeAjuda chave="cliente.usuarios-iniciais" tamanho="sm" />
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Usuários do lado Cliente vinculados a esta instituição. O Administrador da Videnas apenas
          reenvia convites; quem administra os usuários do tenant é o próprio cliente.
        </p>
        <div className="mt-4 overflow-x-auto">
          <TabelaDados
            colunas={colunasUsuarios}
            dados={usuarios}
            chave={(usuario) => usuario.id}
            tituloVazio="Nenhum usuário neste cliente"
            mensagemVazia="Os usuários iniciais são criados no cadastro do cliente."
          />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-neutral-700">
          Obrigações de {formatarCompetencia(competenciaCorrente)}
        </h2>
        {periodosCorrentes.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Nenhuma competência aberta para este cliente. As competências são abertas quando o
            cliente conclui a configuração guiada do ambiente.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {periodosCorrentes.map((periodo) => {
              const derivado = calcularPeriodoDerivado(periodo);
              const modulo = buscarModulo(periodo.moduloId);
              return (
                <li
                  key={periodo.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-neutral-50 p-3"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-neutral-700">{modulo.nome}</span>
                    <span className="block text-xs text-neutral-500">
                      Prazo {formatarData(periodo.prazoEntrega)}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <BadgeStatus estado={periodo.estado} />
                    {derivado.atrasado ? (
                      <span className="status-badge status-badge-error">
                        {derivado.diasDeAtraso} {derivado.diasDeAtraso === 1 ? "dia" : "dias"} de
                        atraso
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-neutral-700">
            Evidências e lacres recentes
          </h2>
          <Link
            href="/app/evidencias"
            className="rounded-sm text-xs font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Ver cadeia completa
          </Link>
        </div>

        {!evidenciasHidratadas ? (
          <div role="status" aria-label="Carregando lacres do cliente" className="mt-4 space-y-2">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : lacresRecentes.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Nenhum lacre registrado para este cliente. Os lacres aparecem quando o cliente fornece
            dados ou quando a Videnas entrega um arquivo.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {lacresRecentes.map((lacre) => (
              <li
                key={lacre.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-neutral-50 p-3 text-sm"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <BadgeSentido sentido={lacre.sentido} />
                  <span className="text-neutral-700">{buscarModulo(lacre.moduloId).sigla}</span>
                  <span className="text-xs text-neutral-500">
                    {formatarCompetencia(lacre.competencia)}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs text-neutral-500">
                    {truncarHash(lacre.hashSha256)}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {formatarDataHora(lacre.seladoEm)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        data-tour="cliente-detalhe-acoes"
        className="rounded-xl border border-neutral-200 bg-white p-6"
      >
        <h2 className="font-display text-lg font-bold text-neutral-700">Ações administrativas</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Estas ações mudam o estado de implantação do cliente e ficam registradas na trilha de
          auditoria.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {podeConvidar ? (
            <Button type="button" variant="secondary" onClick={convidarNovamente}>
              <Send className="size-4" aria-hidden="true" />
              Reenviar convite inicial
            </Button>
          ) : null}

          {tenant.statusImplantacao === "suspenso" ? (
            <Button type="button" variant="outline" onClick={() => setDialogReativar(true)}>
              Reativar cliente
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="text-status-error-text"
              onClick={() => {
                setMotivo("");
                setErroMotivo(null);
                setDialogSuspender(true);
              }}
            >
              Suspender cliente
            </Button>
          )}
        </div>
      </section>

      <Dialog open={dialogSuspender} onOpenChange={setDialogSuspender}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Suspender {tenant.nomeFantasia}?</DialogTitle>
            <DialogDescription>
              O cliente continua visível para a operação e a trilha de auditoria é preservada; novas
              competências deixam de ser abertas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="motivo-suspensao">Motivo da suspensão</Label>
            <Textarea
              id="motivo-suspensao"
              value={motivo}
              onChange={(evento) => {
                setMotivo(evento.target.value);
                setErroMotivo(null);
              }}
              aria-invalid={erroMotivo ? true : undefined}
              aria-describedby={erroMotivo ? "motivo-suspensao-erro" : undefined}
              placeholder="Descreva por que este cliente está sendo suspenso."
            />
            {erroMotivo ? (
              <p id="motivo-suspensao-erro" role="alert" className="text-xs text-status-error-text">
                {erroMotivo}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="button" variant="destructive" onClick={confirmarSuspensao}>
              Suspender cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogReativar} onOpenChange={setDialogReativar}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reativar {tenant.nomeFantasia}?</DialogTitle>
            <DialogDescription>
              O cliente volta ao status Ativo e a plataforma retoma a abertura de novas competências
              para os módulos contratados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="button" onClick={confirmarReativacao}>
              Reativar cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-neutral-500">{rotulo}</dt>
      <dd className="text-sm text-neutral-700">{valor.trim().length > 0 ? valor : "—"}</dd>
    </div>
  );
}
