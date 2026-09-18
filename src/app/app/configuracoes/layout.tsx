"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Table2, Users } from "lucide-react";
import { podeVerRota } from "@/lib/permissoes";
import { useSessaoStore } from "@/lib/store/sessao";
import { cn } from "@/lib/utils";

const ABAS = [
  { href: "/app/configuracoes/instituicao", rotulo: "Instituição", icone: Building2 },
  { href: "/app/configuracoes/usuarios", rotulo: "Usuários e papéis", icone: Users },
  { href: "/app/configuracoes/dicionarios", rotulo: "Dicionários", icone: Table2 },
];

export default function ConfiguracoesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);

  const abasVisiveis = perfilAtivo ? ABAS.filter((aba) => podeVerRota(perfilAtivo, aba.href)) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-700">Configurações</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Dados cadastrais, usuários e dicionários de referência da instituição ativa.
        </p>
      </div>

      {abasVisiveis.length > 0 ? (
        <nav aria-label="Seções de configurações" className="flex gap-1 border-b border-neutral-200">
          {abasVisiveis.map((aba) => {
            const ativo = pathname.startsWith(aba.href);
            const Icone = aba.icone;
            return (
              <Link
                key={aba.href}
                href={aba.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:text-brand-700",
                  ativo && "border-brand-700 text-brand-700"
                )}
              >
                <Icone className="size-4" aria-hidden="true" />
                {aba.rotulo}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {children}
    </div>
  );
}
