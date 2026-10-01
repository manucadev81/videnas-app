"use client";

import { abrirEnvelope } from "@/lib/evidencias/cripto";
import type { RegistroLacre } from "@/lib/tipos";

export async function baixarConteudoLacrado(lacre: RegistroLacre): Promise<void> {
  const conteudo = await abrirEnvelope(
    lacre.instituicaoId,
    lacre.envelopeCifrado,
    lacre.vetorInicializacao
  );
  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const ancora = document.createElement("a");
  ancora.href = url;
  ancora.download = `${lacre.id}.json`;
  document.body.append(ancora);
  ancora.click();
  ancora.remove();
  URL.revokeObjectURL(url);
}
