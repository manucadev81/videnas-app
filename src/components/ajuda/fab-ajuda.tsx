"use client";

import { useRef, useState } from "react";
import { GraduationCap, LifeBuoy, MessagesSquare } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PainelAssistente } from "@/components/ajuda/painel-assistente";
import { useTour } from "@/components/tutorial/tour-provider";
import { buscarPerfil } from "@/lib/permissoes";
import { useSessaoStore } from "@/lib/store/sessao";
import { cn } from "@/lib/utils";

export function FabAjuda() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [painelAberto, setPainelAberto] = useState(false);
  const gatilhoRef = useRef<HTMLButtonElement>(null);

  const { ativo, iniciar } = useTour();

  const hidratado = useSessaoStore((estado) => estado.hidratado);
  const autenticado = useSessaoStore((estado) => estado.autenticado);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);

  if (!hidratado || !autenticado) {
    return null;
  }

  const rotuloPerfil = perfilAtivo ? buscarPerfil(perfilAtivo).rotuloCompleto : null;

  function abrirTutorial() {
    if (!perfilAtivo) return;
    setMenuAberto(false);
    setPainelAberto(false);
    iniciar(perfilAtivo);
  }

  function abrirAssistente() {
    setMenuAberto(false);
    setPainelAberto(true);
  }

  return (
    <>
      <div
        className={cn(
          "fixed right-4 bottom-4 z-50 print:hidden",
          ativo && "pointer-events-none opacity-0"
        )}
      >
        <Popover open={menuAberto} onOpenChange={setMenuAberto}>
          <PopoverTrigger
            ref={gatilhoRef}
            aria-label="Abrir ajuda: tutorial guiado e assistente de dúvidas"
            disabled={ativo}
            className="flex size-14 min-h-11 min-w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-elevado-3 transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 aria-expanded:bg-brand-800"
          >
            <LifeBuoy className="size-6" aria-hidden="true" />
          </PopoverTrigger>

          <PopoverContent
            side="top"
            align="end"
            sideOffset={12}
            className="w-72 max-w-[calc(100vw-2rem)] rounded-xl p-2"
          >
            <p className="px-2 pt-1 pb-2 text-xs font-medium text-neutral-500">Precisa de ajuda?</p>

            <button
              type="button"
              onClick={abrirTutorial}
              disabled={!perfilAtivo}
              className="flex min-h-11 w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:pointer-events-none disabled:opacity-50"
            >
              <GraduationCap className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-neutral-700">Ver tutorial</span>
                <span className="text-xs leading-relaxed text-neutral-500">
                  {rotuloPerfil
                    ? `Refaz o tour guiado do perfil ${rotuloPerfil}.`
                    : "Disponível assim que um perfil estiver ativo."}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={abrirAssistente}
              className="flex min-h-11 w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              <MessagesSquare className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-neutral-700">Tirar dúvidas</span>
                <span className="text-xs leading-relaxed text-neutral-500">
                  Assistente de demonstração sobre módulos, etapas, prazos e perfis.
                </span>
              </span>
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <PainelAssistente
        aberto={painelAberto}
        onAbertoChange={setPainelAberto}
        focoAoFechar={gatilhoRef}
      />
    </>
  );
}
