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
  emissaoIncluida?: boolean;
}

function textoDoSelo(emissaoIncluida: boolean | undefined): string {
  if (emissaoIncluida === true) {
    return "Funcionalidade candidata, sujeita a decisão de produto. A Videnas estrutura a DPS e, como a emissão está incluída no contrato desta instituição, emite o documento fiscal depois da aprovação.";
  }
  if (emissaoIncluida === false) {
    return "Funcionalidade candidata, sujeita a decisão de produto. A Videnas estrutura a DPS; a emissão da NFS-e não está no contrato desta instituição e a DPS é encaminhada ao emissor definido por ela.";
  }
  return "Funcionalidade candidata, sujeita a decisão de produto. A Videnas estrutura a DPS; a emissão da NFS-e depende do contrato de cada instituição.";
}

export function SeloCandidato({ tamanho = "md", className, emissaoIncluida }: SeloCandidatoProps) {
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
          {textoDoSelo(emissaoIncluida)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
