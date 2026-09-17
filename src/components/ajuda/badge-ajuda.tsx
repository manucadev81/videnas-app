"use client";

import type { ComponentProps } from "react";
import { CircleHelp } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buscarAjuda, type ChaveAjuda } from "@/lib/ajuda/textos";
import { cn } from "@/lib/utils";

type TamanhoBadgeAjuda = "xs" | "sm" | "md";

type LadoPopover = ComponentProps<typeof PopoverContent>["side"];
type AlinhamentoPopover = ComponentProps<typeof PopoverContent>["align"];

const CLASSE_BOTAO: Record<TamanhoBadgeAjuda, string> = {
  xs: "size-4",
  sm: "size-5",
  md: "size-6",
};

const CLASSE_ICONE: Record<TamanhoBadgeAjuda, string> = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-5",
};

export interface BadgeAjudaProps {
  chave: ChaveAjuda;
  tamanho?: TamanhoBadgeAjuda;
  side?: LadoPopover;
  align?: AlinhamentoPopover;
  className?: string;
}

export function BadgeAjuda({
  chave,
  tamanho = "sm",
  side = "bottom",
  align = "start",
  className,
}: BadgeAjudaProps) {
  const texto = buscarAjuda(chave);
  const rotulo = texto.pergunta ?? `O que é ${texto.titulo}?`;

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={rotulo}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full align-middle text-neutral-400 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 data-[popup-open]:text-brand-700",
          CLASSE_BOTAO[tamanho],
          className
        )}
      >
        <CircleHelp className={CLASSE_ICONE[tamanho]} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-80 max-w-[calc(100vw-2rem)] rounded-xl">
        <PopoverHeader>
          <PopoverTitle className="font-display text-sm font-bold text-neutral-700">
            {texto.titulo}
          </PopoverTitle>
          <PopoverDescription className="text-sm leading-relaxed text-neutral-600">
            {texto.descricao}
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
