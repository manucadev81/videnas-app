"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { truncarHash } from "@/lib/formatadores";
import { cn } from "@/lib/utils";

export interface ValorHashProps {
  hash: string;
  descricao?: string;
  truncado?: boolean;
  className?: string;
}

export function ValorHash({
  hash,
  descricao = "hash SHA-256",
  truncado = false,
  className,
}: ValorHashProps) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success("Hash copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o hash.");
    }
  }

  return (
    <span className={cn("inline-flex max-w-full items-center gap-1", className)}>
      <code
        title={hash}
        className="min-w-0 rounded-md bg-neutral-50 px-2 py-1 font-mono text-xs break-all text-neutral-600"
      >
        {truncado ? truncarHash(hash, 10, 10) : hash}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={copiar}
        aria-label={`Copiar ${descricao} completo`}
      >
        <Copy aria-hidden="true" />
      </Button>
    </span>
  );
}
