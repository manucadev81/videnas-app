import { DetalhePeriodo } from "@/components/dominio/modulo-detalhe-periodo";

interface PaginaProps {
  params: Promise<{ periodoId: string }>;
}

export default async function AcamPeriodoPage({ params }: PaginaProps) {
  const { periodoId } = await params;
  return <DetalhePeriodo periodoId={periodoId} vozModulo="acam212" />;
}
