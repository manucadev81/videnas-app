"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileCheck2, History, Receipt, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { EnvioArquivoInsumo } from "@/components/fornecimento/envio-arquivo-insumo";
import { FormularioInsumo } from "@/components/fornecimento/formulario-insumo";
import {
  CLASSE_STATUS_INSUMO,
  idAncoraInsumo,
} from "@/components/fornecimento/constantes";
import { useEvidenciasStore } from "@/lib/store/evidencias";
import { ROTULOS_STATUS_INSUMO, rotulosDosCampos } from "@/lib/fornecimento";
import type { AutorLacre } from "@/lib/evidencias/lacre";
import { formatarDataHora, formatarTamanhoArquivo, truncarHash } from "@/lib/formatadores";
import type {
  FornecimentoInsumo,
  InsumoDefinicao,
  PeriodoObrigacao,
  RegistroLacre,
} from "@/lib/tipos";
import { cn } from "@/lib/utils";

export interface CartaoInsumoProps {
  periodo: PeriodoObrigacao;
  definicao: InsumoDefinicao;
  fornecimento: FornecimentoInsumo | undefined;
  lacre: RegistroLacre | undefined;
  principal: boolean;
  primeiro: boolean;
  autor: AutorLacre;
  instituicaoNome: string;
  podeFornecer: boolean;
  motivoBloqueio: string | null;
  aoConcluir: (lacre: RegistroLacre, definicao: InsumoDefinicao) => void;
  aoVerComprovante: (lacre: RegistroLacre, definicao: InsumoDefinicao) => void;
}

export function CartaoInsumo({
  periodo,
  definicao,
  fornecimento,
  lacre,
  principal,
  primeiro,
  autor,
  instituicaoNome,
  podeFornecer,
  motivoBloqueio,
  aoConcluir,
  aoVerComprovante,
}: CartaoInsumoProps) {
  const registrarFornecimentoFormulario = useEvidenciasStore(
    (estado) => estado.registrarFornecimentoFormulario
  );

  const [novaVersao, setNovaVersao] = useState(false);

  const status = fornecimento?.status ?? "pendente";
  const jaFornecido = status === "fornecido" && Boolean(lacre);
  const mostrarEnvio = podeFornecer && (!jaFornecido || novaVersao);
  const idAncora = idAncoraInsumo(definicao.id);

  const faltantesRotulos =
    fornecimento && fornecimento.camposFaltantes.length > 0
      ? rotulosDosCampos(definicao, fornecimento.camposFaltantes)
      : [];

  async function enviarFormulario(valores: Record<string, string>): Promise<boolean> {
    const registro = await registrarFornecimentoFormulario({
      periodo,
      insumoId: definicao.id,
      valores,
      autor,
    });

    if (!registro.sucesso || !registro.lacre) {
      toast.error(registro.motivo ?? "Não foi possível lacrar as respostas. Tente novamente.");
      return false;
    }

    toast.success(`${definicao.rotulo} preenchido e lacrado.`);
    setNovaVersao(false);
    aoConcluir(registro.lacre, definicao);
    return true;
  }

  return (
    <article
      id={idAncora}
      data-tour={primeiro ? "fornecimento-insumo" : undefined}
      aria-labelledby={`${idAncora}-titulo`}
      className="scroll-mt-24 rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            id={`${idAncora}-titulo`}
            className="flex flex-wrap items-center gap-2 font-display text-base font-bold text-neutral-700"
          >
            {definicao.rotulo}
            {principal ? (
              <span className="status-badge status-badge-info">Insumo principal</span>
            ) : null}
            {definicao.obrigatorio ? null : (
              <span className="status-badge status-badge-neutral">Opcional</span>
            )}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">{definicao.descricao}</p>
        </div>
        <span className={cn("status-badge shrink-0", CLASSE_STATUS_INSUMO[status])}>
          {ROTULOS_STATUS_INSUMO[status]}
        </span>
      </div>

      <p className="mb-3 text-xs text-neutral-400">Base normativa: {definicao.baseNormativa}</p>

      <div className="mb-4 rounded-md bg-neutral-50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
          Como fornecer
          <BadgeAjuda chave="fornecimento.insumo" tamanho="xs" />
        </p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">{definicao.comoFornecer}</p>
      </div>

      {faltantesRotulos.length > 0 ? (
        <p className="mb-4 rounded-md border border-status-warning-border bg-status-warning-bg p-3 text-xs text-status-warning-text">
          Ainda faltam preencher: {faltantesRotulos.join(", ")}.
        </p>
      ) : null}

      {jaFornecido && lacre ? (
        <div className="mb-4 rounded-lg border border-status-success-border bg-status-success-bg p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-status-success-text">
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            Fornecido e lacrado
          </p>
          <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-status-success-text/80">Identificador do lacre</dt>
              <dd className="font-mono text-xs break-all text-neutral-700">{lacre.id}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-status-success-text/80">
                Hash SHA-256
                <BadgeAjuda chave="evidencia.hash" tamanho="xs" />
              </dt>
              <dd className="font-mono text-xs text-neutral-700">
                {truncarHash(lacre.hashSha256)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-status-success-text/80">Recebido em</dt>
              <dd className="text-xs text-neutral-700">{formatarDataHora(lacre.seladoEm)}</dd>
            </div>
            <div>
              <dt className="text-xs text-status-success-text/80">Origem</dt>
              <dd className="text-xs break-words text-neutral-700">
                {lacre.origemNome}
                {fornecimento?.tamanhoBytes
                  ? ` · ${formatarTamanhoArquivo(fornecimento.tamanhoBytes)}`
                  : ""}
              </dd>
            </div>
          </dl>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9 bg-white"
              onClick={() => aoVerComprovante(lacre, definicao)}
            >
              <Receipt className="size-4" aria-hidden="true" />
              Ver comprovante
            </Button>
            {podeFornecer ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-9"
                aria-expanded={novaVersao}
                aria-controls={`${idAncora}-envio`}
                onClick={() => setNovaVersao((atual) => !atual)}
              >
                <History className="size-4" aria-hidden="true" />
                {novaVersao ? "Cancelar nova versão" : "Enviar nova versão"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {jaFornecido && novaVersao ? (
        <p className="mb-3 rounded-md border border-status-info-border bg-status-info-bg p-3 text-xs leading-relaxed text-status-info-text">
          O envio anterior permanece lacrado e continua válido como evidência. Este novo envio será
          encadeado ao lacre {lacre?.id} e passará a ser a versão corrente. Nada é apagado.
        </p>
      ) : null}

      {mostrarEnvio ? (
        <div id={`${idAncora}-envio`}>
          {definicao.tipo === "arquivo" ? (
            <EnvioArquivoInsumo
              periodo={periodo}
              definicao={definicao}
              principal={principal}
              autor={autor}
              instituicaoNome={instituicaoNome}
              desabilitado={!podeFornecer}
              aoConcluir={(lacreNovo) => {
                setNovaVersao(false);
                aoConcluir(lacreNovo, definicao);
              }}
            />
          ) : (
            <FormularioInsumo
              definicao={definicao}
              fornecimento={fornecimento}
              desabilitado={!podeFornecer}
              aoEnviar={enviarFormulario}
            />
          )}
        </div>
      ) : null}

      {!podeFornecer && !jaFornecido ? (
        <p className="flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500">
          <FileCheck2 className="mt-0.5 size-4 shrink-0 text-neutral-400" aria-hidden="true" />
          {motivoBloqueio ??
            "O envio deste insumo é responsabilidade do perfil Cliente / Fornecedor de dados da instituição."}
        </p>
      ) : null}
    </article>
  );
}
