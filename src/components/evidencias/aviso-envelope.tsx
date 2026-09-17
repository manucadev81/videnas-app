"use client";

import { Lock } from "lucide-react";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { AVISO_SIMULACAO_ENVELOPE } from "@/lib/evidencias/cripto";
import { cn } from "@/lib/utils";

export function AvisoEnvelope({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600",
        className
      )}
    >
      <Lock className="mt-0.5 size-4 shrink-0 text-neutral-500" aria-hidden="true" />
      <div className="min-w-0 leading-relaxed">
        <p className="flex items-center gap-1.5 font-medium text-neutral-700">
          Ressalva sobre o envelope cifrado
          <BadgeAjuda chave="evidencia.envelope" tamanho="xs" side="top" />
        </p>
        <p className="mt-1">{AVISO_SIMULACAO_ENVELOPE}</p>
      </div>
    </div>
  );
}
