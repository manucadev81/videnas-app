"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "@/components/tutorial/tour-provider";
import { useSessaoStore } from "@/lib/store/sessao";

export function BotaoTutorial() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const { iniciar } = useTour();

  if (!perfilAtivo) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Reiniciar tutorial guiado do perfil atual"
      title="Tutorial"
      className="min-h-11 min-w-11"
      data-tour="botao-tutorial"
      onClick={() => iniciar(perfilAtivo)}
    >
      <CircleHelp className="size-4" aria-hidden="true" />
    </Button>
  );
}
