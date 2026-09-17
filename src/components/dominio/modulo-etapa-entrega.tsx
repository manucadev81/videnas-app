"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileCheck2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PainelArquivo } from "@/components/dominio/painel-arquivo";
import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { AvisoEnvelope } from "@/components/evidencias/aviso-envelope";
import { ValorHash } from "@/components/evidencias/valor-hash";
import { useCriptoDisponivel } from "@/components/evidencias/use-cripto-disponivel";
import {
  baixarComprovante,
  contextoComprovanteDoLacre,
} from "@/components/evidencias/comprovante";
import { lacreDeSaidaDoArquivo, useEvidenciasStore } from "@/lib/store/evidencias";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarPerfil } from "@/lib/permissoes";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { formatarDataHora, formatarTamanhoArquivo } from "@/lib/formatadores";
import type { ArquivoGerado, EstadoPeriodo, ProtocoloBCB } from "@/lib/tipos";

const ESTADOS_COM_PROVA_DE_ENTREGA: EstadoPeriodo[] = ["liberado", "aprovado", "entregue"];

function ProvaDeEntrega({
  periodoId,
  arquivoCorrente,
}: {
  periodoId: string;
  arquivoCorrente: ArquivoGerado | undefined;
}) {
  const periodo = usePeriodosStore((estado) => estado.periodos[periodoId]);
  const hidratado = useEvidenciasStore((estado) => estado.hidratado);
  const lacres = useEvidenciasStore((estado) => estado.lacres);
  const registrarEntregaAoCliente = useEvidenciasStore(
    (estado) => estado.registrarEntregaAoCliente
  );
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);
  const criptoDisponivel = useCriptoDisponivel();
  const [gerando, setGerando] = useState(false);

  if (!periodo || !arquivoCorrente || !ESTADOS_COM_PROVA_DE_ENTREGA.includes(periodo.estado)) {
    return null;
  }

  const perfilMetadados = perfilAtivo ? buscarPerfil(perfilAtivo) : undefined;
  const podeGerarProva = Boolean(
    perfilMetadados &&
      perfilMetadados.lado === "videnas" &&
      perfilMetadados.acoesPermitidas.includes("ver_evidencias")
  );
  const podeBaixarComprovante = Boolean(
    perfilMetadados && perfilMetadados.acoesPermitidas.includes("baixar_comprovante")
  );

  const lacreDeSaida = lacreDeSaidaDoArquivo(lacres, arquivoCorrente.id);

  async function gerarProva() {
    if (!periodo || !arquivoCorrente || !perfilAtivo || !usuarioId) {
      return;
    }

    const usuario = buscarUsuario(usuarioId);
    setGerando(true);

    try {
      const resultado = await registrarEntregaAoCliente({
        periodo,
        arquivo: arquivoCorrente,
        autor: {
          usuarioId,
          nome: usuario?.nome ?? usuarioId,
          perfilId: perfilAtivo,
        },
      });

      if (resultado.sucesso) {
        toast.success("Prova de entrega gerada e lacrada.");
      } else {
        toast.error(resultado.motivo ?? "Não foi possível gerar a prova de entrega.");
      }
    } catch {
      toast.error("Não foi possível gerar a prova de entrega.");
    } finally {
      setGerando(false);
    }
  }

  function baixar() {
    if (!lacreDeSaida) {
      return;
    }
    try {
      baixarComprovante(
        lacreDeSaida,
        contextoComprovanteDoLacre(
          lacreDeSaida,
          "Comprovante do arquivo disponibilizado pela Videnas à instituição."
        )
      );
      toast.success("Comprovante de entrega baixado.");
    } catch {
      toast.error("Não foi possível gerar o comprovante de entrega.");
    }
  }

  return (
    <section
      data-tour="entrega-prova"
      className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div>
        <h2 className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700">
          <ShieldCheck className="size-5 text-brand-700" aria-hidden="true" />
          Prova de entrega
          <BadgeAjuda chave="evidencia.comprovanteEntrega" tamanho="xs" side="bottom" />
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          O lacre de saída registra exatamente qual arquivo a Videnas disponibilizou para a
          instituição, com hash, data, hora e nome de quem liberou. É a contraparte do lacre de
          entrada: junto, os dois fecham o ciclo de custódia da competência.
        </p>
      </div>

      {!hidratado ? (
        <div role="status" aria-label="Carregando prova de entrega" className="space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : lacreDeSaida ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-status-success-border bg-status-success-bg p-4">
            <p className="flex items-center gap-2 font-display text-base font-bold text-status-success-text">
              <FileCheck2 className="size-5" aria-hidden="true" />
              Entrega lacrada
            </p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs font-medium text-neutral-500">Identificador do lacre</dt>
                <dd className="mt-0.5 font-mono text-xs break-all text-neutral-700">
                  {lacreDeSaida.id}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-neutral-500">Arquivo entregue</dt>
                <dd className="mt-0.5 text-sm break-all text-neutral-700">
                  {lacreDeSaida.origemNome}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-neutral-500">Liberado em</dt>
                <dd className="mt-0.5 text-sm text-neutral-700">
                  {formatarDataHora(lacreDeSaida.seladoEm)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-neutral-500">Quem liberou</dt>
                <dd className="mt-0.5 text-sm text-neutral-700">
                  {lacreDeSaida.seladoPorNome} · {buscarPerfil(lacreDeSaida.perfilId).rotulo}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-neutral-500">Tamanho</dt>
                <dd className="mt-0.5 text-sm text-neutral-700">
                  {formatarTamanhoArquivo(lacreDeSaida.tamanhoBytes)}
                </dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                  Hash {lacreDeSaida.algoritmoHash}
                  <BadgeAjuda chave="evidencia.hash" tamanho="xs" side="top" />
                </dt>
                <dd className="mt-1">
                  <ValorHash hash={lacreDeSaida.hashSha256} descricao="hash do lacre de saída" />
                </dd>
              </div>
            </dl>
          </div>

          {podeBaixarComprovante ? (
            <Button type="button" variant="outline" onClick={baixar}>
              <Download aria-hidden="true" />
              Baixar comprovante de entrega
            </Button>
          ) : null}
        </div>
      ) : podeGerarProva ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            Este período já foi liberado, mas ainda não tem lacre de saída. Gere a prova para
            registrar o arquivo entregue na cadeia de custódia.
          </p>
          {criptoDisponivel ? (
            <Button type="button" onClick={gerarProva} disabled={gerando}>
              {gerando ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck aria-hidden="true" />
              )}
              {gerando ? "Gerando prova de entrega…" : "Gerar prova de entrega"}
            </Button>
          ) : (
            <p className="rounded-md border border-status-warning-border bg-status-warning-bg p-3 text-sm text-status-warning-text">
              Este navegador não expõe a Web Crypto API, então o lacre de saída não pode ser gerado
              aqui. Abra a plataforma em um navegador atualizado para concluir a prova de entrega.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-neutral-600">
          A prova de entrega é gerada pelo time Videnas no momento da liberação. Assim que ela
          existir, o hash e o comprovante aparecem aqui.
        </p>
      )}

      <AvisoEnvelope />
    </section>
  );
}

export interface EtapaEntregaProps {
  periodoId: string;
  ehFiscal: boolean;
  arquivoCorrente: ArquivoGerado | undefined;
  protocoloCorrente: ProtocoloBCB | undefined;
  competenciaRotulo: string;
}

export function EtapaEntrega({
  periodoId,
  ehFiscal,
  arquivoCorrente,
  protocoloCorrente,
  competenciaRotulo,
}: EtapaEntregaProps) {
  return (
    <>
      {!ehFiscal ? (
        <div data-tour="entrega-conteudo" className="space-y-4">
          {arquivoCorrente ? (
            <PainelArquivo arquivo={arquivoCorrente} competenciaRotulo={competenciaRotulo} />
          ) : null}
          <BannerPosicionamento variante="info" titulo="Transmissão ao Banco Central">
            O arquivo está pronto e íntegro. A transmissão ao Banco Central é feita pela instituição, fora do
            Videnas. Depois de enviar, registre aqui o protocolo recebido para manter a trilha de
            auditoria completa.
          </BannerPosicionamento>
          {protocoloCorrente ? (
            <div className="rounded-lg border border-status-success-border bg-status-success-bg p-5">
              <h2 className="mb-2 font-display text-lg font-bold text-status-success-text">Protocolo registrado</h2>
              <p className="font-mono text-sm text-status-success-text">{protocoloCorrente.numeroProtocolo}</p>
              <p className="text-xs text-status-success-text">
                {formatarDataHora(protocoloCorrente.dataHoraEnvio)} · canal {protocoloCorrente.canalEnvio} ·
                registrado por {buscarUsuario(protocoloCorrente.registradoPorUsuarioId)?.nome ?? "—"}
              </p>
              <p className="mt-2 text-sm text-status-success-text">
                Situação do retorno:{" "}
                {protocoloCorrente.situacaoRetorno === "aguardando"
                  ? "Aguardando retorno do BCB"
                  : protocoloCorrente.situacaoRetorno === "aceito"
                    ? "Aceito"
                    : protocoloCorrente.situacaoRetorno === "aceito_com_ressalvas"
                      ? "Aceito com ressalvas"
                      : "Rejeitado"}
              </p>
              {protocoloCorrente.mensagemRetorno ? (
                <p className="text-xs text-status-success-text">
                  {protocoloCorrente.codigoRetorno} — {protocoloCorrente.mensagemRetorno}
                </p>
              ) : null}
            </div>
          ) : (
            <EstadoVazio
              titulo="A entrega será liberada após a aprovação do Diretor/Compliance"
              mensagem="Assim que o período for aprovado, o protocolo do Banco Central pode ser registrado por aqui."
            />
          )}
        </div>
      ) : (
        <>
          <BannerPosicionamento variante="atencao" />
          {arquivoCorrente ? (
            <PainelArquivo arquivo={arquivoCorrente} competenciaRotulo={competenciaRotulo} />
          ) : null}
          {protocoloCorrente ? (
            <div className="rounded-lg border border-status-success-border bg-status-success-bg p-5">
              <h2 className="mb-2 font-display text-lg font-bold text-status-success-text">Encaminhamento registrado</h2>
              <p className="text-sm text-status-success-text">{protocoloCorrente.observacao}</p>
              <p className="text-xs text-status-success-text">
                {formatarDataHora(protocoloCorrente.dataHoraEnvio)} · registrado por{" "}
                {buscarUsuario(protocoloCorrente.registradoPorUsuarioId)?.nome ?? "—"}
              </p>
            </div>
          ) : (
            <EstadoVazio
              titulo="A entrega será liberada após a aprovação do Diretor/Compliance"
              mensagem="A emissão da NFS-e ocorre fora da Videnas, pelo emissor definido pela instituição."
            />
          )}
        </>
      )}

      <ProvaDeEntrega periodoId={periodoId} arquivoCorrente={arquivoCorrente} />
    </>
  );
}
