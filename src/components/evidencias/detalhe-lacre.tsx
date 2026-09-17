"use client";

import { useState, type ReactNode } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { AvisoEnvelope } from "@/components/evidencias/aviso-envelope";
import { BadgeSentido } from "@/components/evidencias/badge-sentido";
import { LinhaDoTempoCadeia } from "@/components/evidencias/linha-do-tempo-cadeia";
import { ValorHash } from "@/components/evidencias/valor-hash";
import { VerificadorIntegridade } from "@/components/evidencias/verificador-integridade";
import {
  baixarComprovante,
  contextoComprovanteDoLacre,
} from "@/components/evidencias/comprovante";
import { filtrarCadeia } from "@/lib/evidencias/lacre";
import { useEvidenciasStore } from "@/lib/store/evidencias";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarInsumo } from "@/lib/fornecimento";
import { buscarPerfil } from "@/lib/permissoes";
import {
  formatarCompetencia,
  formatarDataHora,
  formatarTamanhoArquivo,
} from "@/lib/formatadores";
import type { RegistroLacre } from "@/lib/tipos";

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-neutral-500">{rotulo}</dt>
      <dd className="mt-0.5 text-sm break-words text-neutral-700">{children}</dd>
    </div>
  );
}

export interface DetalheLacreProps {
  lacre: RegistroLacre | null;
  aoFechar: () => void;
  podeBaixarComprovante?: boolean;
}

export function DetalheLacre({
  lacre: lacreSelecionado,
  aoFechar,
  podeBaixarComprovante = true,
}: DetalheLacreProps) {
  const lacres = useEvidenciasStore((estado) => estado.lacres);
  const [ultimoExibido, setUltimoExibido] = useState<RegistroLacre | null>(lacreSelecionado);

  if (lacreSelecionado && lacreSelecionado !== ultimoExibido) {
    setUltimoExibido(lacreSelecionado);
  }

  const lacre = lacreSelecionado ?? ultimoExibido;

  const cadeia = lacre
    ? filtrarCadeia(Object.values(lacres), {
        instituicaoId: lacre.instituicaoId,
        moduloId: lacre.moduloId,
        competencia: lacre.competencia,
        insumoId: lacre.insumoId,
      })
    : [];

  const instituicao = lacre ? buscarInstituicao(lacre.instituicaoId) : undefined;
  const modulo = lacre ? buscarModulo(lacre.moduloId) : undefined;
  const insumo = lacre?.insumoId ? buscarInsumo(lacre.insumoId) : undefined;

  function baixar() {
    if (!lacre) {
      return;
    }
    try {
      baixarComprovante(lacre, contextoComprovanteDoLacre(lacre));
      toast.success("Comprovante gerado e baixado.");
    } catch {
      toast.error("Não foi possível gerar o comprovante deste lacre.");
    }
  }

  return (
    <Sheet
      open={lacreSelecionado !== null}
      onOpenChange={(aberto) => {
        if (!aberto) {
          aoFechar();
        }
      }}
    >
      <SheetContent
        side="right"
        data-tour="evidencias-detalhe"
        className="w-full overflow-y-auto sm:max-w-xl data-[side=right]:sm:max-w-xl"
      >
        {lacre ? (
          <>
            <SheetHeader className="pb-0">
              <SheetTitle className="font-display text-lg font-bold text-neutral-700">
                Lacre {lacre.id}
              </SheetTitle>
              <SheetDescription>
                {modulo?.nome} · {formatarCompetencia(lacre.competencia)} ·{" "}
                {instituicao?.nomeFantasia ?? lacre.instituicaoId}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <BadgeSentido sentido={lacre.sentido} />
                <BadgeAjuda chave="evidencia.lacre" tamanho="xs" side="bottom" />
              </div>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Origem">{lacre.origemNome}</Campo>
                <Campo rotulo="Tamanho">{formatarTamanhoArquivo(lacre.tamanhoBytes)}</Campo>
                <Campo rotulo="Selado em">{formatarDataHora(lacre.seladoEm)}</Campo>
                <Campo rotulo="Selado por">
                  {lacre.seladoPorNome} · {buscarPerfil(lacre.perfilId).rotulo}
                </Campo>
                <Campo rotulo="Identificador do período">
                  <span className="font-mono text-xs">{lacre.periodoId}</span>
                </Campo>
                <Campo rotulo="Insumo">
                  {insumo?.rotulo ?? (lacre.insumoId ? lacre.insumoId : "Arquivo consolidado da obrigação")}
                </Campo>
              </dl>

              <section className="space-y-2">
                <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-neutral-700">
                  Impressão digital do conteúdo
                  <BadgeAjuda chave="evidencia.hash" tamanho="xs" side="top" />
                </h3>
                <div>
                  <p className="text-xs font-medium text-neutral-500">
                    Hash {lacre.algoritmoHash}
                  </p>
                  <ValorHash hash={lacre.hashSha256} className="mt-1" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Hash do lacre anterior</p>
                  {lacre.hashAnterior ? (
                    <ValorHash
                      hash={lacre.hashAnterior}
                      descricao="hash do lacre anterior"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-neutral-600">
                      Primeiro lacre desta cadeia — não há elo anterior.
                    </p>
                  )}
                </div>
              </section>

              <LinhaDoTempoCadeia cadeia={cadeia} lacreDestacadoId={lacre.id} />

              <section className="space-y-3">
                <h3 className="font-display text-base font-bold text-neutral-700">
                  Envelope cifrado
                </h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Campo rotulo="Identificador da chave">
                    <span className="font-mono text-xs">{lacre.identificadorChave}</span>
                  </Campo>
                  <Campo rotulo="Vetor de inicialização">
                    <span className="font-mono text-xs">{lacre.vetorInicializacao}</span>
                  </Campo>
                </dl>
                <div>
                  <p className="text-xs font-medium text-neutral-500">
                    Trecho do envelope cifrado
                  </p>
                  <code className="mt-1 block rounded-md bg-neutral-50 p-3 font-mono text-xs break-all text-neutral-600">
                    {lacre.envelopeCifrado.slice(0, 96)}
                    {lacre.envelopeCifrado.length > 96 ? "…" : ""}
                  </code>
                </div>
                <AvisoEnvelope />
              </section>

              <section className="space-y-2">
                <h3 className="font-display text-base font-bold text-neutral-700">
                  Resumo do conteúdo lacrado
                </h3>
                <p className="rounded-md bg-neutral-50 p-3 font-mono text-xs break-words text-neutral-600">
                  {lacre.resumoConteudo}
                </p>
              </section>

              <VerificadorIntegridade key={lacre.id} lacre={lacre} dataTour="evidencias-verificar" />

              {podeBaixarComprovante ? (
                <Button type="button" variant="outline" className="w-full" onClick={baixar}>
                  <Download aria-hidden="true" />
                  Baixar comprovante do lacre
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
