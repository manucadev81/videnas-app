"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Lock, Plus, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { buscarPerfil } from "@/lib/permissoes";
import { useSessaoStore } from "@/lib/store/sessao";
import { cn } from "@/lib/utils";
import {
  ATIVOS_VIRTUAIS_SEED,
  CLIENTES_KYC_SEED,
  CONTAS_CARTEIRAS_SEED,
  FISCAL_SEED,
  PAISES_MOEDAS_SEED,
  type AtivoDicionario,
  type ClienteDicionario,
  type ContaDicionario,
  type FiscalDicionario,
} from "../_dados-mock";

const ATIVOS_IMPORTADOS: Omit<AtivoDicionario, "id" | "ativo">[] = [
  { codigoInterno: "BNB_SPOT", simbolo: "BNB", nome: "BNB", codigoOficial: "VC0012", rede: "BNB Smart Chain", decimais: 18 },
  { codigoInterno: "DOT_SPOT", simbolo: "DOT", nome: "Polkadot", codigoOficial: "VC0037", rede: "Polkadot", decimais: 10 },
  { codigoInterno: "AVAX_SPOT", simbolo: "AVAX", nome: "Avalanche", codigoOficial: "VC0049", rede: "Avalanche", decimais: 18 },
];

function baixarCsv(nomeArquivo: string, cabecalhos: string[], linhas: (string | number)[][]) {
  const conteudo = [cabecalhos, ...linhas].map((linha) => linha.join(";")).join("\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`${nomeArquivo} exportado.`);
}

function novoId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ConfiguracoesDicionariosPage() {
  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);

  const podeEditarDicionarios = Boolean(
    perfilAtivo && buscarPerfil(perfilAtivo).acoesPermitidas.includes("editar_dicionarios")
  );

  function podeEditar(aba: "ativos" | "contas" | "clientes" | "fiscal" | "paises"): boolean {
    if (aba === "paises") return false;
    return podeEditarDicionarios;
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="ativos">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ativos">Ativos virtuais</TabsTrigger>
          <TabsTrigger value="contas">Contas e carteiras</TabsTrigger>
          <TabsTrigger value="clientes">Clientes / KYC</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          <TabsTrigger value="paises">Países e moedas</TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="mt-4">
          <AbaAtivos editavel={podeEditar("ativos")} />
        </TabsContent>
        <TabsContent value="contas" className="mt-4">
          <AbaContas editavel={podeEditar("contas")} />
        </TabsContent>
        <TabsContent value="clientes" className="mt-4">
          <AbaClientes editavel={podeEditar("clientes")} />
        </TabsContent>
        <TabsContent value="fiscal" className="mt-4">
          <AbaFiscal editavel={podeEditar("fiscal")} />
        </TabsContent>
        <TabsContent value="paises" className="mt-4">
          <AbaPaises />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AvisoLeitura({ editavel }: { editavel: boolean }) {
  if (editavel) return null;
  return (
    <p className="mb-3 flex items-center gap-2 rounded-md bg-neutral-50 px-4 py-2.5 text-xs text-neutral-500">
      <Lock className="size-3.5" aria-hidden="true" />
      Modo somente leitura para o seu perfil neste dicionário.
    </p>
  );
}

function Barra({
  onAdicionar,
  onImportar,
  onExportar,
  editavel,
}: {
  onAdicionar?: () => void;
  onImportar?: () => void;
  onExportar: () => void;
  editavel: boolean;
}) {
  return (
    <div className="mb-3 flex flex-wrap justify-end gap-2">
      {editavel && onAdicionar ? (
        <Button type="button" variant="outline" size="sm" onClick={onAdicionar}>
          <Plus className="size-4" aria-hidden="true" />
          Adicionar linha
        </Button>
      ) : null}
      {editavel && onImportar ? (
        <Button type="button" variant="outline" size="sm" onClick={onImportar}>
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          Importar CSV
        </Button>
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={onExportar}>
        <Download className="size-4" aria-hidden="true" />
        Exportar CSV
      </Button>
    </div>
  );
}

function AbaAtivos({ editavel }: { editavel: boolean }) {
  const [linhas, setLinhas] = useState<AtivoDicionario[]>(ATIVOS_VIRTUAIS_SEED);
  const [novaLinha, setNovaLinha] = useState({ codigoInterno: "", simbolo: "", nome: "", codigoOficial: "", rede: "", decimais: "8" });

  function adicionar() {
    if (!novaLinha.codigoInterno.trim() || !novaLinha.codigoOficial.trim()) {
      toast.error("Informe ao menos o código interno e o código oficial.");
      return;
    }
    if (linhas.some((l) => l.codigoOficial === novaLinha.codigoOficial && l.ativo)) {
      toast.error(`Já existe um ativo mapeado para o código ${novaLinha.codigoOficial}.`);
      return;
    }
    setLinhas((atual) => [
      ...atual,
      { id: novoId("ativo"), ...novaLinha, decimais: Number(novaLinha.decimais) || 0, ativo: true },
    ]);
    setNovaLinha({ codigoInterno: "", simbolo: "", nome: "", codigoOficial: "", rede: "", decimais: "8" });
  }

  function importar() {
    setLinhas((atual) => [...atual, ...ATIVOS_IMPORTADOS.map((item) => ({ id: novoId("ativo"), ...item, ativo: true }))]);
    toast.success(`${ATIVOS_IMPORTADOS.length} ativos importados do arquivo de exemplo.`);
  }

  function desativar(id: string) {
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, ativo: !l.ativo } : l)));
  }

  function exportar() {
    baixarCsv(
      "dicionario_ativos_virtuais.csv",
      ["Código interno", "Símbolo", "Nome", "Código oficial", "Rede", "Decimais", "Ativo"],
      linhas.map((l) => [l.codigoInterno, l.simbolo, l.nome, l.codigoOficial, l.rede, l.decimais, l.ativo ? "Sim" : "Não"])
    );
  }

  return (
    <div>
      <AvisoLeitura editavel={editavel} />
      <Barra editavel={editavel} onAdicionar={adicionar} onImportar={importar} onExportar={exportar} />
      {editavel ? (
        <div className="mb-3 grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-6">
          <Input placeholder="Código interno" value={novaLinha.codigoInterno} onChange={(e) => setNovaLinha((a) => ({ ...a, codigoInterno: e.target.value }))} />
          <Input placeholder="Símbolo" value={novaLinha.simbolo} onChange={(e) => setNovaLinha((a) => ({ ...a, simbolo: e.target.value }))} />
          <Input placeholder="Nome" value={novaLinha.nome} onChange={(e) => setNovaLinha((a) => ({ ...a, nome: e.target.value }))} />
          <Input placeholder="Código oficial" value={novaLinha.codigoOficial} onChange={(e) => setNovaLinha((a) => ({ ...a, codigoOficial: e.target.value }))} />
          <Input placeholder="Rede" value={novaLinha.rede} onChange={(e) => setNovaLinha((a) => ({ ...a, rede: e.target.value }))} />
          <Input placeholder="Decimais" value={novaLinha.decimais} onChange={(e) => setNovaLinha((a) => ({ ...a, decimais: e.target.value }))} />
        </div>
      ) : null}
      <Tabela
        cabecalhos={["Código interno", "Símbolo", "Nome", "Código oficial", "Rede", "Decimais", "Situação", editavel ? "" : undefined].filter(Boolean) as string[]}
        vazio="Nenhum item cadastrado neste dicionário."
      >
        {linhas.map((linha) => (
          <tr key={linha.id} className={cn(!linha.ativo && "opacity-50")}>
            <td className="px-3 py-2">{linha.codigoInterno}</td>
            <td className="px-3 py-2">{linha.simbolo}</td>
            <td className="px-3 py-2">{linha.nome}</td>
            <td className="px-3 py-2 font-mono text-xs">{linha.codigoOficial}</td>
            <td className="px-3 py-2">{linha.rede}</td>
            <td className="px-3 py-2">{linha.decimais}</td>
            <td className="px-3 py-2">{linha.ativo ? "Ativo" : "Desativado"}</td>
            {editavel ? (
              <td className="px-3 py-2 text-right">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Desativar ${linha.codigoInterno}`} onClick={() => desativar(linha.id)}>
                  <ShieldOff className="size-4" aria-hidden="true" />
                </Button>
              </td>
            ) : null}
          </tr>
        ))}
      </Tabela>
    </div>
  );
}

function AbaContas({ editavel }: { editavel: boolean }) {
  const [linhas, setLinhas] = useState<ContaDicionario[]>(CONTAS_CARTEIRAS_SEED);
  const [nova, setNova] = useState({ apelido: "", endereco: "", rede: "" });

  function adicionar() {
    if (!nova.apelido.trim() || !nova.endereco.trim()) {
      toast.error("Informe apelido e endereço da conta ou carteira.");
      return;
    }
    setLinhas((atual) => [
      ...atual,
      {
        id: novoId("conta"),
        apelido: nova.apelido,
        endereco: nova.endereco,
        rede: nova.rede,
        titularidade: "propria",
        custodia: "propria",
        ativaDesde: new Date().toISOString().slice(0, 10),
        ativo: true,
      },
    ]);
    setNova({ apelido: "", endereco: "", rede: "" });
  }

  function desativar(id: string) {
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, ativo: !l.ativo } : l)));
  }

  function exportar() {
    baixarCsv(
      "dicionario_contas_carteiras.csv",
      ["Apelido", "Endereço", "Rede", "Titularidade", "Custódia", "Ativa desde", "Situação"],
      linhas.map((l) => [l.apelido, l.endereco, l.rede, l.titularidade, l.custodia, l.ativaDesde, l.ativo ? "Sim" : "Não"])
    );
  }

  return (
    <div>
      <AvisoLeitura editavel={editavel} />
      <Barra editavel={editavel} onAdicionar={adicionar} onExportar={exportar} />
      {editavel ? (
        <div className="mb-3 grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-3">
          <Input placeholder="Apelido" value={nova.apelido} onChange={(e) => setNova((a) => ({ ...a, apelido: e.target.value }))} />
          <Input placeholder="Endereço" value={nova.endereco} onChange={(e) => setNova((a) => ({ ...a, endereco: e.target.value }))} />
          <Input placeholder="Rede" value={nova.rede} onChange={(e) => setNova((a) => ({ ...a, rede: e.target.value }))} />
        </div>
      ) : null}
      <Tabela cabecalhos={["Apelido", "Endereço", "Rede", "Titularidade", "Custódia", "Ativa desde", "Situação", editavel ? "" : undefined].filter(Boolean) as string[]} vazio="Nenhum item cadastrado neste dicionário.">
        {linhas.map((linha) => (
          <tr key={linha.id} className={cn(!linha.ativo && "opacity-50")}>
            <td className="px-3 py-2">{linha.apelido}</td>
            <td className="px-3 py-2 font-mono text-xs">{linha.endereco}</td>
            <td className="px-3 py-2">{linha.rede}</td>
            <td className="px-3 py-2 capitalize">{linha.titularidade.replace("_", " ")}</td>
            <td className="px-3 py-2 capitalize">{linha.custodia}</td>
            <td className="px-3 py-2">{linha.ativaDesde}</td>
            <td className="px-3 py-2">{linha.ativo ? "Ativa" : "Desativada"}</td>
            {editavel ? (
              <td className="px-3 py-2 text-right">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Desativar ${linha.apelido}`} onClick={() => desativar(linha.id)}>
                  <ShieldOff className="size-4" aria-hidden="true" />
                </Button>
              </td>
            ) : null}
          </tr>
        ))}
      </Tabela>
    </div>
  );
}

function AbaClientes({ editavel }: { editavel: boolean }) {
  const [linhas, setLinhas] = useState<ClienteDicionario[]>(CLIENTES_KYC_SEED);

  function desativar(id: string) {
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, ativo: !l.ativo } : l)));
  }

  function exportar() {
    baixarCsv(
      "dicionario_clientes_kyc.csv",
      ["Nome", "Documento", "Tipo", "País de residência", "Situação KYC", "Última atualização"],
      linhas.map((l) => [l.nome, l.documento, l.tipo, l.paisResidencia, l.situacaoKyc, l.ultimaAtualizacao])
    );
  }

  return (
    <div>
      <AvisoLeitura editavel={editavel} />
      <Barra editavel={editavel} onExportar={exportar} />
      <Tabela cabecalhos={["Nome", "CPF/CNPJ", "Tipo", "País", "Situação KYC", "Última atualização", editavel ? "" : undefined].filter(Boolean) as string[]} vazio="Nenhum item cadastrado neste dicionário.">
        {linhas.map((linha) => (
          <tr key={linha.id} className={cn(!linha.ativo && "opacity-50")}>
            <td className="px-3 py-2">{linha.nome}</td>
            <td className="px-3 py-2">{linha.documento}</td>
            <td className="px-3 py-2">{linha.tipo}</td>
            <td className="px-3 py-2">{linha.paisResidencia}</td>
            <td className="px-3 py-2 capitalize">{linha.situacaoKyc}</td>
            <td className="px-3 py-2">{linha.ultimaAtualizacao}</td>
            {editavel ? (
              <td className="px-3 py-2 text-right">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Desativar ${linha.nome}`} onClick={() => desativar(linha.id)}>
                  <ShieldOff className="size-4" aria-hidden="true" />
                </Button>
              </td>
            ) : null}
          </tr>
        ))}
      </Tabela>
    </div>
  );
}

function AbaFiscal({ editavel }: { editavel: boolean }) {
  const [linhas, setLinhas] = useState<FiscalDicionario[]>(FISCAL_SEED);
  const [nova, setNova] = useState({ codigoServico: "", descricao: "", municipio: "", aliquotaIss: "" });

  function adicionar() {
    if (!nova.codigoServico.trim() || !nova.municipio.trim()) {
      toast.error("Informe o código de serviço e o município.");
      return;
    }
    setLinhas((atual) => [
      ...atual,
      {
        id: novoId("fiscal"),
        codigoServico: nova.codigoServico,
        descricao: nova.descricao,
        municipio: nova.municipio,
        aliquotaIss: Number(nova.aliquotaIss.replace(",", ".")) || 0,
        retencaoPadrao: false,
        regime: "Lucro Presumido",
        ativo: true,
      },
    ]);
    setNova({ codigoServico: "", descricao: "", municipio: "", aliquotaIss: "" });
  }

  function desativar(id: string) {
    setLinhas((atual) => atual.map((l) => (l.id === id ? { ...l, ativo: !l.ativo } : l)));
  }

  function exportar() {
    baixarCsv(
      "dicionario_fiscal.csv",
      ["Código de serviço", "Descrição", "Município", "Alíquota ISS", "Retenção padrão", "Regime"],
      linhas.map((l) => [l.codigoServico, l.descricao, l.municipio, `${l.aliquotaIss}%`, l.retencaoPadrao ? "Sim" : "Não", l.regime])
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <SeloCandidato tamanho="sm" />
        <p className="text-xs text-neutral-500">Parâmetros usados para sugerir alíquota; o contador sempre confirma.</p>
      </div>
      <AvisoLeitura editavel={editavel} />
      <Barra editavel={editavel} onAdicionar={adicionar} onExportar={exportar} />
      {editavel ? (
        <div className="mb-3 grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-4">
          <Input placeholder="Código de serviço" value={nova.codigoServico} onChange={(e) => setNova((a) => ({ ...a, codigoServico: e.target.value }))} />
          <Input placeholder="Descrição" value={nova.descricao} onChange={(e) => setNova((a) => ({ ...a, descricao: e.target.value }))} />
          <Input placeholder="Município" value={nova.municipio} onChange={(e) => setNova((a) => ({ ...a, municipio: e.target.value }))} />
          <Input placeholder="Alíquota ISS (%)" value={nova.aliquotaIss} onChange={(e) => setNova((a) => ({ ...a, aliquotaIss: e.target.value }))} />
        </div>
      ) : null}
      <Tabela cabecalhos={["Código de serviço", "Descrição", "Município", "Alíquota ISS", "Retenção padrão", "Regime", "Situação", editavel ? "" : undefined].filter(Boolean) as string[]} vazio="Nenhum item cadastrado neste dicionário.">
        {linhas.map((linha) => (
          <tr key={linha.id} className={cn(!linha.ativo && "opacity-50")}>
            <td className="px-3 py-2">{linha.codigoServico}</td>
            <td className="px-3 py-2">{linha.descricao}</td>
            <td className="px-3 py-2">{linha.municipio}</td>
            <td className="px-3 py-2">{linha.aliquotaIss.toFixed(2)}%</td>
            <td className="px-3 py-2">{linha.retencaoPadrao ? "Sim" : "Não"}</td>
            <td className="px-3 py-2">{linha.regime}</td>
            <td className="px-3 py-2">{linha.ativo ? "Ativo" : "Desativado"}</td>
            {editavel ? (
              <td className="px-3 py-2 text-right">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Desativar ${linha.codigoServico}`} onClick={() => desativar(linha.id)}>
                  <ShieldOff className="size-4" aria-hidden="true" />
                </Button>
              </td>
            ) : null}
          </tr>
        ))}
      </Tabela>
    </div>
  );
}

function AbaPaises() {
  return (
    <div>
      <p className="mb-3 flex items-center gap-2 rounded-md bg-neutral-50 px-4 py-2.5 text-xs text-neutral-500">
        <Lock className="size-3.5" aria-hidden="true" />
        Tabela oficial. Não editável.
      </p>
      <Barra
        editavel={false}
        onExportar={() =>
          baixarCsv(
            "dicionario_paises_moedas.csv",
            ["Código do país", "País", "Moeda", "Sigla"],
            PAISES_MOEDAS_SEED.map((l) => [l.codigoPais, l.pais, l.moeda, l.sigla])
          )
        }
      />
      <Tabela cabecalhos={["Código do país", "País", "Moeda", "Sigla"]} vazio="Nenhum item cadastrado neste dicionário.">
        {PAISES_MOEDAS_SEED.map((linha) => (
          <tr key={linha.id}>
            <td className="px-3 py-2">{linha.codigoPais}</td>
            <td className="px-3 py-2">{linha.pais}</td>
            <td className="px-3 py-2">{linha.moeda}</td>
            <td className="px-3 py-2">{linha.sigla}</td>
          </tr>
        ))}
      </Tabela>
    </div>
  );
}

function Tabela({
  cabecalhos,
  vazio,
  children,
}: {
  cabecalhos: string[];
  vazio: string;
  children: ReactNode;
}) {
  const linhas = Array.isArray(children) ? children : [children];
  const temLinhas = linhas.length > 0;

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50">
          <tr>
            {cabecalhos.map((cabecalho) => (
              <th key={cabecalho} className="px-3 py-2 font-semibold text-neutral-700">
                {cabecalho}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {temLinhas ? (
            children
          ) : (
            <tr>
              <td colSpan={cabecalhos.length} className="px-3 py-6 text-center text-neutral-400">
                {vazio}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
