import {
  Archive,
  FileCheck2,
  FileLock2,
  FileSignature,
  FileText,
  Gavel,
  Paperclip,
  Send,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROTULOS_TIPO_ARTEFATO, tipoArtefatoDoLacre } from "@/lib/evidencias/lacre";
import type { RegistroLacre, TipoArtefatoLacre } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const ICONES: Record<TipoArtefatoLacre, LucideIcon> = {
  insumo: Upload,
  arquivo_entregue: FileLock2,
  anexo_retorno: Paperclip,
  recibo_retorno: FileCheck2,
  dossie_arquivamento: Archive,
  dossie_comite: Gavel,
  ata_comite: FileSignature,
  documento_fiscal: FileText,
  comprovante_transmissao: Send,
  anexo_protocolo_manual: Paperclip,
  recibo_protocolo_manual: FileCheck2,
  recibo_encaminhamento: FileCheck2,
};

const CLASSES: Record<TipoArtefatoLacre, string> = {
  insumo: "status-badge-info",
  arquivo_entregue: "status-badge-success",
  anexo_retorno: "status-badge-warning",
  recibo_retorno: "status-badge-warning",
  dossie_arquivamento: "status-badge-neutral",
  dossie_comite: "status-badge-warning",
  ata_comite: "status-badge-info",
  documento_fiscal: "status-badge-success",
  comprovante_transmissao: "status-badge-success",
  anexo_protocolo_manual: "status-badge-warning",
  recibo_protocolo_manual: "status-badge-warning",
  recibo_encaminhamento: "status-badge-warning",
};

export function BadgeTipoArtefato({
  lacre,
  className,
}: {
  lacre: Pick<RegistroLacre, "sentido" | "tipoArtefato">;
  className?: string;
}) {
  const tipo = tipoArtefatoDoLacre(lacre);
  const Icone = ICONES[tipo];

  return (
    <span className={cn("status-badge px-2 py-1 text-xs", CLASSES[tipo], className)}>
      <Icone className="size-3.5" aria-hidden="true" />
      {ROTULOS_TIPO_ARTEFATO[tipo]}
    </span>
  );
}
