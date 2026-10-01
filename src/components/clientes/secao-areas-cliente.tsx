"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessaoStore } from "@/lib/store/sessao";
import { useTenantsStore } from "@/lib/store/tenants";
import { buscarPerfil } from "@/lib/permissoes";
import { buscarModulo } from "@/lib/mock/modulos";
import {
  ROTULO_ETAPA_AREA,
  ROTULO_TIPO_AREA,
  TIPOS_AREA_CLIENTE,
  areaCadastrada,
  areaTemErro,
  areasParaEdicao,
  validarArea,
  type ErrosArea,
} from "@/lib/areas-cliente";
import type { AreaCliente, EtapaId, Instituicao, MapeamentoAreasCliente, ModuloId, TipoAreaCliente } from "@/lib/tipos";

type CampoArea = "nome" | "responsavelNome" | "email" | "telefone";

export function SecaoAreasCliente({ instituicao }: { instituicao: Instituicao }) {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);
  const alterarAreasCliente = useTenantsStore((estado) => estado.alterarAreasCliente);
  const podeEditar = Boolean(
    perfilAtivo && buscarPerfil(perfilAtivo).acoesPermitidas.includes("editar_areas_cliente")
  );

  const [areas, setAreas] = useState<AreaCliente[]>(() => areasParaEdicao(instituicao));
  const [mapeamento, setMapeamento] = useState<MapeamentoAreasCliente>(() => instituicao.mapeamentoAreas ?? {});
  const [erros, setErros] = useState<Record<string, ErrosArea>>({});
  const [tentouSalvar, setTentouSalvar] = useState(false);

  function atualizar(areaId: string, campo: CampoArea, valor: string) {
    setAreas((atual) => atual.map((area) => (area.id === areaId ? { ...area, [campo]: valor } : area)));
    if (tentouSalvar) {
      setErros((atual) => {
        const proxima = { ...atual };
        const area = areas.find((item) => item.id === areaId);
        if (area) {
          proxima[areaId] = validarArea({ ...area, [campo]: valor });
        }
        return proxima;
      });
    }
  }

  function alternarMapeamento(moduloId: ModuloId, etapaId: EtapaId, tipo: TipoAreaCliente, marcado: boolean) {
    setMapeamento((atual) => {
      const atuaisDaEtapa = atual[moduloId]?.[etapaId] ?? [];
      const proximos = marcado
        ? [...atuaisDaEtapa.filter((item) => item !== tipo), tipo]
        : atuaisDaEtapa.filter((item) => item !== tipo);
      return { ...atual, [moduloId]: { ...(atual[moduloId] ?? {}), [etapaId]: proximos } };
    });
  }

  function salvar() {
    if (!perfilAtivo || !usuarioId || !podeEditar) {
      return;
    }
    setTentouSalvar(true);
    const novosErros: Record<string, ErrosArea> = {};
    for (const area of areas) {
      novosErros[area.id] = validarArea(area);
    }
    setErros(novosErros);
    if (Object.values(novosErros).some(areaTemErro)) {
      toast.error("Corrija os campos destacados para salvar as áreas.");
      return;
    }
    const resultado = alterarAreasCliente(instituicao.id, areas, mapeamento, { usuarioId, perfilId: perfilAtivo });
    if (resultado.sucesso) {
      toast.success("Áreas e responsabilidades salvas. A alteração ficou registrada na trilha de auditoria.");
      setTentouSalvar(false);
    } else {
      toast.error(resultado.motivo ?? "Não foi possível salvar as áreas.");
    }
  }

  return (
    <section data-tour="areas-cliente" className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="font-display text-lg font-bold text-neutral-700">Áreas do cliente</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Controles internos, Custódia e Contábil são áreas da própria instituição. Quem responde por cada
        controle é informado pelo cliente no início do contrato e tem caráter informativo; as áreas
        mapeadas ao módulo recebem os avisos de aprovação e arquivamento.
        {podeEditar
          ? " Preencha o contato de cada uma; a área sem contato fica como não cadastrada."
          : " Área sem contato fica como não cadastrada."}
      </p>
      {!podeEditar ? (
        <p className="mt-3 flex items-center gap-2 rounded-md bg-neutral-50 px-4 py-2.5 text-xs text-neutral-500">
          <Lock className="size-3.5" aria-hidden="true" />
          Somente o Administrador da Videnas registra as áreas e o mapeamento, conforme informado pelo cliente no
          contrato. Aqui você apenas consulta.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {areas.map((area) => {
          const errosArea = erros[area.id] ?? {};
          const prefixo = `area-${area.tipo}`;
          return (
            <fieldset key={area.id} className="space-y-3 rounded-lg border border-neutral-200 p-4">
              <legend className="px-1 text-sm font-bold text-neutral-700">{ROTULO_TIPO_AREA[area.tipo]}</legend>
              <div className="space-y-1.5">
                <Label htmlFor={`${prefixo}-nome`}>Nome da área</Label>
                <Input
                  id={`${prefixo}-nome`}
                  value={area.nome}
                  disabled={!podeEditar}
                  aria-invalid={errosArea.nome ? true : undefined}
                  onChange={(evento) => atualizar(area.id, "nome", evento.target.value)}
                />
                {errosArea.nome ? <p className="text-xs text-status-error-text">{errosArea.nome}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${prefixo}-contato`}>Contato</Label>
                <Input
                  id={`${prefixo}-contato`}
                  value={area.responsavelNome}
                  disabled={!podeEditar}
                  aria-invalid={errosArea.responsavelNome ? true : undefined}
                  onChange={(evento) => atualizar(area.id, "responsavelNome", evento.target.value)}
                />
                {errosArea.responsavelNome ? (
                  <p className="text-xs text-status-error-text">{errosArea.responsavelNome}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${prefixo}-email`}>E-mail</Label>
                <Input
                  id={`${prefixo}-email`}
                  type="email"
                  value={area.email}
                  disabled={!podeEditar}
                  aria-invalid={errosArea.email ? true : undefined}
                  onChange={(evento) => atualizar(area.id, "email", evento.target.value)}
                />
                {errosArea.email ? <p className="text-xs text-status-error-text">{errosArea.email}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${prefixo}-telefone`}>Telefone (opcional)</Label>
                <Input
                  id={`${prefixo}-telefone`}
                  value={area.telefone ?? ""}
                  disabled={!podeEditar}
                  onChange={(evento) => atualizar(area.id, "telefone", evento.target.value)}
                />
              </div>
              <p className="text-xs text-neutral-400">
                {areaCadastrada(area) ? "Área cadastrada" : "Área não cadastrada"}
              </p>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-bold text-neutral-700">Quem responde por cada controle</h3>
        {instituicao.modulosContratados.map((moduloId) => {
          const modulo = buscarModulo(moduloId);
          return (
            <div key={moduloId} className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-sm">
                <caption className="bg-neutral-50 px-4 py-2 text-left text-sm font-semibold text-neutral-700">
                  {modulo.nome}
                </caption>
                <thead>
                  <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                    <th scope="col" className="px-4 py-2 text-left font-medium">
                      Etapa
                    </th>
                    {TIPOS_AREA_CLIENTE.map((tipo) => (
                      <th key={tipo} scope="col" className="px-4 py-2 text-left font-medium">
                        {ROTULO_TIPO_AREA[tipo]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modulo.etapas.map((etapaId) => (
                    <tr key={etapaId} className="border-b border-neutral-100 last:border-b-0">
                      <th scope="row" className="px-4 py-2 text-left font-normal text-neutral-700">
                        {ROTULO_ETAPA_AREA[etapaId]}
                      </th>
                      {TIPOS_AREA_CLIENTE.map((tipo) => {
                        const idCaixa = `mapa-${moduloId}-${etapaId}-${tipo}`;
                        return (
                          <td key={tipo} className="px-4 py-2">
                            <Checkbox
                              id={idCaixa}
                              aria-label={`${ROTULO_TIPO_AREA[tipo]} responde por ${ROTULO_ETAPA_AREA[etapaId]} em ${modulo.nome}`}
                              checked={(mapeamento[moduloId]?.[etapaId] ?? []).includes(tipo)}
                              disabled={!podeEditar}
                              onCheckedChange={(valor) => alternarMapeamento(moduloId, etapaId, tipo, valor === true)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {podeEditar ? (
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={salvar}>
            <Save className="size-4" aria-hidden="true" />
            Salvar áreas e responsabilidades
          </Button>
        </div>
      ) : null}
    </section>
  );
}
