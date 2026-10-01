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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { usePeriodosStore, validarEntradaRetorno } from "@/lib/store/periodos";
import { useEvidenciasStore } from "@/lib/store/evidencias";
import { useSessaoStore } from "@/lib/store/sessao";
import { buscarPerfil, ROTULOS_ACAO } from "@/lib/permissoes";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import { ROTULO_RETORNO_GENERICO, configuracaoFluxo, rotuloRetornoDoModulo } from "@/lib/mock/configuracao-fluxo";
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
  "arquivar",
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
  arquivar: "secundario",
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
  const arquivar = usePeriodosStore((estado) => estado.arquivar);
  const protocolos = usePeriodosStore((estado) => estado.protocolos);
  const selarNovaVersaoArquivo = useEvidenciasStore((estado) => estado.selarNovaVersaoArquivo);
  const selarRetornoRegulador = useEvidenciasStore((estado) => estado.selarRetornoRegulador);
  const selarArquivamento = useEvidenciasStore((estado) => estado.selarArquivamento);

  const perfilAtivo = useSessaoStore((estado) => estado.perfilAtivo);
  const usuarioId = useSessaoStore((estado) => estado.usuarioId);

  const [dialogoAberto, setDialogoAberto] = useState<AcaoId | null>(null);

  const [campoTexto, setCampoTexto] = useState("");
  const [campoTexto2, setCampoTexto2] = useState("");
  const [campoTextarea, setCampoTextarea] = useState("");
  const [campoSelect, setCampoSelect] = useState("");
  const [campoCheckbox, setCampoCheckbox] = useState(false);
  const [campoData, setCampoData] = useState("");
  const [campoAnexo, setCampoAnexo] = useState<File | null>(null);
  const [processando, setProcessando] = useState(false);

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
  const rotuloRetorno = rotuloRetornoDoModulo(periodo.moduloId);
  const protocoloCorrente = periodo.protocoloId ? protocolos[periodo.protocoloId] : undefined;

  function abrirDialogo(acaoId: AcaoId) {
    setCampoTexto("");
    setCampoTexto2("");
    setCampoTextarea("");
    setCampoSelect("");
    setCampoCheckbox(false);
    setCampoData("");
    setCampoAnexo(null);
    if (acaoId === "registrar_protocolo") {
      setCampoSelect("pstaw10");
    }
    if (acaoId === "marcar_encaminhado") {
      setCampoSelect("ERP do cliente");
    }
    if (acaoId === "registrar_retorno") {
      setCampoSelect("aceito");
      setCampoData(new Date().toISOString().slice(0, 10));
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

  async function confirmarRetorno() {
    if (!usuarioAtual || !periodo.protocoloId) {
      toast.error("Período sem protocolo registrado.");
      return;
    }
    const protocolo = protocolos[periodo.protocoloId];
    if (!protocolo) {
      toast.error("Protocolo não encontrado.");
      return;
    }
    const situacao = (campoSelect || "aceito") as "aceito" | "aceito_com_ressalvas" | "rejeitado";
    const validacao = validarEntradaRetorno(situacao, campoTexto, campoTextarea);
    if (!validacao.sucesso) {
      toast.error(validacao.motivo ?? "Dados do retorno inválidos.");
      return;
    }
    if (periodo.estado !== "aguardando_retorno") {
      toast.error("Ação indisponível no estado atual do período.");
      return;
    }

    setProcessando(true);
    try {
      const selagem = await selarRetornoRegulador({
        periodo,
        protocolo,
        rotuloArtefato: rotuloRetorno,
        situacao,
        codigoRetorno: campoTexto.trim(),
        mensagemRetorno: campoTextarea.trim(),
        identificador: campoTexto2.trim() || null,
        dataInformada: campoData || null,
        anexo: campoAnexo,
        autor: { usuarioId: autor.usuarioId, nome: usuarioAtual.nome, perfilId: autor.perfilId },
      });
      if (!selagem.sucesso || !selagem.reciboLacre) {
        toast.error(selagem.motivo ?? "Não foi possível lacrar o retorno.");
        return;
      }
      const resultado = registrarRetorno(periodoId, autor, situacao, campoTexto.trim(), campoTextarea.trim(), {
        identificador: campoTexto2,
        dataInformada: campoData,
        anexoNome: campoAnexo?.name ?? null,
        anexoTamanhoBytes: campoAnexo?.size ?? null,
        anexoHash: selagem.anexoLacre?.hashSha256 ?? null,
        anexoLacreId: selagem.anexoLacre?.id ?? null,
        reciboLacreId: selagem.reciboLacre.id,
        reciboHash: selagem.reciboLacre.hashSha256,
      });
      tratarResultado(resultado, `Retorno ${rotuloRetorno} registrado e lacrado na cadeia do período.`);
    } catch {
      toast.error("Não foi possível registrar o retorno.");
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarArquivamento() {
    if (!usuarioAtual || !perfilAtivo) {
      return;
    }
    const avaliacao = podeExecutarStore(perfilAtivo, "arquivar", periodoId, usuarioId ?? undefined);
    if (!avaliacao.permitido) {
      toast.error(avaliacao.motivo ?? "Ação indisponível no estado atual do período.");
      return;
    }

    const arquivadoEm = new Date().toISOString();
    setProcessando(true);
    try {
      const selagem = await selarArquivamento({
        periodo,
        arquivo: arquivoCorrente,
        protocolo: periodo.protocoloId ? protocolos[periodo.protocoloId] : undefined,
        arquivadoEm,
        autor: { usuarioId: autor.usuarioId, nome: usuarioAtual.nome, perfilId: autor.perfilId },
      });
      if (!selagem.sucesso || !selagem.lacre) {
        toast.error(selagem.motivo ?? "Não foi possível lacrar o dossiê de arquivamento.");
        return;
      }
      const resultado = arquivar(periodoId, autor, {
        lacreId: selagem.lacre.id,
        hashDossie: selagem.lacre.hashSha256,
        arquivadoEm,
      });
      tratarResultado(resultado, "Período arquivado. Lacre de saída encadeado à cadeia do período.");
    } catch {
      toast.error("Não foi possível arquivar o período.");
    } finally {
      setProcessando(false);
    }
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
        void confirmarRetorno();
        return;
      }
      case "arquivar": {
        void confirmarArquivamento();
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
    if (acaoId === "registrar_retorno") {
      return rotuloRetorno === ROTULO_RETORNO_GENERICO
        ? "Registrar retorno do regulador/emissor"
        : `Registrar retorno ${rotuloRetorno}`;
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
                  <DialogTitle>Registrar retorno {rotuloRetorno}</DialogTitle>
                  <DialogDescription>
                    {rotuloRetorno === "ACAM213"
                      ? "Registre o retorno de processamento do ACAM212 recebido do Banco Central."
                      : "Registre o retorno recebido do regulador ou do emissor para o protocolo informado."}
                    {protocoloCorrente ? ` Protocolo ${protocoloCorrente.numeroProtocolo}.` : ""}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-neutral-700">Resultado do retorno</legend>
                    <RadioGroup value={campoSelect} onValueChange={(valor) => setCampoSelect(String(valor))}>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="aceito" id="situacao-aceito" />
                        <Label htmlFor="situacao-aceito" className="font-normal">
                          Aceito
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="aceito_com_ressalvas" id="situacao-ressalvas" />
                        <Label htmlFor="situacao-ressalvas" className="font-normal">
                          Aceito com ressalvas
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="rejeitado" id="situacao-rejeitado" />
                        <Label htmlFor="situacao-rejeitado" className="font-normal">
                          Rejeitado
                        </Label>
                      </div>
                    </RadioGroup>
                  </fieldset>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="identificador-retorno">Identificador do {rotuloRetorno} (opcional)</Label>
                      <Input
                        id="identificador-retorno"
                        value={campoTexto2}
                        placeholder="ACAM213-202511-0001"
                        onChange={(evento) => setCampoTexto2(evento.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="data-retorno">Data do retorno</Label>
                      <Input
                        id="data-retorno"
                        type="date"
                        value={campoData}
                        onChange={(evento) => setCampoData(evento.target.value)}
                      />
                    </div>
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
                    <Label htmlFor="mensagem-retorno">
                      {campoSelect === "aceito_com_ressalvas" ? "Ressalva recebida (obrigatória)" : "Mensagem"}
                    </Label>
                    <Textarea
                      id="mensagem-retorno"
                      value={campoTextarea}
                      onChange={(evento) => setCampoTextarea(evento.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="anexo-retorno">Arquivo de retorno (opcional)</Label>
                    <Input
                      id="anexo-retorno"
                      type="file"
                      className="h-auto py-1.5"
                      onChange={(evento) => setCampoAnexo(evento.currentTarget.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-neutral-500">
                      O arquivo anexado é lacrado e encadeado à cadeia do período junto com o recibo do retorno.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo} disabled={processando}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo} disabled={processando}>
                    {processando ? "Lacrando…" : "Registrar"}
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "arquivar" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Arquivar a competência {periodo.competenciaRotulo}?</DialogTitle>
                  <DialogDescription>
                    O período passa a ser somente leitura. Um dossiê com o hash do arquivo, aprovações,
                    negações, protocolo e retorno é lacrado e encadeado ao último lacre do período.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
                  <p>
                    Arquivo: {arquivoCorrente?.nomeArquivo ?? "—"} · hash{" "}
                    <span className="font-mono">
                      {arquivoCorrente ? truncarHash(arquivoCorrente.hashSha256) : "—"}
                    </span>
                  </p>
                  <p>Protocolo: {protocoloCorrente?.numeroProtocolo ?? "—"}</p>
                  <p>
                    Retorno {rotuloRetorno}: {protocoloCorrente?.codigoRetorno ?? "—"}
                  </p>
                  <p>
                    Prazo de retenção:{" "}
                    {configuracaoFluxo.retencao
                      ? `${configuracaoFluxo.retencao.anos} anos a partir do arquivamento`
                      : "não configurado"}
                    .
                  </p>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo} disabled={processando}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo} disabled={processando}>
                    {processando ? "Lacrando…" : "Arquivar período"}
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
