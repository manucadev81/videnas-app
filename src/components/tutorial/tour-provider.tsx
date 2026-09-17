"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import type { PerfilId } from "@/lib/tipos";
import { buscarPerfil } from "@/lib/permissoes";
import { useSessaoStore } from "@/lib/store/sessao";
import { ROTEIROS, type PassoTour } from "@/components/tutorial/roteiros";

const CHAVE_STORAGE_TOUR = "sentinellus-tutorial-visto";

function lerPerfisVistos(): Partial<Record<PerfilId, boolean>> {
  try {
    const bruto = sessionStorage.getItem(CHAVE_STORAGE_TOUR);
    return bruto ? (JSON.parse(bruto) as Partial<Record<PerfilId, boolean>>) : {};
  } catch {
    return {};
  }
}

function marcarPerfilVisto(perfilId: PerfilId) {
  try {
    const atual = lerPerfisVistos();
    atual[perfilId] = true;
    sessionStorage.setItem(CHAVE_STORAGE_TOUR, JSON.stringify(atual));
  } catch {
  }
}

export interface EstadoTour {
  ativo: boolean;
  perfilId: PerfilId | null;
  passos: PassoTour[];
  indiceAtual: number;
  passoAtual: PassoTour | null;
  totalPassos: number;
  iniciar: (perfilId: PerfilId) => void;
  proximo: () => void;
  anterior: () => void;
  encerrar: () => void;
  pularPasso: () => void;
}

const ContextoTour = createContext<EstadoTour | null>(null);

const PASSOS_VAZIOS: PassoTour[] = [];

export function useTour(): EstadoTour {
  const contexto = useContext(ContextoTour);
  if (!contexto) {
    throw new Error("useTour precisa ser usado dentro de um TourProvider.");
  }
  return contexto;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const perfilSessao = useSessaoStore((estado) => estado.perfilAtivo);

  const [perfilTour, setPerfilTour] = useState<PerfilId | null>(null);
  const [indiceAtual, setIndiceAtual] = useState(0);

  const perfilAnteriorRef = useRef<PerfilId | null>(null);
  const perfisOferecidosRef = useRef<Set<PerfilId>>(new Set());
  const elementoFocoAnteriorRef = useRef<HTMLElement | null>(null);

  const passos = perfilTour ? ROTEIROS[perfilTour] : PASSOS_VAZIOS;

  const iniciar = useCallback((perfilId: PerfilId) => {
    if (typeof document !== "undefined") {
      elementoFocoAnteriorRef.current = document.activeElement as HTMLElement | null;
    }
    setPerfilTour(perfilId);
    setIndiceAtual(0);
  }, []);

  const encerrar = useCallback(() => {
    setPerfilTour((perfilAtual) => {
      if (perfilAtual) {
        marcarPerfilVisto(perfilAtual);
      }
      return null;
    });
    setIndiceAtual(0);
    const elementoParaFocar = elementoFocoAnteriorRef.current;
    if (elementoParaFocar && typeof elementoParaFocar.focus === "function") {
      requestAnimationFrame(() => elementoParaFocar.focus());
    }
    elementoFocoAnteriorRef.current = null;
  }, []);

  const proximo = useCallback(() => {
    setIndiceAtual((atual) => {
      const proximoIndice = atual + 1;
      if (proximoIndice >= passos.length) {
        queueMicrotask(() => encerrar());
        return atual;
      }
      return proximoIndice;
    });
  }, [passos.length, encerrar]);

  const pularPasso = proximo;

  const anterior = useCallback(() => {
    setIndiceAtual((atual) => Math.max(0, atual - 1));
  }, []);

  useEffect(() => {
    if (!perfilSessao) {
      perfilAnteriorRef.current = null;
      return;
    }

    const primeiraVezNaSessao = perfilAnteriorRef.current === null;
    const trocouPerfil = !primeiraVezNaSessao && perfilAnteriorRef.current !== perfilSessao;
    perfilAnteriorRef.current = perfilSessao;

    if (trocouPerfil) {
      const vistos = lerPerfisVistos();
      const perfilParaOferecer = perfilSessao;
      const rotuloPerfil = buscarPerfil(perfilParaOferecer).rotuloCompleto;

      toast(`Perfil ativo: ${rotuloPerfil}`, {
        description: vistos[perfilParaOferecer]
          ? "Quer rever o tutorial guiado deste perfil?"
          : "Este perfil tem um tutorial guiado. Quer ver agora?",
        action: {
          label: "Ver tutorial",
          onClick: () => iniciar(perfilParaOferecer),
        },
      });
      return;
    }

    if (pathname !== "/app") {
      return;
    }
    if (perfisOferecidosRef.current.has(perfilSessao)) {
      return;
    }
    const vistos = lerPerfisVistos();
    if (vistos[perfilSessao]) {
      return;
    }

    const temporizador = setTimeout(() => {
      perfisOferecidosRef.current.add(perfilSessao);
      iniciar(perfilSessao);
    }, 700);
    return () => clearTimeout(temporizador);
  }, [perfilSessao, pathname, iniciar]);

  const valor = useMemo<EstadoTour>(
    () => ({
      ativo: perfilTour !== null,
      perfilId: perfilTour,
      passos,
      indiceAtual,
      passoAtual: passos[indiceAtual] ?? null,
      totalPassos: passos.length,
      iniciar,
      proximo,
      anterior,
      encerrar,
      pularPasso,
    }),
    [perfilTour, passos, indiceAtual, iniciar, proximo, anterior, encerrar, pularPasso]
  );

  return <ContextoTour.Provider value={valor}>{children}</ContextoTour.Provider>;
}
