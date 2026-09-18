"use client";

import { useMemo, useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { BadgeAjuda } from "@/components/ajuda/badge-ajuda";
import { BadgeStatus } from "@/components/dominio/badge-status";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { PainelCompletude } from "@/components/fornecimento/painel-completude";
import { PainelPendencias } from "@/components/fornecimento/painel-pendencias";
import { CartaoInsumo } from "@/components/fornecimento/cartao-insumo";
import { PreviaCanonica } from "@/components/fornecimento/previa-canonica";
import {
  ComprovanteEnvio,
  type ContextoComprovanteEnvio,
} from "@/components/fornecimento/comprovante-envio";
import {
  INSUMO_PRINCIPAL_POR_MODULO,
  idAncoraInsumo,
} from "@/components/fornecimento/constantes";
import { useEvidenciasStore, fornecimentosDoPeriodo, ultimoLacreDe } from "@/lib/store/evidencias";
import { usePeriodosStore } from "@/lib/store/periodos";
import { buscarInsumos, calcularCompletude } from "@/lib/fornecimento";
import { criptografiaDisponivel } from "@/lib/evidencias/cripto";
import type { AutorLacre } from "@/lib/evidencias/lacre";
import { buscarModulo } from "@/lib/mock/modulos";
import { formatarCompetencia } from "@/lib/formatadores";
import type { Instituicao, InsumoDefinicao, PerfilId, PeriodoObrigacao, RegistroLacre } from "@/lib/tipos";

const MOTIVO_SEM_CRIPTOGRAFIA =
  "Este navegador não expõe a Web Crypto API, então a Videnas não consegue lacrar os envios. Abra a plataforma em um navegador atualizado e em conexão segura (HTTPS) para fornecer os dados.";

const MOTIVO_OUTRO_PERFIL =
  "Somente o perfil Cliente / Fornecedor de dados envia insumos por esta tela. Você está consultando o andamento do fornecimento.";

export interface PainelPeriodoProps {
  periodo: PeriodoObrigacao;
  instituicao: Instituicao | undefined;
  perfilAtivo: PerfilId;
  usuarioId: string;
  autor: AutorLacre;
}

function rolarAteInsumo(insumoId: string) {
  const alvo = document.getElementById(idAncoraInsumo(insumoId));
  if (!alvo) {
    return;
  }

  const reduzirMovimento =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  alvo.scrollIntoView({ behavior: reduzirMovimento ? "auto" : "smooth", block: "start" });

  const focavel = alvo.querySelector<HTMLElement>('[role="button"], button, input:not([tabindex="-1"]), select, textarea');
  focavel?.focus({ preventScroll: true });
}

export function PainelPeriodo({
  periodo,
  instituicao,
  perfilAtivo,
  usuarioId,
  autor,
}: PainelPeriodoProps) {
  const fornecimentosPorPeriodo = useEvidenciasStore((estado) => estado.fornecimentos);
  const lacres = useEvidenciasStore((estado) => estado.lacres);
  const podeExecutar = usePeriodosStore((estado) => estado.podeExecutar);

  const [comprovanteAberto, setComprovanteAberto] = useState(false);
  const [lacreVisivel, setLacreVisivel] = useState<RegistroLacre | null>(null);
  const [insumoDoComprovante, setInsumoDoComprovante] = useState<InsumoDefinicao | null>(null);
  const [aviso, setAviso] = useState("");

  const criptoDisponivel = criptografiaDisponivel();

  const fornecimentos = useMemo(
    () => fornecimentosDoPeriodo(fornecimentosPorPeriodo, periodo.id),
    [fornecimentosPorPeriodo, periodo.id]
  );

  const completude = useMemo(
    () => calcularCompletude(periodo, fornecimentos),
    [periodo, fornecimentos]
  );

  const insumos = buscarInsumos(periodo.moduloId);
  const modulo = buscarModulo(periodo.moduloId);
  const competenciaRotulo = formatarCompetencia(periodo.competencia);
  const insumoPrincipalId = INSUMO_PRINCIPAL_POR_MODULO[periodo.moduloId];

  const avaliacao = podeExecutar(perfilAtivo, "fornecer_dados", periodo.id, usuarioId);
  const podeFornecer = avaliacao.permitido && criptoDisponivel;
  const modoConsulta = perfilAtivo !== "cliente";

  const motivoBloqueio = !criptoDisponivel
    ? MOTIVO_SEM_CRIPTOGRAFIA
    : avaliacao.visivel
      ? (avaliacao.motivo ?? null)
      : MOTIVO_OUTRO_PERFIL;

  const contextoComprovante: ContextoComprovanteEnvio = {
    instituicaoNome: instituicao?.nomeFantasia ?? "Instituição da demonstração",
    instituicaoCnpj: instituicao?.cnpj,
    moduloNome: modulo.nomeCompleto,
    competenciaRotulo,
    insumoRotulo: insumoDoComprovante?.rotulo ?? null,
  };

  function abrirComprovante(lacre: RegistroLacre, definicao: InsumoDefinicao) {
    setLacreVisivel(lacre);
    setInsumoDoComprovante(definicao);
    setComprovanteAberto(true);
  }

  function registrarConclusao(lacre: RegistroLacre, definicao: InsumoDefinicao) {
    setAviso(`${definicao.rotulo} foi recebido e lacrado sob o identificador ${lacre.id}.`);
    abrirComprovante(lacre, definicao);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-bold text-neutral-700">
          {modulo.nome} · {competenciaRotulo}
        </h2>
        {modulo.candidato ? <SeloCandidato tamanho="sm" /> : null}
        <BadgeStatus estado={periodo.estado} />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {aviso}
      </p>

      {criptoDisponivel ? null : (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-status-error-border bg-status-error-bg p-4"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-status-error-text" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-status-error-text">
              Envios indisponíveis neste navegador
            </p>
            <p className="text-sm text-status-error-text/90">{MOTIVO_SEM_CRIPTOGRAFIA}</p>
          </div>
        </div>
      )}

      {modoConsulta ? (
        <div
          role="note"
          className="flex gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600"
        >
          <Lock className="mt-0.5 size-4 shrink-0 text-neutral-500" aria-hidden="true" />
          <div className="min-w-0 leading-relaxed">
            <p className="flex items-center gap-1.5 font-medium text-neutral-700">
              Modo consulta
              <BadgeAjuda chave="fornecimento.acompanhamento" tamanho="xs" side="top" />
            </p>
            <p className="mt-1">
              Apenas o Cliente fornece os dados. Use &quot;Notificar cliente&quot; no período da
              obrigação para cobrar o que falta.
            </p>
          </div>
        </div>
      ) : null}

      <PainelCompletude
        completude={completude}
        competenciaRotulo={competenciaRotulo}
        moduloNome={modulo.nomeCompleto}
      />

      <PainelPendencias pendencias={completude.pendencias} aoIrParaInsumo={rolarAteInsumo} />

      <section data-tour="fornecimento-checklist" aria-labelledby="fornecimento-checklist-titulo">
        <div className="mb-3">
          <h2
            id="fornecimento-checklist-titulo"
            className="flex items-center gap-1.5 font-display text-lg font-bold text-neutral-700"
          >
            Checklist de insumos
            <BadgeAjuda chave="fornecimento.checklist" tamanho="sm" />
          </h2>
          <p className="text-sm text-neutral-500">
            {podeFornecer
              ? "Envie cada insumo abaixo. Tudo o que entra é lacrado no ato e não pode mais ser alterado."
              : "Acompanhe o que a instituição já forneceu nesta competência. O envio é feito pelo perfil Cliente / Fornecedor de dados."}
          </p>
        </div>

        <div className="space-y-4">
          {insumos.map((definicao, indice) => (
            <CartaoInsumo
              key={definicao.id}
              periodo={periodo}
              definicao={definicao}
              fornecimento={fornecimentos[definicao.id]}
              lacre={ultimoLacreDe(lacres, periodo.id, definicao.id)}
              principal={definicao.id === insumoPrincipalId}
              primeiro={indice === 0}
              autor={autor}
              instituicaoNome={instituicao?.nomeFantasia ?? "esta instituição"}
              podeFornecer={podeFornecer}
              motivoBloqueio={motivoBloqueio}
              aoConcluir={registrarConclusao}
              aoVerComprovante={abrirComprovante}
            />
          ))}
        </div>
      </section>

      {completude.statusCanonico === "incompleto" ? null : (
        <PreviaCanonica periodo={periodo} fornecimentos={fornecimentos} />
      )}

      <ComprovanteEnvio
        lacre={lacreVisivel}
        contexto={contextoComprovante}
        aberto={comprovanteAberto}
        aoAlterarAbertura={setComprovanteAberto}
      />
    </div>
  );
}
