"use client";

import { useId, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { CircleAlert, CircleCheckBig, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { ValorHash } from "@/components/evidencias/valor-hash";
import { useCriptoDisponivel } from "@/components/evidencias/use-cripto-disponivel";
import { verificarIntegridade } from "@/lib/evidencias/lacre";
import { useEvidenciasStore } from "@/lib/store/evidencias";
import { formatarDataHora } from "@/lib/formatadores";
import type { RegistroLacre } from "@/lib/tipos";
import { cn } from "@/lib/utils";

interface ResultadoLocal {
  confere: boolean;
  hashCalculado: string;
  nomeArquivo: string;
}

export interface VerificadorIntegridadeProps {
  lacre: RegistroLacre;
  className?: string;
  dataTour?: string;
}

export function VerificadorIntegridade({
  lacre,
  className,
  dataTour,
}: VerificadorIntegridadeProps) {
  const idCampo = useId();
  const criptoDisponivel = useCriptoDisponivel();
  const registrarVerificacao = useEvidenciasStore((estado) => estado.registrarVerificacao);
  const verificacoes = useEvidenciasStore((estado) => estado.verificacoes);

  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoLocal | null>(null);

  const historico = verificacoes.filter((item) => item.lacreId === lacre.id);

  async function aoSelecionarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const campo = evento.currentTarget;
    const arquivo = campo.files?.[0];
    if (!arquivo) {
      return;
    }

    setAnalisando(true);
    setResultado(null);

    try {
      const conferencia = await verificarIntegridade(arquivo, lacre.hashSha256);
      setResultado({
        confere: conferencia.confere,
        hashCalculado: conferencia.hashCalculado,
        nomeArquivo: arquivo.name,
      });
      registrarVerificacao(lacre.id, conferencia.confere, conferencia.hashCalculado);

      if (conferencia.confere) {
        toast.success("Integridade confirmada: o arquivo é idêntico ao que foi lacrado.");
      } else {
        toast.error("O arquivo selecionado não corresponde ao hash registrado no lacre.");
      }
    } catch {
      toast.error("Não foi possível ler o arquivo para recalcular o hash.");
    } finally {
      setAnalisando(false);
      campo.value = "";
    }
  }

  return (
    <section className={cn("space-y-3", className)} data-tour={dataTour}>
      <div>
        <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-neutral-700">
          Verificar integridade
          <BadgeAjuda chave="evidencia.verificarIntegridade" tamanho="xs" side="top" />
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Selecione o arquivo que você tem em mãos. O hash é recalculado no seu próprio navegador e
          comparado com o hash registrado no lacre — nenhum byte do arquivo é enviado para fora do
          dispositivo.
        </p>
      </div>

      {criptoDisponivel ? (
        <div className="space-y-2">
          <Label htmlFor={idCampo}>Arquivo a conferir</Label>
          <Input
            id={idCampo}
            type="file"
            className="h-auto py-1.5"
            disabled={analisando}
            onChange={aoSelecionarArquivo}
          />
        </div>
      ) : (
        <p className="rounded-md border border-status-warning-border bg-status-warning-bg p-3 text-sm text-status-warning-text">
          Este navegador não expõe a Web Crypto API, então o hash não pode ser recalculado aqui.
          Abra a plataforma em um navegador atualizado para conferir a integridade.
        </p>
      )}

      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        {analisando ? (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Recalculando o hash SHA-256 do arquivo…
          </p>
        ) : null}

        {resultado ? (
          <div
            className={cn(
              "rounded-lg border p-4",
              resultado.confere
                ? "border-status-success-border bg-status-success-bg"
                : "border-status-error-border bg-status-error-bg"
            )}
          >
            <p
              className={cn(
                "flex items-center gap-2 font-display text-base font-bold",
                resultado.confere ? "text-status-success-text" : "text-status-error-text"
              )}
            >
              {resultado.confere ? (
                <CircleCheckBig className="size-5" aria-hidden="true" />
              ) : (
                <CircleAlert className="size-5" aria-hidden="true" />
              )}
              {resultado.confere
                ? "Confere — arquivo íntegro"
                : "NÃO confere — arquivo divergente"}
            </p>
            <p
              className={cn(
                "mt-1 text-sm",
                resultado.confere ? "text-status-success-text" : "text-status-error-text"
              )}
            >
              {resultado.confere
                ? `O arquivo ${resultado.nomeArquivo} é exatamente o mesmo que foi lacrado, byte a byte.`
                : `O arquivo ${resultado.nomeArquivo} foi alterado depois do lacre ou não é o arquivo desta competência.`}
            </p>

            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs font-medium text-neutral-500">Hash registrado no lacre</dt>
                <dd className="mt-1">
                  <ValorHash hash={lacre.hashSha256} descricao="hash do lacre" />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-neutral-500">
                  Hash recalculado do arquivo
                </dt>
                <dd className="mt-1">
                  <ValorHash hash={resultado.hashCalculado} descricao="hash recalculado" />
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>

      <div>
        <h4 className="text-sm font-medium text-neutral-700">Histórico de verificações</h4>
        {historico.length === 0 ? (
          <p className="mt-1 text-sm text-neutral-500">
            Nenhuma verificação registrada para este lacre até agora.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {historico.map((item) => (
              <li
                key={`${item.lacreId}-${item.verificadoEm}`}
                className="flex flex-wrap items-center gap-2 rounded-md bg-neutral-50 p-3 text-sm"
              >
                <span
                  className={cn(
                    "status-badge px-2 py-1 text-xs",
                    item.confere ? "status-badge-success" : "status-badge-error"
                  )}
                >
                  {item.confere ? "Confere" : "Não confere"}
                </span>
                <span className="text-neutral-600">{formatarDataHora(item.verificadoEm)}</span>
                <code className="font-mono text-xs break-all text-neutral-500">
                  {item.hashCalculado}
                </code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
