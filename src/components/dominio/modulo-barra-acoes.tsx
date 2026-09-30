"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePeriodosStore } from "@/lib/store/periodos";
import { useEvidenciasStore } from "@/lib/store/evidencias";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarPerfil, ROTULOS_ACAO } from "@/lib/permissoes";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import type { AcaoId, CanalEnvioBcb, ValidacaoItem } from "@/lib/tipos";
import { formatarDataHora, truncarHash } from "@/lib/formatadores";

const VARIANTE_BOTAO: Record<string, "default" | "outline" | "destructive" | "ghost"> = {
  primario: "default",
  secundario: "outline",
  "destrutivo-suave": "destructive",
  ghost: "ghost",
};

const CANDIDATOS_BARRA: AcaoId[] = [
  "gerar",
  "regerar",
  "enviar_validacao",
  "enviar_contador",
  "validar_fiscal",
  "devolver_fiscal",
  "executar_validacao",
  "liberar",
  "registrar_protocolo",
  "marcar_encaminhado",
  "registrar_retorno",
  "aprovar",
  "negar_aprovacao",
];

const VARIANTE_ACAO: Partial<Record<AcaoId, "primario" | "secundario" | "destrutivo-suave" | "ghost">> = {
  gerar: "primario",
  regerar: "secundario",
  enviar_validacao: "primario",
  enviar_contador: "primario",
  validar_fiscal: "primario",
  devolver_fiscal: "destrutivo-suave",
  executar_validacao: "primario",
  liberar: "primario",
  registrar_protocolo: "primario",
  marcar_encaminhado: "primario",
  registrar_retorno: "secundario",
  aprovar: "primario",
  negar_aprovacao: "destrutivo-suave",
  reabrir: "destrutivo-suave",
};

function resolverItensValidacao(
  periodo: ReturnType<typeof usePeriodosStore.getState>["periodos"][string],
  validacoes: ReturnType<typeof usePeriodosStore.getState>["validacoes"],
  excecoes: ReturnType<typeof usePeriodosStore.getState>["excecoes"]
): { itens: ValidacaoItem[]; totalAvisos?: number } {
  if (periodo.estado === "com_excecoes") {
    return { itens: [] };
  }

  const validacaoExistente = periodo.validacaoId ? validacoes[periodo.validacaoId] : undefined;
  if (validacaoExistente && validacaoExistente.itens.length > 0) {
    return { itens: validacaoExistente.itens, totalAvisos: validacaoExistente.totalAvisos };
  }

  const bloqueantesAbertas = Object.values(excecoes).filter(
    (excecao) =>
      excecao.periodoId === periodo.id &&
      excecao.severidade === "bloqueante" &&
      excecao.status !== "tratada" &&
      excecao.status !== "aceita_com_justificativa"
  );

  if (bloqueantesAbertas.length > 0) {
    return {
      itens: bloqueantesAbertas.map((excecao) => ({
        codigo: excecao.codigo,
        severidade: "bloqueante" as const,
        mensagem: excecao.descricao,
        localizacaoLinha: null,
        localizacaoNo: null,
        campo: null,
        valorEncontrado: null,
        valorEsperado: null,
        registroRefId: excecao.registroRefId,
      })),
    };
  }

  return { itens: [] };
}

export interface BarraAcoesFluxoProps {
  periodoId: string;
  className?: string;
}

export function BarraAcoesFluxo({ periodoId, className }: BarraAcoesFluxoProps) {
  const periodo = usePeriodosStore((estado) => estado.periodos[periodoId]);
  const arquivos = usePeriodosStore((estado) => estado.arquivos);
  const validacoes = usePeriodosStore((estado) => estado.validacoes);
  const excecoes = usePeriodosStore((estado) => estado.excecoes);
  const podeExecutarStore = usePeriodosStore((estado) => estado.podeExecutar);

  const gerarArquivo = usePeriodosStore((estado) => estado.gerarArquivo);
  const enviarParaValidacao = usePeriodosStore((estado) => estado.enviarParaValidacao);
  const enviarAoContador = usePeriodosStore((estado) => estado.enviarAoContador);
  const validarContador = usePeriodosStore((estado) => estado.validarContador);
  const reprocessar = usePeriodosStore((estado) => estado.reprocessar);
  const liberar = usePeriodosStore((estado) => estado.liberar);
  const aprovar = usePeriodosStore((estado) => estado.aprovar);
  const registrarEntrega = usePeriodosStore((estado) => estado.registrarEntrega);
  const registrarRetorno = usePeriodosStore((estado) => estado.registrarRetorno);
  const reabrir = usePeriodosStore((estado) => estado.reabrir);
  const negarAprovacao = usePeriodosStore((estado) => estado.negarAprovacao);
  const selarNovaVersaoArquivo = useEvidenciasStore((estado) => estado.selarNovaVersaoArquivo);

  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);

  const [dialogoAberto, setDialogoAberto] = useState<AcaoId | null>(null);

  const [campoTexto, setCampoTexto] = useState("");
  const [campoTexto2, setCampoTexto2] = useState("");
  const [campoTextarea, setCampoTextarea] = useState("");
  const [campoSelect, setCampoSelect] = useState("");
  const [campoCheckbox, setCampoCheckbox] = useState(false);

  if (!periodo || !perfilAtivo || !usuarioId) {
    return null;
  }

  const perfilMetadados = buscarPerfil(perfilAtivo);
  const autor = { usuarioId, perfilId: perfilAtivo };
  const instituicao = buscarInstituicao(periodo.instituicaoId);
  const arquivoCorrente = periodo.arquivoCorrenteId ? arquivos[periodo.arquivoCorrenteId] : undefined;
  const usuarioGerador = periodo.geradoPorUsuarioId ? buscarUsuario(periodo.geradoPorUsuarioId) : undefined;
  const usuarioLiberador = periodo.liberadoPorUsuarioId ? buscarUsuario(periodo.liberadoPorUsuarioId) : undefined;
  const modulo = buscarModulo(periodo.moduloId);
  const usuarioContador = periodo.contadorUsuarioId ? buscarUsuario(periodo.contadorUsuarioId) : undefined;
  const usuarioAtual = buscarUsuario(usuarioId);

  function abrirDialogo(acaoId: AcaoId) {
    setCampoTexto("");
    setCampoTexto2("");
    setCampoTextarea("");
    setCampoSelect("");
    setCampoCheckbox(false);
    if (acaoId === "registrar_protocolo") {
      setCampoSelect("pstaw10");
    }
    if (acaoId === "marcar_encaminhado") {
      setCampoSelect("ERP do cliente");
    }
    if (acaoId === "registrar_retorno") {
      setCampoSelect("aceito");
    }
    setDialogoAberto(acaoId);
  }

  function fecharDialogo() {
    setDialogoAberto(null);
  }

  function tratarResultado(resultado: { sucesso: boolean; motivo?: string }, mensagemSucesso: string) {
    if (resultado.sucesso) {
      toast.success(mensagemSucesso);
      fecharDialogo();
    } else {
      toast.error(resultado.motivo ?? "Não foi possível concluir a ação.");
    }
  }

  function acionar(acaoId: AcaoId) {
    switch (acaoId) {
      case "gerar": {
        const resultado = gerarArquivo(periodoId, autor);
        tratarResultado(resultado, "Arquivo gerado. Hash registrado na trilha de auditoria.");
        return;
      }
      case "enviar_validacao": {
        const resultado = enviarParaValidacao(periodoId, autor);
        tratarResultado(resultado, "Arquivo enviado para validação.");
        return;
      }
      case "executar_validacao": {
        const { itens, totalAvisos } = resolverItensValidacao(periodo, validacoes, excecoes);
        const resultado = reprocessar(periodoId, autor, { itens, totalAvisos });
        const totalErros = itens.filter((item) => item.severidade === "bloqueante").length;
        tratarResultado(
          resultado,
          totalErros > 0
            ? `Validação concluída com ${totalErros} erro(s) bloqueante(s). Exceções abertas.`
            : "Validação concluída: 0 erros."
        );
        return;
      }
      case "baixar_arquivo":
        toast.info("Download simulado. Nenhum arquivo real é gerado nesta demonstração.");
        return;
      case "exportar_auditoria":
        toast.info("Exportação simulada. Nenhum arquivo real é gerado nesta demonstração.");
        return;
      default:
        abrirDialogo(acaoId);
    }
  }

  async function selarSeNecessario(estadoOrigem: string) {
    if (estadoOrigem !== "devolvido_diretor" || !usuarioAtual) {
      return;
    }
    const periodoAtual = usePeriodosStore.getState().periodos[periodoId];
    const arquivoAtual = periodoAtual?.arquivoCorrenteId
      ? usePeriodosStore.getState().arquivos[periodoAtual.arquivoCorrenteId]
      : undefined;
    if (!periodoAtual || !arquivoAtual) {
      return;
    }
    await selarNovaVersaoArquivo({
      periodo: periodoAtual,
      arquivo: arquivoAtual,
      autor: { usuarioId: autor.usuarioId, nome: usuarioAtual.nome, perfilId: autor.perfilId },
      origemNome: `Nova versão gerada após devolução do Diretor — ${arquivoAtual.nomeArquivo}`,
    });
  }

  function confirmarDialogo() {
    if (!dialogoAberto) return;

    switch (dialogoAberto) {
      case "regerar": {
        const estadoOrigem = periodo.estado;
        const resultado = gerarArquivo(periodoId, autor);
        if (resultado.sucesso) {
          void selarSeNecessario(estadoOrigem);
        }
        tratarResultado(resultado, "Nova versão do arquivo gerada. Hash atualizado na trilha.");
        return;
      }
      case "negar_aprovacao": {
        if (campoTextarea.trim().length < 10) {
          toast.error("Descreva o motivo da negação com pelo menos 10 caracteres.");
          return;
        }
        const resultado = negarAprovacao(periodoId, autor, campoTextarea);
        tratarResultado(resultado, "Aprovação negada. Período devolvido ao Executor.");
        return;
      }
      case "enviar_contador": {
        const resultado = enviarAoContador(periodoId, autor);
        tratarResultado(resultado, "DPS enviada ao contador responsável.");
        return;
      }
      case "validar_fiscal": {
        if (!campoCheckbox) {
          toast.error("Confirme a declaração para concluir a análise.");
          return;
        }
        const resultado = validarContador(periodoId, autor, "confirmado");
        tratarResultado(resultado, `Enquadramento fiscal confirmado por ${usuarioAtual?.nome ?? "você"}.`);
        return;
      }
      case "devolver_fiscal": {
        if (campoTextarea.trim().length < 20) {
          toast.error("Descreva o motivo da devolução com pelo menos 20 caracteres.");
          return;
        }
        const resultado = validarContador(periodoId, autor, "devolvido", campoTextarea);
        tratarResultado(resultado, "DPS devolvida para correção.");
        return;
      }
      case "liberar": {
        const resultado = liberar(periodoId, autor);
        tratarResultado(resultado, `Competência ${periodo.competenciaRotulo} liberada para ${instituicao?.nomeFantasia ?? "a instituição"}.`);
        return;
      }
      case "aprovar": {
        if (!campoCheckbox) {
          toast.error("Marque a declaração de ciência para aprovar.");
          return;
        }
        const textoCiencia = `Declaro, na qualidade de ${usuarioAtual?.cargo ?? "responsável"} da ${instituicao?.razaoSocial ?? "instituição"}, que revisei o conteúdo deste arquivo e assumo a responsabilidade pela obrigação perante o órgão competente.`;
        const resultado = aprovar(periodoId, autor, textoCiencia);
        tratarResultado(resultado, `Competência aprovada por ${usuarioAtual?.nome ?? "você"}. Arquivo disponível para transmissão.`);
        return;
      }
      case "registrar_protocolo": {
        if (campoTexto.trim().length < 6) {
          toast.error("Informe o número do protocolo recebido do Banco Central.");
          return;
        }
        const resultado = registrarEntrega(periodoId, autor, {
          numeroProtocolo: campoTexto,
          canalEnvio: (campoSelect || "outro") as CanalEnvioBcb,
          observacao: campoTextarea || undefined,
        });
        tratarResultado(resultado, `Protocolo ${campoTexto} registrado.`);
        return;
      }
      case "marcar_encaminhado": {
        const emissor = campoTexto2 ? `${campoSelect} — ${campoTexto2}` : campoSelect || "Outro";
        const resultado = registrarEntrega(periodoId, autor, {
          emissor,
          canalEnvio: "outro",
          observacao: `Encaminhado para ${emissor}.${campoTextarea ? ` ${campoTextarea}` : ""}`,
        });
        tratarResultado(resultado, "DPS encaminhada ao emissor definido pela instituição.");
        return;
      }
      case "registrar_retorno": {
        if (!campoTextarea.trim()) {
          toast.error("Descreva a mensagem de retorno recebida do Banco Central.");
          return;
        }
        const resultado = registrarRetorno(
          periodoId,
          autor,
          (campoSelect || "aceito") as "aceito" | "aceito_com_ressalvas" | "rejeitado",
          campoTexto,
          campoTextarea
        );
        tratarResultado(resultado, "Retorno do Banco Central registrado na trilha.");
        return;
      }
      case "reabrir": {
        if (campoTextarea.trim().length < 10) {
          toast.error("Descreva o motivo da reabertura com pelo menos 10 caracteres.");
          return;
        }
        const resultado = reabrir(periodoId, autor, campoTextarea);
        tratarResultado(resultado, "Período reaberto para correção.");
        return;
      }
      default:
        fecharDialogo();
    }
  }

  const acoesBarra = CANDIDATOS_BARRA.filter((acaoId) => perfilMetadados.acoesPermitidas.includes(acaoId))
    .map((acaoId) => ({ acaoId, avaliacao: podeExecutarStore(perfilAtivo, acaoId, periodoId, usuarioId) }))
    .filter((item) => item.avaliacao.visivel);

  const acaoBaixar = perfilMetadados.acoesPermitidas.includes("baixar_arquivo")
    ? podeExecutarStore(perfilAtivo, "baixar_arquivo", periodoId, usuarioId)
    : null;
  const acaoExportar = perfilMetadados.acoesPermitidas.includes("exportar_auditoria")
    ? podeExecutarStore(perfilAtivo, "exportar_auditoria", periodoId, usuarioId)
    : null;
  const acaoReabrir = perfilMetadados.acoesPermitidas.includes("reabrir")
    ? podeExecutarStore(perfilAtivo, "reabrir", periodoId, usuarioId)
    : null;

  const temMenu = Boolean(acaoBaixar?.visivel || acaoExportar?.visivel || acaoReabrir?.visivel);

  function rotuloAcao(acaoId: AcaoId): string {
    if (acaoId === "executar_validacao" && periodo.estado === "com_excecoes") {
      return "Reprocessar validação";
    }
    return ROTULOS_ACAO[acaoId];
  }

  return (
    <TooltipProvider>
      <div data-tour="barra-acoes" className={className}>
        <div className="flex flex-wrap items-center gap-2">
          {acoesBarra.map(({ acaoId, avaliacao }) => {
            const variante = VARIANTE_ACAO[acaoId] ?? "secundario";
            const botao = (
              <Button
                key={acaoId}
                type="button"
                variant={VARIANTE_BOTAO[variante]}
                size="sm"
                disabled={!avaliacao.permitido}
                onClick={() => acionar(acaoId)}
              >
                {rotuloAcao(acaoId)}
              </Button>
            );

            if (!avaliacao.permitido && avaliacao.motivo) {
              return (
                <Tooltip key={acaoId}>
                  <TooltipTrigger render={<span tabIndex={0} />}>{botao}</TooltipTrigger>
                  <TooltipContent>{avaliacao.motivo}</TooltipContent>
                </Tooltip>
              );
            }

            return botao;
          })}

          {temMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Mais ações" />}
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {acaoBaixar?.visivel ? (
                  <DropdownMenuItem
                    disabled={!acaoBaixar.permitido}
                    onClick={() => acionar("baixar_arquivo")}
                  >
                    Baixar arquivo
                  </DropdownMenuItem>
                ) : null}
                {acaoExportar?.visivel ? (
                  <DropdownMenuItem
                    disabled={!acaoExportar.permitido}
                    onClick={() => acionar("exportar_auditoria")}
                  >
                    Exportar trilha do período
                  </DropdownMenuItem>
                ) : null}
                {acaoReabrir?.visivel ? (
                  <DropdownMenuItem
                    disabled={!acaoReabrir.permitido}
                    variant="destructive"
                    onClick={() => abrirDialogo("reabrir")}
                  >
                    Reabrir período
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <Dialog open={dialogoAberto !== null} onOpenChange={(aberto) => !aberto && fecharDialogo()}>
          <DialogContent>
            {dialogoAberto === "regerar" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Gerar novamente?</DialogTitle>
                  <DialogDescription>
                    A versão atual será marcada como substituída e um novo hash será calculado. A versão
                    anterior permanece na trilha de auditoria.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo}>
                    Gerar nova versão
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "enviar_contador" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Enviar ao contador?</DialogTitle>
                  <DialogDescription>
                    {usuarioContador?.nome ?? "O contador responsável"} será notificado para confirmar
                    alíquota, retenção e enquadramento das DPS desta competência.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo}>
                    Enviar
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "validar_fiscal" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Confirmar o enquadramento?</DialogTitle>
                  <DialogDescription>
                    Você declara que alíquota, retenção e enquadramento tributário das DPS desta competência
                    foram revisados e estão corretos. Esta confirmação fica registrada em seu nome na trilha
                    de auditoria.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="ciencia-fiscal"
                    checked={campoCheckbox}
                    onCheckedChange={(valor) => setCampoCheckbox(valor === true)}
                  />
                  <Label htmlFor="ciencia-fiscal" className="font-normal">
                    Revisei e confirmo o enquadramento fiscal desta competência.
                  </Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo}>
                    Confirmar
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "devolver_fiscal" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Devolver para correção?</DialogTitle>
                  <DialogDescription>
                    Descreva o que precisa ser ajustado. O time Videnas será acionado.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={campoTextarea}
                  onChange={(evento) => setCampoTextarea(evento.target.value)}
                  placeholder="Ex.: revisar alíquota do código de serviço 17.01 para o município informado."
                  rows={4}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="destructive" onClick={confirmarDialogo}>
                    Devolver
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "liberar" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Liberar esta competência?</DialogTitle>
                  <DialogDescription>
                    Você confirma que o arquivo passou pela validação de schema e está apto a ser entregue
                    pela instituição. Arquivo gerado por {usuarioGerador?.nome ?? "—"} · hash{" "}
                    {arquivoCorrente ? truncarHash(arquivoCorrente.hashSha256) : "—"}.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo}>
                    Liberar
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "aprovar" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Aprovar a competência {periodo.competenciaRotulo}?</DialogTitle>
                  <DialogDescription>
                    {modulo.nome} · Competência {periodo.competenciaRotulo} · versão v
                    {arquivoCorrente?.versao ?? "—"} · liberado por {usuarioLiberador?.nome ?? "—"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
                  <p>
                    Hash SHA-256:{" "}
                    <span className="font-mono">
                      {arquivoCorrente ? truncarHash(arquivoCorrente.hashSha256) : "—"}
                    </span>
                  </p>
                </div>
                {periodo.negacoesAprovacao.length > 0 ? (
                  <div className="space-y-1.5 rounded-md border border-status-warning-border bg-status-warning-bg p-3">
                    <p className="text-xs font-semibold text-status-warning-text">
                      Negações anteriores ({periodo.negacoesAprovacao.length})
                    </p>
                    <ul className="space-y-1.5 text-xs text-status-warning-text">
                      {periodo.negacoesAprovacao.map((negacao, indice) => {
                        const arquivoNegado = negacao.arquivoId ? arquivos[negacao.arquivoId] : undefined;
                        return (
                          <li key={`${negacao.ocorridoEm}-${indice}`}>
                            {formatarDataHora(negacao.ocorridoEm)} ·{" "}
                            {buscarUsuario(negacao.usuarioId)?.nome ?? negacao.usuarioId}
                            {arquivoNegado ? (
                              <>
                                {" "}
                                · versão v{arquivoNegado.versao} · hash{" "}
                                <span className="font-mono">{truncarHash(arquivoNegado.hashSha256)}</span>
                              </>
                            ) : negacao.arquivoId ? (
                              ` · arquivo ${negacao.arquivoId}`
                            ) : (
                              ""
                            )}
                            <br />
                            {negacao.motivo}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="ciencia-aprovacao"
                    checked={campoCheckbox}
                    onCheckedChange={(valor) => setCampoCheckbox(valor === true)}
                  />
                  <Label htmlFor="ciencia-aprovacao" className="font-normal">
                    Declaro, na qualidade de {usuarioAtual?.cargo ?? "responsável"} da{" "}
                    {instituicao?.razaoSocial ?? "instituição"}, que revisei o conteúdo deste arquivo e
                    assumo a responsabilidade pela obrigação perante o órgão competente.
                  </Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo}>
                    Aprovar
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "negar_aprovacao" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Negar aprovação e devolver ao Executor?</DialogTitle>
                  <DialogDescription>
                    Descreva o que precisa ser corrigido. O período volta para o Executor e uma nova
                    versão do arquivo precisará passar por validação e liberação novamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Textarea
                    value={campoTextarea}
                    onChange={(evento) => setCampoTextarea(evento.target.value)}
                    placeholder="Descreva o motivo da negação (mínimo 10 caracteres)."
                    rows={4}
                  />
                  {campoTextarea.trim().length > 0 && campoTextarea.trim().length < 10 ? (
                    <p className="text-xs text-status-error-text">
                      Descreva o motivo com pelo menos 10 caracteres.
                    </p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={campoTextarea.trim().length < 10}
                    onClick={confirmarDialogo}
                  >
                    Negar aprovação
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "registrar_protocolo" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Registrar protocolo do BCB</DialogTitle>
                  <DialogDescription>
                    Registre o protocolo recebido após a transmissão feita pela instituição, fora do
                    Videnas.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="numero-protocolo">Protocolo</Label>
                    <Input
                      id="numero-protocolo"
                      value={campoTexto}
                      placeholder="BCB-C212-2026091612345678"
                      onChange={(evento) => setCampoTexto(evento.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="canal-envio">Canal</Label>
                    <Select value={campoSelect} onValueChange={(valor) => setCampoSelect(valor ?? "")}>
                      <SelectTrigger id="canal-envio" className="w-full">
                        <SelectValue placeholder="Selecione o canal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sisbacen">Sisbacen</SelectItem>
                        <SelectItem value="pstaw10">PSTAW10</SelectItem>
                        <SelectItem value="portal_cidadao">Portal do Cidadão</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="observacao-protocolo">Observação (opcional)</Label>
                    <Textarea
                      id="observacao-protocolo"
                      value={campoTextarea}
                      onChange={(evento) => setCampoTextarea(evento.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo}>
                    Registrar
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "marcar_encaminhado" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Confirmar o encaminhamento?</DialogTitle>
                  <DialogDescription>
                    A emissão da NFS-e é feita pelo emissor escolhido, fora da Videnas.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="emissor">Emissor</Label>
                    <Select value={campoSelect} onValueChange={(valor) => setCampoSelect(valor ?? "")}>
                      <SelectTrigger id="emissor" className="w-full">
                        <SelectValue placeholder="Selecione o emissor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ERP do cliente">ERP do cliente</SelectItem>
                        <SelectItem value="Sistema municipal (prefeitura)">
                          Sistema municipal (prefeitura)
                        </SelectItem>
                        <SelectItem value="Escritório contábil">Escritório contábil</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emissor-nome">Nome do sistema (opcional)</Label>
                    <Input
                      id="emissor-nome"
                      value={campoTexto2}
                      placeholder="Ex.: ERP Omie"
                      onChange={(evento) => setCampoTexto2(evento.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="observacao-encaminhamento">Observação (opcional)</Label>
                    <Textarea
                      id="observacao-encaminhamento"
                      value={campoTextarea}
                      onChange={(evento) => setCampoTextarea(evento.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo}>
                    Confirmar
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "registrar_retorno" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Registrar retorno do BCB</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="situacao-retorno">Situação</Label>
                    <Select value={campoSelect} onValueChange={(valor) => setCampoSelect(valor ?? "")}>
                      <SelectTrigger id="situacao-retorno" className="w-full">
                        <SelectValue placeholder="Selecione a situação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aceito">Aceito</SelectItem>
                        <SelectItem value="aceito_com_ressalvas">Aceito com ressalvas</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="codigo-retorno">Código de retorno</Label>
                    <Input
                      id="codigo-retorno"
                      value={campoTexto}
                      onChange={(evento) => setCampoTexto(evento.target.value)}
                      placeholder="RET-0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mensagem-retorno">Mensagem</Label>
                    <Textarea
                      id="mensagem-retorno"
                      value={campoTextarea}
                      onChange={(evento) => setCampoTextarea(evento.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo}>
                    Registrar
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "reabrir" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Reabrir esta competência?</DialogTitle>
                  <DialogDescription>
                    O período volta para &quot;Dados recebidos&quot; e todas as etapas seguintes precisarão
                    ser refeitas. Arquivos e validações anteriores permanecem na trilha.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={campoTextarea}
                  onChange={(evento) => setCampoTextarea(evento.target.value)}
                  placeholder="Descreva o motivo da reabertura."
                  rows={4}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="destructive" onClick={confirmarDialogo}>
                    Reabrir
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
