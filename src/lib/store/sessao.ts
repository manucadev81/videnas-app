"use client";

import { create } from "zustand";
import type { PerfilId } from "@/lib/tipos";
import { buscarUsuario, usuariosPorEmail } from "@/lib/mock/usuarios";

export interface EstadoSessao {
  autenticado: boolean;
  usuarioId: string | null;
  perfilAtivo: PerfilId | null;
  instituicaoAtivaId: string | "todas" | null;
  entrar: (email: string) => { usuarioId: string; reconhecido: boolean };
  sair: () => void;
  definirPerfil: (perfilId: PerfilId) => void;
  definirInstituicao: (instituicaoId: string | "todas") => void;
}

const USUARIO_PADRAO_NAO_RECONHECIDO = "usr-paula";

export const useSessaoStore = create<EstadoSessao>((set) => ({
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
  sair: () =>
    set({
      autenticado: false,
      usuarioId: null,
      perfilAtivo: null,
      instituicaoAtivaId: null,
    }),
  definirPerfil: (perfilId: PerfilId) => set({ perfilAtivo: perfilId }),
  definirInstituicao: (instituicaoId: string | "todas") =>
    set({ instituicaoAtivaId: instituicaoId }),
}));
