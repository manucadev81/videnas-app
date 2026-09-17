"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SeletorPerfil } from "@/components/dominio/seletor-perfil";
import { SeletorInstituicao } from "@/components/dominio/seletor-instituicao";
import { useLogout } from "@/lib/hooks/use-logout";

const ROTULOS_SEGMENTO: Record<string, string> = {
  app: "Painel",
  acam212: "ACAM212",
  cadoc: "Cadoc 5710/5711",
  fiscal: "Fiscal",
  calendario: "Calendário",
  auditoria: "Auditoria",
  configuracoes: "Configurações",
  operacao: "Operação",
};

function rotuloSegmento(segmento: string): string {
  return ROTULOS_SEGMENTO[segmento] ?? segmento.replace(/-/g, " ");
}

export function HeaderApp() {
  const pathname = usePathname();
  const aoSair = useLogout();
  const segmentos = pathname.split("/").filter(Boolean);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          {segmentos.map((segmento, indice) => {
            const caminho = `/${segmentos.slice(0, indice + 1).join("/")}`;
            const ultimo = indice === segmentos.length - 1;

            return (
              <span key={caminho} className="flex items-center gap-1.5">
                {indice > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {ultimo ? (
                    <BreadcrumbPage>{rotuloSegmento(segmento)}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={caminho}>{rotuloSegmento(segmento)}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center gap-4">
        <SeletorInstituicao className="min-w-40" />
        <div data-tour="seletor-perfil">
          <SeletorPerfil className="w-56" />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={aoSair}
                  aria-label="Sair da conta"
                />
              }
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
            </TooltipTrigger>
            <TooltipContent>Sair da conta</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
