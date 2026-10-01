"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface FiltroArquivadosProps {
  id: string;
  marcado: boolean;
  aoAlterar: (marcado: boolean) => void;
  totalOcultos: number;
}

export function FiltroArquivados({ id, marcado, aoAlterar, totalOcultos }: FiltroArquivadosProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={marcado} onCheckedChange={aoAlterar} />
      <Label htmlFor={id} className="font-normal">
        Mostrar arquivados{!marcado && totalOcultos > 0 ? ` (${totalOcultos} ocultos)` : ""}
      </Label>
    </div>
  );
}
