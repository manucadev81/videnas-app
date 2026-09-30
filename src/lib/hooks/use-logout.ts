"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSessaoStore } from "@/lib/store/sessao";

export function useLogout(): () => void {
  const router = useRouter();
  const sair = useSessaoStore((estado) => estado.sair);

  return useCallback(() => {
    sair();
    toast.success("Sessão encerrada.");
    router.replace("/login");
  }, [sair, router]);
}
