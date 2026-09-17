"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useHidratarSessao, useSessaoStore } from "@/lib/store/sessao";

function EsqueletoConteudo() {
  return (
    <div role="status" aria-label="Carregando sessão" className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function GuardiaSessao({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hidratado = useHidratarSessao();
  const autenticado = useSessaoStore((estado) => estado.autenticado);

  useEffect(() => {
    if (hidratado && !autenticado) {
      router.replace("/login");
    }
  }, [hidratado, autenticado, router]);

  if (!hidratado || !autenticado) {
    return <EsqueletoConteudo />;
  }

  return <>{children}</>;
}
