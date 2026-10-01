import { Archive, FileCheck2, FileLock2, Paperclip, Upload } from "lucide-react";
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
};

const CLASSES: Record<TipoArtefatoLacre, string> = {
  insumo: "status-badge-info",
  arquivo_entregue: "status-badge-success",
  anexo_retorno: "status-badge-warning",
  recibo_retorno: "status-badge-warning",
  dossie_arquivamento: "status-badge-neutral",
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
