"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  History,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Vault,
  Wallet,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogoVidenas } from "@/components/marca/logo-videnas";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import type { ChaveAjuda } from "@/lib/ajuda/textos";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessaoStore } from "@/lib/store/sessao";
import { podeVerRota } from "@/lib/permissoes";
import { cn } from "@/lib/utils";

interface ItemNavegacao {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  chaveAjuda: ChaveAjuda;
  candidato?: boolean;
}

const ITENS_NAVEGACAO: ItemNavegacao[] = [
  { href: "/app", rotulo: "Dashboard", icone: LayoutDashboard, chaveAjuda: "nav.dashboard" },
  { href: "/app/acam212", rotulo: "ACAM212", icone: ShieldCheck, chaveAjuda: "nav.acam212" },
  { href: "/app/cadoc", rotulo: "Cadoc 5710/5711", icone: Vault, chaveAjuda: "nav.cadoc" },
  { href: "/app/fiscal", rotulo: "Fiscal", icone: Wallet, chaveAjuda: "nav.fiscal", candidato: true },
  { href: "/app/calendario", rotulo: "Calendário", icone: Calendar, chaveAjuda: "nav.calendario" },
  { href: "/app/auditoria", rotulo: "Auditoria", icone: History, chaveAjuda: "nav.auditoria" },
  { href: "/app/operacao", rotulo: "Operação", icone: Workflow, chaveAjuda: "nav.operacao" },
  { href: "/app/configuracoes", rotulo: "Configurações", icone: Settings, chaveAjuda: "nav.configuracoes" },
];

function ConteudoNavegacao({ pathname, itens }: { pathname: string; itens: ItemNavegacao[] }) {
  return (
    <nav aria-label="Navegação principal" className="flex-1 space-y-1 px-2 py-4">
      {itens.map((item) => {
        const ativo = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        const Icone = item.icone;

        return (
          <div key={item.href} className="flex items-center gap-0.5 pr-1.5">
            <Link
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              data-tour={`nav-${item.href.split("/").filter(Boolean).pop() ?? "app"}`}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 rounded-md border-l-3 border-transparent px-4 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100",
                ativo && "border-brand-700 bg-brand-50 text-brand-700"
              )}
            >
              <Icone className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{item.rotulo}</span>
              {item.candidato ? <SeloCandidato tamanho="sm" /> : null}
            </Link>
            <BadgeAjuda chave={item.chaveAjuda} tamanho="xs" side="right" align="start" />
          </div>
        );
      })}
    </nav>
  );
}

function EsqueletoNavegacao() {
  return (
    <div
      role="status"
      aria-label="Carregando navegação"
      className="flex-1 space-y-1 px-2 py-4"
    >
      {ITENS_NAVEGACAO.map((item) => (
        <div key={item.href} className="flex items-center gap-2.5 px-4 py-3" aria-hidden="true">
          <Skeleton className="size-4 shrink-0 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function SidebarApp() {
  const pathname = usePathname();
  const hidratado = useSessaoStore((estado) => estado.hidratado);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);

  const itensVisiveis = perfilAtivo
    ? ITENS_NAVEGACAO.filter((item) => podeVerRota(perfilAtivo, item.href))
    : [];

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 md:flex">
        <div className="border-b border-neutral-200 p-4">
          <Link href="/app" aria-label="Ir para o dashboard">
            <LogoVidenas className="h-8 w-auto text-brand-700" />
          </Link>
        </div>
        {hidratado ? (
          <ConteudoNavegacao pathname={pathname} itens={itensVisiveis} />
        ) : (
          <EsqueletoNavegacao />
        )}
      </aside>

      <div className="border-b border-neutral-200 bg-neutral-50 p-3 md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" aria-label="Abrir menu de navegação" />
            }
          >
            <Menu className="size-4" aria-hidden="true" />
            Menu
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navegação</SheetTitle>
            <div className="border-b border-neutral-200 p-4">
              <LogoVidenas className="h-8 w-auto text-brand-700" />
            </div>
            {hidratado ? (
              <ConteudoNavegacao pathname={pathname} itens={itensVisiveis} />
            ) : (
              <EsqueletoNavegacao />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
