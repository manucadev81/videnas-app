"use client";

import Link from "next/link";
import { CheckCircle2, FileSignature, TriangleAlert } from "lucide-react";
import { DetalheCadastro, ResumoContratoModulo } from "@/components/contrato/painel-contrato";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useSessaoStore } from "@/lib/store/sessao";
import { useTenantsStore } from "@/lib/store/tenants";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import {
  avaliarDisponibilidadeDoPeriodo,
  contratoDoModulo,
  contratoMudouAposAprovacao,
  descreverCaminhoDeEntrega,
  type TomCaminhoEntrega,
} from "@/lib/contrato";
import { formatarData } from "@/lib/formatadores";
import { cn } from "@/lib/utils";

const CLASSES_TOM: Record<TomCaminhoEntrega, string> = {
  info: "border-status-info-border bg-status-info-bg text-status-info-text",
  atencao: "border-status-warning-border bg-status-warning-bg text-status-warning-text",
  sucesso: "border-status-success-border bg-status-success-bg text-status-success-text",
};

export function BlocoContratoEntrega({ periodoId }: { periodoId: string }) {
  const periodo = usePeriodosStore((estado) => estado.periodos[periodoId]);
  const tenants = useTenantsStore((estado) => estado.tenants);
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);

  if (!periodo) {
    return null;
  }

  const instituicao =
    tenants.find((tenant) => tenant.id === periodo.instituicaoId) ?? buscarInstituicao(periodo.instituicaoId);
  const modulo = buscarModulo(periodo.moduloId);
  const disponibilidade = avaliarDisponibilidadeDoPeriodo(periodo, instituicao);
  const caminho = descreverCaminhoDeEntrega(periodo, instituicao);
  const congelado = periodo.contratoCongelado;
  const mudouAposAprovacao = contratoMudouAposAprovacao(periodo, instituicao);
  const Icone = caminho.tom === "sucesso" ? CheckCircle2 : caminho.tom === "atencao" ? TriangleAlert : FileSignature;

  const link =
    perfilAtivo === "admin"
      ? { href: `/app/clientes/${periodo.instituicaoId}`, rotulo: "Ver contrato e cadastros do cliente" }
      : perfilAtivo === "diretor"
        ? { href: "/app/configuracoes/instituicao#contrato-cadastros", rotulo: "Ver contrato e cadastros da instituição" }
        : null;

  return (
    <section
      id="contrato-entrega"
      data-tour="entrega-contrato"
      className="scroll-mt-24 space-y-4 rounded-lg border border-neutral-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-neutral-700">
            Contrato e cadastro prévio · {modulo.nome}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {congelado
              ? "O que a Videnas emite e transmite nesta entrega segue o contrato congelado na aprovação e o cadastro prévio do canal."
              : "O que a Videnas emite e transmite nesta entrega vem do contrato da instituição e do cadastro prévio do canal."}
          </p>
        </div>
        {link ? (
          <Link
            href={link.href}
            className="rounded-sm text-xs font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            {link.rotulo}
          </Link>
        ) : (
          <span className="text-xs text-neutral-500">Contrato editável pelo Administrador, em Clientes.</span>
        )}
      </div>

      <div role="note" className={cn("flex gap-3 rounded-lg border p-4 text-sm", CLASSES_TOM[caminho.tom])}>
        <Icone className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">{caminho.titulo}</p>
          <p className="mt-1 leading-relaxed">{caminho.texto}</p>
        </div>
      </div>

      {congelado ? (
        <p className="text-sm font-medium text-neutral-700">
          Contrato vigente na aprovação ({formatarData(congelado.congeladoEm)})
        </p>
      ) : null}

      <ResumoContratoModulo moduloId={periodo.moduloId} contrato={disponibilidade.contrato} />

      {mudouAposAprovacao ? (
        <div
          role="note"
          className={cn("flex gap-3 rounded-lg border p-4 text-sm", CLASSES_TOM.atencao)}
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">O contrato mudou depois da aprovação</p>
            <p className="mt-1 leading-relaxed">
              A mudança não vale para este período, que segue o contrato congelado na aprovação. Ela vale só
              para períodos aprovados a partir de agora.
            </p>
            <p className="mt-2 text-xs font-medium">Contrato atual da instituição</p>
            <ResumoContratoModulo
              moduloId={periodo.moduloId}
              contrato={contratoDoModulo(instituicao, periodo.moduloId)}
            />
          </div>
        </div>
      ) : null}

      {disponibilidade.contrato.transmissaoIncluida ? (
        <div className="space-y-1.5 rounded-md bg-neutral-50 p-3">
          <p className="text-xs font-medium text-neutral-500">Cadastro prévio aplicável</p>
          <DetalheCadastro cadastro={disponibilidade.cadastro} />
        </div>
      ) : null}
    </section>
  );
}
