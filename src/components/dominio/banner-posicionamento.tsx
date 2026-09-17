import type { ReactNode } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type VarianteBanner = "info" | "atencao";

export interface BannerPosicionamentoProps {
  variante?: VarianteBanner;
  titulo?: string;
  children?: ReactNode;
  className?: string;
}

const TEXTO_PADRAO: Record<VarianteBanner, { titulo: string; corpo: ReactNode }> = {
  info: {
    titulo: "O que a Videnas é — e o que ela não é",
    corpo: (
      <>
        A Videnas é uma prestadora de serviços tecnológicos: uma RegTech. Recebemos os dados
        que a sua instituição nos envia, estruturamos os arquivos no formato exigido pelo
        regulador, validamos contra o schema oficial e registramos a trilha de auditoria de cada
        etapa. A Videnas não é instituição financeira, não custodia ativos virtuais, não
        transmite o arquivo ao Banco Central em nome da instituição, não emite NFS-e e não
        substitui o trabalho do seu contador ou do seu advogado.
      </>
    ),
  },
  atencao: {
    titulo: "Atenção — Módulo Fiscal (Candidato)",
    corpo: (
      <>
        Este módulo é uma funcionalidade candidata, sujeita a decisão de produto. A Videnas
        estrutura os dados do serviço prestado no formato da DPS. A emissão da NFS-e acontece fora
        da Videnas, pelo emissor que a sua instituição definir. A definição de alíquota,
        retenção e enquadramento tributário é do contador responsável, cuja validação é
        obrigatória antes da liberação.
      </>
    ),
  },
};

export function BannerPosicionamento({
  variante = "info",
  titulo,
  children,
  className,
}: BannerPosicionamentoProps) {
  const conteudoPadrao = TEXTO_PADRAO[variante];
  const Icone = variante === "info" ? Info : TriangleAlert;

  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-lg border p-4",
        variante === "info"
          ? "border-status-info-border bg-status-info-bg"
          : "border-status-warning-border bg-status-warning-bg",
        className
      )}
    >
      <Icone
        className={cn(
          "mt-0.5 size-5 shrink-0",
          variante === "info" ? "text-status-info-text" : "text-status-warning-text"
        )}
        aria-hidden="true"
      />
      <div className={cn("text-sm", variante === "info" ? "text-status-info-text" : "text-status-warning-text")}>
        <p className="font-medium">{titulo ?? conteudoPadrao.titulo}</p>
        <div className="mt-1 leading-relaxed">{children ?? conteudoPadrao.corpo}</div>
      </div>
    </div>
  );
}
