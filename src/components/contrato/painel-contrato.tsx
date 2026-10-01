"use client";

import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buscarModulo } from "@/lib/mock/modulos";
import { HOJE_ISO } from "@/lib/mock/periodos";
import {
  CLASSE_STATUS_CADASTRO,
  ROTULO_RESPONSAVEL_TRANSMISSAO,
  ROTULO_STATUS_CADASTRO,
  cadastroAplicavel,
  contratoDoModulo,
  rotuloCanalCompletoDoCadastro,
  situacaoEfetivaCadastro,
} from "@/lib/contrato";
import { formatarData } from "@/lib/formatadores";
import type {
  CadastroPrevio,
  ContratoModulo,
  Instituicao,
  ModuloId,
  ResponsavelTransmissao,
} from "@/lib/tipos";
import { cn } from "@/lib/utils";

export function BadgeSituacaoCadastro({ cadastro }: { cadastro: CadastroPrevio }) {
  const situacao = situacaoEfetivaCadastro(cadastro, HOJE_ISO);
  return (
    <span className={cn("status-badge", CLASSE_STATUS_CADASTRO[situacao])}>
      {ROTULO_STATUS_CADASTRO[situacao]}
      {situacao !== cadastro.status ? " (pela validade)" : ""}
    </span>
  );
}

function BadgeIncluido({ incluido, rotuloSim, rotuloNao }: { incluido: boolean; rotuloSim: string; rotuloNao: string }) {
  return (
    <span className={cn("status-badge", incluido ? "status-badge-success" : "status-badge-neutral")}>
      {incluido ? rotuloSim : rotuloNao}
    </span>
  );
}

export function DetalheCadastro({ cadastro }: { cadastro: CadastroPrevio | null }) {
  if (!cadastro) {
    return <p className="text-sm text-neutral-500">Nenhum cadastro prévio registrado para este módulo.</p>;
  }
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt className="text-xs text-neutral-500">Canal</dt>
        <dd className="text-sm text-neutral-700">{rotuloCanalCompletoDoCadastro(cadastro)}</dd>
      </div>
      <div>
        <dt className="text-xs text-neutral-500">Responsável pelo cadastro</dt>
        <dd className="text-sm text-neutral-700">{ROTULO_RESPONSAVEL_TRANSMISSAO[cadastro.responsavel]}</dd>
      </div>
      <div>
        <dt className="text-xs text-neutral-500">Situação</dt>
        <dd className="mt-0.5">
          <BadgeSituacaoCadastro cadastro={cadastro} />
        </dd>
      </div>
      <div>
        <dt className="text-xs text-neutral-500">Identificador</dt>
        <dd className="font-mono text-xs text-neutral-700">{cadastro.identificador ?? "Aguardando identificador"}</dd>
      </div>
      <div>
        <dt className="text-xs text-neutral-500">Registrado em</dt>
        <dd className="text-sm text-neutral-700">{formatarData(cadastro.registradoEm)}</dd>
      </div>
      <div>
        <dt className="text-xs text-neutral-500">Válido até</dt>
        <dd className="text-sm text-neutral-700">
          {cadastro.validoAte ? formatarData(cadastro.validoAte) : "Sem validade informada"}
        </dd>
      </div>
    </dl>
  );
}

export interface ResumoContratoModuloProps {
  moduloId: ModuloId;
  contrato: ContratoModulo;
}

export function ResumoContratoModulo({ moduloId, contrato }: ResumoContratoModuloProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {moduloId === "fiscal" ? (
        <BadgeIncluido incluido={contrato.emissaoIncluida} rotuloSim="Emissão incluída" rotuloNao="Emissão não contratada" />
      ) : null}
      <BadgeIncluido
        incluido={contrato.transmissaoIncluida}
        rotuloSim="Transmissão incluída"
        rotuloNao="Transmissão não contratada"
      />
      {contrato.transmissaoIncluida ? (
        <span className="status-badge status-badge-info">
          Responsável: {ROTULO_RESPONSAVEL_TRANSMISSAO[contrato.responsavelTransmissao]}
        </span>
      ) : null}
    </div>
  );
}

export interface PainelContratoCadastrosProps {
  instituicao: Instituicao;
  onAlterarContrato?: (moduloId: ModuloId, alteracao: Partial<ContratoModulo>) => void;
  idAncora?: string;
}

export function PainelContratoCadastros({
  instituicao,
  onAlterarContrato,
  idAncora = "contrato-cadastros",
}: PainelContratoCadastrosProps) {
  const prefixo = useId();
  const editavel = Boolean(onAlterarContrato);
  const cadastros = instituicao.contrato?.cadastros ?? [];

  return (
    <section id={idAncora} className="scroll-mt-24 rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="font-display text-lg font-bold text-neutral-700">Contrato e cadastros prévios</h2>
      <p className="mt-1 text-sm text-neutral-500">
        {editavel
          ? "O que a Videnas emite e transmite depende do contrato de cada cliente. Alterar emissão, transmissão ou responsável fica registrado na trilha de auditoria. Os cadastros prévios são somente leitura."
          : "O que a Videnas emite e transmite depende do contrato da instituição. Os cadastros prévios abaixo definem quem pode transmitir e por qual canal; são somente leitura."}
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {instituicao.modulosContratados.map((moduloId) => {
          const modulo = buscarModulo(moduloId);
          const contrato = contratoDoModulo(instituicao, moduloId);
          const cadastro = cadastroAplicavel(instituicao, moduloId, HOJE_ISO);
          const idEmissao = `${prefixo}-${moduloId}-emissao`;
          const idTransmissao = `${prefixo}-${moduloId}-transmissao`;
          const idResponsavel = `${prefixo}-${moduloId}-responsavel`;

          return (
            <article key={moduloId} className="space-y-3 rounded-lg border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-neutral-700">{modulo.nome}</h3>
              </div>

              {editavel ? (
                <div className="space-y-3">
                  {moduloId === "fiscal" ? (
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor={idEmissao} className="font-normal">
                        Emissão da NFS-e incluída
                      </Label>
                      <Switch
                        id={idEmissao}
                        checked={contrato.emissaoIncluida}
                        onCheckedChange={(valor) =>
                          onAlterarContrato?.(moduloId, { emissaoIncluida: valor === true })
                        }
                      />
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={idTransmissao} className="font-normal">
                      Transmissão incluída
                    </Label>
                    <Switch
                      id={idTransmissao}
                      checked={contrato.transmissaoIncluida}
                      onCheckedChange={(valor) =>
                        onAlterarContrato?.(moduloId, { transmissaoIncluida: valor === true })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={idResponsavel} className="font-normal">
                      Responsável pela transmissão
                    </Label>
                    <Select
                      value={contrato.responsavelTransmissao}
                      disabled={!contrato.transmissaoIncluida}
                      onValueChange={(valor) =>
                        onAlterarContrato?.(moduloId, {
                          responsavelTransmissao: (valor ?? "videnas") as ResponsavelTransmissao,
                        })
                      }
                    >
                      <SelectTrigger id={idResponsavel} className="w-48">
                        <SelectValue>
                          {(valor: string | null) =>
                            valor ? ROTULO_RESPONSAVEL_TRANSMISSAO[valor as ResponsavelTransmissao] : "Selecione"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="videnas">{ROTULO_RESPONSAVEL_TRANSMISSAO.videnas}</SelectItem>
                        <SelectItem value="diretor">{ROTULO_RESPONSAVEL_TRANSMISSAO.diretor}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <ResumoContratoModulo moduloId={moduloId} contrato={contrato} />
              )}

              {contrato.transmissaoIncluida ? (
                <div className="space-y-1.5 rounded-md bg-neutral-50 p-3">
                  <p className="text-xs font-medium text-neutral-500">Cadastro prévio aplicável</p>
                  <DetalheCadastro cadastro={cadastro} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold text-neutral-700">Cadastros prévios por canal</h3>
        {cadastros.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Nenhum cadastro prévio registrado para esta instituição.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Canal</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Módulos</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Responsável</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Situação</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Identificador</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Registrado em</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-700">Válido até</th>
                </tr>
              </thead>
              <tbody>
                {cadastros.map((cadastro) => (
                  <tr key={cadastro.id} className="border-t border-neutral-200">
                    <td className="px-3 py-2 text-neutral-700">{rotuloCanalCompletoDoCadastro(cadastro)}</td>
                    <td className="px-3 py-2 text-neutral-600">
                      {cadastro.moduloIds.map((moduloId) => buscarModulo(moduloId).sigla).join(", ")}
                    </td>
                    <td className="px-3 py-2 text-neutral-600">
                      {ROTULO_RESPONSAVEL_TRANSMISSAO[cadastro.responsavel]}
                    </td>
                    <td className="px-3 py-2">
                      <BadgeSituacaoCadastro cadastro={cadastro} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-neutral-600">
                      {cadastro.identificador ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-neutral-600">{formatarData(cadastro.registradoEm)}</td>
                    <td className="px-3 py-2 text-neutral-600">
                      {cadastro.validoAte ? formatarData(cadastro.validoAte) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
