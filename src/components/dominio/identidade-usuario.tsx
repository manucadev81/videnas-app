"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarPerfil } from "@/lib/permissoes";
import { cn } from "@/lib/utils";

export interface IdentidadeUsuarioProps {
  className?: string;
}

export function IdentidadeUsuario({ className }: IdentidadeUsuarioProps) {
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);

  const usuario = usuarioId ? buscarUsuario(usuarioId) : undefined;

  if (!usuario || !perfilAtivo) {
    return null;
  }

  const perfil = buscarPerfil(perfilAtivo);
  const instituicaoId =
    instituicaoAtivaId && instituicaoAtivaId !== "todas" ? instituicaoAtivaId : usuario.instituicaoIds[0];
  const instituicao = instituicaoId ? buscarInstituicao(instituicaoId) : undefined;

  const linhaSecundaria = [instituicao?.nomeFantasia, perfil.rotuloCompleto]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      data-tour="identidade-usuario"
      className={cn("flex min-w-0 max-w-full items-center gap-3 rounded-md p-2", className)}
    >
      <Avatar>
        <AvatarFallback className="bg-brand-700 text-white">{usuario.avatarIniciais}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-neutral-700">{usuario.nome}</span>
        <span className="block truncate text-xs text-neutral-500">{linhaSecundaria}</span>
      </span>
    </div>
  );
}
