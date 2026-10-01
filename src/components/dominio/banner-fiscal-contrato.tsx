"use client";

import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { useTenantsStore } from "@/lib/store/tenants";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { contratoDoModulo } from "@/lib/contrato";

export function BannerFiscalContrato({
  instituicaoId,
  emissaoIncluidaDoPeriodo,
}: {
  instituicaoId: string | null | undefined;
  emissaoIncluidaDoPeriodo?: boolean;
}) {
  const tenants = useTenantsStore((estado) => estado.tenants);
  const instituicao =
    instituicaoId && instituicaoId !== "todas"
      ? (tenants.find((tenant) => tenant.id === instituicaoId) ?? buscarInstituicao(instituicaoId))
      : undefined;
  const emissaoIncluida =
    emissaoIncluidaDoPeriodo ??
    (instituicao ? contratoDoModulo(instituicao, "fiscal").emissaoIncluida : undefined);

  return <BannerPosicionamento variante="atencao" emissaoIncluida={emissaoIncluida} />;
}
