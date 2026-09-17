import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EstadoVazio } from "@/components/dominio/estado-vazio";

export interface ColunaTabela<T> {
  id: string;
  cabecalho: string;
  renderizar: (item: T) => ReactNode;
  alinhamento?: "left" | "right" | "center";
  className?: string;
}

export interface TabelaDadosProps<T> {
  colunas: ColunaTabela<T>[];
  dados: T[];
  chave: (item: T) => string;
  tituloVazio?: string;
  mensagemVazia?: string;
  className?: string;
}

const CLASSE_ALINHAMENTO: Record<"left" | "right" | "center", string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function TabelaDados<T>({
  colunas,
  dados,
  chave,
  tituloVazio = "Nenhum registro encontrado",
  mensagemVazia = "Não há dados para exibir com os filtros atuais.",
  className,
}: TabelaDadosProps<T>) {
  if (dados.length === 0) {
    return <EstadoVazio titulo={tituloVazio} mensagem={mensagemVazia} />;
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className="bg-neutral-50">
          {colunas.map((coluna) => (
            <TableHead
              key={coluna.id}
              className={cn(
                "px-4 py-3 font-semibold text-neutral-700 whitespace-normal",
                CLASSE_ALINHAMENTO[coluna.alinhamento ?? "left"],
                coluna.className
              )}
            >
              {coluna.cabecalho}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((item) => (
          <TableRow key={chave(item)}>
            {colunas.map((coluna) => (
              <TableCell
                key={coluna.id}
                className={cn(
                  "px-4 py-3 whitespace-normal text-neutral-600",
                  CLASSE_ALINHAMENTO[coluna.alinhamento ?? "left"],
                  coluna.className
                )}
              >
                {coluna.renderizar(item)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
