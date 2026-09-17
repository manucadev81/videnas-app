"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { formatarCNPJ, formatarData } from "@/lib/formatadores";
import { cn } from "@/lib/utils";
import type { ModuloId } from "@/lib/tipos";

const TODOS_MODULOS: ModuloId[] = ["acam212", "cadoc5711", "cadoc5710", "fiscal"];
const ROTULO_TIPO: Record<string, string> = { exchange: "Exchange", custodiante: "Custodiante", mesa_otc: "Mesa de OTC" };

export default function ConfiguracoesInstituicaoPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const instituicaoAtivaId = useSessaoStore((estado) => estado.instituicaoAtivaId);
  const instituicao =
    instituicaoAtivaId && instituicaoAtivaId !== "todas" ? buscarInstituicao(instituicaoAtivaId) : undefined;

  const podeEditar = perfilAtivo === "diretor";
  const [modulosAtivos, setModulosAtivos] = useState<ModuloId[]>(instituicao?.modulosContratados ?? []);

  if (!instituicao) {
    return (
      <EstadoVazio
        titulo="Selecione uma instituição"
        mensagem="Escolha uma instituição no seletor do topo para ver os dados cadastrais."
      />
    );
  }

  function alternarModulo(modulo: ModuloId) {
    if (!podeEditar) return;
    setModulosAtivos((atual) => (atual.includes(modulo) ? atual.filter((item) => item !== modulo) : [...atual, modulo]));
  }

  function salvar() {
    toast.success("Alterações salvas (simulação). Nenhum dado real foi persistido.");
  }

  return (
    <div className="space-y-6">
      {!podeEditar ? (
        <p className="flex items-center gap-2 rounded-md bg-neutral-50 px-4 py-2.5 text-xs text-neutral-500">
          <Lock className="size-3.5" aria-hidden="true" />
          Modo somente leitura. Apenas o perfil Diretor / Compliance edita os dados da instituição.
        </p>
      ) : null}

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-neutral-700">Identificação</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CampoLeitura label="Razão social" valor={instituicao.razaoSocial} editavel={podeEditar} />
          <CampoLeitura label="Nome fantasia" valor={instituicao.nomeFantasia} editavel={podeEditar} />
          <CampoLeitura label="CNPJ" valor={formatarCNPJ(instituicao.cnpj)} editavel={false} />
          <CampoLeitura label="Tipo" valor={ROTULO_TIPO[instituicao.tipo]} editavel={false} />
          <CampoLeitura label="Inscrição municipal" valor={instituicao.inscricaoMunicipal} editavel={podeEditar} />
          <CampoLeitura label="Data de constituição" valor={formatarData(instituicao.criadoEm.slice(0, 10))} editavel={false} />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-neutral-700">Registro regulatório</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CampoLeitura
            label="Código da instituição no BCB"
            valor={`CNPJ-BASE ${instituicao.cnpj.replace(/\D/g, "").slice(0, 8)}`}
            editavel={false}
          />
          <CampoLeitura label="Situação de autorização" valor={instituicao.situacaoRegulatoria} editavel={false} />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-neutral-700">Endereço</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <CampoLeitura label="Município" valor={instituicao.municipio} editavel={podeEditar} />
          <CampoLeitura label="UF" valor={instituicao.uf} editavel={podeEditar} />
          <CampoLeitura label="CEP" valor={instituicao.cep} editavel={podeEditar} />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-neutral-700">Responsável perante o BCB</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CampoLeitura label="Nome" valor={instituicao.responsavelBcb.nome} editavel={podeEditar} />
          <CampoLeitura label="CPF" valor={instituicao.responsavelBcb.cpf} editavel={false} />
          <CampoLeitura label="Cargo" valor={instituicao.responsavelBcb.cargo} editavel={podeEditar} />
          <CampoLeitura label="E-mail" valor={instituicao.responsavelBcb.email} editavel={podeEditar} />
          <CampoLeitura label="Telefone" valor={instituicao.responsavelBcb.telefone} editavel={podeEditar} />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-neutral-700">Módulos contratados</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TODOS_MODULOS.map((moduloId) => {
            const modulo = buscarModulo(moduloId);
            const ativo = modulosAtivos.includes(moduloId);
            return (
              <label
                key={moduloId}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md border p-3",
                  ativo ? "border-brand-700 bg-brand-50" : "border-neutral-200"
                )}
              >
                <span>
                  <span className="block text-sm font-medium text-neutral-700">{modulo.nome}</span>
                  <span className="block text-xs text-neutral-500">
                    {ativo ? "Ativado desde o onboarding" : "Não contratado"}
                  </span>
                </span>
                <Switch checked={ativo} disabled={!podeEditar} onCheckedChange={() => alternarModulo(moduloId)} aria-label={`Módulo ${modulo.nome}`} />
              </label>
            );
          })}
        </div>
      </section>

      <BannerPosicionamento />

      {podeEditar ? (
        <div className="flex justify-end">
          <Button type="button" onClick={salvar}>
            <Save className="size-4" aria-hidden="true" />
            Salvar alterações
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function CampoLeitura({ label, valor, editavel }: { label: string; valor: string; editavel: boolean }) {
  const [valorLocal, setValorLocal] = useState(valor);
  const id = `campo-inst-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={valorLocal} disabled={!editavel} onChange={(evento) => setValorLocal(evento.target.value)} />
    </div>
  );
}
