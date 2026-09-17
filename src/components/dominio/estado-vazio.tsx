import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EstadoVazioProps {
  titulo: string;
  mensagem: string;
  icone?: LucideIcon;
  rotuloAcao?: string;
  aoAcionar?: () => void;
  className?: string;
}

export function EstadoVazio({
  titulo,
  mensagem,
  icone: Icone = Inbox,
  rotuloAcao,
  aoAcionar,
  className,
}: EstadoVazioProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-4 py-16 text-center", className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-neutral-100">
        <Icone className="size-7 text-neutral-400" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-neutral-700">{titulo}</h3>
      <p className="mb-6 max-w-sm text-sm text-neutral-500">{mensagem}</p>
      {rotuloAcao && aoAcionar ? (
        <Button type="button" onClick={aoAcionar}>
          {rotuloAcao}
        </Button>
      ) : null}
    </div>
  );
}
