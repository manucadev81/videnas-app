"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PerfilId } from "@/lib/tipos";
import { buscarUsuario, usuariosPorEmail } from "@/lib/mock/usuarios";

export interface EstadoSessao {
  hidratado: boolean;
  autenticado: boolean;
  usuarioId: string | null;
  perfilAtivo: PerfilId | null;
  instituicaoAtivaId: string | "todas" | null;
  entrar: (email: string) => { usuarioId: string; reconhecido: boolean };
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

        set({
          autenticado: true,
          usuarioId,
          perfilAtivo: usuario?.perfilId ?? "operacional",
          instituicaoAtivaId: usuario?.instituicaoIds[0] ?? null,
        });

        return { usuarioId, reconhecido };
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
      definirPerfil: (perfilId: PerfilId) => set({ perfilAtivo: perfilId }),
      definirInstituicao: (instituicaoId: string | "todas") =>
        set({ instituicaoAtivaId: instituicaoId }),
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
        useSessaoStore.setState({ hidratado: true });
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
