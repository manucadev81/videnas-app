"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Archive, Download, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { PainelExcecoes } from "@/components/dominio/modulo-painel-excecoes";
import { BadgeTipoArtefato } from "@/components/evidencias/badge-tipo-artefato";
import { DialogoVerificarIntegridade } from "@/components/evidencias/dialogo-verificar-integridade";
import { ValorHash } from "@/components/evidencias/valor-hash";
import { baixarConteudoLacrado } from "@/components/evidencias/conteudo-lacrado";
import { useEvidenciasStore } from "@/lib/store/evidencias";
import { usePeriodosStore } from "@/lib/store/periodos";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { diasDesdeTransmissao } from "@/lib/mock/periodos";
import {
  configuracaoFluxo,
  retornoSomentePosicionamento,
  rotuloRetornoDoModulo,
} from "@/lib/mock/configuracao-fluxo";
import { formatarData, formatarDataHora, formatarTamanhoArquivo } from "@/lib/formatadores";
import type { RegistroLacre, SituacaoRetornoBcb } from "@/lib/tipos";

const ROTULOS_SITUACAO: Record<SituacaoRetornoBcb, string> = {
  aguardando: "Aguardando retorno",
  aceito: "Aceito",
  aceito_com_ressalvas: "Aceito com ressalvas",
  rejeitado: "Rejeitado",
};

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-neutral-500">{rotulo}</dt>
      <dd className="mt-0.5 text-sm break-words text-neutral-700">{children}</dd>
    </div>
  );
}

function LinhaLacre({
  titulo,
  lacre,
  aoVerificar,
  baixavel,
}: {
  titulo: string;
  lacre: RegistroLacre;
  aoVerificar: (lacre: RegistroLacre) => void;
  baixavel: boolean;
}) {
  async function baixar() {
    try {
      await baixarConteudoLacrado(lacre);
      toast.success("Conteúdo lacrado baixado. Use-o para conferir a integridade.");
    } catch {
      toast.error("Este lacre veio da carga inicial de demonstração e não guarda conteúdo recuperável.");
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <BadgeTipoArtefato lacre={lacre} />
        <span className="text-sm font-medium text-neutral-700">{titulo}</span>
      </div>
      <p className="font-mono text-xs break-all text-neutral-600">{lacre.id}</p>
      <ValorHash hash={lacre.hashSha256} truncado descricao="hash do lacre" />
      <p className="text-xs text-neutral-500">
        {lacre.hashAnterior
          ? `Encadeado após ${lacre.hashAnterior.slice(0, 16)}…`
          : "Primeiro elo da cadeia."}{" "}
        · {formatarDataHora(lacre.seladoEm)} · {lacre.seladoPorNome}
      </p>
      <div className="flex flex-wrap gap-2">
        {baixavel ? (
          <Button type="button" variant="outline" size="sm" onClick={baixar}>
            <Download aria-hidden="true" />
            Baixar conteúdo lacrado
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={() => aoVerificar(lacre)}>
          Verificar integridade
        </Button>
      </div>
    </div>
  );
}

export function PainelRetorno({ periodoId }: { periodoId: string }) {
  const periodo = usePeriodosStore((estado) => estado.periodos[periodoId]);
  const protocolos = usePeriodosStore((estado) => estado.protocolos);
  const excecoesStore = usePeriodosStore((estado) => estado.excecoes);
  const lacres = useEvidenciasStore((estado) => estado.lacres);
  const [lacreEmConferencia, setLacreEmConferencia] = useState<RegistroLacre | null>(null);

  if (!periodo) {
    return null;
  }

  const estadosComRetorno = [
    "aguardando_retorno",
    "retorno_aceito",
    "retorno_com_ressalvas",
    "retorno_rejeitado",
    "arquivado",
  ];
  if (!estadosComRetorno.includes(periodo.estado)) {
    return null;
  }

  const protocolo = periodo.protocoloId ? protocolos[periodo.protocoloId] : undefined;
  const rotulo = rotuloRetornoDoModulo(periodo.moduloId);
  const somentePosicionamento = retornoSomentePosicionamento(periodo.moduloId);
  const retorno = protocolo?.retornoRegulador ?? null;
  const dias = diasDesdeTransmissao(periodo);
  const aguardando = periodo.estado === "aguardando_retorno";
  const excecoesRetorno = Object.values(excecoesStore).filter(
    (excecao) => excecao.periodoId === periodoId && excecao.origem === "retorno_bcb"
  );
  const lacreAnexo = retorno?.anexoLacreId ? lacres[retorno.anexoLacreId] : undefined;
  const lacreRecibo = retorno?.reciboLacreId ? lacres[retorno.reciboLacreId] : undefined;

  return (
    <section
      data-tour="entrega-retorno"
      className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div>
        <h2 className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
          <Radio className="size-5 text-brand-700" aria-hidden="true" />
          Retorno do regulador · {rotulo}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {aguardando
            ? `Transmitido há ${dias ?? 0} ${dias === 1 ? "dia" : "dias"} · protocolo ${protocolo?.numeroProtocolo ?? "—"}. O retorno ainda não foi registrado.`
            : somentePosicionamento
              ? `Protocolo ${protocolo?.numeroProtocolo ?? "—"} · aprovado: ${protocolo?.situacaoRetorno === "aceito" ? "sim" : "não"}.`
              : `Protocolo ${protocolo?.numeroProtocolo ?? "—"} · situação: ${ROTULOS_SITUACAO[protocolo?.situacaoRetorno ?? "aguardando"]}.`}
        </p>
      </div>

      {!aguardando && protocolo ? (
        <dl className="grid gap-4 sm:grid-cols-2">
          {somentePosicionamento ? (
            <Campo rotulo="Aprovado">{protocolo.situacaoRetorno === "aceito" ? "Sim" : "Não"}</Campo>
          ) : (
            <>
              <Campo rotulo="Artefato">{rotulo}</Campo>
              <Campo rotulo="Identificador">{retorno?.identificador ?? "—"}</Campo>
              <Campo rotulo="Data do retorno">
                {retorno?.dataInformada
                  ? formatarData(retorno.dataInformada)
                  : protocolo.dataRetorno
                    ? formatarData(protocolo.dataRetorno)
                    : "—"}
              </Campo>
              <Campo rotulo="Código">{protocolo.codigoRetorno ?? "—"}</Campo>
              <div className="sm:col-span-2">
                <Campo rotulo="Mensagem">{protocolo.mensagemRetorno ?? "—"}</Campo>
              </div>
            </>
          )}
          {retorno?.anexoNome ? (
            <Campo rotulo="Arquivo anexado">
              {retorno.anexoNome}
              {retorno.anexoTamanhoBytes ? ` · ${formatarTamanhoArquivo(retorno.anexoTamanhoBytes)}` : ""}
            </Campo>
          ) : null}
        </dl>
      ) : null}

      {lacreAnexo || lacreRecibo ? (
        <div className="space-y-2">
          <h3 className="font-display text-base font-bold text-neutral-700">Lacres do retorno</h3>
          {lacreAnexo ? (
            <LinhaLacre
              titulo="Arquivo anexado ao retorno"
              lacre={lacreAnexo}
              aoVerificar={setLacreEmConferencia}
              baixavel={false}
            />
          ) : null}
          {lacreRecibo ? (
            <LinhaLacre
              titulo="Recibo do retorno"
              lacre={lacreRecibo}
              aoVerificar={setLacreEmConferencia}
              baixavel
            />
          ) : null}
        </div>
      ) : null}

      {periodo.estado === "retorno_rejeitado" ? (
        <BannerPosicionamento variante="atencao" titulo="Retorno rejeitado">
          A exceção abaixo foi aberta com origem no retorno. O Executor pode reabrir o período para
          iniciar a correção.
        </BannerPosicionamento>
      ) : null}

      {excecoesRetorno.length > 0 ? (
        <div className="space-y-2">
          <h3 className="font-display text-base font-bold text-neutral-700">Exceções do retorno</h3>
          <PainelExcecoes excecoes={excecoesRetorno} />
        </div>
      ) : null}

      <DialogoVerificarIntegridade
        lacre={lacreEmConferencia}
        aoFechar={() => setLacreEmConferencia(null)}
      />
    </section>
  );
}

export function PainelArquivamento({ periodoId }: { periodoId: string }) {
  const periodo = usePeriodosStore((estado) => estado.periodos[periodoId]);
  const lacres = useEvidenciasStore((estado) => estado.lacres);
  const [lacreEmConferencia, setLacreEmConferencia] = useState<RegistroLacre | null>(null);

  if (!periodo || periodo.estado !== "arquivado") {
    return null;
  }

  const lacre = periodo.arquivamentoLacreId ? lacres[periodo.arquivamentoLacreId] : undefined;
  const arquivadoPor = periodo.arquivadoPorUsuarioId
    ? buscarUsuario(periodo.arquivadoPorUsuarioId)
    : undefined;

  return (
    <section
      data-tour="entrega-arquivamento"
      className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div>
        <h2 className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
          <Archive className="size-5 text-brand-700" aria-hidden="true" />
          Período arquivado
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Arquivado {periodo.arquivadoEm ? `em ${formatarDataHora(periodo.arquivadoEm)}` : ""}
          {arquivadoPor ? ` por ${arquivadoPor.nome}` : ""}. Somente leitura: nenhuma ação altera o
          período.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Retenção">
          {periodo.retencaoAte ? `Retido até ${formatarData(periodo.retencaoAte)}` : "Prazo de retenção não configurado"}
          {configuracaoFluxo.retencao?.baseLegal ? ` — ${configuracaoFluxo.retencao.baseLegal}` : ""}
        </Campo>
        <Campo rotulo="Lacre do dossiê">{lacre ? lacre.id : (periodo.arquivamentoLacreId ?? "—")}</Campo>
      </dl>

      {lacre ? (
        <LinhaLacre
          titulo="Dossiê de arquivamento"
          lacre={lacre}
          aoVerificar={setLacreEmConferencia}
          baixavel
        />
      ) : null}

      <DialogoVerificarIntegridade
        lacre={lacreEmConferencia}
        aoFechar={() => setLacreEmConferencia(null)}
      />
    </section>
  );
}
