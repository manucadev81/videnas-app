"use client";

import { UploadCloud } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { buscarModulo } from "@/lib/mock/modulos";
import type { ModuloId } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export interface ItemModuloContratadoProps {
  moduloId: ModuloId;
  checked: boolean;
  onCheckedChange: (valor: boolean) => void;
  titulo?: string;
  descricao?: string;
  idPrefixo?: string;
  invalido?: boolean;
}

export function ItemModuloContratado({
  moduloId,
  checked,
  onCheckedChange,
  titulo,
  descricao,
  idPrefixo = "modulo-contratado",
  invalido,
}: ItemModuloContratadoProps) {
  const modulo = buscarModulo(moduloId);
  const id = `${idPrefixo}-${moduloId}`;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors",
        checked ? "border-brand-700 bg-brand-50" : "border-neutral-200 bg-white"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <UploadCloud className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
        <div className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <Label htmlFor={id} className="cursor-pointer text-sm font-bold text-neutral-700">
              {titulo ?? modulo.nome}
            </Label>
            {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
          </span>
          <p className="mt-0.5 text-xs text-neutral-500">{descricao ?? modulo.descricaoCurta}</p>
        </div>
      </div>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(valor) => onCheckedChange(valor === true)}
        aria-invalid={invalido ? true : undefined}
        className="mt-0.5"
      />
    </div>
  );
}
