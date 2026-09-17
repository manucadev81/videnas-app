"use client";

import {
  montarConteudoArquivoEntregue,
  tipoMimeDoFormato,
} from "@/lib/evidencias/conteudo-arquivo";
import type { ArquivoGerado, PeriodoObrigacao } from "@/lib/tipos";

export function baixarArquivoEntregue(arquivo: ArquivoGerado, periodo: PeriodoObrigacao): void {
  const conteudo = montarConteudoArquivoEntregue(arquivo, periodo);
  const blob = new Blob([conteudo], { type: tipoMimeDoFormato(arquivo.formato) });
  const url = URL.createObjectURL(blob);
  const ancora = document.createElement("a");
  ancora.href = url;
  ancora.download = arquivo.nomeArquivo;
  document.body.append(ancora);
  ancora.click();
  ancora.remove();
  URL.revokeObjectURL(url);
}
