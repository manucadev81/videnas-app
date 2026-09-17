"use client";

import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { BadgeSentido } from "@/components/evidencias/badge-sentido";
import { ValorHash } from "@/components/evidencias/valor-hash";
import { buscarPerfil } from "@/lib/permissoes";
import { formatarDataHora, formatarTamanhoArquivo } from "@/lib/formatadores";
import type { RegistroLacre } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export interface LinhaDoTempoCadeiaProps {
  cadeia: RegistroLacre[];
  lacreDestacadoId?: string;
  className?: string;
}

export function LinhaDoTempoCadeia({
  cadeia,
  lacreDestacadoId,
  className,
}: LinhaDoTempoCadeiaProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-neutral-700">
          Cadeia encadeada
          <BadgeAjuda chave="evidencia.encadeamento" tamanho="xs" side="top" />
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Cada versão guarda o hash da anterior. Reenvios se somam ao histórico: nada é
          sobrescrito e nenhum elo pode ser removido sem que a corrente quebre.
        </p>
      </div>

      <ol className="space-y-3 border-l-2 border-neutral-200 pl-4">
        {cadeia.map((elo, indice) => {
          const destacado = elo.id === lacreDestacadoId;
          return (
            <li key={elo.id} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-2 -left-[22px] size-3 rounded-full border-2 border-white",
                  destacado ? "bg-brand-700" : "bg-neutral-300"
                )}
              />
              <div
                className={cn(
                  "rounded-lg border p-3",
                  destacado
                    ? "border-brand-200 bg-brand-50"
                    : "border-neutral-200 bg-white"
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-bold text-neutral-700">
                    v{indice + 1}
                  </span>
                  <BadgeSentido sentido={elo.sentido} />
                  {destacado ? (
                    <span className="status-badge status-badge-neutral px-2 py-1 text-xs">
                      Lacre em exibição
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium break-all text-neutral-700">
                  {elo.origemNome}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatarDataHora(elo.seladoEm)} · {elo.seladoPorNome} (
                  {buscarPerfil(elo.perfilId).rotulo}) · {formatarTamanhoArquivo(elo.tamanhoBytes)}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-neutral-500">Hash deste elo</p>
                  <ValorHash hash={elo.hashSha256} truncado descricao="hash do elo" />
                  <p className="text-xs text-neutral-500">
                    {elo.hashAnterior
                      ? `Encadeado após ${elo.hashAnterior.slice(0, 16)}…`
                      : "Primeiro elo da cadeia — não há lacre anterior."}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
