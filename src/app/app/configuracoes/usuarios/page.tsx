"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, Plus, RefreshCcw, ShieldOff, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { useSessaoStore } from "@/lib/store/sessao";
import { usuariosDoTenant, useTenantsStore } from "@/lib/store/tenants";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { PERFIS, buscarPerfil } from "@/lib/permissoes";
import { CLASSE_SITUACAO, ROTULO_SITUACAO } from "@/lib/usuarios/rotulos";
import { formatarDataHora } from "@/lib/formatadores";
import { cn } from "@/lib/utils";
import type { ModuloId, PerfilId, Usuario } from "@/lib/tipos";

const PERFIS_CONVITE: PerfilId[] = ["diretor", "operacional", "contador", "cliente"];

const ROTULOS_ROTA_MATRIZ: Record<string, string> = {
  "/app": "Dashboard",
  "/app/clientes": "Clientes",
  "/app/fornecimento": "Fornecimento de dados",
  "/app/acam212": "ACAM212",
  "/app/cadoc": "Cadoc 5710/5711",
  "/app/fiscal": "Fiscal",
  "/app/entregas": "Arquivos entregues",
  "/app/calendario": "Calendário",
  "/app/auditoria": "Auditoria",
  "/app/evidencias": "Evidências",
  "/app/operacao": "Operação",
  "/app/configuracoes": "Configurações",
  "/app/configuracoes/instituicao": "Configurações · Instituição",
  "/app/configuracoes/usuarios": "Configurações · Usuários",
  "/app/configuracoes/dicionarios": "Configurações · Dicionários",
};

const ROTULOS_ACAO_MATRIZ: Record<string, string> = {
  gerar: "Gerar arquivo",
  regerar: "Gerar novamente",
  enviar_validacao: "Enviar para validação",
  enviar_contador: "Enviar ao contador",
  validar_fiscal: "Confirmar enquadramento fiscal",
  devolver_fiscal: "Devolver para correção",
  executar_validacao: "Executar validação de schema",
  liberar: "Liberar para o cliente",
  registrar_retorno: "Registrar retorno do BCB",
  reabrir: "Reabrir período",
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

export default function ConfiguracoesUsuariosPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const instituicao =
    instituicaoAtivaId && instituicaoAtivaId !== "todas" ? buscarInstituicao(instituicaoAtivaId) : undefined;

  const podeEditar = Boolean(perfilAtivo && buscarPerfil(perfilAtivo).acoesPermitidas.includes("gerenciar_usuarios"));

  const usuariosProvisionados = useTenantsStore((estado) => estado.usuariosProvisionados);

  const usuariosInstituicao = useMemo(
    () => (instituicao ? usuariosDoTenant(usuariosProvisionados, instituicao.id) : []),
    [instituicao, usuariosProvisionados]
  );

  const [usuariosExtras, setUsuariosExtras] = useState<Usuario[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [perfilFiltro, setPerfilFiltro] = useState<PerfilId | "todos">("todos");
  const [novo, setNovo] = useState({
    nome: "",
    email: "",
    perfil: "operacional" as PerfilId,
    modulos: [] as ModuloId[],
  });

  if (!instituicao) {
    return (
      <EstadoVazio
        titulo="Selecione uma instituição"
        mensagem="Escolha uma instituição no seletor do topo para ver os usuários e papéis."
      />
    );
  }

  const todosUsuarios = [...usuariosInstituicao, ...usuariosExtras];
  const responsaveisEnvio = todosUsuarios.filter((usuario) => usuario.perfilId === "cliente");

  function abrirConvite(perfilInicial: PerfilId) {
    setNovo((atual) => ({ ...atual, perfil: perfilInicial }));
    setDialogAberto(true);
  }

  function alternarModulo(moduloId: ModuloId) {
    setNovo((atual) => ({
      ...atual,
      modulos: atual.modulos.includes(moduloId) ? atual.modulos.filter((m) => m !== moduloId) : [...atual.modulos, moduloId],
    }));
  }

  function convidar() {
    if (!novo.nome.trim() || !novo.email.trim()) {
      toast.error("Informe nome e e-mail para convidar o usuário.");
      return;
    }
    const usuario: Usuario = {
      id: `usr-conv-${Math.random().toString(36).slice(2, 8)}`,
      nome: novo.nome,
      email: novo.email,
      cpf: "",
      perfilId: novo.perfil,
      lado: "cliente",
      instituicaoIds: instituicao ? [instituicao.id] : [],
      moduloIds: novo.modulos,
      cargo: buscarPerfil(novo.perfil).rotulo,
      registroProfissional: null,
      situacao: "convite_pendente",
      ultimoAcesso: new Date().toISOString(),
      avatarIniciais: novo.nome
        .split(" ")
        .map((parte) => parte[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    };
    setUsuariosExtras((atual) => [...atual, usuario]);
    setNovo({ nome: "", email: "", perfil: "operacional", modulos: [] });
    setDialogAberto(false);
    toast.success(`Convite enviado para ${usuario.email} (simulação).`);
  }

  function reenviarConvite(usuario: Usuario) {
    toast.info(`Convite reenviado para ${usuario.email} (simulação).`);
  }

  function desativar(usuario: Usuario) {
    setUsuariosExtras((atual) =>
      atual.map((item) => (item.id === usuario.id ? { ...item, situacao: "desativado" } : item))
    );
    toast.success(`${usuario.nome} foi desativado (simulação).`);
  }

  const colunas: ColunaTabela<Usuario>[] = [
    {
      id: "nome",
      cabecalho: "Nome",
      renderizar: (u) => (
        <span className="flex flex-col gap-1">
          <span className="font-medium text-neutral-700">{u.nome}</span>
          {u.perfilId === "cliente" ? (
            <span className="w-fit rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              Responsável pelo envio de dados
            </span>
          ) : null}
        </span>
      ),
    },
    { id: "email", cabecalho: "E-mail", renderizar: (u) => u.email },
    { id: "perfil", cabecalho: "Perfil", renderizar: (u) => buscarPerfil(u.perfilId).rotulo },
    { id: "lado", cabecalho: "Lado", renderizar: (u) => (u.lado === "videnas" ? "Videnas" : "Cliente") },
    { id: "modulos", cabecalho: "Módulos", renderizar: (u) => u.moduloIds.map((m) => m.toUpperCase()).join(", ") },
    { id: "ultimoAcesso", cabecalho: "Último acesso", renderizar: (u) => formatarDataHora(u.ultimoAcesso) },
    {
      id: "situacao",
      cabecalho: "Situação",
      renderizar: (u) => <span className={cn("status-badge", CLASSE_SITUACAO[u.situacao])}>{ROTULO_SITUACAO[u.situacao]}</span>,
    },
    {
      id: "acoes",
      cabecalho: "Ações",
      alinhamento: "right",
      renderizar: (u) =>
        podeEditar ? (
          <div className="flex justify-end gap-1">
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${u.nome}`} onClick={() => toast.info("Edição simulada.")}>
              <UserPen className="size-4" aria-hidden="true" />
            </Button>
            {u.situacao === "convite_pendente" ? (
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Reenviar convite para ${u.nome}`} onClick={() => reenviarConvite(u)}>
                <RefreshCcw className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
            {u.situacao !== "desativado" ? (
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Desativar ${u.nome}`} onClick={() => desativar(u)}>
                <ShieldOff className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-neutral-300">—</span>
        ),
    },
  ];

  const colunasResponsaveis: ColunaTabela<Usuario>[] = [
    { id: "nome", cabecalho: "Nome", renderizar: (u) => <span className="font-medium text-neutral-700">{u.nome}</span> },
    { id: "email", cabecalho: "E-mail", renderizar: (u) => u.email },
    { id: "cargo", cabecalho: "Cargo", renderizar: (u) => u.cargo || "—" },
    {
      id: "modulos",
      cabecalho: "Módulos",
      renderizar: (u) => (u.moduloIds.length > 0 ? u.moduloIds.map((m) => m.toUpperCase()).join(", ") : "—"),
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      renderizar: (u) => <span className={cn("status-badge", CLASSE_SITUACAO[u.situacao])}>{ROTULO_SITUACAO[u.situacao]}</span>,
    },
  ];

  const perfisMatriz = perfilFiltro === "todos" ? PERFIS : PERFIS.filter((p) => p.id === perfilFiltro);

  return (
    <div className="space-y-6">
      {!podeEditar ? (
        <p className="flex items-center gap-2 rounded-md bg-neutral-50 px-4 py-2.5 text-xs text-neutral-500">
          <Lock className="size-3.5" aria-hidden="true" />
          Modo somente leitura. Apenas o perfil Operacional / Suporte ao
          cliente gerencia usuários. O Administrador da Videnas cadastra a instituição e os
          usuários iniciais no provisionamento do cliente; a gestão contínua de usuários é do
          próprio tenant.
        </p>
      ) : null}

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-neutral-700">Usuários da instituição</h2>
          {podeEditar ? (
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger
                render={<Button type="button" size="sm" onClick={() => abrirConvite("operacional")} />}
              >
                <Plus className="size-4" aria-hidden="true" />
                Convidar usuário
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Convidar usuário</DialogTitle>
                  <DialogDescription>O convite é simulado — nenhum e-mail real é enviado.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="convite-nome">Nome</Label>
                    <Input id="convite-nome" value={novo.nome} onChange={(e) => setNovo((a) => ({ ...a, nome: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convite-email">E-mail</Label>
                    <Input id="convite-email" type="email" value={novo.email} onChange={(e) => setNovo((a) => ({ ...a, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="convite-perfil">Perfil</Label>
                    <Select value={novo.perfil} onValueChange={(valor) => setNovo((a) => ({ ...a, perfil: (valor as PerfilId) ?? a.perfil }))}>
                      <SelectTrigger id="convite-perfil" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERFIS_CONVITE.map((perfilId) => (
                          <SelectItem key={perfilId} value={perfilId}>
                            {buscarPerfil(perfilId).rotuloCompleto}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-neutral-400">{buscarPerfil(novo.perfil).descricao}</p>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-neutral-700">Módulos</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {instituicao.modulosContratados.map((moduloId) => (
                        <label key={moduloId} className="flex items-center gap-2 text-sm text-neutral-600">
                          <Checkbox checked={novo.modulos.includes(moduloId)} onCheckedChange={() => alternarModulo(moduloId)} />
                          {moduloId.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={convidar}>
                    Enviar convite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>

        <div className="mt-4">
          <TabelaDados
            colunas={colunas}
            dados={todosUsuarios}
            chave={(u) => u.id}
            tituloVazio="Nenhum usuário nesta instituição"
            mensagemVazia="Convide o primeiro usuário para começar."
          />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="font-display text-lg font-bold text-neutral-700">Responsáveis pelo envio de dados</h2>
            <p className="mt-1 text-sm text-neutral-500">
              O responsável pelo envio de dados é cadastrado previamente aqui, pelo operador do tenant. Ele já nasce
              vinculado a esta instituição: entra direto no painel dela e não escolhe instituição no login.
            </p>
          </div>
          {podeEditar ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => abrirConvite("cliente")}>
              <Plus className="size-4" aria-hidden="true" />
              Designar responsável
            </Button>
          ) : null}
        </div>

        <div className="mt-4">
          <TabelaDados
            colunas={colunasResponsaveis}
            dados={responsaveisEnvio}
            chave={(u) => u.id}
            tituloVazio="Nenhum responsável pelo envio de dados designado"
            mensagemVazia="Use o botão Designar responsável para cadastrar a pessoa que vai fornecer os dados desta instituição."
          />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-neutral-700">Matriz de permissões</h2>
            <p className="text-sm text-neutral-500">Reprodução somente leitura das seções e das ações permitidas por perfil.</p>
          </div>
          <Select value={perfilFiltro} onValueChange={(valor) => setPerfilFiltro((valor as PerfilId | "todos") ?? "todos")}>
            <SelectTrigger className="w-56" aria-label="Filtrar matriz por perfil">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os perfis</SelectItem>
              {PERFIS.map((perfil) => (
                <SelectItem key={perfil.id} value={perfil.id}>
                  {perfil.rotuloCompleto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-4">
          {perfisMatriz.map((perfil) => (
            <div key={perfil.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-neutral-700">{perfil.rotuloCompleto}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    perfil.lado === "videnas" ? "bg-status-candidate-bg text-status-candidate-text" : "bg-status-info-bg text-status-info-text"
                  )}
                >
                  {perfil.lado === "videnas" ? "Videnas" : "Cliente"}
                </span>
              </div>
              <p className="mt-3 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                Seções acessíveis
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {perfil.rotasPermitidas
                  .filter((rota) => rota.startsWith("/app"))
                  .map((rota) => (
                    <span
                      key={rota}
                      className="rounded-md bg-status-info-bg px-2 py-1 text-[11px] text-status-info-text"
                    >
                      {ROTULOS_ROTA_MATRIZ[rota] ?? rota}
                    </span>
                  ))}
              </div>

              <p className="mt-3 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                Ações permitidas
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {perfil.acoesPermitidas.map((acaoId) => (
                  <span key={acaoId} className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600">
                    {ROTULOS_ACAO_MATRIZ[acaoId] ?? acaoId}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-md bg-status-warning-bg px-4 py-2.5 text-xs text-status-warning-text">
          Executor, Validador e Administrador são papéis da Videnas e não podem ser atribuídos a usuários da
          instituição.
        </p>
      </section>
    </div>
  );
}
