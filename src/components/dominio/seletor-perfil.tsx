"use client";

import { ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { perfilTemContextoFixo, useSessaoStore } from "@/lib/store/sessao";
import { PERFIS, PERFIS_SIMULAVEIS } from "@/lib/permissoes";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { cn } from "@/lib/utils";

export interface SeletorPerfilProps {
  className?: string;
}

export function SeletorPerfil({ className }: SeletorPerfilProps) {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);
  const definirPerfil = useSessaoStore((estado) => estado.definirPerfil);

  const usuario = usuarioId ? buscarUsuario(usuarioId) : undefined;
  const perfilMetadados = PERFIS.find((perfil) => perfil.id === perfilAtivo);

  if (!usuario || !perfilMetadados || perfilTemContextoFixo(perfilAtivo)) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-neutral-100",
              className
            )}
          />
        }
      >
        <Avatar>
          <AvatarFallback className="bg-brand-700 text-white">{usuario.avatarIniciais}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-neutral-700">{usuario.nome}</span>
          <span className="block truncate text-xs text-neutral-500">{perfilMetadados.rotuloCompleto}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Simular perfil (demonstração)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PERFIS_SIMULAVEIS.map((perfil) => (
            <DropdownMenuItem
              key={perfil.id}
              onClick={() => definirPerfil(perfil.id)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span className="flex w-full items-center justify-between gap-2 text-sm font-medium text-neutral-700">
                {perfil.rotuloCompleto}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    perfil.lado === "videnas"
                      ? "bg-status-candidate-bg text-status-candidate-text"
                      : "bg-status-info-bg text-status-info-text"
                  )}
                >
                  {perfil.lado === "videnas" ? "Videnas" : "Cliente"}
                </span>
              </span>
              <span className="text-xs text-neutral-500">{perfil.descricao}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
