import type { EstadoPeriodo, EtapaId } from "@/lib/tipos";
import type { EstadoEtapa, EtapaStepperItem } from "@/components/dominio/stepper-etapas";

const ROTULOS_ETAPA: Record<EtapaId, string> = {
  ingestao: "Ingestão",
  geracao: "Geração",
  contador: "Contador",
  validacao: "Validação",
  auditoria: "Auditoria",
  entrega: "Entrega",
};

export interface MarcoEtapa {
  concluidaEm?: string | null;
  responsavelNome?: string | null;
}

export function construirEtapasStepper(
  etapasModulo: EtapaId[],
  etapaAtualId: EtapaId,
  estadoPeriodo: EstadoPeriodo,
  marcos: Partial<Record<EtapaId, MarcoEtapa>>
): EtapaStepperItem[] {
  const indiceAtual = etapasModulo.indexOf(etapaAtualId);

  return etapasModulo.map((etapaId, indice) => {
    let estado: EstadoEtapa;
    if (indice < indiceAtual) {
      estado = "concluida";
    } else if (indice > indiceAtual) {
      estado = "bloqueada";
    } else {
      const comErro =
        (estadoPeriodo === "com_excecoes" && etapaId === "validacao") ||
        (estadoPeriodo === "retorno_com_erro" && etapaId === "entrega");
      estado = comErro ? "erro" : "atual";
    }

    const marco = marcos[etapaId];
    return {
      id: etapaId,
      rotulo: ROTULOS_ETAPA[etapaId],
      estado,
      concluidaEm: estado === "concluida" ? (marco?.concluidaEm ?? null) : null,
      responsavelNome: estado === "concluida" ? (marco?.responsavelNome ?? null) : null,
    };
  });
}

export { ROTULOS_ETAPA };
