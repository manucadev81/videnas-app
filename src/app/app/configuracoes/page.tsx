"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { podeVerRota } from "@/lib/permissoes";
import { useSessaoStore } from "@/lib/store/sessao";

const DESTINOS = [
  "/app/configuracoes/instituicao",
  "/app/configuracoes/usuarios",
  "/app/configuracoes/dicionarios",
];

export default function ConfiguracoesPage() {
  const router = useRouter();
  const hidratado = useSessaoStore((estado) => estado.hidratado);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);

  useEffect(() => {
    if (!hidratado) {
      return;
    }

    const destino = perfilAtivo
      ? (DESTINOS.find((rota) => podeVerRota(perfilAtivo, rota)) ?? "/app")
      : "/app";

    router.replace(destino);
  }, [hidratado, perfilAtivo, router]);

  return (
    <div role="status" aria-label="Abrindo configurações" className="space-y-3">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
