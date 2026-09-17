import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  Clock,
  FileCog,
  Inbox,
  PackageCheck,
  SearchCheck,
  TriangleAlert,
  Unlock,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EstadoPeriodo } from "@/lib/tipos";

type VarianteStatus = "neutral" | "info" | "success" | "warning" | "error";

interface ConfiguracaoEstado {
  rotulo: string;
  variante: VarianteStatus;
  icone: LucideIcon;
}

const CONFIGURACAO_ESTADO: Record<EstadoPeriodo, ConfiguracaoEstado> = {
  aguardando_dados: { rotulo: "Aguardando dados", variante: "neutral", icone: Clock },
  dados_ingeridos: { rotulo: "Dados recebidos", variante: "info", icone: Inbox },
  gerado: { rotulo: "Arquivo gerado", variante: "info", icone: FileCog },
  aguardando_contador: { rotulo: "Aguardando contador", variante: "warning", icone: Calculator },
  em_validacao: { rotulo: "Em validação", variante: "info", icone: SearchCheck },
  validado: { rotulo: "Validado", variante: "success", icone: CheckCircle2 },
  com_excecoes: { rotulo: "Com exceções", variante: "error", icone: TriangleAlert },
  liberado: { rotulo: "Liberado", variante: "success", icone: Unlock },
  aprovado: { rotulo: "Aprovado", variante: "success", icone: BadgeCheck },
  entregue: { rotulo: "Entregue", variante: "success", icone: PackageCheck },
  retorno_com_erro: { rotulo: "Retorno com erro", variante: "error", icone: XCircle },
};

const CLASSE_VARIANTE: Record<VarianteStatus, string> = {
  neutral: "status-badge-neutral",
  info: "status-badge-info",
  success: "status-badge-success",
  warning: "status-badge-warning",
  error: "status-badge-error",
};

export interface BadgeStatusProps {
  estado: EstadoPeriodo;
  className?: string;
}

export function BadgeStatus({ estado, className }: BadgeStatusProps) {
  const configuracao = CONFIGURACAO_ESTADO[estado];
  const Icone = configuracao.icone;

  return (
    <span className={cn("status-badge", CLASSE_VARIANTE[configuracao.variante], className)}>
      <Icone className="size-3.5" aria-hidden="true" />
      {configuracao.rotulo}
    </span>
  );
}

export interface BadgeAtrasadoProps {
  dias: number;
  className?: string;
}

export function BadgeAtrasado({ dias, className }: BadgeAtrasadoProps) {
  if (dias <= 0) {
    return null;
  }

  return (
    <span className={cn("status-badge status-badge-error", className)}>
      <TriangleAlert className="size-3.5" aria-hidden="true" />
      Atrasado · {dias} {dias === 1 ? "dia" : "dias"}
    </span>
  );
}
