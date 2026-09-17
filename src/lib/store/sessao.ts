"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PerfilId } from "@/lib/tipos";
import { buscarUsuario, usuariosPorEmail } from "@/lib/mock/usuarios";
import { PERFIS } from "@/lib/permissoes";

export interface EstadoSessao {
  hidratado: boolean;
  autenticado: boolean;
  usuarioId: string | null;
  perfilAtivo: PerfilId | null;
  instituicaoAtivaId: string | "todas" | null;
  entrar: (email: string) => {
    usuarioId: string;
    reconhecido: boolean;
    contextoFixo: boolean;
    destino: string;
  };
  sair: () => void;
  definirPerfil: (perfilId: PerfilId) => void;
  definirInstituicao: (instituicaoId: string | "todas") => void;
}

type SessaoPersistida = Pick<
  EstadoSessao,
  "autenticado" | "usuarioId" | "perfilAtivo" | "instituicaoAtivaId"
>;

const USUARIO_PADRAO_NAO_RECONHECIDO = "usr-paula";

export const NOME_ARMAZENAMENTO_SESSAO = "videnas-sessao";

export function perfilEhMultiTenant(perfilId: PerfilId | null): boolean {
  if (!perfilId) {
    return false;
  }
  return PERFIS.find((perfil) => perfil.id === perfilId)?.multiTenant ?? false;
}

export function perfilTemContextoFixo(perfilId: PerfilId | null): boolean {
  if (!perfilId) {
    return false;
  }
  return PERFIS.find((perfil) => perfil.id === perfilId)?.contextoFixo ?? false;
}

export function normalizarInstituicaoAtiva(
  perfilAtivo: PerfilId | null,
  usuarioId: string | null,
  instituicaoId: string | "todas" | null
): string | "todas" | null {
  if (instituicaoId !== "todas") {
    return instituicaoId;
  }
  if (perfilEhMultiTenant(perfilAtivo)) {
    return "todas";
  }
  if (!usuarioId) {
    return null;
  }
  return buscarUsuario(usuarioId)?.instituicaoIds[0] ?? null;
}

export const useSessaoStore = create<EstadoSessao>()(
  persist<EstadoSessao, [], [], SessaoPersistida>(
    (set) => ({
      hidratado: false,
      autenticado: false,
      usuarioId: null,
      perfilAtivo: null,
      instituicaoAtivaId: null,
      entrar: (email: string) => {
        const emailNormalizado = email.trim().toLowerCase();
        const usuarioId = usuariosPorEmail[emailNormalizado] ?? USUARIO_PADRAO_NAO_RECONHECIDO;
        const reconhecido = emailNormalizado in usuariosPorEmail;
        const usuario = buscarUsuario(usuarioId);

        const perfilAtivo = usuario?.perfilId ?? "operacional";

        set({
          autenticado: true,
          usuarioId,
          perfilAtivo,
          instituicaoAtivaId: usuario?.instituicaoIds[0] ?? null,
        });

        const contextoFixo =
          perfilTemContextoFixo(perfilAtivo) && (usuario?.instituicaoIds.length ?? 0) === 1;
        const destino = contextoFixo ? "/app" : "/selecionar-instituicao";

        return { usuarioId, reconhecido, contextoFixo, destino };
      },
      sair: () => {
        set({
          autenticado: false,
          usuarioId: null,
          perfilAtivo: null,
          instituicaoAtivaId: null,
        });
        useSessaoStore.persist?.clearStorage();
      },
      definirPerfil: (perfilId: PerfilId) =>
        set((estado) => ({
          perfilAtivo: perfilId,
          instituicaoAtivaId: normalizarInstituicaoAtiva(
            perfilId,
            estado.usuarioId,
            estado.instituicaoAtivaId
          ),
        })),
      definirInstituicao: (instituicaoId: string | "todas") =>
        set((estado) => ({
          instituicaoAtivaId: normalizarInstituicaoAtiva(
            estado.perfilAtivo,
            estado.usuarioId,
            instituicaoId
          ),
        })),
    }),
    {
      name: NOME_ARMAZENAMENTO_SESSAO,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (estado) => ({
        autenticado: estado.autenticado,
        usuarioId: estado.usuarioId,
        perfilAtivo: estado.perfilAtivo,
        instituicaoAtivaId: estado.instituicaoAtivaId,
      }),
      onRehydrateStorage: () => () => {
        const atual = useSessaoStore.getState();
        useSessaoStore.setState({
          hidratado: true,
          instituicaoAtivaId: normalizarInstituicaoAtiva(
            atual.perfilAtivo,
            atual.usuarioId,
            atual.instituicaoAtivaId
          ),
        });
      },
    }
  )
);

export function useHidratarSessao(): boolean {
  const hidratado = useSessaoStore((estado) => estado.hidratado);

  useEffect(() => {
    const armazenamento = useSessaoStore.persist;

    if (!armazenamento) {
      useSessaoStore.setState({ hidratado: true });
      return;
    }

    if (!armazenamento.hasHydrated()) {
      void armazenamento.rehydrate();
    }
  }, []);

  return hidratado;
}
