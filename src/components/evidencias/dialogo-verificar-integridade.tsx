"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerificadorIntegridade } from "@/components/evidencias/verificador-integridade";
import { buscarModulo } from "@/lib/mock/modulos";
import { formatarCompetencia } from "@/lib/formatadores";
import type { RegistroLacre } from "@/lib/tipos";

export interface DialogoVerificarIntegridadeProps {
  lacre: RegistroLacre | null;
  aoFechar: () => void;
}

export function DialogoVerificarIntegridade({
  lacre: lacreSelecionado,
  aoFechar,
}: DialogoVerificarIntegridadeProps) {
  const [ultimoExibido, setUltimoExibido] = useState<RegistroLacre | null>(lacreSelecionado);

  if (lacreSelecionado && lacreSelecionado !== ultimoExibido) {
    setUltimoExibido(lacreSelecionado);
  }

  const lacre = lacreSelecionado ?? ultimoExibido;

  return (
    <Dialog
      open={lacreSelecionado !== null}
      onOpenChange={(aberto) => {
        if (!aberto) {
          aoFechar();
        }
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {lacre ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-base font-bold text-neutral-700">
                Conferir {lacre.origemNome}
              </DialogTitle>
              <DialogDescription>
                {buscarModulo(lacre.moduloId).nome} · {formatarCompetencia(lacre.competencia)} ·
                lacre {lacre.id}
              </DialogDescription>
            </DialogHeader>
            <VerificadorIntegridade key={lacre.id} lacre={lacre} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
