import { FichaCliente } from "@/components/clientes/ficha-cliente";

interface PaginaProps {
  params: Promise<{ id: string }>;
}

export default async function ClienteDetalhePage({ params }: PaginaProps) {
  const { id } = await params;
  return <FichaCliente tenantId={id} />;
}
