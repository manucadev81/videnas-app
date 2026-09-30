"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reiniciarDemo } from "@/lib/store/demo";

type VariantesBotao = VariantProps<typeof buttonVariants>;

interface BotaoReiniciarDemoProps {
  variant?: VariantesBotao["variant"];
  size?: VariantesBotao["size"];
  className?: string;
  rotulo?: string;
  rotuloCompacto?: boolean;
}

export function BotaoReiniciarDemo({
  variant = "ghost",
  size = "sm",
  className,
  rotulo = "Reiniciar demo",
  rotuloCompacto = false,
}: BotaoReiniciarDemoProps) {
  const [aberto, setAberto] = useState(false);

  function confirmarReinicio() {
    const resultado = reiniciarDemo();
    setAberto(false);

    if (resultado.sessaoEncerrada) {
      toast.success(
        "Dados da demonstração reiniciados. Sua sessão foi encerrada porque o usuário atual não existe mais na semente."
      );
      return;
    }

    toast.success("Dados da demonstração reiniciados. Tudo voltou ao estado inicial.");
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setAberto(true)}
        aria-label={rotulo}
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        <span className={rotuloCompacto ? "hidden sm:inline" : undefined}>{rotulo}</span>
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reiniciar todos os dados da demonstração?</DialogTitle>
            <DialogDescription>
              Clientes, períodos, evidências, protocolos, exceções e o histórico de auditoria
              voltam ao estado inicial da semente da demonstração. Essa ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmarReinicio}>
              Reiniciar demonstração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
