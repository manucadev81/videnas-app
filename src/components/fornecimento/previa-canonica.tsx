"use client";

import { useMemo } from "react";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { modelarCanonicamente } from "@/lib/fornecimento";
import { formatarDataHora, formatarNumero } from "@/lib/formatadores";
import type { FornecimentoInsumo, LinhaCanonica, PeriodoObrigacao } from "@/lib/tipos";

export interface PreviaCanonicaProps {
  periodo: PeriodoObrigacao;
  fornecimentos: Record<string, FornecimentoInsumo>;
}

export function PreviaCanonica({ periodo, fornecimentos }: PreviaCanonicaProps) {
  const modelo = useMemo(
    () => modelarCanonicamente(periodo, fornecimentos),
    [periodo, fornecimentos]
  );

  const colunas: ColunaTabela<LinhaCanonica>[] = modelo.colunas.map((coluna) => ({
    id: coluna.chave,
    cabecalho: coluna.rotulo,
    alinhamento:
      coluna.chave === "quantidade" || coluna.chave === "valor_brl" ? "right" : "left",
    renderizar: (linha) => linha.valores[coluna.chave] || "—",
  }));

  return (
    <section
      data-tour="fornecimento-canonico"
      aria-labelledby="fornecimento-canonico-titulo"
      className="rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="fornecimento-canonico-titulo"
            className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700"
          >
            Como a Videnas estruturou seus dados
            <BadgeAjuda chave="fornecimento.canonico" tamanho="sm" />
          </h2>
          <p className="text-sm text-neutral-500">
            Modelo canônico gerado a partir dos insumos que você forneceu. É a partir dele que o
            arquivo da obrigação é montado.
          </p>
        </div>
        <span className="status-badge status-badge-info shrink-0">
          {formatarNumero(modelo.totalLinhas)} linha(s) no total
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-200">
        <TabelaDados
          colunas={colunas}
          dados={modelo.linhas}
          chave={(linha) => linha.chave}
          tituloVazio="Nenhuma linha estruturada ainda"
          mensagemVazia="Os insumos foram recebidos, mas ainda não há registros legíveis para pré-visualizar."
        />
      </div>

      <p className="mt-2 text-xs text-neutral-500">
        Amostra com as primeiras {formatarNumero(modelo.linhas.length)} de{" "}
        {formatarNumero(modelo.totalLinhas)} linha(s) · estruturado em{" "}
        {formatarDataHora(modelo.geradoEm)}. A conferência completa acontece na etapa de validação.
      </p>
    </section>
  );
}
