"use client";

import { toast } from "sonner";
import { Copy, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ArquivoGerado } from "@/lib/tipos";
import { formatarDataHora, truncarHash } from "@/lib/formatadores";

export interface PainelArquivoProps {
  arquivo: ArquivoGerado;
  competenciaRotulo?: string;
  className?: string;
}

export function PainelArquivo({ arquivo, competenciaRotulo, className }: PainelArquivoProps) {
  async function copiarHash() {
    try {
      await navigator.clipboard.writeText(arquivo.hashSha256);
      toast.success("Hash copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o hash.");
    }
  }

  function baixarArquivo() {
    toast.info("Download simulado. Nenhum arquivo real é gerado nesta demonstração.");
  }

  return (
    <div className={`rounded-lg border border-neutral-200 bg-white p-6 space-y-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <FileText className="size-5 text-brand-700" aria-hidden="true" />
        <div>
          <h5 className="font-bold text-neutral-700">Arquivo gerado</h5>
          {competenciaRotulo ? (
            <p className="text-sm text-neutral-500">Período: {competenciaRotulo}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-neutral-500">Nome</p>
          <p className="text-sm font-medium text-neutral-700 break-all">{arquivo.nomeArquivo}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-500">Hash SHA-256</p>
          <div className="mt-1 flex gap-2">
            <code className="flex-1 truncate rounded-md bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-600">
              {truncarHash(arquivo.hashSha256)}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copiarHash}
              aria-label="Copiar hash SHA-256 completo"
            >
              <Copy className="size-3.5" aria-hidden="true" />
              Copiar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-neutral-500">Tamanho</p>
            <p className="text-sm text-neutral-700">{arquivo.tamanhoLegivel}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500">Schema</p>
            <p className="text-sm text-neutral-700">
              {arquivo.schema} v{arquivo.versaoSchema}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-500">Gerado em</p>
          <p className="text-sm text-neutral-700">{formatarDataHora(arquivo.geradoEm)}</p>
        </div>
      </div>

      <Button type="button" className="w-full" onClick={baixarArquivo}>
        <Download className="size-4" aria-hidden="true" />
        Baixar arquivo
      </Button>
    </div>
  );
}
