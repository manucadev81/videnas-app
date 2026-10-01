import { diasDesdeTransmissao } from "@/lib/mock/periodos";
import type { PeriodoObrigacao, ProtocoloBCB } from "@/lib/tipos";

export function ProtocoloComRetorno({
  periodo,
  protocolo,
}: {
  periodo: PeriodoObrigacao;
  protocolo: ProtocoloBCB | undefined;
}) {
  if (!protocolo) {
    return <>—</>;
  }

  const dias = periodo.estado === "aguardando_retorno" ? diasDesdeTransmissao(periodo) : null;

  return (
    <span className="flex flex-col">
      <span className="font-mono text-xs">{protocolo.numeroProtocolo}</span>
      {dias !== null ? (
        <span className="text-xs text-status-warning-text">
          Aguardando retorno há {dias} {dias === 1 ? "dia" : "dias"}
        </span>
      ) : null}
    </span>
  );
}
