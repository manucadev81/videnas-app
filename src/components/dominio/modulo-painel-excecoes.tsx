"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TriangleAlert, Info as InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarPerfil } from "@/lib/permissoes";
import type { Excecao } from "@/lib/tipos";
import { formatarDataHora } from "@/lib/formatadores";
import { cn } from "@/lib/utils";

export interface PainelExcecoesProps {
  excecoes: Excecao[];
  className?: string;
}

export function PainelExcecoes({ excecoes, className }: PainelExcecoesProps) {
  const tratarExcecao = usePeriodosStore((estado) => estado.tratarExcecao);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);

  const [excecaoEmEdicao, setExcecaoEmEdicao] = useState<Excecao | null>(null);
  const [acaoEscolhida, setAcaoEscolhida] = useState<"tratada" | "aceita_com_justificativa">("tratada");
  const [justificativa, setJustificativa] = useState("");

  if (excecoes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Nenhuma pendência aberta. Todas as exceções desta competência foram tratadas.
      </p>
    );
  }

  const podeTratar = perfilAtivo ? buscarPerfil(perfilAtivo).acoesPermitidas.includes("tratar_excecao") : false;

  function abrir(excecao: Excecao) {
    setExcecaoEmEdicao(excecao);
    setAcaoEscolhida("tratada");
    setJustificativa("");
  }

  function confirmar() {
    if (!excecaoEmEdicao || !perfilAtivo || !usuarioId) return;
    if (justificativa.trim().length < 5) {
      toast.error("Descreva o tratamento aplicado com pelo menos 5 caracteres.");
      return;
    }
    const resultado = tratarExcecao(
      excecaoEmEdicao.periodoId,
      { usuarioId, perfilId: perfilAtivo },
      excecaoEmEdicao.id,
      acaoEscolhida,
      justificativa
    );
    if (resultado.sucesso) {
      toast.success(`Exceção ${excecaoEmEdicao.codigo} atualizada.`);
      setExcecaoEmEdicao(null);
    } else {
      toast.error(resultado.motivo ?? "Não foi possível tratar a exceção.");
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {excecoes.map((excecao) => {
        const tratavel = excecao.status === "aberta" || excecao.status === "em_tratamento";
        return (
          <div
            key={excecao.id}
            className={cn(
              "flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-start sm:justify-between",
              excecao.severidade === "bloqueante"
                ? "border-status-error-border bg-status-error-bg"
                : "border-status-warning-border bg-status-warning-bg"
            )}
          >
            <div className="flex gap-2">
              {excecao.severidade === "bloqueante" ? (
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-error-text" aria-hidden="true" />
              ) : (
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-status-warning-text" aria-hidden="true" />
              )}
              <div>
                <p className="font-mono text-xs text-neutral-500">{excecao.codigo}</p>
                <p className="text-sm font-medium text-neutral-700">{excecao.titulo}</p>
                <p className="mt-0.5 text-sm text-neutral-600">{excecao.descricao}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Status:{" "}
                  {excecao.status === "aberta"
                    ? "Aberta"
                    : excecao.status === "em_tratamento"
                      ? "Em tratamento"
                      : excecao.status === "tratada"
                        ? "Tratada"
                        : "Aceita com justificativa"}
                  {excecao.tratadaEm ? ` · ${formatarDataHora(excecao.tratadaEm)}` : ""}
                </p>
                {excecao.justificativa ? (
                  <p className="mt-1 text-xs text-neutral-500">Justificativa: {excecao.justificativa}</p>
                ) : null}
              </div>
            </div>
            {podeTratar && tratavel ? (
              <Button type="button" size="sm" variant="outline" onClick={() => abrir(excecao)}>
                Tratar
              </Button>
            ) : null}
          </div>
        );
      })}

      <Dialog open={excecaoEmEdicao !== null} onOpenChange={(aberto) => !aberto && setExcecaoEmEdicao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tratar exceção {excecaoEmEdicao?.codigo}</DialogTitle>
            <DialogDescription>{excecaoEmEdicao?.descricao}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <RadioGroup
              value={acaoEscolhida}
              onValueChange={(valor) => setAcaoEscolhida(valor as "tratada" | "aceita_com_justificativa")}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="tratada" id="acao-tratada" />
                <Label htmlFor="acao-tratada" className="font-normal">
                  Corrigida — marcar como tratada
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="aceita_com_justificativa" id="acao-aceita" />
                <Label htmlFor="acao-aceita" className="font-normal">
                  Aceitar com justificativa, sem alteração de dado
                </Label>
              </div>
            </RadioGroup>
            <div className="space-y-1.5">
              <Label htmlFor="justificativa-excecao">Justificativa</Label>
              <Textarea
                id="justificativa-excecao"
                value={justificativa}
                onChange={(evento) => setJustificativa(evento.target.value)}
                rows={3}
                placeholder="Descreva o que foi verificado ou corrigido."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExcecaoEmEdicao(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
