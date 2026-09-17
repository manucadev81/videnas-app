"use client";

import { toast } from "sonner";
import { Copy, Download, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { baixarArquivoEntregue } from "@/components/evidencias/arquivo-entregue";
import { lacreDeSaidaDoArquivo, useEvidenciasStore } from "@/lib/store/evidencias";
import { usePeriodosStore } from "@/lib/store/periodos";
import type { ArquivoGerado } from "@/lib/tipos";
import { formatarDataHora, formatarTamanhoArquivo, truncarHash } from "@/lib/formatadores";

export interface PainelArquivoProps {
  arquivo: ArquivoGerado;
  competenciaRotulo?: string;
  className?: string;
}

export function PainelArquivo({ arquivo, competenciaRotulo, className }: PainelArquivoProps) {
  const periodo = usePeriodosStore((estado) => estado.periodos[arquivo.periodoId]);
  const lacres = useEvidenciasStore((estado) => estado.lacres);

  const lacreDeSaida = lacreDeSaidaDoArquivo(lacres, arquivo.id);
  const hashExibido = lacreDeSaida?.hashSha256 ?? arquivo.hashSha256;
  const tamanhoExibido = lacreDeSaida
    ? formatarTamanhoArquivo(lacreDeSaida.tamanhoBytes)
    : arquivo.tamanhoLegivel;

  async function copiarHash() {
    try {
      await navigator.clipboard.writeText(hashExibido);
      toast.success("Hash copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o hash.");
    }
  }

  function baixarArquivo() {
    if (!periodo) {
      toast.error("Não foi possível localizar a competência deste arquivo para montar o download.");
      return;
    }

    try {
      baixarArquivoEntregue(arquivo, periodo);
      toast.success(`${arquivo.nomeArquivo} baixado.`);
    } catch {
      toast.error("Não foi possível gerar o arquivo para download.");
    }
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
          <p className="text-xs font-medium text-neutral-500">
            {lacreDeSaida ? "Hash SHA-256 do lacre de entrega" : "Hash SHA-256 do arquivo gerado"}
          </p>
          <div className="mt-1 flex gap-2">
            <code className="flex-1 truncate rounded-md bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-600">
              {truncarHash(hashExibido)}
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
          {lacreDeSaida ? (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-neutral-500">
              <ShieldCheck className="mt-px size-3.5 shrink-0 text-brand-700" aria-hidden="true" />
              <span>
                Este é o hash calculado sobre o conteúdo entregue e registrado no lacre{" "}
                <span className="font-mono">{lacreDeSaida.id}</span>. É o mesmo valor mostrado na
                prova de entrega e o único usado na verificação de integridade.
              </span>
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-neutral-500">Tamanho</p>
            <p className="text-sm text-neutral-700">{tamanhoExibido}</p>
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

      <Button type="button" className="w-full" onClick={baixarArquivo} disabled={!periodo}>
        <Download className="size-4" aria-hidden="true" />
        Baixar arquivo
      </Button>
    </div>
  );
}
