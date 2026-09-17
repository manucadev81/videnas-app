"use client";

import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { perfilEhMultiTenant, useSessaoStore } from "@/lib/store/sessao";
import { instituicoes, buscarInstituicao } from "@/lib/mock/instituicoes";
import { formatarCNPJ } from "@/lib/formatadores";

export interface SeletorInstituicaoProps {
  className?: string;
}

export function SeletorInstituicao({ className }: SeletorInstituicaoProps) {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const definirInstituicao = useSessaoStore((estado) => estado.definirInstituicao);

  const multiTenant = perfilEhMultiTenant(perfilAtivo);

  if (!multiTenant) {
    const instituicao = instituicaoAtivaId ? buscarInstituicao(instituicaoAtivaId) : undefined;
    if (!instituicao) return null;

    return (
      <div className={className}>
        <p className="text-xs font-medium text-neutral-500">Instituição</p>
        <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
          <Building2 className="size-3.5 text-neutral-400" aria-hidden="true" />
          {instituicao.nomeFantasia}
        </p>
        <p className="text-xs text-neutral-500">{formatarCNPJ(instituicao.cnpj)}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="mb-1 text-xs font-medium text-neutral-500">Instituição</p>
      <Select
        value={instituicaoAtivaId ?? "todas"}
        onValueChange={(valor) => definirInstituicao(valor as string)}
      >
        <SelectTrigger aria-label="Selecionar instituição" className="w-full">
          <SelectValue placeholder="Selecionar instituição" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as instituições</SelectItem>
          {instituicoes.map((instituicao) => (
            <SelectItem key={instituicao.id} value={instituicao.id}>
              {instituicao.nomeFantasia}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
