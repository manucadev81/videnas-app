"use client";

import { FileText } from "lucide-react";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { PainelAcompanhamentoFornecimento } from "@/components/dominio/painel-acompanhamento-fornecimento";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { formatarDataHora, formatarTamanhoArquivo } from "@/lib/formatadores";
import type { CanalIngestao, LoteIngestao } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const ROTULO_CANAL: Record<CanalIngestao, string> = {
  upload: "Upload manual",
  sftp: "SFTP",
  api: "Integração",
};

const COLUNAS_ARQUIVOS: ColunaTabela<LoteIngestao>[] = [
  {
    id: "nome",
    cabecalho: "Arquivo",
    renderizar: (lote) => (
      <span className="flex items-center gap-2">
        <FileText className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
        {lote.nomeArquivo}
      </span>
    ),
  },
  {
    id: "tamanho",
    cabecalho: "Tamanho",
    alinhamento: "right",
    renderizar: (lote) => formatarTamanhoArquivo(lote.tamanhoBytes),
  },
  {
    id: "recebido",
    cabecalho: "Recebido em",
    renderizar: (lote) => formatarDataHora(lote.recebidoEm),
  },
  {
    id: "canal",
    cabecalho: "Canal",
    renderizar: (lote) => ROTULO_CANAL[lote.canal],
  },
  {
    id: "status",
    cabecalho: "Status",
    renderizar: () => <span className="status-badge status-badge-success">Aceito</span>,
  },
];

export interface RecepcaoDocumentosProps {
  periodoId: string;
  className?: string;
}

export function RecepcaoDocumentos({ periodoId, className }: RecepcaoDocumentosProps) {
  const periodo = usePeriodosStore((estado) => estado.periodos[periodoId]);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);

  if (!periodo || !perfilAtivo || !usuarioId) {
    return null;
  }

  const autor = { usuarioId, perfilId: perfilAtivo };

  const linhas = [...periodo.lotes].sort((a, b) =>
    a.recebidoEm < b.recebidoEm ? 1 : a.recebidoEm > b.recebidoEm ? -1 : 0
  );

  return (
    <div className={cn("space-y-4", className)}>
      <PainelAcompanhamentoFornecimento periodo={periodo} autor={autor} />

      <div data-tour="recepcao-tabela-arquivos" className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
            Arquivos recebidos
            <BadgeAjuda chave="recepcao.tabela" tamanho="sm" />
          </h2>
          <span className="text-xs text-neutral-500">
            {linhas.length === 1 ? "1 lote na competência" : `${linhas.length} lotes na competência`}
          </span>
        </div>
        <TabelaDados
          colunas={COLUNAS_ARQUIVOS}
          dados={linhas}
          chave={(lote) => lote.id}
          tituloVazio="Nenhum arquivo recebido"
          mensagemVazia="O Cliente / Fornecedor de dados da instituição ainda não enviou os dados desta competência."
        />
      </div>
    </div>
  );
}
