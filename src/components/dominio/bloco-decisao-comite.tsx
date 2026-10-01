import { DESFECHOS_COMITE } from "@/lib/mock/configuracao-fluxo";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { formatarDataHora } from "@/lib/formatadores";
import type { DecisaoComiteQualidade } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export interface BlocoDecisaoComiteProps {
  decisao: DecisaoComiteQualidade;
  titulo?: string;
  mostrarPlano?: boolean;
  className?: string;
}

export function BlocoDecisaoComite({
  decisao,
  titulo = "Decisão do Comitê de Qualidade",
  mostrarPlano = true,
  className,
}: BlocoDecisaoComiteProps) {
  const presidente = buscarUsuario(decisao.presidenteId)?.nome ?? decisao.presidenteId;
  const membro = buscarUsuario(decisao.membroId)?.nome ?? decisao.membroId;

  return (
    <div
      data-tour="bloco-decisao-comite"
      className={cn("space-y-1 rounded-md bg-white/60 p-3 text-xs", className)}
    >
      <p className="font-semibold">{titulo}</p>
      <p>{DESFECHOS_COMITE[decisao.desfecho].rotulo}</p>
      <p>
        <span className="font-semibold">Justificativa:</span> {decisao.justificativa}
      </p>
      {mostrarPlano && decisao.planoCorrecao ? (
        <p>
          <span className="font-semibold">Plano de correção:</span> {decisao.planoCorrecao}
        </p>
      ) : null}
      <p className="opacity-80">
        {presidente} e {membro} · {formatarDataHora(decisao.decididoEm)}
        {decisao.lacreAtaId ? (
          <>
            {" "}
            · ata <span className="font-mono">{decisao.lacreAtaId}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
