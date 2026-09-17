"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldCheck, ShieldQuestion } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BadgeStatus, BadgeAtrasado } from "@/components/dominio/badge-status";
import { StepperEtapas } from "@/components/dominio/stepper-etapas";
import { PainelArquivo } from "@/components/dominio/painel-arquivo";
import { TimelineAuditoria } from "@/components/dominio/timeline-auditoria";
import { BannerPosicionamento } from "@/components/dominio/banner-posicionamento";
import { SeloCandidato } from "@/components/dominio/selo-candidato";
import { EstadoVazio } from "@/components/dominio/estado-vazio";
import { TabelaDados, type ColunaTabela } from "@/components/dominio/tabela-dados";
import { BarraAcoesFluxo } from "@/components/dominio/modulo-barra-acoes";
import { PainelExcecoes } from "@/components/dominio/modulo-painel-excecoes";
import { RecepcaoDocumentos } from "@/components/dominio/modulo-recepcao-documentos";
import { construirEtapasStepper, type MarcoEtapa } from "@/components/dominio/modulo-etapas";
import { usePeriodosStore } from "@/lib/store/periodos";
import { buscarModulo } from "@/lib/mock/modulos";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { calcularPeriodoDerivado } from "@/lib/mock/periodos";
import { operacoesPorPeriodo } from "@/lib/mock/operacoes";
import { datasBaseCobertas, posicoesDiariasPorPeriodo, posicoesMensaisPorPeriodo } from "@/lib/mock/custodia";
import { servicosPorPeriodo } from "@/lib/mock/fiscal";
import {
  formatarBRL,
  formatarCNPJ,
  formatarData,
  formatarDataHora,
  formatarNumero,
  truncarHash,
} from "@/lib/formatadores";
import type {
  EtapaId,
  OperacaoCambio,
  PosicaoCustodiaDiaria,
  PosicaoCustodiaMensal,
  ServicoPrestadoDPS,
} from "@/lib/tipos";
import { cn } from "@/lib/utils";

function rotuloTotal(chave: string): string {
  const dicionario: Record<string, string> = {
    operacoes: "Operações",
    grupoG01: "G01 — Identificação",
    grupoG10: "G10 — Pagamentos e transferências",
    grupoG20: "G20 — Operações com cartão",
    grupoG30: "G30 — Autocustódia",
    grupoG40: "G40 — Totais mensais",
    grupoG90: "G90 — Anulações e retificações",
    datasBaseRecebidas: "Datas-base recebidas",
    datasBaseEsperadas: "Datas-base esperadas",
    clientesDistintos: "Clientes distintos",
    ativos: "Ativos",
    carteiras: "Carteiras",
    carteirasComStaking: "Carteiras com staking",
    dps: "DPS estruturadas",
    valorServicos: "Valor dos serviços",
    valorIss: "ISS devido",
    valorRetido: "Retido na fonte",
  };
  return dicionario[chave] ?? chave;
}

function formatarValorTotal(chave: string, valor: number | string): string {
  if (typeof valor === "number" && (chave === "valorServicos" || chave === "valorIss" || chave === "valorRetido")) {
    return formatarBRL(valor);
  }
  return String(valor);
}

function TabelaAcam212({ periodoId }: { periodoId: string }) {
  const dados = operacoesPorPeriodo(periodoId).slice(0, 20);
  const colunas: ColunaTabela<OperacaoCambio>[] = [
    { id: "numero", cabecalho: "Nº de controle", renderizar: (op) => <span className="font-mono text-xs">{op.numeroControle}</span> },
    { id: "data", cabecalho: "Data", renderizar: (op) => formatarData(op.dataOperacao) },
    { id: "grupo", cabecalho: "Grupo", renderizar: (op) => op.grupo },
    { id: "cliente", cabecalho: "Cliente", renderizar: (op) => op.clienteNome },
    {
      id: "documento",
      cabecalho: "CPF/CNPJ",
      renderizar: (op) => (
        <span className="flex items-center gap-1">
          <span className="font-mono text-xs">{op.clienteDocumento}</span>
          {!op.kycResolvido ? (
            <span className="status-badge status-badge-error px-1.5 py-0.5 text-[10px]">KYC não resolvido</span>
          ) : null}
        </span>
      ),
    },
    { id: "pais", cabecalho: "País contraparte", renderizar: (op) => op.paisContraparte || "—" },
    { id: "moeda", cabecalho: "Moeda", renderizar: (op) => op.moeda },
    { id: "valorMe", cabecalho: "Valor ME", alinhamento: "right", renderizar: (op) => formatarNumero(op.valorMoedaEstrangeira, 2) },
    { id: "taxa", cabecalho: "Taxa", alinhamento: "right", renderizar: (op) => formatarNumero(op.taxaCambio, 4) },
    { id: "valorReais", cabecalho: "Valor R$", alinhamento: "right", renderizar: (op) => formatarBRL(op.valorReais) },
    { id: "ativo", cabecalho: "Ativo virtual", renderizar: (op) => op.ativoVirtual },
    { id: "quantidade", cabecalho: "Quantidade", alinhamento: "right", renderizar: (op) => formatarNumero(Number(op.quantidadeAtivo), 8) },
    {
      id: "endereco",
      cabecalho: "Endereço destino",
      renderizar: (op) => (op.enderecoDestino ? <span className="font-mono text-xs">{truncarHash(op.enderecoDestino, 6, 6)}</span> : "—"),
    },
  ];

  return (
    <TabelaDados
      colunas={colunas}
      dados={dados}
      chave={(op) => op.id}
      tituloVazio="Nenhuma operação recebida"
      mensagemVazia="Nenhum lote foi recebido para esta competência ainda."
    />
  );
}

function TabelaCadoc5711({ periodoId }: { periodoId: string }) {
  const dados = posicoesDiariasPorPeriodo(periodoId).slice(0, 20);
  const colunas: ColunaTabela<PosicaoCustodiaDiaria>[] = [
    { id: "data", cabecalho: "Data-base", renderizar: (pos) => formatarData(pos.dataBase) },
    { id: "documento", cabecalho: "CPF/CNPJ do cliente", renderizar: (pos) => <span className="font-mono text-xs">{pos.clienteDocumento}</span> },
    { id: "nome", cabecalho: "Nome", renderizar: (pos) => pos.clienteNome },
    { id: "ativo", cabecalho: "Ativo virtual", renderizar: (pos) => pos.ativoVirtual },
    { id: "codigo", cabecalho: "Código oficial", renderizar: (pos) => pos.codigoAtivoOficial },
    { id: "quantidade", cabecalho: "Quantidade custodiada", alinhamento: "right", renderizar: (pos) => formatarNumero(Number(pos.quantidadeCustodiada), 8) },
    { id: "valor", cabecalho: "Valor em R$", alinhamento: "right", renderizar: (pos) => formatarBRL(pos.valorReais) },
    { id: "tipo", cabecalho: "Tipo de custódia", renderizar: (pos) => (pos.tipoCustodia === "propria" ? "Própria" : "Terceirizada") },
  ];

  const datasBase = datasBaseCobertas(periodoId);

  return (
    <div className="space-y-4">
      {datasBase.length > 0 ? (
        <div className="rounded-md border border-neutral-200 p-3">
          <p className="mb-2 text-xs font-medium text-neutral-500">
            Cobertura de datas-base recebidas ({datasBase.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {datasBase.map((data) => (
              <span
                key={data}
                title={formatarData(data)}
                className="flex size-7 items-center justify-center rounded bg-status-success-bg text-[10px] font-medium text-status-success-text"
              >
                {data.slice(8, 10)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <TabelaDados
        colunas={colunas}
        dados={dados}
        chave={(pos) => pos.id}
        tituloVazio="Nenhuma posição diária recebida"
        mensagemVazia="Nenhum lote foi recebido para esta competência ainda."
      />
    </div>
  );
}

function TabelaCadoc5710({ periodoId }: { periodoId: string }) {
  const dados = posicoesMensaisPorPeriodo(periodoId);
  const colunas: ColunaTabela<PosicaoCustodiaMensal>[] = [
    { id: "data", cabecalho: "Data-base", renderizar: (pos) => formatarData(pos.dataBase) },
    {
      id: "carteira",
      cabecalho: "Carteira/Endereço",
      renderizar: (pos) => (
        <span>
          <span className="block text-xs">{pos.carteiraApelido}</span>
          <span className="block font-mono text-[11px] text-neutral-400">{truncarHash(pos.enderecoCarteira, 8, 6)}</span>
        </span>
      ),
    },
    { id: "rede", cabecalho: "Rede", renderizar: (pos) => pos.redeBlockchain },
    {
      id: "titularidade",
      cabecalho: "Titularidade",
      renderizar: (pos) =>
        pos.titularidade === "propria" ? "Própria" : pos.titularidade === "de_cliente" ? "De cliente" : "Terceiro",
    },
    { id: "ativo", cabecalho: "Ativo", renderizar: (pos) => pos.ativoVirtual },
    { id: "saldo", cabecalho: "Saldo total", alinhamento: "right", renderizar: (pos) => formatarNumero(Number(pos.saldoTotal), 8) },
    {
      id: "staking",
      cabecalho: "Saldo em staking",
      alinhamento: "right",
      renderizar: (pos) => (pos.staking ? formatarNumero(Number(pos.staking.saldoEmStaking), 8) : "0,00000000"),
    },
    { id: "protocolo", cabecalho: "Protocolo de staking", renderizar: (pos) => pos.staking?.protocolo ?? "—" },
    { id: "valor", cabecalho: "Valor em R$", alinhamento: "right", renderizar: (pos) => formatarBRL(pos.valorReais) },
  ];

  return (
    <TabelaDados
      colunas={colunas}
      dados={dados}
      chave={(pos) => pos.id}
      tituloVazio="Nenhuma carteira com saldo nesta competência"
      mensagemVazia="O documento não precisa ser transmitido nesta competência."
    />
  );
}

function TabelaFiscal({ periodoId }: { periodoId: string }) {
  const dados = servicosPorPeriodo(periodoId).slice(0, 20);
  const colunas: ColunaTabela<ServicoPrestadoDPS>[] = [
    { id: "numero", cabecalho: "Nº do documento", renderizar: (dps) => <span className="font-mono text-xs">{dps.numeroDocumentoInterno}</span> },
    { id: "data", cabecalho: "Data da prestação", renderizar: (dps) => formatarData(dps.dataPrestacao) },
    { id: "tomador", cabecalho: "Tomador", renderizar: (dps) => dps.tomadorNome },
    { id: "documento", cabecalho: "CNPJ do tomador", renderizar: (dps) => <span className="font-mono text-xs">{dps.tomadorDocumento}</span> },
    { id: "municipio", cabecalho: "Município", renderizar: (dps) => dps.municipioPrestacao },
    { id: "servico", cabecalho: "Código do serviço", renderizar: (dps) => `${dps.codigoServico} — ${dps.descricaoServico}` },
    { id: "valor", cabecalho: "Valor do serviço", alinhamento: "right", renderizar: (dps) => formatarBRL(dps.valorServico) },
    {
      id: "aliquota",
      cabecalho: "Alíquota ISS",
      alinhamento: "right",
      renderizar: (dps) => `${formatarNumero(dps.aliquotaIssConfirmada ?? dps.aliquotaIssSugerida, 2)}%`,
    },
    { id: "iss", cabecalho: "ISS", alinhamento: "right", renderizar: (dps) => formatarBRL(dps.valorIss) },
    {
      id: "retencao",
      cabecalho: "Retenção na fonte",
      renderizar: (dps) => (dps.retencaoNaFonte ? `Sim — ${formatarBRL(dps.valorRetido)}` : "Não"),
    },
  ];

  return (
    <TabelaDados
      colunas={colunas}
      dados={dados}
      chave={(dps) => dps.id}
      tituloVazio="Nenhum serviço prestado registrado"
      mensagemVazia="Nenhuma DPS foi registrada nesta competência ainda."
    />
  );
}

export interface DetalhePeriodoProps {
  periodoId: string;
  vozModulo: "acam212" | "cadoc" | "fiscal";
}

export function DetalhePeriodo({ periodoId, vozModulo }: DetalhePeriodoProps) {
  const periodo = usePeriodosStore((estado) => estado.periodos[periodoId]);
  const arquivos = usePeriodosStore((estado) => estado.arquivos);
  const validacoes = usePeriodosStore((estado) => estado.validacoes);
  const protocolos = usePeriodosStore((estado) => estado.protocolos);
  const eventos = usePeriodosStore((estado) => estado.eventos);
  const excecoesStore = usePeriodosStore((estado) => estado.excecoes);

  const [etapaSelecionada, setEtapaSelecionada] = useState<EtapaId | null>(null);
  const [estadoAnterior, setEstadoAnterior] = useState<string | undefined>(periodo?.estado);
  const [verificandoHashId, setVerificandoHashId] = useState<string | null>(null);

  if (periodo && periodo.estado !== estadoAnterior) {
    setEstadoAnterior(periodo.estado);
    setEtapaSelecionada(calcularPeriodoDerivado(periodo).etapaAtual);
  }

  if (!periodo) {
    return (
      <EstadoVazio
        titulo="Período não encontrado"
        mensagem="A competência solicitada não existe ou não pertence a este módulo."
      />
    );
  }

  if (vozModulo === "acam212" && periodo.moduloId !== "acam212") {
    return <EstadoVazio titulo="Período fora do módulo" mensagem="Esta competência não pertence ao ACAM212." />;
  }
  if (vozModulo === "cadoc" && periodo.moduloId !== "cadoc5711" && periodo.moduloId !== "cadoc5710") {
    return <EstadoVazio titulo="Período fora do módulo" mensagem="Esta competência não pertence ao Cadoc." />;
  }
  if (vozModulo === "fiscal" && periodo.moduloId !== "fiscal") {
    return <EstadoVazio titulo="Período fora do módulo" mensagem="Esta competência não pertence ao Fiscal." />;
  }

  const derivado = calcularPeriodoDerivado(periodo);
  const modulo = buscarModulo(periodo.moduloId);
  const instituicao = buscarInstituicao(periodo.instituicaoId);
  const arquivoCorrente = periodo.arquivoCorrenteId ? arquivos[periodo.arquivoCorrenteId] : undefined;
  const validacaoCorrente = periodo.validacaoId ? validacoes[periodo.validacaoId] : undefined;
  const protocoloCorrente = periodo.protocoloId ? protocolos[periodo.protocoloId] : undefined;
  const excecoesPeriodo = Object.values(excecoesStore).filter((excecao) => excecao.periodoId === periodoId);
  const eventosPeriodo = eventos
    .filter((evento) => evento.periodoId === periodoId)
    .sort((a, b) => (a.ocorridoEm < b.ocorridoEm ? -1 : a.ocorridoEm > b.ocorridoEm ? 1 : 0));

  const ultimoLote = periodo.lotes.at(-1);
  const marcos: Partial<Record<EtapaId, MarcoEtapa>> = {
    ingestao: ultimoLote
      ? { concluidaEm: ultimoLote.recebidoEm, responsavelNome: buscarUsuario(ultimoLote.recebidoPorUsuarioId)?.nome }
      : undefined,
    geracao: periodo.geradoEm
      ? { concluidaEm: periodo.geradoEm, responsavelNome: buscarUsuario(periodo.geradoPorUsuarioId ?? "")?.nome }
      : undefined,
    contador: periodo.contadorConfirmadoEm
      ? { concluidaEm: periodo.contadorConfirmadoEm, responsavelNome: buscarUsuario(periodo.contadorUsuarioId ?? "")?.nome }
      : undefined,
    validacao: validacaoCorrente
      ? { concluidaEm: validacaoCorrente.executadaEm, responsavelNome: buscarUsuario(validacaoCorrente.executadaPorUsuarioId)?.nome }
      : undefined,
    auditoria: periodo.liberadoEm
      ? { concluidaEm: periodo.liberadoEm, responsavelNome: buscarUsuario(periodo.liberadoPorUsuarioId ?? "")?.nome }
      : undefined,
    entrega: periodo.entregueEm
      ? { concluidaEm: periodo.entregueEm, responsavelNome: buscarUsuario(protocoloCorrente?.registradoPorUsuarioId ?? "")?.nome }
      : undefined,
  };

  const etapas = construirEtapasStepper(modulo.etapas, derivado.etapaAtual, periodo.estado, marcos);
  const etapaAtivaId = etapaSelecionada ?? derivado.etapaAtual;

  const usuarioGerador = periodo.geradoPorUsuarioId ? buscarUsuario(periodo.geradoPorUsuarioId) : undefined;
  const usuarioLiberador = periodo.liberadoPorUsuarioId ? buscarUsuario(periodo.liberadoPorUsuarioId) : undefined;
  const usuarioAprovador = periodo.aprovadoPorUsuarioId ? buscarUsuario(periodo.aprovadoPorUsuarioId) : undefined;
  const segregacaoOk = Boolean(
    usuarioGerador && usuarioLiberador && usuarioGerador.id !== usuarioLiberador.id
  );

  const ehFiscal = periodo.moduloId === "fiscal";
  const rotaLista = modulo.rota;

  function reverificarHash(arquivoId: string) {
    setVerificandoHashId(arquivoId);
    setTimeout(() => {
      setVerificandoHashId(null);
      toast.success("Hash íntegro confirmado.");
    }, 1200);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <nav aria-label="Trilha de navegação" className="mb-1 text-xs text-neutral-500">
            <Link href="/app" className="hover:text-brand-700">
              Painel
            </Link>
            {" › "}
            <Link href={rotaLista} className="hover:text-brand-700">
              {modulo.nome}
            </Link>
            {" › "}
            <span className="text-neutral-700">{periodo.competenciaRotulo}</span>
          </nav>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-neutral-700">
            {modulo.nome} · Competência {periodo.competenciaRotulo}
            {ehFiscal ? <SeloCandidato tamanho="sm" /> : null}
          </h1>
          <div data-tour="periodo-cabecalho" className="mt-2 flex flex-wrap items-center gap-2">
            <BadgeStatus estado={periodo.estado} />
            <BadgeAtrasado dias={derivado.diasDeAtraso} />
            <span className="text-sm text-neutral-500">Prazo: {formatarData(periodo.prazoEntrega)}</span>
            <span className="text-sm text-neutral-500">
              {instituicao?.nomeFantasia} · {instituicao ? formatarCNPJ(instituicao.cnpj) : ""}
            </span>
          </div>
        </div>
        <BarraAcoesFluxo periodoId={periodoId} className="shrink-0" />
      </div>

      <StepperEtapas
        etapas={etapas}
        aoSelecionar={(etapaId) => setEtapaSelecionada(etapaId)}
        etapaSelecionadaId={etapaAtivaId}
        className="rounded-lg border"
      />

      <Tabs value={etapaAtivaId} onValueChange={(valor) => setEtapaSelecionada(valor as EtapaId)}>
        <TabsList className="hidden">
          {modulo.etapas.map((etapaId) => (
            <TabsTrigger key={etapaId} value={etapaId}>
              {etapaId}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="ingestao" id="ingestao-painel" className="space-y-4">
          <RecepcaoDocumentos periodoId={periodoId} />

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Pré-visualização dos registros</h2>
            {periodo.moduloId === "acam212" ? <TabelaAcam212 periodoId={periodoId} /> : null}
            {periodo.moduloId === "cadoc5711" ? <TabelaCadoc5711 periodoId={periodoId} /> : null}
            {periodo.moduloId === "cadoc5710" ? <TabelaCadoc5710 periodoId={periodoId} /> : null}
            {periodo.moduloId === "fiscal" ? <TabelaFiscal periodoId={periodoId} /> : null}
          </div>
        </TabsContent>

        <TabsContent value="geracao" className="space-y-4">
          {arquivoCorrente ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div className="rounded-lg border border-neutral-200 bg-white p-5">
                  <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Composição</h2>
                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {Object.entries(periodo.totaisResumo).map(([chave, valor]) => (
                      <div key={chave} className="rounded-md bg-neutral-50 p-3">
                        <dt className="text-xs text-neutral-500">{rotuloTotal(chave)}</dt>
                        <dd className="text-sm font-medium text-neutral-700">{formatarValorTotal(chave, valor)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {periodo.moduloId === "cadoc5710" ? (
                  <div className="rounded-lg border border-neutral-200 bg-white p-5">
                    <h2 className="mb-1 font-display text-lg font-bold text-neutral-700">Bloco de staking</h2>
                    <p className="mb-3 text-xs text-neutral-500">
                      Bloco incluído no arquivo apenas quando há saldo em staking na data-base.
                    </p>
                    <TabelaDados
                      colunas={[
                        { id: "carteira", cabecalho: "Carteira", renderizar: (pos) => pos.carteiraApelido },
                        { id: "rede", cabecalho: "Rede", renderizar: (pos) => pos.redeBlockchain },
                        { id: "ativo", cabecalho: "Ativo", renderizar: (pos) => pos.ativoVirtual },
                        {
                          id: "saldo",
                          cabecalho: "Saldo em staking",
                          alinhamento: "right",
                          renderizar: (pos) => formatarNumero(Number(pos.staking?.saldoEmStaking ?? 0), 8),
                        },
                        { id: "protocolo", cabecalho: "Protocolo", renderizar: (pos) => pos.staking?.protocolo ?? "—" },
                        {
                          id: "recompensas",
                          cabecalho: "Recompensas no período",
                          alinhamento: "right",
                          renderizar: (pos) => formatarNumero(Number(pos.staking?.recompensasPeriodo ?? 0), 8),
                        },
                        {
                          id: "valor",
                          cabecalho: "Valor em R$",
                          alinhamento: "right",
                          renderizar: (pos) => formatarBRL(pos.staking?.valorEmStakingReais ?? 0),
                        },
                      ]}
                      dados={posicoesMensaisPorPeriodo(periodoId).filter((pos) => pos.possuiStaking)}
                      chave={(pos) => pos.id}
                      tituloVazio="Sem saldo em staking"
                      mensagemVazia="Nenhuma carteira desta competência possui saldo em staking."
                    />
                  </div>
                ) : null}

                <div className="rounded-lg border border-neutral-200 bg-white p-5">
                  <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Versões geradas</h2>
                  <ul className="space-y-1.5 text-sm">
                    {periodo.arquivoIds.map((arquivoId) => {
                      const versao = arquivos[arquivoId];
                      if (!versao) return null;
                      return (
                        <li key={arquivoId} className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-neutral-700">v{versao.versao}</span>
                          <span className="text-neutral-500">{formatarDataHora(versao.geradoEm)}</span>
                          <span className="font-mono text-xs text-neutral-500">{truncarHash(versao.hashSha256)}</span>
                          <span
                            className={cn(
                              "status-badge",
                              versao.situacao === "corrente" ? "status-badge-success" : "status-badge-neutral"
                            )}
                          >
                            {versao.situacao === "corrente" ? "Corrente" : "Substituída"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-white p-5">
                  <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Visualização do arquivo</h2>
                  <pre className="max-h-64 overflow-auto rounded-md bg-neutral-50 p-3 font-mono text-xs text-neutral-600">
                    {arquivoCorrente.previewConteudo}
                  </pre>
                </div>
              </div>

              <div data-tour="painel-arquivo">
                <PainelArquivo arquivo={arquivoCorrente} competenciaRotulo={periodo.competenciaRotulo} />
              </div>
            </div>
          ) : (
            <EstadoVazio
              titulo="O arquivo ainda não foi gerado para esta competência"
              mensagem="A geração é executada pelo time Sentinellus depois que os dados são recebidos."
            />
          )}
        </TabsContent>

        {modulo.etapas.includes("contador") ? (
          <TabsContent value="contador" className="space-y-4">
            <div data-tour="fiscal-banner">
              <BannerPosicionamento variante="atencao" />
            </div>
            <div data-tour="contador-resumo" className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Resumo para o contador</h2>
              {periodo.contadorStatus === "confirmado" ? (
                <p className="text-sm text-status-success-text">
                  Enquadramento confirmado por {buscarUsuario(periodo.contadorUsuarioId ?? "")?.nome ?? "contador responsável"} em{" "}
                  {periodo.contadorConfirmadoEm ? formatarDataHora(periodo.contadorConfirmadoEm) : "—"}.
                </p>
              ) : periodo.estado === "aguardando_contador" ? (
                <p className="text-sm text-status-warning-text">
                  Aguardando análise do contador responsável desde {formatarData(periodo.dataAbertura)}. Use os
                  botões de ação no topo da página para confirmar ou devolver.
                </p>
              ) : (
                <p className="text-sm text-neutral-500">
                  A DPS ainda não foi enviada para análise do contador nesta competência.
                </p>
              )}
              <p className="mt-3 text-xs text-neutral-500">
                A Sentinellus calcula a partir dos dicionários configurados. A definição de alíquota, retenção e
                enquadramento é do contador responsável.
              </p>
            </div>
            <div data-tour="contador-tabela-dps" className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">DPS para análise</h2>
              <TabelaFiscal periodoId={periodoId} />
            </div>
          </TabsContent>
        ) : null}

        <TabsContent value="validacao" className="space-y-4">
          {validacaoCorrente ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Resultado da validação</h2>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-neutral-500">Schema</p>
                    <p className="font-medium text-neutral-700">
                      {validacaoCorrente.schema} v{validacaoCorrente.versaoSchema}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Executada em</p>
                    <p className="font-medium text-neutral-700">{formatarDataHora(validacaoCorrente.executadaEm)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Responsável</p>
                    <p className="font-medium text-neutral-700">
                      {buscarUsuario(validacaoCorrente.executadaPorUsuarioId)?.nome ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Duração</p>
                    <p className="font-medium text-neutral-700">{formatarNumero(validacaoCorrente.duracaoMs)} ms</p>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-neutral-700">
                  {validacaoCorrente.totalErros} erro(s) · {validacaoCorrente.totalAvisos} aviso(s)
                </p>
              </div>

              {validacaoCorrente.itens.length > 0 ? (
                <div data-tour="lista-erros-avisos" className="rounded-lg border border-neutral-200 bg-white p-5">
                  <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Erros e avisos</h2>
                  <ul className="space-y-2">
                    {validacaoCorrente.itens.map((item, indice) => (
                      <li
                        key={`${item.codigo}-${indice}`}
                        className={cn(
                          "rounded-md border p-3 text-sm",
                          item.severidade === "bloqueante"
                            ? "border-status-error-border bg-status-error-bg"
                            : item.severidade === "aviso"
                              ? "border-status-warning-border bg-status-warning-bg"
                              : "border-status-info-border bg-status-info-bg"
                        )}
                      >
                        <p className="font-mono text-xs text-neutral-500">{item.codigo}</p>
                        <p className="text-neutral-700">{item.mensagem}</p>
                        {item.localizacaoLinha ? (
                          <p className="mt-1 text-xs text-neutral-500">Linha {item.localizacaoLinha}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Regras determinísticas</h2>
                <ul className="space-y-1.5 text-sm">
                  {validacaoCorrente.regrasDeterministicas.map((regra) => (
                    <li key={regra.regra} className="flex items-center gap-2">
                      {regra.aprovada ? (
                        <ShieldCheck className="size-4 text-status-success-text" aria-hidden="true" />
                      ) : (
                        <ShieldQuestion className="size-4 text-status-error-text" aria-hidden="true" />
                      )}
                      <span className="text-neutral-700">{regra.regra}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <EstadoVazio titulo="A validação ainda não foi executada" mensagem="Ela roda o schema oficial e as regras determinísticas do módulo." />
          )}

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Exceções da competência</h2>
            <PainelExcecoes excecoes={excecoesPeriodo} />
          </div>
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4">
          <div data-tour="card-segregacao-funcoes" className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Segregação de funções</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Gerado por</p>
                <p className="text-sm font-medium text-neutral-700">{usuarioGerador?.nome ?? "—"}</p>
                <p className="text-xs text-neutral-500">{periodo.geradoEm ? formatarDataHora(periodo.geradoEm) : "—"}</p>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Liberado por</p>
                <p className="text-sm font-medium text-neutral-700">{usuarioLiberador?.nome ?? "—"}</p>
                <p className="text-xs text-neutral-500">{periodo.liberadoEm ? formatarDataHora(periodo.liberadoEm) : "—"}</p>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Aprovado por</p>
                <p className="text-sm font-medium text-neutral-700">{usuarioAprovador?.nome ?? "—"}</p>
                <p className="text-xs text-neutral-500">{periodo.aprovadoEm ? formatarDataHora(periodo.aprovadoEm) : "—"}</p>
              </div>
            </div>
            <span className={cn("status-badge mt-3", segregacaoOk ? "status-badge-success" : "status-badge-neutral")}>
              {segregacaoOk ? "Segregação verificada" : "Aguardando"}
            </span>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Registro de integridade</h2>
            <ul className="space-y-2">
              {periodo.arquivoIds.map((arquivoId) => {
                const versao = arquivos[arquivoId];
                if (!versao) return null;
                return (
                  <li key={arquivoId} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-neutral-50 p-3 text-sm">
                    <div>
                      <p className="font-medium text-neutral-700">{versao.nomeArquivo}</p>
                      <p className="font-mono text-xs text-neutral-500">{versao.hashSha256}</p>
                      <p className="text-xs text-neutral-500">
                        {versao.algoritmoHash} · {formatarNumero(versao.tamanhoBytes)} bytes ·{" "}
                        {formatarDataHora(versao.geradoEm)}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => reverificarHash(arquivoId)}>
                      {verificandoHashId === arquivoId ? "Verificando…" : "Reverificar hash"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-neutral-700">Linha do tempo</h2>
            <TimelineAuditoria eventos={eventosPeriodo} />
          </div>

          {periodo.aprovadoEm && usuarioAprovador ? (
            <div className="rounded-lg border border-status-success-border bg-status-success-bg p-5">
              <h2 className="mb-2 font-display text-lg font-bold text-status-success-text">Termo de aprovação</h2>
              <p className="text-sm text-status-success-text">
                Declaro, na qualidade de {usuarioAprovador.cargo} da {instituicao?.razaoSocial}, que revisei o
                conteúdo deste arquivo e assumo a responsabilidade pela obrigação perante o órgão competente.
              </p>
              <p className="mt-2 text-xs text-status-success-text">
                {usuarioAprovador.nome} · CPF {usuarioAprovador.cpf} · {formatarDataHora(periodo.aprovadoEm)}
                {arquivoCorrente ? ` · hash ${truncarHash(arquivoCorrente.hashSha256)}` : ""}
              </p>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="entrega" className="space-y-4">
          {!ehFiscal ? (
            <div data-tour="entrega-conteudo" className="space-y-4">
              {arquivoCorrente ? <PainelArquivo arquivo={arquivoCorrente} competenciaRotulo={periodo.competenciaRotulo} /> : null}
              <BannerPosicionamento variante="info" titulo="Transmissão ao Banco Central">
                O arquivo está pronto e íntegro. A transmissão ao Banco Central é feita pela instituição, fora do
                Sentinellus. Depois de enviar, registre aqui o protocolo recebido para manter a trilha de
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
              {arquivoCorrente ? <PainelArquivo arquivo={arquivoCorrente} competenciaRotulo={periodo.competenciaRotulo} /> : null}
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
                  mensagem="A emissão da NFS-e ocorre fora do Sentinellus, pelo emissor definido pela instituição."
                />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Separator />
    </div>
  );
}
