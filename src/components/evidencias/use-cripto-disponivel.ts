"use client";

import { useSyncExternalStore } from "react";
import { criptografiaDisponivel } from "@/lib/evidencias/cripto";

function assinar(): () => void {
  return () => {};
}

function estadoNoCliente(): boolean {
  return criptografiaDisponivel();
}

function estadoNoServidor(): boolean {
  return true;
}

export function useCriptoDisponivel(): boolean {
  return useSyncExternalStore(assinar, estadoNoCliente, estadoNoServidor);
}
