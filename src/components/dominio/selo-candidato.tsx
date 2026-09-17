import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface SeloCandidatoProps {
  tamanho?: "sm" | "md";
  className?: string;
}

export function SeloCandidato({ tamanho = "md", className }: SeloCandidatoProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(
                "status-badge status-badge-candidate cursor-help",
                tamanho === "sm" && "px-2 py-1 text-xs",
                className
              )}
            />
          }
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          Candidato
        </TooltipTrigger>
        <TooltipContent>
          Funcionalidade candidata, sujeita a decisão de produto. A Sentinellus estrutura a DPS; a
          emissão da NFS-e ocorre fora da plataforma.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
