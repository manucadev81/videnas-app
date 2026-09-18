"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Instituicao,
  ModuloId,
  StatusImplantacao,
  TipoEventoAuditoria,
  TipoInstituicao,
  Usuario,
} from "@/lib/tipos";
import { instituicoesSemente } from "@/lib/mock/instituicoes";
import { usuariosSemente } from "@/lib/mock/usuarios";
import {
  definirRegistroInstituicoes,
  definirRegistroUsuarios,
} from "@/lib/tenants/registro";
import { usePeriodosStore, type AutorAcao } from "@/lib/store/periodos";
import { formatarCNPJ } from "@/lib/formatadores";

export const NOME_ARMAZENAMENTO_TENANTS = "videnas-tenants";

export interface ContatoInicial {
  nome: string;
  email: string;
}

export interface EntradaProvisionamento {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  tipo: TipoInstituicao;
  municipio: string;
  uf: string;
  cep: string;
  codigoIbge?: string;
  inscricaoMunicipal?: string;
  modulosContratados: ModuloId[];
  diretor: ContatoInicial;
  responsavelEnvio?: ContatoInicial | null;
}

export interface ResultadoTenant {
  sucesso: boolean;
  motivo?: string;
}

export interface ResultadoProvisionamento extends ResultadoTenant {
  tenantId?: string;
}

export interface EstadoTenants {
  hidratado: boolean;
  tenants: Instituicao[];
  usuariosProvisionados: Usuario[];
  provisionarTenant: (
    entrada: EntradaProvisionamento,
    autor: AutorAcao
  ) => ResultadoProvisionamento;
  enviarConviteInicial: (tenantId: string, autor: AutorAcao) => ResultadoTenant;
  reenviarConvite: (tenantId: string, usuarioId: string, autor: AutorAcao) => ResultadoTenant;
  alterarStatusTenant: (
    tenantId: string,
    status: "suspenso" | "ativo",
    autor: AutorAcao,
    motivo?: string
  ) => ResultadoTenant;
  alterarModulosContratados: (
    tenantId: string,
    modulos: ModuloId[],
    autor: AutorAcao
  ) => ResultadoTenant;
  concluirOnboarding: (tenantId: string, autor: AutorAcao) => ResultadoTenant;
  reiniciarTenants: () => void;
}

type TenantsPersistidos = Pick<EstadoTenants, "tenants" | "usuariosProvisionados">;

export const ROTULO_STATUS_IMPLANTACAO: Record<StatusImplantacao, string> = {
  provisionado: "Provisionado",
  onboarding_em_andamento: "Onboarding em andamento",
  ativo: "Ativo",
  suspenso: "Suspenso",
};

export const CLASSE_STATUS_IMPLANTACAO: Record<StatusImplantacao, string> = {
  provisionado: "status-badge-neutral",
  onboarding_em_andamento: "status-badge-warning",
  ativo: "status-badge-success",
  suspenso: "status-badge-error",
};

const SITUACAO_REGULATORIA_INICIAL = "Cadastro em análise — Res. BCB 519/2025";

function estadoInicial(): TenantsPersistidos {
  return {
    tenants: instituicoesSemente.map((instituicao) => ({ ...instituicao })),
    usuariosProvisionados: [],
  };
}

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
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

function gerarSlug(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function iniciaisDe(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => parte.length > 0);
  if (partes.length === 0) {
    return "??";
  }
  const primeira = partes[0][0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1][0] ?? "") : "";
  return `${primeira}${ultima}`.toUpperCase();
}

function identificadorDisponivel(tenants: Instituicao[], slug: string): string {
  const base = slug.length > 0 ? slug : "cliente";
  let candidato = `inst-${base}`;
  let sufixo = 2;
  while (tenants.some((tenant) => tenant.id === candidato)) {
    candidato = `inst-${base}-${sufixo}`;
    sufixo += 1;
  }
  return candidato;
}

function emailsEmUso(usuariosProvisionados: Usuario[]): Set<string> {
  const conjunto = new Set<string>();
  for (const usuario of [...usuariosSemente, ...usuariosProvisionados]) {
    conjunto.add(normalizarEmail(usuario.email));
  }
  return conjunto;
}

export function buscarTenant(tenants: Instituicao[], tenantId: string): Instituicao | undefined {
  return tenants.find((tenant) => tenant.id === tenantId);
}

export function usuariosDoTenant(
  usuariosProvisionados: Usuario[],
  tenantId: string
): Usuario[] {
  return [...usuariosSemente, ...usuariosProvisionados].filter(
    (usuario) => usuario.lado === "cliente" && usuario.instituicaoIds.includes(tenantId)
  );
}

export function diretorDoTenant(
  usuariosProvisionados: Usuario[],
  tenantId: string
): Usuario | undefined {
  return usuariosDoTenant(usuariosProvisionados, tenantId).find(
    (usuario) => usuario.perfilId === "diretor"
  );
}

export function responsavelEnvioDoTenant(
  usuariosProvisionados: Usuario[],
  tenantId: string
): Usuario | undefined {
  return usuariosDoTenant(usuariosProvisionados, tenantId).find(
    (usuario) => usuario.perfilId === "cliente"
  );
}

function sincronizarRegistros(estado: EstadoTenants): void {
  definirRegistroInstituicoes(estado.tenants);
  definirRegistroUsuarios([...usuariosSemente, ...estado.usuariosProvisionados]);
}

function registrarAuditoria(
  autor: AutorAcao,
  instituicaoId: string,
  tipo: TipoEventoAuditoria,
  rotuloTipo: string,
  referencia: string | null,
  payload: Record<string, unknown>
): void {
  usePeriodosStore.getState().registrarEventoAdministrativo({
    autor,
    instituicaoId,
    tipo,
    rotuloTipo,
    referencia,
    payload,
  });
}

export const useTenantsStore = create<EstadoTenants>()(
  persist<EstadoTenants, [], [], TenantsPersistidos>(
    (set, get) => ({
      hidratado: false,
      ...estadoInicial(),

      provisionarTenant: (entrada, autor) => {
        const razaoSocial = entrada.razaoSocial.trim();
        const nomeFantasia = entrada.nomeFantasia.trim();

        if (!razaoSocial) {
          return { sucesso: false, motivo: "Informe a razão social do cliente." };
        }
        if (!nomeFantasia) {
          return { sucesso: false, motivo: "Informe o nome fantasia do cliente." };
        }

        const digitosCnpj = somenteDigitos(entrada.cnpj);
        if (digitosCnpj.length !== 14) {
          return { sucesso: false, motivo: "O CNPJ precisa ter 14 dígitos." };
        }
        if (/^(\d)\1{13}$/.test(digitosCnpj)) {
          return { sucesso: false, motivo: "O CNPJ informado não é válido." };
        }

        const estadoAtual = get();

        if (
          estadoAtual.tenants.some((tenant) => somenteDigitos(tenant.cnpj) === digitosCnpj)
        ) {
          return { sucesso: false, motivo: "Já existe um cliente cadastrado com este CNPJ." };
        }

        if (entrada.modulosContratados.length === 0) {
          return { sucesso: false, motivo: "Contrate ao menos um módulo para o cliente." };
        }

        const nomeDiretor = entrada.diretor.nome.trim();
        const emailDiretor = normalizarEmail(entrada.diretor.email);

        if (!nomeDiretor) {
          return { sucesso: false, motivo: "Informe o nome do Diretor responsável." };
        }
        if (!emailPlausivel(emailDiretor)) {
          return { sucesso: false, motivo: "Informe um e-mail válido para o Diretor responsável." };
        }

        const responsavelEnvio = entrada.responsavelEnvio ?? null;
        const nomeResponsavel = responsavelEnvio?.nome.trim() ?? "";
        const emailResponsavel = responsavelEnvio ? normalizarEmail(responsavelEnvio.email) : "";

        if (responsavelEnvio) {
          if (!nomeResponsavel) {
            return { sucesso: false, motivo: "Informe o nome do responsável pelo envio de dados." };
          }
          if (!emailPlausivel(emailResponsavel)) {
            return {
              sucesso: false,
              motivo: "Informe um e-mail válido para o responsável pelo envio de dados.",
            };
          }
          if (emailResponsavel === emailDiretor) {
            return {
              sucesso: false,
              motivo: "O responsável pelo envio precisa ter um e-mail diferente do Diretor.",
            };
          }
        }

        const emUso = emailsEmUso(estadoAtual.usuariosProvisionados);
        if (emUso.has(emailDiretor)) {
          return {
            sucesso: false,
            motivo: `Já existe um usuário cadastrado com o e-mail ${emailDiretor}.`,
          };
        }
        if (responsavelEnvio && emUso.has(emailResponsavel)) {
          return {
            sucesso: false,
            motivo: `Já existe um usuário cadastrado com o e-mail ${emailResponsavel}.`,
          };
        }

        const slug = gerarSlug(nomeFantasia);
        const tenantId = identificadorDisponivel(estadoAtual.tenants, slug);
        const agora = new Date().toISOString();
        const modulosContratados = [...entrada.modulosContratados];

        const tenant: Instituicao = {
          id: tenantId,
          razaoSocial,
          nomeFantasia,
          cnpj: formatarCNPJ(digitosCnpj),
          tipo: entrada.tipo,
          inscricaoMunicipal: entrada.inscricaoMunicipal?.trim() ?? "",
          municipio: entrada.municipio.trim(),
          uf: entrada.uf.trim().toUpperCase(),
          codigoIbge: entrada.codigoIbge?.trim() ?? "",
          cep: entrada.cep.trim(),
          situacaoRegulatoria: SITUACAO_REGULATORIA_INICIAL,
          responsavelBcb: {
            nome: nomeDiretor,
            cpf: "",
            cargo: "Diretor Responsável",
            email: emailDiretor,
            telefone: "",
          },
          modulosContratados: [...modulosContratados],
          onboardingConcluido: false,
          etapaOnboardingAtual: 1,
          criadoEm: agora,
          statusImplantacao: "provisionado",
        };

        const diretor: Usuario = {
          id: `usr-${tenantId.slice(5)}-diretor`,
          nome: nomeDiretor,
          email: emailDiretor,
          cpf: "",
          perfilId: "diretor",
          lado: "cliente",
          instituicaoIds: [tenantId],
          moduloIds: [...modulosContratados],
          cargo: "Diretor Responsável",
          registroProfissional: null,
          situacao: "convite_pendente",
          ultimoAcesso: agora,
          avatarIniciais: iniciaisDe(nomeDiretor),
        };

        const novosUsuarios: Usuario[] = [diretor];

        if (responsavelEnvio) {
          novosUsuarios.push({
            id: `usr-${tenantId.slice(5)}-dados`,
            nome: nomeResponsavel,
            email: emailResponsavel,
            cpf: "",
            perfilId: "cliente",
            lado: "cliente",
            instituicaoIds: [tenantId],
            moduloIds: [...modulosContratados],
            cargo: "Responsável pelo envio de dados",
            registroProfissional: null,
            situacao: "convite_pendente",
            ultimoAcesso: agora,
            avatarIniciais: iniciaisDe(nomeResponsavel),
          });
        }

        set((estado) => ({
          tenants: [...estado.tenants, tenant],
          usuariosProvisionados: [...estado.usuariosProvisionados, ...novosUsuarios],
        }));

        registrarAuditoria(autor, tenantId, "TENANT_PROVISIONADO", "Cliente provisionado", tenantId, {
          nomeFantasia,
          cnpj: tenant.cnpj,
          tipo: tenant.tipo,
          modulosContratados,
          diretorEmail: emailDiretor,
          ...(responsavelEnvio ? { responsavelEnvioEmail: emailResponsavel } : {}),
        });

        return { sucesso: true, tenantId };
      },

      enviarConviteInicial: (tenantId, autor) => {
        const estadoAtual = get();
        const tenant = buscarTenant(estadoAtual.tenants, tenantId);
        if (!tenant) {
          return { sucesso: false, motivo: "Cliente não encontrado." };
        }
        if (tenant.statusImplantacao !== "provisionado") {
          return {
            sucesso: false,
            motivo: "O convite inicial só pode ser enviado enquanto o cliente está provisionado.",
          };
        }

        const convidados = usuariosDoTenant(estadoAtual.usuariosProvisionados, tenantId).map(
          (usuario) => usuario.email
        );

        set((estado) => ({
          tenants: estado.tenants.map((item) =>
            item.id === tenantId
              ? { ...item, statusImplantacao: "onboarding_em_andamento" as StatusImplantacao }
              : item
          ),
        }));

        registrarAuditoria(
          autor,
          tenantId,
          "CONVITE_INICIAL_ENVIADO",
          "Convite inicial enviado",
          tenantId,
          { emailsConvidados: convidados, reenvio: false }
        );

        return { sucesso: true };
      },

      reenviarConvite: (tenantId, usuarioId, autor) => {
        const estadoAtual = get();
        const tenant = buscarTenant(estadoAtual.tenants, tenantId);
        if (!tenant) {
          return { sucesso: false, motivo: "Cliente não encontrado." };
        }

        const usuario = usuariosDoTenant(estadoAtual.usuariosProvisionados, tenantId).find(
          (item) => item.id === usuarioId
        );
        if (!usuario) {
          return { sucesso: false, motivo: "Usuário não encontrado neste cliente." };
        }

        registrarAuditoria(
          autor,
          tenantId,
          "CONVITE_INICIAL_ENVIADO",
          "Convite inicial enviado",
          usuarioId,
          { reenvio: true, email: usuario.email }
        );

        return { sucesso: true };
      },

      alterarStatusTenant: (tenantId, status, autor, motivo) => {
        const tenant = buscarTenant(get().tenants, tenantId);
        if (!tenant) {
          return { sucesso: false, motivo: "Cliente não encontrado." };
        }

        const justificativa = motivo?.trim() ?? "";

        if (status === "suspenso") {
          if (tenant.statusImplantacao === "suspenso") {
            return { sucesso: false, motivo: "Este cliente já está suspenso." };
          }
          if (justificativa.length < 10) {
            return {
              sucesso: false,
              motivo: "Descreva o motivo da suspensão com pelo menos 10 caracteres.",
            };
          }
        } else if (tenant.statusImplantacao !== "suspenso") {
          return { sucesso: false, motivo: "Este cliente não está suspenso." };
        }

        set((estado) => ({
          tenants: estado.tenants.map((item) =>
            item.id === tenantId ? { ...item, statusImplantacao: status } : item
          ),
        }));

        if (status === "suspenso") {
          registrarAuditoria(autor, tenantId, "TENANT_SUSPENSO", "Cliente suspenso", tenantId, {
            statusAnterior: tenant.statusImplantacao,
            motivo: justificativa,
          });
        } else {
          registrarAuditoria(autor, tenantId, "TENANT_REATIVADO", "Cliente reativado", tenantId, {
            statusAnterior: tenant.statusImplantacao,
            ...(justificativa ? { motivo: justificativa } : {}),
          });
        }

        return { sucesso: true };
      },

      alterarModulosContratados: (tenantId, modulos, autor) => {
        const tenant = buscarTenant(get().tenants, tenantId);
        if (!tenant) {
          return { sucesso: false, motivo: "Cliente não encontrado." };
        }
        if (modulos.length === 0) {
          return { sucesso: false, motivo: "O cliente precisa ter ao menos um módulo contratado." };
        }

        const antes = [...tenant.modulosContratados];
        const depois = [...modulos];

        set((estado) => ({
          tenants: estado.tenants.map((item) =>
            item.id === tenantId ? { ...item, modulosContratados: depois } : item
          ),
        }));

        registrarAuditoria(
          autor,
          tenantId,
          "MODULOS_CONTRATADOS_ALTERADOS",
          "Módulos contratados alterados",
          tenantId,
          { antes, depois }
        );

        return { sucesso: true };
      },

      concluirOnboarding: (tenantId, autor) => {
        const tenant = buscarTenant(get().tenants, tenantId);
        if (!tenant) {
          return { sucesso: false, motivo: "Cliente não encontrado." };
        }
        if (tenant.onboardingConcluido && tenant.statusImplantacao === "ativo") {
          return { sucesso: true };
        }

        set((estado) => ({
          tenants: estado.tenants.map((item) =>
            item.id === tenantId
              ? {
                  ...item,
                  onboardingConcluido: true,
                  etapaOnboardingAtual: 7,
                  statusImplantacao: "ativo" as StatusImplantacao,
                }
              : item
          ),
        }));

        registrarAuditoria(
          autor,
          tenantId,
          "ONBOARDING_CONCLUIDO",
          "Onboarding concluído",
          tenantId,
          { statusAnterior: tenant.statusImplantacao }
        );

        return { sucesso: true };
      },

      reiniciarTenants: () => {
        set({ ...estadoInicial() });
      },
    }),
    {
      name: NOME_ARMAZENAMENTO_TENANTS,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (estado) => ({
        tenants: estado.tenants,
        usuariosProvisionados: estado.usuariosProvisionados,
      }),
      merge: (persistido, atual) => {
        const parcial = (persistido ?? {}) as Partial<TenantsPersistidos>;
        const persistidos = parcial.tenants ?? [];

        const unidos = atual.tenants.map((semente) => {
          const equivalente = persistidos.find((tenant) => tenant.id === semente.id);
          return equivalente ? { ...semente, ...equivalente } : semente;
        });

        const extras = persistidos.filter(
          (tenant) => !atual.tenants.some((semente) => semente.id === tenant.id)
        );

        return {
          ...atual,
          ...parcial,
          tenants: [...unidos, ...extras],
          usuariosProvisionados: parcial.usuariosProvisionados ?? atual.usuariosProvisionados,
        };
      },
      onRehydrateStorage: () => () => {
        useTenantsStore.setState({ hidratado: true });
        sincronizarRegistros(useTenantsStore.getState());
      },
    }
  )
);

sincronizarRegistros(useTenantsStore.getState());

useTenantsStore.subscribe((estado) => {
  sincronizarRegistros(estado);
});

export function useHidratarTenants(): boolean {
  const hidratado = useTenantsStore((estado) => estado.hidratado);

  useEffect(() => {
    const armazenamento = useTenantsStore.persist;

    if (!armazenamento) {
      useTenantsStore.setState({ hidratado: true });
      return;
    }

    if (!armazenamento.hasHydrated()) {
      void armazenamento.rehydrate();
    }
  }, []);

  return hidratado;
}
