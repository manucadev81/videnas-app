"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "@/components/tutorial/tour-provider";
import type { PosicaoTour } from "@/components/tutorial/roteiros";
import { cn } from "@/lib/utils";

interface RetanguloAlvo {
  top: number;
  left: number;
  width: number;
  height: number;
}

const MARGEM_SPOTLIGHT = 8;
const TENTATIVAS_MAXIMAS = 30;
const INTERVALO_TENTATIVA_MS = 100;
const LARGURA_CARD_PADRAO = 360;
const MARGEM_TELA = 16;
const GAP_CARD = 12;
const ALTURA_ESTIMADA_CARD = 220;
const LARGURA_MINIMA_LADO_A_LADO = 640;

function clamp(valor: number, minimo: number, maximo: number): number {
  if (maximo < minimo) return minimo;
  return Math.min(Math.max(valor, minimo), maximo);
}

function buscarElementoVisivel(seletor: string): HTMLElement | null {
  const candidatos = document.querySelectorAll<HTMLElement>(seletor);
  for (const candidato of candidatos) {
    if (candidato.offsetParent !== null || candidato.getClientRects().length > 0) {
      return candidato;
    }
  }
  return candidatos[0] ?? null;
}

function prefereMovimentoReduzidoInicial(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefereMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = useState<boolean>(prefereMovimentoReduzidoInicial);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    function aoMudar(evento: MediaQueryListEvent) {
      setReduzido(evento.matches);
    }
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  return reduzido;
}

function calcularEstiloCard(
  retangulo: RetanguloAlvo | null,
  posicaoPreferida: PosicaoTour
): { estilo: CSSProperties; modoFolha: boolean } {
  if (typeof window === "undefined") {
    return { estilo: {}, modoFolha: false };
  }

  const larguraJanela = window.innerWidth;
  const alturaJanela = window.innerHeight;
  const larguraCard = Math.min(LARGURA_CARD_PADRAO, larguraJanela - MARGEM_TELA * 2);

  if (larguraJanela < LARGURA_MINIMA_LADO_A_LADO) {
    return { estilo: {}, modoFolha: true };
  }

  if (!retangulo) {
    return {
      estilo: { top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: larguraCard },
      modoFolha: false,
    };
  }

  const espacoAbaixo = alturaJanela - (retangulo.top + retangulo.height);
  const espacoAcima = retangulo.top;
  const espacoDireita = larguraJanela - (retangulo.left + retangulo.width);
  const espacoEsquerda = retangulo.left;

  const cabe = {
    bottom: espacoAbaixo >= ALTURA_ESTIMADA_CARD,
    top: espacoAcima >= ALTURA_ESTIMADA_CARD,
    right: espacoDireita >= larguraCard + GAP_CARD,
    left: espacoEsquerda >= larguraCard + GAP_CARD,
  } as const;

  let posicaoFinal: keyof typeof cabe =
    posicaoPreferida === "auto" ? "bottom" : (posicaoPreferida as keyof typeof cabe);

  if (!cabe[posicaoFinal]) {
    const ordemPreferencia: (keyof typeof cabe)[] = ["bottom", "top", "right", "left"];
    posicaoFinal = ordemPreferencia.find((posicao) => cabe[posicao]) ?? "bottom";
  }

  if (posicaoFinal === "bottom") {
    return {
      estilo: {
        top: retangulo.top + retangulo.height + GAP_CARD,
        left: clamp(retangulo.left + retangulo.width / 2 - larguraCard / 2, MARGEM_TELA, larguraJanela - larguraCard - MARGEM_TELA),
        width: larguraCard,
      },
      modoFolha: false,
    };
  }

  if (posicaoFinal === "top") {
    return {
      estilo: {
        bottom: alturaJanela - retangulo.top + GAP_CARD,
        left: clamp(retangulo.left + retangulo.width / 2 - larguraCard / 2, MARGEM_TELA, larguraJanela - larguraCard - MARGEM_TELA),
        width: larguraCard,
      },
      modoFolha: false,
    };
  }

  if (posicaoFinal === "right") {
    return {
      estilo: {
        left: retangulo.left + retangulo.width + GAP_CARD,
        top: clamp(retangulo.top + retangulo.height / 2 - ALTURA_ESTIMADA_CARD / 2, MARGEM_TELA, alturaJanela - ALTURA_ESTIMADA_CARD - MARGEM_TELA),
        width: larguraCard,
      },
      modoFolha: false,
    };
  }

  return {
    estilo: {
      right: larguraJanela - retangulo.left + GAP_CARD,
      top: clamp(retangulo.top + retangulo.height / 2 - ALTURA_ESTIMADA_CARD / 2, MARGEM_TELA, alturaJanela - ALTURA_ESTIMADA_CARD - MARGEM_TELA),
      width: larguraCard,
    },
    modoFolha: false,
  };
}

function SpotlightFundo({
  retangulo,
  reduzirMovimento,
}: {
  retangulo: RetanguloAlvo;
  reduzirMovimento: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[100]" />
      <div
        aria-hidden="true"
        className={cn("fixed z-[101] rounded-lg", !reduzirMovimento && "transition-all duration-300 ease-out")}
        style={{
          top: retangulo.top - MARGEM_SPOTLIGHT,
          left: retangulo.left - MARGEM_SPOTLIGHT,
          width: retangulo.width + MARGEM_SPOTLIGHT * 2,
          height: retangulo.height + MARGEM_SPOTLIGHT * 2,
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

interface CardTourProps {
  retangulo: RetanguloAlvo | null;
  posicaoPreferida: PosicaoTour;
  titulo: string;
  descricao: string;
  indiceAtual: number;
  totalPassos: number;
  tituloId: string;
  descricaoId: string;
  onProximo: () => void;
  onAnterior: () => void;
  onEncerrar: () => void;
}

const CardTour = forwardRef<HTMLDivElement, CardTourProps>(function CardTour(
  {
    retangulo,
    posicaoPreferida,
    titulo,
    descricao,
    indiceAtual,
    totalPassos,
    tituloId,
    descricaoId,
    onProximo,
    onAnterior,
    onEncerrar,
  },
  ref
) {
  const { estilo, modoFolha } = calcularEstiloCard(retangulo, posicaoPreferida);
  const ehPrimeiro = indiceAtual === 0;
  const ehUltimo = indiceAtual === totalPassos - 1;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      aria-describedby={descricaoId}
      tabIndex={-1}
      className={cn(
        "fixed z-[102] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-xl outline-none",
        modoFolha &&
          "inset-x-0 bottom-0 w-full max-w-full max-h-[75vh] overflow-y-auto rounded-b-none border-b-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      )}
      style={modoFolha ? undefined : estilo}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-brand-700">
          Passo {indiceAtual + 1} de {totalPassos}
        </p>
        <button
          type="button"
          onClick={onEncerrar}
          aria-label="Fechar tutorial"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <h2 id={tituloId} className="font-display text-lg font-bold text-neutral-700">
        {titulo}
      </h2>
      <p id={descricaoId} className="text-sm leading-relaxed text-neutral-600">
        {descricao}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={onEncerrar} className="min-h-11">
          Pular tutorial
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onAnterior} disabled={ehPrimeiro} className="min-h-11">
            Voltar
          </Button>
          <Button type="button" size="sm" onClick={onProximo} className="min-h-11">
            {ehUltimo ? "Concluir" : "Próximo"}
          </Button>
        </div>
      </div>
    </div>
  );
});

export function TourOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const { ativo, passoAtual, indiceAtual, totalPassos, proximo, anterior, encerrar } = useTour();

  const [retangulo, setRetangulo] = useState<RetanguloAlvo | null>(null);
  const [pronto, setPronto] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const descricaoId = useId();
  const reduzirMovimento = usePrefereMovimentoReduzido();

  const precisaNavegar = Boolean(passoAtual?.rota && passoAtual.rota !== pathname);

  useEffect(() => {
    if (!ativo || !passoAtual) return;
    if (passoAtual.rota && passoAtual.rota !== pathname) {
      router.push(passoAtual.rota);
    }
  }, [ativo, passoAtual, pathname, router]);

  useEffect(() => {
    if (!ativo || !passoAtual || precisaNavegar) {
      queueMicrotask(() => {
        setRetangulo(null);
        setPronto(false);
      });
      return;
    }

    let cancelado = false;
    let tentativas = 0;
    queueMicrotask(() => {
      if (!cancelado) setPronto(false);
    });

    function medir() {
      if (cancelado || !passoAtual) return;
      const alvo = buscarElementoVisivel(passoAtual.seletor);
      if (!alvo) {
        tentativas += 1;
        if (tentativas > TENTATIVAS_MAXIMAS) {
          proximo();
          return;
        }
        setTimeout(medir, INTERVALO_TENTATIVA_MS);
        return;
      }
      alvo.scrollIntoView({ block: "center", behavior: reduzirMovimento ? "auto" : "smooth" });
      requestAnimationFrame(() => {
        if (cancelado) return;
        const rect = alvo.getBoundingClientRect();
        setRetangulo({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        setPronto(true);
      });
    }

    if (passoAtual.acaoSugerida) {
      const gatilho = buscarElementoVisivel(passoAtual.acaoSugerida.seletor);
      gatilho?.click();
      setTimeout(medir, 120);
    } else {
      medir();
    }

    return () => {
      cancelado = true;
    };
  }, [ativo, passoAtual, precisaNavegar, reduzirMovimento, proximo]);

  useEffect(() => {
    if (!pronto || !passoAtual) return;
    function recalcular() {
      if (!passoAtual) return;
      const alvo = buscarElementoVisivel(passoAtual.seletor);
      if (!alvo) return;
      const rect = alvo.getBoundingClientRect();
      setRetangulo({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }
    window.addEventListener("resize", recalcular);
    window.addEventListener("scroll", recalcular, true);
    return () => {
      window.removeEventListener("resize", recalcular);
      window.removeEventListener("scroll", recalcular, true);
    };
  }, [pronto, passoAtual]);

  useEffect(() => {
    if (!ativo || !pronto) return;
    const quadro = requestAnimationFrame(() => cardRef.current?.focus());
    return () => cancelAnimationFrame(quadro);
  }, [ativo, pronto, indiceAtual]);

  useEffect(() => {
    if (!ativo) return;

    function aoTeclar(evento: KeyboardEvent) {
      const focoNoBotaoDoCard =
        cardRef.current?.contains(document.activeElement) &&
        (document.activeElement as HTMLElement | null)?.tagName === "BUTTON";

      if (evento.key === "Escape") {
        evento.preventDefault();
        encerrar();
        return;
      }

      if ((evento.key === "ArrowRight" || evento.key === "Enter") && !(evento.key === "Enter" && focoNoBotaoDoCard)) {
        evento.preventDefault();
        proximo();
        return;
      }

      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        anterior();
        return;
      }

      if (evento.key === "Tab" && cardRef.current) {
        const focaveis = cardRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focaveis.length === 0) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (evento.shiftKey && document.activeElement === primeiro) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primeiro.focus();
        }
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [ativo, proximo, anterior, encerrar]);

  if (!ativo || !passoAtual) {
    return null;
  }

  return (
    <div className="fixed inset-0">
      {pronto && retangulo ? (
        <SpotlightFundo retangulo={retangulo} reduzirMovimento={reduzirMovimento} />
      ) : (
        <div className="fixed inset-0 z-[100] bg-neutral-900/60" />
      )}

      <CardTour
        ref={cardRef}
        retangulo={pronto ? retangulo : null}
        posicaoPreferida={passoAtual.posicao ?? "auto"}
        titulo={passoAtual.titulo}
        descricao={passoAtual.descricao}
        indiceAtual={indiceAtual}
        totalPassos={totalPassos}
        tituloId={tituloId}
        descricaoId={descricaoId}
        onProximo={proximo}
        onAnterior={anterior}
        onEncerrar={encerrar}
      />
    </div>
  );
}
