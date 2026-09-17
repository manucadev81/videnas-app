"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AVISO_ASSISTENTE, PERGUNTAS_RAPIDAS, responder } from "@/lib/assistente";
import { cn } from "@/lib/utils";

interface MensagemAssistente {
  id: string;
  autor: "usuario" | "assistente";
  titulo?: string;
  texto: string;
  sugestoes?: string[];
}

const MENSAGEM_INICIAL: MensagemAssistente = {
  id: "msg-0",
  autor: "assistente",
  titulo: "Como posso ajudar?",
  texto:
    "Pergunte sobre os módulos (ACAM212, Cadoc 5711, Cadoc 5710 e Fiscal/DPS), as etapas de uma competência, prazos regulatórios, envio de lote e não conformidades, pendências e exceções, perfis de usuário ou seleção de instituição.",
};

export interface PainelAssistenteProps {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  focoAoFechar?: RefObject<HTMLElement | null>;
}

export function PainelAssistente({ aberto, onAbertoChange, focoAoFechar }: PainelAssistenteProps) {
  const [mensagens, setMensagens] = useState<MensagemAssistente[]>([MENSAGEM_INICIAL]);
  const [rascunho, setRascunho] = useState("");
  const [pensando, setPensando] = useState(false);

  const campoRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const contadorRef = useRef(0);
  const campoId = useId();

  useEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    lista.scrollTop = lista.scrollHeight;
  }, [mensagens, pensando]);

  function proximoId(prefixo: string): string {
    contadorRef.current += 1;
    return `${prefixo}-${contadorRef.current}`;
  }

  async function perguntar(pergunta: string) {
    const texto = pergunta.trim();
    if (texto.length === 0 || pensando) return;

    setMensagens((atual) => [...atual, { id: proximoId("usuario"), autor: "usuario", texto }]);
    setRascunho("");
    setPensando(true);

    const resposta = await responder(texto);

    setMensagens((atual) => [
      ...atual,
      {
        id: proximoId("assistente"),
        autor: "assistente",
        titulo: resposta.titulo,
        texto: resposta.texto,
        sugestoes: resposta.sugestoes,
      },
    ]);
    setPensando(false);
    campoRef.current?.focus();
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void perguntar(rascunho);
  }

  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      <SheetContent
        side="right"
        initialFocus={campoRef}
        finalFocus={focoAoFechar}
        className="w-full gap-0 p-0 sm:max-w-md"
        aria-label="Assistente Videnas"
      >
        <SheetHeader className="border-b border-neutral-200 px-4 py-4 pr-14">
          <SheetTitle className="font-display text-base font-bold text-neutral-700">
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand-600" aria-hidden="true" />
              Assistente Videnas
            </span>
          </SheetTitle>
          <SheetDescription className="text-xs leading-relaxed text-neutral-500">
            {AVISO_ASSISTENTE}
          </SheetDescription>
        </SheetHeader>

        <div
          ref={listaRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="Conversa com o assistente"
          className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        >
          {mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={cn(
                "flex flex-col gap-2",
                mensagem.autor === "usuario" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                  mensagem.autor === "usuario"
                    ? "bg-brand-600 text-white"
                    : "border border-neutral-200 bg-neutral-50 text-neutral-600"
                )}
              >
                {mensagem.titulo && mensagem.autor === "assistente" ? (
                  <p className="mb-1 font-display text-sm font-bold text-neutral-700">
                    {mensagem.titulo}
                  </p>
                ) : null}
                <p className="whitespace-pre-line">{mensagem.texto}</p>
              </div>

              {mensagem.sugestoes && mensagem.sugestoes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {mensagem.sugestoes.map((sugestao) => (
                    <button
                      key={sugestao}
                      type="button"
                      onClick={() => void perguntar(sugestao)}
                      className="min-h-11 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-left text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {pensando ? (
            <p className="flex items-center gap-2 text-xs text-neutral-500">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Consultando a base de conhecimento…
            </p>
          ) : null}
        </div>

        <div className="border-t border-neutral-200 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-neutral-500">Perguntas rápidas</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {PERGUNTAS_RAPIDAS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void perguntar(item.pergunta)}
                disabled={pensando}
                className="min-h-11 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-50"
              >
                {item.rotulo}
              </button>
            ))}
          </div>

          <form onSubmit={aoEnviar} className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor={campoId} className="sr-only">
                Escreva sua dúvida sobre a plataforma
              </Label>
              <Input
                id={campoId}
                ref={campoRef}
                value={rascunho}
                onChange={(evento) => setRascunho(evento.target.value)}
                placeholder="Ex.: qual o prazo do Cadoc 5711?"
                autoComplete="off"
                disabled={pensando}
                className="min-h-11"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              aria-label="Enviar pergunta"
              disabled={pensando || rascunho.trim().length === 0}
              className="min-h-11 min-w-11"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
