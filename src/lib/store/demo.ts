"use client";

import { buscarUsuario } from "@/lib/mock/usuarios";
import { useEvidenciasStore } from "@/lib/store/evidencias";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { useTenantsStore } from "@/lib/store/tenants";

export interface ResultadoReinicioDemo {
  sessaoEncerrada: boolean;
}

export function reiniciarDemo(): ResultadoReinicioDemo {
  const sessao = useSessaoStore.getState();
  const usuarioAtualId = sessao.usuarioId;

  useTenantsStore.getState().reiniciarTenants();
  usePeriodosStore.getState().reiniciarMock();
  useEvidenciasStore.getState().reiniciarEvidencias();

  const usuarioAindaValido = usuarioAtualId ? Boolean(buscarUsuario(usuarioAtualId)) : true;

  if (sessao.autenticado && !usuarioAindaValido) {
    sessao.sair();
    return { sessaoEncerrada: true };
  }

  return { sessaoEncerrada: false };
}
