"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Building2, CheckCircle2, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { ItemModuloContratado } from "@/components/dominio/item-modulo-contratado";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { useSessaoStore } from "@/lib/store/sessao";
import {
  CLASSE_STATUS_IMPLANTACAO,
  ROTULO_STATUS_IMPLANTACAO,
  useTenantsStore,
  type EntradaProvisionamento,
} from "@/lib/store/tenants";
import { buscarModulo } from "@/lib/mock/modulos";
import { formatarCNPJ } from "@/lib/formatadores";
import type { ModuloId, TipoInstituicao } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const TODOS_MODULOS: ModuloId[] = ["acam212", "cadoc5711", "cadoc5710", "fiscal"];

const ROTULO_TIPO: Record<TipoInstituicao, string> = {
  exchange: "Exchange",
  custodiante: "Custodiante",
  mesa_otc: "Mesa de OTC",
};

interface FormularioCliente {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  tipo: TipoInstituicao;
  municipio: string;
  uf: string;
  cep: string;
  codigoIbge: string;
  inscricaoMunicipal: string;
  modulos: ModuloId[];
  diretorNome: string;
  diretorEmail: string;
  responsavelNome: string;
  responsavelEmail: string;
}

interface Provisionado {
  tenantId: string;
  nomeFantasia: string;
  cnpj: string;
  tipo: TipoInstituicao;
  modulos: ModuloId[];
  diretorNome: string;
  diretorEmail: string;
  responsavelNome: string;
  responsavelEmail: string;
}

const FORMULARIO_INICIAL: FormularioCliente = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  tipo: "exchange",
  municipio: "",
  uf: "",
  cep: "",
  codigoIbge: "",
  inscricaoMunicipal: "",
  modulos: [],
  diretorNome: "",
  diretorEmail: "",
  responsavelNome: "",
  responsavelEmail: "",
};

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

function emailPlausivel(email: string): boolean {
  const valor = email.trim();
  const posicaoArroba = valor.indexOf("@");
  if (posicaoArroba <= 0) {
    return false;
  }
  const dominio = valor.slice(posicaoArroba + 1);
  const posicaoPonto = dominio.indexOf(".");
  return posicaoPonto > 0 && posicaoPonto < dominio.length - 1;
}

function EsqueletoFormulario() {
  return (
    <div role="status" aria-label="Carregando formulário de cadastro" className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}

export default function NovoClientePage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);
  const hidratado = useTenantsStore((estado) => estado.hidratado);
  const provisionarTenant = useTenantsStore((estado) => estado.provisionarTenant);
  const enviarConviteInicial = useTenantsStore((estado) => estado.enviarConviteInicial);

  const [formulario, setFormulario] = useState<FormularioCliente>(FORMULARIO_INICIAL);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [provisionado, setProvisionado] = useState<Provisionado | null>(null);
  const [conviteEnviado, setConviteEnviado] = useState(false);

  if (perfilAtivo !== "admin") {
    return (
      <EstadoVazio
        titulo="Acesso não disponível"
        mensagem="O cadastro de novos clientes é restrito ao perfil Administrador da Videnas."
        icone={Building2}
      />
    );
  }

  if (!hidratado) {
    return <EsqueletoFormulario />;
  }

  function atualizar<C extends keyof FormularioCliente>(campo: C, valor: FormularioCliente[C]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => {
      if (!atual[campo as string]) return atual;
      const proximo = { ...atual };
      delete proximo[campo as string];
      return proximo;
    });
  }

  function alternarModulo(moduloId: ModuloId, ativo: boolean) {
    setFormulario((atual) => ({
      ...atual,
      modulos: ativo
        ? [...atual.modulos, moduloId]
        : atual.modulos.filter((item) => item !== moduloId),
    }));
    setErros((atual) => {
      if (!atual.modulos) return atual;
      const proximo = { ...atual };
      delete proximo.modulos;
      return proximo;
    });
  }

  function validar(): Record<string, string> {
    const novos: Record<string, string> = {};

    if (!formulario.razaoSocial.trim()) {
      novos.razaoSocial = "Informe a razão social do cliente.";
    }
    if (!formulario.nomeFantasia.trim()) {
      novos.nomeFantasia = "Informe o nome fantasia do cliente.";
    }
    if (somenteDigitos(formulario.cnpj).length !== 14) {
      novos.cnpj = "O CNPJ precisa ter 14 dígitos.";
    }
    if (!formulario.municipio.trim()) {
      novos.municipio = "Informe o município da sede.";
    }
    if (formulario.uf.trim().length !== 2) {
      novos.uf = "Informe a UF com duas letras.";
    }
    if (formulario.modulos.length === 0) {
      novos.modulos = "Contrate ao menos um módulo para o cliente.";
    }
    if (!formulario.diretorNome.trim()) {
      novos.diretorNome = "Informe o nome do Responsável de Compliance.";
    }
    if (!emailPlausivel(formulario.diretorEmail)) {
      novos.diretorEmail = "Informe um e-mail válido para o Responsável de Compliance.";
    }

    const temResponsavel =
      formulario.responsavelNome.trim().length > 0 || formulario.responsavelEmail.trim().length > 0;

    if (temResponsavel) {
      if (!formulario.responsavelNome.trim()) {
        novos.responsavelNome = "Informe o nome do responsável pelo envio de dados.";
      }
      if (!emailPlausivel(formulario.responsavelEmail)) {
        novos.responsavelEmail = "Informe um e-mail válido para o responsável pelo envio de dados.";
      }
    }

    return novos;
  }

  function enviar() {
    setErroEnvio(null);

    const novosErros = validar();
    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      setErroEnvio("Revise os campos destacados antes de cadastrar o cliente.");
      return;
    }

    const temResponsavel =
      formulario.responsavelNome.trim().length > 0 && formulario.responsavelEmail.trim().length > 0;

    const entrada: EntradaProvisionamento = {
      razaoSocial: formulario.razaoSocial,
      nomeFantasia: formulario.nomeFantasia,
      cnpj: formulario.cnpj,
      tipo: formulario.tipo,
      municipio: formulario.municipio,
      uf: formulario.uf,
      cep: formulario.cep,
      codigoIbge: formulario.codigoIbge,
      inscricaoMunicipal: formulario.inscricaoMunicipal,
      modulosContratados: formulario.modulos,
      diretor: { nome: formulario.diretorNome, email: formulario.diretorEmail },
      responsavelEnvio: temResponsavel
        ? { nome: formulario.responsavelNome, email: formulario.responsavelEmail }
        : null,
    };

    const resultado = provisionarTenant(entrada, {
      usuarioId: usuarioId ?? "usr-marina",
      perfilId: "admin",
    });

    if (!resultado.sucesso || !resultado.tenantId) {
      const motivo = resultado.motivo ?? "Não foi possível cadastrar este cliente.";
      setErroEnvio(motivo);
      toast.error(motivo);
      return;
    }

    setProvisionado({
      tenantId: resultado.tenantId,
      nomeFantasia: formulario.nomeFantasia.trim(),
      cnpj: formatarCNPJ(somenteDigitos(formulario.cnpj)),
      tipo: formulario.tipo,
      modulos: [...formulario.modulos],
      diretorNome: formulario.diretorNome.trim(),
      diretorEmail: formulario.diretorEmail.trim().toLowerCase(),
      responsavelNome: temResponsavel ? formulario.responsavelNome.trim() : "",
      responsavelEmail: temResponsavel ? formulario.responsavelEmail.trim().toLowerCase() : "",
    });
    setConviteEnviado(false);
    toast.success(`${formulario.nomeFantasia.trim()} foi provisionada na plataforma.`);
  }

  function convidar() {
    if (!provisionado) return;

    const resultado = enviarConviteInicial(provisionado.tenantId, {
      usuarioId: usuarioId ?? "usr-marina",
      perfilId: "admin",
    });

    if (!resultado.sucesso) {
      toast.error(resultado.motivo ?? "Não foi possível enviar o convite inicial.");
      return;
    }

    setConviteEnviado(true);
    toast.success(
      `Convite simulado enviado. Nenhum e-mail real sai daqui: para entrar na demonstração como Responsável de Compliance desta instituição, use ${provisionado.diretorEmail} na tela de login.`
    );
  }

  function recomecar() {
    setFormulario(FORMULARIO_INICIAL);
    setErros({});
    setErroEnvio(null);
    setProvisionado(null);
    setConviteEnviado(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/app/clientes"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para a carteira
      </Link>

      {provisionado ? (
        <BlocoSucesso
          provisionado={provisionado}
          conviteEnviado={conviteEnviado}
          aoConvidar={convidar}
          aoRecomecar={recomecar}
        />
      ) : (
        <>
          <header>
            <h1 className="font-display text-2xl font-bold text-neutral-700">Cadastrar novo cliente</h1>
            <p className="text-sm text-neutral-500">
              O cadastro cria a instituição na plataforma e os usuários iniciais dela. A configuração
              guiada do ambiente é feita depois, pelo Responsável de Compliance do cliente.
            </p>
          </header>

          <form
            data-tour="cliente-novo-formulario"
            noValidate
            onSubmit={(evento) => {
              evento.preventDefault();
              enviar();
            }}
            className="space-y-6"
          >
            <fieldset className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
              <legend className="font-display text-lg font-bold text-neutral-700">
                Dados da instituição
              </legend>
              <p className="text-sm text-neutral-500">
                Identificação cadastral do cliente. O CNPJ é único na plataforma: não é possível
                cadastrar duas vezes a mesma instituição.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  id="cliente-razao-social"
                  rotulo="Razão social"
                  obrigatorio
                  erro={erros.razaoSocial}
                >
                  <Input
                    value={formulario.razaoSocial}
                    onChange={(evento) => atualizar("razaoSocial", evento.target.value)}
                    autoComplete="organization"
                  />
                </Campo>

                <Campo
                  id="cliente-nome-fantasia"
                  rotulo="Nome fantasia"
                  obrigatorio
                  erro={erros.nomeFantasia}
                >
                  <Input
                    value={formulario.nomeFantasia}
                    onChange={(evento) => atualizar("nomeFantasia", evento.target.value)}
                  />
                </Campo>

                <Campo id="cliente-cnpj" rotulo="CNPJ" obrigatorio erro={erros.cnpj}>
                  <Input
                    value={formatarCNPJ(formulario.cnpj)}
                    onChange={(evento) =>
                      atualizar("cnpj", somenteDigitos(evento.target.value).slice(0, 14))
                    }
                    placeholder="00.000.000/0000-00"
                    inputMode="numeric"
                  />
                </Campo>

                <div className="space-y-1.5">
                  <Label htmlFor="cliente-tipo">Tipo de instituição</Label>
                  <Select
                    value={formulario.tipo}
                    onValueChange={(valor) =>
                      atualizar("tipo", (valor as TipoInstituicao) ?? "exchange")
                    }
                  >
                    <SelectTrigger id="cliente-tipo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exchange">Exchange</SelectItem>
                      <SelectItem value="custodiante">Custodiante</SelectItem>
                      <SelectItem value="mesa_otc">Mesa de OTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Campo id="cliente-municipio" rotulo="Município" obrigatorio erro={erros.municipio}>
                  <Input
                    value={formulario.municipio}
                    onChange={(evento) => atualizar("municipio", evento.target.value)}
                  />
                </Campo>

                <Campo id="cliente-uf" rotulo="UF" obrigatorio erro={erros.uf}>
                  <Input
                    value={formulario.uf}
                    onChange={(evento) => atualizar("uf", evento.target.value.toUpperCase())}
                    maxLength={2}
                    className="uppercase"
                  />
                </Campo>

                <Campo id="cliente-cep" rotulo="CEP">
                  <Input
                    value={formulario.cep}
                    onChange={(evento) => atualizar("cep", evento.target.value)}
                    placeholder="00000-000"
                    inputMode="numeric"
                  />
                </Campo>

                <Campo id="cliente-codigo-ibge" rotulo="Código IBGE do município">
                  <Input
                    value={formulario.codigoIbge}
                    onChange={(evento) => atualizar("codigoIbge", evento.target.value)}
                    inputMode="numeric"
                  />
                </Campo>

                <Campo id="cliente-inscricao-municipal" rotulo="Inscrição municipal">
                  <Input
                    value={formulario.inscricaoMunicipal}
                    onChange={(evento) => atualizar("inscricaoMunicipal", evento.target.value)}
                  />
                </Campo>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
              <legend className="font-display text-lg font-bold text-neutral-700">
                Módulos contratados
              </legend>
              <p className="text-sm text-neutral-500">
                Selecione ao menos um módulo. Os módulos contratados definem quais competências são
                abertas quando o cliente concluir a configuração guiada.
              </p>

              <div className="space-y-3">
                {TODOS_MODULOS.map((moduloId) => (
                  <ItemModuloContratado
                    key={moduloId}
                    moduloId={moduloId}
                    checked={formulario.modulos.includes(moduloId)}
                    onCheckedChange={(valor) => alternarModulo(moduloId, valor)}
                    idPrefixo="cliente-modulo"
                    invalido={Boolean(erros.modulos)}
                  />
                ))}
              </div>

              {formulario.modulos.includes("fiscal") ? (
                <BannerPosicionamento variante="atencao" />
              ) : null}

              {erros.modulos ? (
                <p role="alert" className="text-xs text-status-error-text">
                  {erros.modulos}
                </p>
              ) : null}
            </fieldset>

            <fieldset className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
              <legend className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
                Usuários iniciais
                <BadgeAjuda chave="cliente.usuarios-iniciais" tamanho="sm" />
              </legend>

              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-neutral-700">Responsável de Compliance</h2>
                  <p className="text-sm text-neutral-500">
                    É ele quem recebe o convite inicial, conclui a configuração guiada do ambiente e
                    responde pela instituição perante o Banco Central.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    id="cliente-diretor-nome"
                    rotulo="Nome"
                    obrigatorio
                    erro={erros.diretorNome}
                  >
                    <Input
                      value={formulario.diretorNome}
                      onChange={(evento) => atualizar("diretorNome", evento.target.value)}
                    />
                  </Campo>
                  <Campo
                    id="cliente-diretor-email"
                    rotulo="E-mail"
                    obrigatorio
                    erro={erros.diretorEmail}
                  >
                    <Input
                      type="email"
                      value={formulario.diretorEmail}
                      onChange={(evento) => atualizar("diretorEmail", evento.target.value)}
                      inputMode="email"
                    />
                  </Campo>
                </div>
              </div>

              <div className="space-y-4 border-t border-neutral-200 pt-4">
                <div>
                  <h2 className="text-sm font-bold text-neutral-700">
                    Responsável pelo envio de dados (opcional)
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Esta pessoa fornece os dados de origem de cada obrigação. Ela pode ser designada
                    agora ou depois, pelo próprio cliente, em Configurações → Usuários e papéis.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    id="cliente-responsavel-nome"
                    rotulo="Nome do responsável pelo envio"
                    erro={erros.responsavelNome}
                  >
                    <Input
                      value={formulario.responsavelNome}
                      onChange={(evento) => atualizar("responsavelNome", evento.target.value)}
                    />
                  </Campo>
                  <Campo
                    id="cliente-responsavel-email"
                    rotulo="E-mail do responsável pelo envio"
                    erro={erros.responsavelEmail}
                  >
                    <Input
                      type="email"
                      value={formulario.responsavelEmail}
                      onChange={(evento) => atualizar("responsavelEmail", evento.target.value)}
                      inputMode="email"
                    />
                  </Campo>
                </div>
              </div>
            </fieldset>

            {erroEnvio ? (
              <p
                role="alert"
                className="rounded-md border border-status-error-border bg-status-error-bg px-4 py-3 text-sm text-status-error-text"
              >
                {erroEnvio}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button render={<Link href="/app/clientes" />} nativeButton={false} variant="outline">
                Cancelar
              </Button>
              <Button type="submit">Cadastrar cliente</Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function Campo({
  id,
  rotulo,
  obrigatorio,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  obrigatorio?: boolean;
  erro?: string;
  children: React.ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    required?: boolean;
  }>;
}) {
  const idErro = `${id}-erro`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {rotulo}
        {obrigatorio ? (
          <span className="text-status-error-text" aria-hidden="true">
            *
          </span>
        ) : null}
        {obrigatorio ? <span className="sr-only">(obrigatório)</span> : null}
      </Label>
      {React.cloneElement(children, {
        id,
        "aria-invalid": erro ? true : undefined,
        "aria-describedby": erro ? idErro : undefined,
      })}
      {erro ? (
        <p id={idErro} className="text-xs text-status-error-text">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

function BlocoSucesso({
  provisionado,
  conviteEnviado,
  aoConvidar,
  aoRecomecar,
}: {
  provisionado: Provisionado;
  conviteEnviado: boolean;
  aoConvidar: () => void;
  aoRecomecar: () => void;
}) {
  const status = conviteEnviado ? "onboarding_em_andamento" : "provisionado";

  return (
    <section
      data-tour="cliente-novo-sucesso"
      aria-labelledby="cliente-novo-sucesso-titulo"
      className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-status-success-text" aria-hidden="true" />
        <div>
          <h1
            id="cliente-novo-sucesso-titulo"
            className="font-display text-2xl font-bold text-neutral-700"
          >
            Cliente provisionado
          </h1>
          <p className="text-sm text-neutral-500">{provisionado.nomeFantasia}</p>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Resumo rotulo="CNPJ" valor={provisionado.cnpj} />
        <Resumo rotulo="Tipo" valor={ROTULO_TIPO[provisionado.tipo]} />
        <Resumo
          rotulo="Módulos contratados"
          valor={provisionado.modulos.map((moduloId) => buscarModulo(moduloId).nome).join(" · ")}
        />
        <div className="space-y-1">
          <dt className="flex items-center gap-1.5 text-xs text-neutral-500">
            Status atual
            <BadgeAjuda chave="cliente.status-implantacao" tamanho="xs" />
          </dt>
          <dd>
            <span className={cn("status-badge", CLASSE_STATUS_IMPLANTACAO[status])}>
              {ROTULO_STATUS_IMPLANTACAO[status]}
            </span>
          </dd>
        </div>
        <Resumo
          rotulo="Responsável de Compliance"
          valor={`${provisionado.diretorNome} · ${provisionado.diretorEmail}`}
        />
        {provisionado.responsavelEmail ? (
          <Resumo
            rotulo="Responsável pelo envio de dados"
            valor={`${provisionado.responsavelNome} · ${provisionado.responsavelEmail}`}
          />
        ) : null}
      </dl>

      <p className="rounded-md border border-status-info-border bg-status-info-bg px-4 py-3 text-sm leading-relaxed text-status-info-text">
        A instituição já existe na plataforma e aparece para Executor, Validador e Administrador.
        Falta enviar o convite para o Responsável de Compliance — é ele quem conclui a configuração guiada
        do ambiente.
      </p>

      <div className="flex flex-wrap gap-3">
        {conviteEnviado ? (
          <Button type="button" disabled>
            <MailCheck className="size-4" aria-hidden="true" />
            Convite enviado
          </Button>
        ) : (
          <Button type="button" onClick={aoConvidar}>
            <Send className="size-4" aria-hidden="true" />
            Enviar convite
          </Button>
        )}

        {conviteEnviado ? (
          <Button
            render={<Link href={`/app/clientes/${provisionado.tenantId}`} />}
            nativeButton={false}
            variant="outline"
          >
            Abrir ficha do cliente
          </Button>
        ) : null}

        <Button type="button" variant="ghost" onClick={aoRecomecar}>
          Cadastrar outro cliente
        </Button>
      </div>
    </section>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-neutral-500">{rotulo}</dt>
      <dd className="text-sm text-neutral-700">{valor}</dd>
    </div>
  );
}
