"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { buscarPerfil, podeVerRota } from "@/lib/permissoes";
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
  const pathname = usePathname();
  const hidratado = useHidratarSessao();
  const autenticado = useSessaoStore((estado) => estado.autenticado);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);

  const rotaPermitida = Boolean(perfilAtivo && podeVerRota(perfilAtivo, pathname));

  useEffect(() => {
    if (!hidratado) {
      return;
    }

    if (!autenticado) {
      router.replace("/login");
      return;
    }

    if (perfilAtivo && !podeVerRota(perfilAtivo, pathname)) {
      toast.error(`Esta área não faz parte do perfil ${buscarPerfil(perfilAtivo).rotuloCompleto}.`);
      router.replace("/app");
    }
  }, [hidratado, autenticado, perfilAtivo, pathname, router]);

  if (!hidratado || !autenticado || !perfilAtivo || !rotaPermitida) {
    return <EsqueletoConteudo />;
  }

  return <>{children}</>;
}
