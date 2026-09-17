"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Download, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { ROTULOS_SENTIDO_LACRE, montarComprovante } from "@/lib/evidencias/lacre";
import { AVISO_SIMULACAO_ENVELOPE } from "@/lib/evidencias/cripto";
import { formatarDataHora, formatarTamanhoArquivo } from "@/lib/formatadores";
import { buscarPerfil } from "@/lib/permissoes";
import type { RegistroLacre } from "@/lib/tipos";

export interface ContextoComprovanteEnvio {
  instituicaoNome: string;
  instituicaoCnpj?: string;
  moduloNome: string;
  competenciaRotulo: string;
  insumoRotulo?: string | null;
}

export interface ComprovanteEnvioProps {
  lacre: RegistroLacre | null;
  contexto: ContextoComprovanteEnvio;
  aberto: boolean;
  aoAlterarAbertura: (aberto: boolean) => void;
}

function LinhaComprovante({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-neutral-100 py-2 last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs text-neutral-500">{rotulo}</dt>
      <dd className="text-sm break-words text-neutral-700">{valor}</dd>
    </div>
  );
}

export function ComprovanteEnvio({
  lacre,
  contexto,
  aberto,
  aoAlterarAbertura,
}: ComprovanteEnvioProps) {
  const [lacreCopiadoId, setLacreCopiadoId] = useState<string | null>(null);
  const copiado = lacreCopiadoId !== null && lacreCopiadoId === lacre?.id;

  useEffect(() => {
    if (lacreCopiadoId === null) {
      return;
    }
    const temporizador = setTimeout(() => setLacreCopiadoId(null), 2400);
    return () => clearTimeout(temporizador);
  }, [lacreCopiadoId]);

  async function copiarHash() {
    if (!lacre) {
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Área de transferência indisponível.");
      }
      await navigator.clipboard.writeText(lacre.hashSha256);
      setLacreCopiadoId(lacre.id);
      toast.success("Hash SHA-256 copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o hash neste navegador. Selecione o texto manualmente.");
    }
  }

  function baixarComprovante() {
    if (!lacre) {
      return;
    }
    const comprovante = montarComprovante(lacre, {
      instituicaoNome: contexto.instituicaoNome,
      instituicaoCnpj: contexto.instituicaoCnpj,
      moduloNome: contexto.moduloNome,
      competenciaRotulo: contexto.competenciaRotulo,
      insumoRotulo: contexto.insumoRotulo ?? null,
    });

    const blob = new Blob([comprovante.conteudo], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = comprovante.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Comprovante baixado. Guarde o arquivo junto da sua documentação de compliance.");
  }

  return (
    <Sheet open={aberto} onOpenChange={aoAlterarAbertura}>
      <SheetContent
        side="right"
        data-tour="fornecimento-comprovante"
        className="w-full overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader className="gap-1.5 border-b border-neutral-200 p-5">
          <SheetTitle className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
            Comprovante de envio
            <BadgeAjuda chave="evidencia.comprovanteEnvio" tamanho="sm" align="end" />
          </SheetTitle>
          <SheetDescription>
            Registro do que foi recebido pela Videnas, com a impressão digital do conteúdo enviado.
          </SheetDescription>
        </SheetHeader>

        {lacre ? (
          <div className="space-y-5 px-5 pb-2">
            <div className="flex items-start gap-3 rounded-lg border border-status-success-border bg-status-success-bg p-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-status-success-text" aria-hidden="true" />
              <p className="text-sm text-status-success-text">
                Conteúdo lacrado e cifrado no momento do envio. A partir daqui ele não pode ser
                alterado: qualquer correção entra como uma nova versão encadeada a esta.
              </p>
            </div>

            <section aria-labelledby="comprovante-integridade">
              <h3
                id="comprovante-integridade"
                className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-neutral-700"
              >
                Impressão digital do conteúdo
                <BadgeAjuda chave="evidencia.hash" tamanho="xs" align="end" />
              </h3>
              <p className="mb-2 text-xs text-neutral-500">
                {lacre.algoritmoHash} — recalcule o hash do arquivo original e compare com o valor
                abaixo para provar que nada mudou.
              </p>
              <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs break-all text-neutral-700">
                {lacre.hashSha256}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void copiarHash()}
              >
                {copiado ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
                {copiado ? "Hash copiado" : "Copiar hash completo"}
              </Button>
            </section>

            <section aria-labelledby="comprovante-dados">
              <h3 id="comprovante-dados" className="mb-1 text-sm font-semibold text-neutral-700">
                Dados do registro
              </h3>
              <dl className="rounded-lg border border-neutral-200 px-4 py-1">
                <LinhaComprovante rotulo="Identificador do lacre" valor={lacre.id} />
                <LinhaComprovante rotulo="Sentido" valor={ROTULOS_SENTIDO_LACRE[lacre.sentido]} />
                <LinhaComprovante rotulo="Data e hora" valor={formatarDataHora(lacre.seladoEm)} />
                <LinhaComprovante
                  rotulo="Enviado por"
                  valor={`${lacre.seladoPorNome} · ${buscarPerfil(lacre.perfilId).rotuloCompleto}`}
                />
                <LinhaComprovante rotulo="Instituição" valor={contexto.instituicaoNome} />
                <LinhaComprovante rotulo="Obrigação" valor={contexto.moduloNome} />
                <LinhaComprovante rotulo="Competência" valor={contexto.competenciaRotulo} />
                <LinhaComprovante rotulo="Insumo" valor={contexto.insumoRotulo ?? "Não informado"} />
                <LinhaComprovante rotulo="Origem" valor={lacre.origemNome} />
                <LinhaComprovante
                  rotulo="Tamanho"
                  valor={formatarTamanhoArquivo(lacre.tamanhoBytes)}
                />
                <LinhaComprovante
                  rotulo="Encadeado após"
                  valor={lacre.hashAnterior ?? "Primeiro lacre desta cadeia"}
                />
              </dl>
            </section>

            <section
              aria-labelledby="comprovante-envelope"
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
            >
              <h3
                id="comprovante-envelope"
                className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-neutral-700"
              >
                Ressalva sobre o envelope cifrado
                <BadgeAjuda chave="evidencia.envelope" tamanho="xs" align="end" />
              </h3>
              <p className="text-xs leading-relaxed text-neutral-500">{AVISO_SIMULACAO_ENVELOPE}</p>
              <p className="mt-2 font-mono text-xs break-all text-neutral-500">
                Chave: {lacre.identificadorChave}
              </p>
            </section>
          </div>
        ) : (
          <p className="px-5 text-sm text-neutral-500">
            Nenhum envio selecionado. Escolha um insumo já fornecido para ver o comprovante.
          </p>
        )}

        <SheetFooter className="border-t border-neutral-200 p-5">
          <Button type="button" disabled={!lacre} onClick={baixarComprovante}>
            <Download className="size-4" aria-hidden="true" />
            Baixar comprovante (JSON)
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
