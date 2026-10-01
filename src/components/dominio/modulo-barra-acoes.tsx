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
import { TAMANHO_MINIMO_TEXTO_COMITE, usePeriodosStore, validarEntradaRetorno } from "@/lib/store/periodos";
import { BlocoDecisaoComite } from "@/components/dominio/bloco-decisao-comite";
import {
  descricaoQuorumComite,
  impedimentosDoComite,
  membrosElegiveisAoComite,
  situacaoPrazoComite,
  usuariosImpedidosDoComite,
} from "@/lib/comite";
import { hashDoArquivoEntregue, useEvidenciasStore } from "@/lib/store/evidencias";
import { useSessaoStore } from "@/lib/store/sessao";
import { useTenantsStore } from "@/lib/store/tenants";
import {
  CANAIS_BCB_OFERECIDOS,
  ROTULO_CANAL_BCB,
  ROTULO_RESPONSAVEL_TRANSMISSAO,
  TAMANHO_MINIMO_JUSTIFICATIVA_MANUAL,
  avaliarDisponibilidadeDoPeriodo,
  rotuloCanalCompletoDoCadastro,
  validarEntradaEncaminhamento,
  validarEntradaProtocoloManual,
} from "@/lib/contrato";
import {
  gerarNumeroDocumentoFiscal,
  gerarNumeroProtocoloTransmissao,
  nomeArquivoDocumentoFiscal,
} from "@/lib/transmissao";
import { buscarPerfil, ROTULOS_ACAO } from "@/lib/permissoes";
import { ROTULOS_TIPO } from "@/lib/mock/auditoria";
import { baixarCsv, montarCsvTrilha, nomeArquivoTrilha } from "@/lib/auditoria/exportar-csv";
import { MENSAGEM_SEM_VALIDADOR_ELEGIVEL, rotuloUsuarioComNivel, validadorDesignado } from "@/lib/validadores";
import { buscarUsuario } from "@/lib/mock/usuarios";
import { buscarInstituicao } from "@/lib/mock/instituicoes";
import { buscarModulo } from "@/lib/mock/modulos";
import {
  DESFECHOS_COMITE,
  ROTULO_RETORNO_GENERICO,
  configuracaoFluxo,
  retornoSomentePosicionamento,
  rotuloRetornoDoModulo,
} from "@/lib/mock/configuracao-fluxo";
import type { AcaoId, CanalEnvioBcb, DesfechoComite, ValidacaoItem } from "@/lib/tipos";
import { formatarData, formatarDataHora, truncarHash } from "@/lib/formatadores";
import {
  contarNegativas,
  limiarNegativas,
  proximaNegativaEscalaParaComite,
  rotuloContagemNegativas,
  rotuloOrigemNegativa,
  rotuloTotalNegativas,
} from "@/lib/negacoes";

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
  "emitir_fiscal",
  "transmitir",
  "marcar_encaminhado",
  "registrar_protocolo_manual",
  "registrar_retorno",
  "arquivar",
  "aprovar",
  "negar_aprovacao",
  "decidir_comite",
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
  emitir_fiscal: "primario",
  transmitir: "primario",
  marcar_encaminhado: "primario",
  registrar_protocolo_manual: "secundario",
  registrar_retorno: "secundario",
  arquivar: "secundario",
  aprovar: "primario",
  negar_aprovacao: "destrutivo-suave",
  decidir_comite: "primario",
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
  const registrarEventoAdministrativo = usePeriodosStore((estado) => estado.registrarEventoAdministrativo);
  const aprovar = usePeriodosStore((estado) => estado.aprovar);
  const emitirFiscal = usePeriodosStore((estado) => estado.emitirFiscal);
  const transmitir = usePeriodosStore((estado) => estado.transmitir);
  const registrarProtocoloManual = usePeriodosStore((estado) => estado.registrarProtocoloManual);
  const marcarEncaminhado = usePeriodosStore((estado) => estado.marcarEncaminhado);
  const tenants = useTenantsStore((estado) => estado.tenants);
  const registrarRetorno = usePeriodosStore((estado) => estado.registrarRetorno);
  const reabrir = usePeriodosStore((estado) => estado.reabrir);
  const negarAprovacao = usePeriodosStore((estado) => estado.negarAprovacao);
  const arquivar = usePeriodosStore((estado) => estado.arquivar);
  const protocolos = usePeriodosStore((estado) => estado.protocolos);
  const selarNovaVersaoArquivo = useEvidenciasStore((estado) => estado.selarNovaVersaoArquivo);
  const selarRetornoRegulador = useEvidenciasStore((estado) => estado.selarRetornoRegulador);
  const selarArquivamento = useEvidenciasStore((estado) => estado.selarArquivamento);
  const selarEscalaComite = useEvidenciasStore((estado) => estado.selarEscalaComite);
  const selarAtaComite = useEvidenciasStore((estado) => estado.selarAtaComite);
  const selarDocumentoFiscal = useEvidenciasStore((estado) => estado.selarDocumentoFiscal);
  const selarTransmissao = useEvidenciasStore((estado) => estado.selarTransmissao);
  const selarProtocoloManual = useEvidenciasStore((estado) => estado.selarProtocoloManual);
  const selarEncaminhamento = useEvidenciasStore((estado) => estado.selarEncaminhamento);
  const validarDecisaoComite = usePeriodosStore((estado) => estado.validarDecisaoComite);
  const decidirComite = usePeriodosStore((estado) => estado.decidirComite);
  const eventosStore = usePeriodosStore((estado) => estado.eventos);

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
  const [campoMembro, setCampoMembro] = useState("");
  const [campoDesfecho, setCampoDesfecho] = useState<DesfechoComite | "">("");
  const [campoPlano, setCampoPlano] = useState("");
  const [processando, setProcessando] = useState(false);

  if (!periodo || !perfilAtivo || !usuarioId) {
    return null;
  }

  const perfilMetadados = buscarPerfil(perfilAtivo);
  const autor = { usuarioId, perfilId: perfilAtivo };
  const instituicao = tenants.find((tenant) => tenant.id === periodo.instituicaoId) ?? buscarInstituicao(periodo.instituicaoId);
  const disponibilidadeTransmissao = avaliarDisponibilidadeDoPeriodo(periodo, instituicao);
  const ehFiscalPeriodo = periodo.moduloId === "fiscal";
  const arquivoCorrente = periodo.arquivoCorrenteId ? arquivos[periodo.arquivoCorrenteId] : undefined;
  const usuarioGerador = periodo.geradoPorUsuarioId ? buscarUsuario(periodo.geradoPorUsuarioId) : undefined;
  const usuarioLiberador = periodo.liberadoPorUsuarioId ? buscarUsuario(periodo.liberadoPorUsuarioId) : undefined;
  const modulo = buscarModulo(periodo.moduloId);
  const usuarioContador = periodo.contadorUsuarioId ? buscarUsuario(periodo.contadorUsuarioId) : undefined;
  const usuarioAtual = buscarUsuario(usuarioId);
  const rotuloRetorno = rotuloRetornoDoModulo(periodo.moduloId);
  const complementoRetorno = rotuloRetorno === ROTULO_RETORNO_GENERICO ? "do regulador/emissor" : rotuloRetorno;
  const protocoloCorrente = periodo.protocoloId ? protocolos[periodo.protocoloId] : undefined;
  const retornoSimples = retornoSomentePosicionamento(periodo.moduloId);
  const usuarioDesignado = validadorDesignado(periodo);

  function abrirDialogo(acaoId: AcaoId) {
    setCampoTexto("");
    setCampoTexto2("");
    setCampoTextarea("");
    setCampoSelect("");
    setCampoCheckbox(false);
    setCampoData("");
    setCampoAnexo(null);
    setCampoMembro("");
    setCampoDesfecho("");
    setCampoPlano("");
    if (acaoId === "registrar_protocolo_manual") {
      setCampoSelect(disponibilidadeTransmissao.cadastro?.canal ?? "sisbacen");
      setCampoTexto2(disponibilidadeTransmissao.cadastro?.emissor ?? "");
      setCampoData(new Date().toISOString().slice(0, 10));
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

  function tratarResultado(
    resultado: { sucesso: boolean; motivo?: string; notificacoes?: string[] },
    mensagemSucesso: string
  ) {
    if (resultado.sucesso) {
      toast.success(mensagemSucesso);
      if (resultado.notificacoes && resultado.notificacoes.length > 0) {
        toast.info(`Notificação simulada enviada a: ${resultado.notificacoes.join("; ")}. Nenhum e-mail real foi enviado.`);
      }
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
        exportarTrilhaDoPeriodo();
        return;
      default:
        abrirDialogo(acaoId);
    }
  }

  function exportarTrilhaDoPeriodo() {
    const eventosPeriodo = eventosStore
      .filter((evento) => evento.periodoId === periodoId)
      .sort((a, b) => (a.ocorridoEm < b.ocorridoEm ? 1 : -1));
    if (eventosPeriodo.length === 0) {
      toast.info("Nenhum evento para exportar neste período.");
      return;
    }
    try {
      const nomeArquivo = nomeArquivoTrilha(periodoId.replace(/^per-/, ""), new Date().toISOString());
      const conteudo = montarCsvTrilha(eventosPeriodo, {
        rotulosTipo: ROTULOS_TIPO,
        rotuloPerfil: (perfilId) => buscarPerfil(perfilId).rotulo,
        rotuloModulo: (moduloId) => buscarModulo(moduloId).nome,
        nomeInstituicao: (instituicaoId) => buscarInstituicao(instituicaoId)?.nomeFantasia ?? "",
      });
      baixarCsv(nomeArquivo, conteudo);
      registrarEventoAdministrativo({
        autor,
        instituicaoId: periodo.instituicaoId,
        tipo: "TRILHA_EXPORTADA",
        rotuloTipo: ROTULOS_TIPO.TRILHA_EXPORTADA,
        referencia: nomeArquivo,
        payload: {
          quantidade: eventosPeriodo.length,
          formato: "csv",
          nomeArquivo,
          filtros: { periodoId, modulo: periodo.moduloId },
        },
      });
      toast.success(`Trilha do período exportada: ${eventosPeriodo.length} evento(s).`);
    } catch {
      toast.error("Não foi possível gerar o arquivo CSV.");
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
      origemNome: `Nova versão gerada após devolução do Compliance — ${arquivoAtual.nomeArquivo}`,
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
    const validacao = validarEntradaRetorno(situacao, campoTexto, campoTextarea, retornoSimples);
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
        identificador: retornoSimples ? null : campoTexto2.trim() || null,
        dataInformada: retornoSimples ? null : campoData || null,
        anexo: campoAnexo,
        autor: { usuarioId: autor.usuarioId, nome: usuarioAtual.nome, perfilId: autor.perfilId },
      });
      if (!selagem.sucesso || !selagem.reciboLacre) {
        toast.error(selagem.motivo ?? "Não foi possível lacrar o retorno.");
        return;
      }
      const resultado = registrarRetorno(periodoId, autor, situacao, campoTexto.trim(), campoTextarea.trim(), {
        identificador: retornoSimples ? "" : campoTexto2,
        dataInformada: retornoSimples ? "" : campoData,
        anexoNome: campoAnexo?.name ?? null,
        anexoTamanhoBytes: campoAnexo?.size ?? null,
        anexoHash: selagem.anexoLacre?.hashSha256 ?? null,
        anexoLacreId: selagem.anexoLacre?.id ?? null,
        reciboLacreId: selagem.reciboLacre.id,
        reciboHash: selagem.reciboLacre.hashSha256,
      });
      tratarResultado(resultado, `Retorno ${complementoRetorno} registrado e lacrado na cadeia do período.`);
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

  async function confirmarNegacao() {
    if (!usuarioAtual || !perfilAtivo) {
      return;
    }
    if (campoTextarea.trim().length < 10) {
      toast.error("Descreva o motivo da negação com pelo menos 10 caracteres.");
      return;
    }
    const avaliacao = podeExecutarStore(perfilAtivo, "negar_aprovacao", periodoId, usuarioId ?? undefined);
    if (!avaliacao.permitido) {
      toast.error(avaliacao.motivo ?? "Ação indisponível no estado atual do período.");
      return;
    }

    if (!proximaNegativaEscalaParaComite(periodo)) {
      const resultado = negarAprovacao(periodoId, autor, campoTextarea);
      tratarResultado(resultado, "Aprovação negada. Período devolvido ao Executor.");
      return;
    }

    const ocorridoEm = new Date().toISOString();
    setProcessando(true);
    try {
      const periodoComNegacao = {
        ...periodo,
        negacoesAprovacao: [
          ...periodo.negacoesAprovacao,
          {
            motivo: campoTextarea,
            usuarioId: autor.usuarioId,
            ocorridoEm,
            arquivoId: arquivoCorrente?.id ?? null,
          },
        ],
      };
      const selagem = await selarEscalaComite({
        periodo: periodoComNegacao,
        buscarArquivo: (arquivoId) => usePeriodosStore.getState().arquivos[arquivoId],
        escaladoEm: ocorridoEm,
        autor: { usuarioId: autor.usuarioId, nome: usuarioAtual.nome, perfilId: autor.perfilId },
      });
      if (!selagem.sucesso || !selagem.lacre) {
        toast.error(selagem.motivo ?? "Não foi possível lacrar o dossiê de escalonamento.");
        return;
      }
      const resultado = negarAprovacao(periodoId, autor, campoTextarea, {
        ocorridoEm,
        lacreId: selagem.lacre.id,
        hashDossie: selagem.lacre.hashSha256,
      });
      tratarResultado(
        resultado,
        "Aprovação negada. Período escalado ao Comitê de Qualidade e dossiê lacrado na cadeia."
      );
    } catch {
      toast.error("Não foi possível negar a aprovação.");
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarDecisaoComite() {
    if (!usuarioAtual || !perfilAtivo) {
      return;
    }
    if (!campoDesfecho) {
      toast.error("Escolha o desfecho do Comitê.");
      return;
    }
    if (!campoMembro) {
      toast.error("Selecione o segundo membro do Comitê de Qualidade.");
      return;
    }
    const dados = {
      membroId: campoMembro,
      desfecho: campoDesfecho,
      justificativa: campoTextarea,
      planoCorrecao: campoPlano,
    };
    const validacao = validarDecisaoComite(periodoId, autor, dados);
    if (!validacao.sucesso) {
      toast.error(validacao.motivo ?? "Não foi possível registrar a decisão.");
      return;
    }

    const decididoEm = new Date().toISOString();
    const estadoNovo = DESFECHOS_COMITE[campoDesfecho].estadoDestino;
    setProcessando(true);
    try {
      const selagem = await selarAtaComite({
        periodo,
        buscarArquivo: (arquivoId) => usePeriodosStore.getState().arquivos[arquivoId],
        desfecho: campoDesfecho,
        participantes: [
          { usuarioId: autor.usuarioId, papel: "Presidente" },
          { usuarioId: campoMembro, papel: "Membro" },
        ],
        justificativa: campoTextarea.trim(),
        planoCorrecao: DESFECHOS_COMITE[campoDesfecho].exigePlanoCorrecao ? campoPlano.trim() : null,
        estadoNovo,
        decididoEm,
        autor: { usuarioId: autor.usuarioId, nome: usuarioAtual.nome, perfilId: autor.perfilId },
      });
      if (!selagem.sucesso || !selagem.lacre) {
        toast.error(selagem.motivo ?? "Não foi possível lacrar a ata do Comitê.");
        return;
      }
      const resultado = decidirComite(periodoId, autor, {
        ...dados,
        decididoEm,
        lacreId: selagem.lacre.id,
        hashAta: selagem.lacre.hashSha256,
      });
      tratarResultado(
        resultado,
        campoDesfecho === "negativa_superada"
          ? "Decisão registrada. Período devolvido ao Responsável de Compliance e ata lacrada na cadeia."
          : "Decisão registrada. Período devolvido ao Executor com o plano de correção e ata lacrada na cadeia."
      );
    } catch {
      toast.error("Não foi possível registrar a decisão do Comitê.");
    } finally {
      setProcessando(false);
    }
  }

  function autorLacre() {
    return { usuarioId: autor.usuarioId, nome: usuarioAtual?.nome ?? autor.usuarioId, perfilId: autor.perfilId };
  }

  function objetoDaEntrega(): { tipo: "arquivo" | "documento_fiscal"; nome: string; hashSha256: string } | null {
    if (ehFiscalPeriodo) {
      return periodo.documentoFiscal
        ? {
            tipo: "documento_fiscal",
            nome: periodo.documentoFiscal.nomeArquivo,
            hashSha256: periodo.documentoFiscal.hashSha256,
          }
        : null;
    }
    return arquivoCorrente
      ? { tipo: "arquivo", nome: arquivoCorrente.nomeArquivo, hashSha256: hashEntregaDoArquivo() }
      : null;
  }

  function hashEntregaDoArquivo(): string {
    return arquivoCorrente
      ? hashDoArquivoEntregue(useEvidenciasStore.getState().lacres, arquivoCorrente)
      : "";
  }

  async function confirmarEmissaoFiscal() {
    if (!usuarioAtual || !perfilAtivo) {
      return;
    }
    const avaliacao = podeExecutarStore(perfilAtivo, "emitir_fiscal", periodoId, usuarioId ?? undefined);
    if (!avaliacao.permitido) {
      toast.error(avaliacao.motivo ?? "Ação indisponível no estado atual do período.");
      return;
    }

    const instante = new Date();
    const numeroDocumento = gerarNumeroDocumentoFiscal(periodo.competencia, instante);
    setProcessando(true);
    try {
      const selagem = await selarDocumentoFiscal({
        periodo,
        arquivo: arquivoCorrente ? { ...arquivoCorrente, hashSha256: hashEntregaDoArquivo() } : undefined,
        numeroDocumento,
        emitidoEm: instante.toISOString(),
        cadastro: disponibilidadeTransmissao.cadastro,
        autor: autorLacre(),
      });
      if (!selagem.sucesso || !selagem.lacre) {
        toast.error(selagem.motivo ?? "Não foi possível lacrar o documento fiscal.");
        return;
      }
      const resultado = emitirFiscal(periodoId, autor, {
        numeroDocumento,
        nomeArquivo: nomeArquivoDocumentoFiscal(numeroDocumento),
        hashDocumento: selagem.lacre.hashSha256,
        lacreId: selagem.lacre.id,
        emitidoEm: instante.toISOString(),
      });
      tratarResultado(resultado, `Documento fiscal ${numeroDocumento} emitido e lacrado na cadeia do período.`);
    } catch {
      toast.error("Não foi possível emitir o documento fiscal.");
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarTransmissao() {
    if (!usuarioAtual || !perfilAtivo) {
      return;
    }
    const avaliacao = podeExecutarStore(perfilAtivo, "transmitir", periodoId, usuarioId ?? undefined);
    if (!avaliacao.permitido) {
      toast.error(avaliacao.motivo ?? "Ação indisponível no estado atual do período.");
      return;
    }
    const cadastro = disponibilidadeTransmissao.cadastro;
    const objeto = objetoDaEntrega();
    if (!cadastro || !objeto) {
      toast.error(
        ehFiscalPeriodo
          ? "O documento fiscal ainda não foi emitido."
          : "O arquivo corrente do período não foi encontrado."
      );
      return;
    }

    const instante = new Date();
    const numeroProtocolo = gerarNumeroProtocoloTransmissao(periodo.moduloId, periodo.competencia, instante);
    setProcessando(true);
    try {
      const selagem = await selarTransmissao({
        periodo,
        objeto,
        numeroProtocolo,
        canalBcb: cadastro.canal,
        cadastro,
        responsavel: disponibilidadeTransmissao.responsavel,
        transmitidoEm: instante.toISOString(),
        autor: autorLacre(),
      });
      if (!selagem.sucesso || !selagem.lacre) {
        toast.error(selagem.motivo ?? "Não foi possível lacrar o comprovante de transmissão.");
        return;
      }
      const resultado = transmitir(periodoId, autor, {
        numeroProtocolo,
        cadastroId: cadastro.id,
        responsavel: disponibilidadeTransmissao.responsavel,
        lacreId: selagem.lacre.id,
        hashComprovante: selagem.lacre.hashSha256,
        hashObjeto: objeto.hashSha256,
        transmitidoEm: instante.toISOString(),
      });
      tratarResultado(
        resultado,
        `Transmissão simulada concluída (protocolo ${numeroProtocolo}). Comprovante lacrado na cadeia do período.`
      );
    } catch {
      toast.error("Não foi possível transmitir.");
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarProtocoloManual() {
    if (!usuarioAtual || !perfilAtivo) {
      return;
    }
    const canalBcb = ehFiscalPeriodo ? null : ((campoSelect || null) as CanalEnvioBcb | null);
    const emissor = ehFiscalPeriodo ? campoTexto2.trim() : null;
    const validacao = validarEntradaProtocoloManual(periodo.moduloId, {
      justificativa: campoTextarea,
      numeroProtocolo: campoTexto,
      dataInformada: campoData,
      canal: canalBcb,
      emissor: emissor ?? "",
    });
    if (!validacao.sucesso) {
      toast.error(validacao.motivo ?? "Dados do protocolo inválidos.");
      return;
    }
    const avaliacao = podeExecutarStore(perfilAtivo, "registrar_protocolo_manual", periodoId, usuarioId ?? undefined);
    if (!avaliacao.permitido) {
      toast.error(avaliacao.motivo ?? "Ação indisponível no estado atual do período.");
      return;
    }

    const objeto = objetoDaEntrega();
    setProcessando(true);
    try {
      const selagem = await selarProtocoloManual({
        periodo,
        numeroProtocolo: campoTexto.trim(),
        dataInformada: campoData,
        canalBcb,
        emissor,
        justificativa: campoTextarea.trim(),
        motivoIndisponibilidade: disponibilidadeTransmissao.motivo,
        objeto: objeto ? { nome: objeto.nome, hashSha256: objeto.hashSha256 } : null,
        anexo: campoAnexo,
        autor: autorLacre(),
      });
      if (!selagem.sucesso || !selagem.reciboLacre) {
        toast.error(selagem.motivo ?? "Não foi possível lacrar o recibo do protocolo manual.");
        return;
      }
      const resultado = registrarProtocoloManual(periodoId, autor, {
        numeroProtocolo: campoTexto.trim(),
        dataInformada: campoData,
        canalBcb,
        emissor,
        justificativa: campoTextarea.trim(),
        anexoNome: campoAnexo?.name ?? null,
        anexoHash: selagem.anexoLacre?.hashSha256 ?? null,
        anexoLacreId: selagem.anexoLacre?.id ?? null,
        reciboLacreId: selagem.reciboLacre.id,
        reciboHash: selagem.reciboLacre.hashSha256,
      });
      tratarResultado(resultado, `Protocolo ${campoTexto.trim()} registrado e lacrado na cadeia do período.`);
    } catch {
      toast.error("Não foi possível registrar o protocolo manual.");
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarEncaminhamento() {
    if (!usuarioAtual || !perfilAtivo) {
      return;
    }
    const emissor = campoTexto2 ? `${campoSelect} — ${campoTexto2}` : campoSelect || "Outro";
    const validacao = validarEntradaEncaminhamento(emissor);
    if (!validacao.sucesso) {
      toast.error(validacao.motivo ?? "Dados do encaminhamento inválidos.");
      return;
    }
    const avaliacao = podeExecutarStore(perfilAtivo, "marcar_encaminhado", periodoId, usuarioId ?? undefined);
    if (!avaliacao.permitido) {
      toast.error(avaliacao.motivo ?? "Ação indisponível no estado atual do período.");
      return;
    }

    const observacao = campoTextarea.trim() ? campoTextarea.trim() : null;
    setProcessando(true);
    try {
      const selagem = await selarEncaminhamento({
        periodo,
        emissor,
        observacao,
        objeto: arquivoCorrente ? { nome: arquivoCorrente.nomeArquivo, hashSha256: hashEntregaDoArquivo() } : null,
        autor: autorLacre(),
      });
      if (!selagem.sucesso || !selagem.lacre) {
        toast.error(selagem.motivo ?? "Não foi possível lacrar o recibo de encaminhamento.");
        return;
      }
      const resultado = marcarEncaminhado(periodoId, autor, {
        emissor,
        observacao,
        reciboLacreId: selagem.lacre.id,
        reciboHash: selagem.lacre.hashSha256,
      });
      tratarResultado(resultado, "DPS encaminhada ao emissor definido pela instituição. Recibo lacrado.");
    } catch {
      toast.error("Não foi possível registrar o encaminhamento.");
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
        void confirmarNegacao();
        return;
      }
      case "decidir_comite": {
        void confirmarDecisaoComite();
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
      case "emitir_fiscal": {
        void confirmarEmissaoFiscal();
        return;
      }
      case "transmitir": {
        void confirmarTransmissao();
        return;
      }
      case "registrar_protocolo_manual": {
        void confirmarProtocoloManual();
        return;
      }
      case "marcar_encaminhado": {
        void confirmarEncaminhamento();
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

  const impedimentosComite =
    periodo.estado === "em_comite_qualidade" ? impedimentosDoComite(periodo, arquivos, eventosStore) : {};
  const membrosElegiveis =
    periodo.estado === "em_comite_qualidade"
      ? membrosElegiveisAoComite(periodo, usuarioId, impedimentosComite)
      : [];
  const usuariosImpedidos = usuariosImpedidosDoComite(impedimentosComite);
  const prazoComite = periodo.estado === "em_comite_qualidade" ? situacaoPrazoComite(periodo) : null;
  const desfechosComite = configuracaoFluxo.comiteQualidade?.desfechosPermitidos ?? [];
  const ultimaDecisaoComite = periodo.decisoesComite?.at(-1);
  const decisaoParaDiretor =
    ultimaDecisaoComite &&
    ultimaDecisaoComite.desfecho === "negativa_superada" &&
    ultimaDecisaoComite.arquivoId === periodo.arquivoCorrenteId
      ? ultimaDecisaoComite
      : null;

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

  const avisoEnvioBloqueado = acoesBarra.some(
    ({ acaoId, avaliacao }) =>
      (acaoId === "enviar_validacao" || acaoId === "validar_fiscal") &&
      avaliacao.motivo === MENSAGEM_SEM_VALIDADOR_ELEGIVEL
  )
    ? MENSAGEM_SEM_VALIDADOR_ELEGIVEL
    : null;

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

        {avisoEnvioBloqueado ? (
          <p role="status" className="mt-2 text-xs text-status-error-text">
            {avisoEnvioBloqueado}
          </p>
        ) : null}

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
                {usuarioDesignado ? (
                  <p className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
                    Validador designado por sorteio para {modulo.nome}: {rotuloUsuarioComNivel(usuarioDesignado)}.
                  </p>
                ) : null}
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
                    {arquivoCorrente?.versao ?? "—"} · liberado por {rotuloUsuarioComNivel(usuarioLiberador)}
                  </DialogDescription>
                </DialogHeader>
                {usuarioDesignado ? (
                  <p className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
                    Validador designado por sorteio: {rotuloUsuarioComNivel(usuarioDesignado)}.
                  </p>
                ) : null}
                <div className="space-y-1.5 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
                  <p>
                    Hash SHA-256:{" "}
                    <span className="font-mono">
                      {arquivoCorrente ? truncarHash(arquivoCorrente.hashSha256) : "—"}
                    </span>
                  </p>
                </div>
                {decisaoParaDiretor ? (
                  <div className="rounded-md border border-status-info-border bg-status-info-bg p-3 text-status-info-text">
                    <BlocoDecisaoComite
                      decisao={decisaoParaDiretor}
                      titulo="Justificativa do Comitê de Qualidade"
                    />
                  </div>
                ) : null}
                {periodo.negacoesAprovacao.length > 0 ? (
                  <div className="space-y-1.5 rounded-md border border-status-warning-border bg-status-warning-bg p-3">
                    <p className="text-xs font-semibold text-status-warning-text">
                      Negações anteriores ({rotuloTotalNegativas(periodo.negacoesAprovacao.length)})
                    </p>
                    <ul className="space-y-1.5 text-xs text-status-warning-text">
                      {periodo.negacoesAprovacao.map((negacao, indice) => {
                        const arquivoNegado = negacao.arquivoId ? arquivos[negacao.arquivoId] : undefined;
                        return (
                          <li key={`${negacao.ocorridoEm}-${indice}`}>
                            {rotuloOrigemNegativa(negacao.origem)} · {formatarDataHora(negacao.ocorridoEm)} ·{" "}
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
                  <DialogTitle>
                    {proximaNegativaEscalaParaComite(periodo)
                      ? "Negar aprovação e escalar ao Comitê de Qualidade?"
                      : "Negar aprovação e devolver ao Executor?"}
                  </DialogTitle>
                  <DialogDescription>
                    Descreva o que precisa ser corrigido.{" "}
                    {proximaNegativaEscalaParaComite(periodo)
                      ? "O período não volta para o Executor: fica bloqueado para qualquer alteração até a decisão do Comitê."
                      : "O período volta para o Executor e uma nova versão do arquivo precisará passar por validação e liberação novamente."}
                  </DialogDescription>
                </DialogHeader>
                <p
                  className="text-sm font-medium text-neutral-700"
                  aria-live="polite"
                >
                  {rotuloContagemNegativas(contarNegativas(periodo) + 1)}
                </p>
                {proximaNegativaEscalaParaComite(periodo) ? (
                  <div
                    role="alert"
                    className="space-y-1 rounded-md border border-status-warning-border bg-status-warning-bg p-3 text-sm text-status-warning-text"
                  >
                    <p className="font-semibold">Esta negativa envia o período ao Comitê de Qualidade.</p>
                    <p className="text-xs">
                      É a negativa {contarNegativas(periodo) + 1}{" "}
                      {contarNegativas(periodo) + 1 > limiarNegativas()
                        ? `(limite ${limiarNegativas()})`
                        : `de ${limiarNegativas()}`}{" "}
                      nesta competência. Ao confirmar, o histórico de negativas será lacrado em um dossiê e
                      o período ficará somente leitura até a decisão do Comitê de Qualidade, presidido
                      pelo Administrador da Videnas.
                    </p>
                  </div>
                ) : null}
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
                    disabled={campoTextarea.trim().length < 10 || processando}
                    onClick={confirmarDialogo}
                  >
                    {proximaNegativaEscalaParaComite(periodo)
                      ? "Negar e escalar ao Comitê"
                      : "Negar aprovação"}
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "decidir_comite" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Registrar decisão do Comitê de Qualidade</DialogTitle>
                  <DialogDescription>
                    Você preside o Comitê. Quórum: {descricaoQuorumComite()}. A decisão é lavrada em uma
                    ata lacrada e encadeada ao dossiê de escalonamento. O Comitê é consultivo: a aprovação
                    regulatória continua sendo do Responsável de Compliance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="comite-membro">Segundo membro do Comitê</Label>
                    <Select value={campoMembro} onValueChange={(valor) => setCampoMembro(valor ?? "")}>
                      <SelectTrigger id="comite-membro" className="w-full">
                        <SelectValue placeholder="Selecione um membro elegível">
                          {(valor: string | null) => {
                            const selecionado = membrosElegiveis.find((membro) => membro.id === valor);
                            return selecionado
                              ? `${selecionado.nome} · ${buscarPerfil(selecionado.perfilId).rotulo}`
                              : "Selecione um membro elegível";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {membrosElegiveis.map((membro) => (
                          <SelectItem key={membro.id} value={membro.id}>
                            {membro.nome} · {buscarPerfil(membro.perfilId).rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {membrosElegiveis.length === 0 ? (
                      <p role="alert" className="text-xs text-status-error-text">
                        Nenhum membro elegível: todos os candidatos da equipe Videnas estão impedidos
                        por segregação de funções.
                      </p>
                    ) : null}
                    {usuariosImpedidos.length > 0 ? (
                      <p className="text-xs text-neutral-500">
                        Impedidos por segregação de funções (geraram ou liberaram versões negadas, ou
                        negaram/devolveram):{" "}
                        {usuariosImpedidos.map((usuario) => usuario.nome).join(", ")}.
                      </p>
                    ) : null}
                  </div>

                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-neutral-700">Desfecho</legend>
                    <RadioGroup
                      value={campoDesfecho}
                      onValueChange={(valor) => setCampoDesfecho(valor as DesfechoComite)}
                    >
                      {desfechosComite.map((desfecho) => (
                        <div key={desfecho} className="flex items-start gap-2">
                          <RadioGroupItem value={desfecho} id={`desfecho-${desfecho}`} className="mt-0.5" />
                          <Label htmlFor={`desfecho-${desfecho}`} className="block font-normal">
                            <span className="font-medium">{DESFECHOS_COMITE[desfecho].rotulo}</span>
                            <span className="block text-xs text-neutral-500">
                              {DESFECHOS_COMITE[desfecho].descricao}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-neutral-500">
                      Sem acordo entre os dois membros, a negativa é mantida: registre o primeiro
                      desfecho.
                    </p>
                  </fieldset>

                  <div className="space-y-1.5">
                    <Label htmlFor="comite-justificativa">Justificativa</Label>
                    <Textarea
                      id="comite-justificativa"
                      value={campoTextarea}
                      onChange={(evento) => setCampoTextarea(evento.target.value)}
                      placeholder={`Registre a justificativa do Comitê (mínimo ${TAMANHO_MINIMO_TEXTO_COMITE} caracteres).`}
                      rows={3}
                    />
                    {campoTextarea.trim().length > 0 &&
                    campoTextarea.trim().length < TAMANHO_MINIMO_TEXTO_COMITE ? (
                      <p className="text-xs text-status-error-text">
                        Descreva a justificativa com pelo menos {TAMANHO_MINIMO_TEXTO_COMITE} caracteres.
                      </p>
                    ) : null}
                  </div>

                  {campoDesfecho && DESFECHOS_COMITE[campoDesfecho].exigePlanoCorrecao ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="comite-plano">Plano de correção</Label>
                      <Textarea
                        id="comite-plano"
                        value={campoPlano}
                        onChange={(evento) => setCampoPlano(evento.target.value)}
                        placeholder={`O que o Executor deve corrigir na nova versão (mínimo ${TAMANHO_MINIMO_TEXTO_COMITE} caracteres).`}
                        rows={3}
                      />
                      {campoPlano.trim().length > 0 &&
                      campoPlano.trim().length < TAMANHO_MINIMO_TEXTO_COMITE ? (
                        <p className="text-xs text-status-error-text">
                          Descreva o plano com pelo menos {TAMANHO_MINIMO_TEXTO_COMITE} caracteres.
                        </p>
                      ) : null}
                      <p className="text-xs text-neutral-500">
                        O Executor precisa gerar uma nova versão do arquivo; o plano fica visível a ele no
                        período.
                      </p>
                    </div>
                  ) : null}

                  {prazoComite ? (
                    <p className="text-xs text-neutral-500">
                      Prazo do Comitê: {formatarData(prazoComite.prazoIso)} · {prazoComite.texto}.
                    </p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo} disabled={processando}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={confirmarDialogo}
                    disabled={
                      processando ||
                      !campoMembro ||
                      !campoDesfecho ||
                      campoTextarea.trim().length < TAMANHO_MINIMO_TEXTO_COMITE ||
                      (DESFECHOS_COMITE[campoDesfecho || "negativa_superada"].exigePlanoCorrecao &&
                        campoPlano.trim().length < TAMANHO_MINIMO_TEXTO_COMITE)
                    }
                  >
                    {processando ? "Lacrando…" : "Registrar decisão e lacrar ata"}
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "emitir_fiscal" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Emitir o documento fiscal?</DialogTitle>
                  <DialogDescription>
                    A emissão da NFS-e está incluída no contrato desta instituição. A plataforma gera um
                    documento fiscal de demonstração (XML), lacra e encadeia à cadeia do período e leva a
                    competência para Documento fiscal emitido. Nenhuma nota real é emitida.
                  </DialogDescription>
                </DialogHeader>
                {arquivoCorrente ? (
                  <dl className="grid gap-3 rounded-md bg-neutral-50 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-neutral-500">DPS de origem</dt>
                      <dd className="break-all text-neutral-700">{arquivoCorrente.nomeArquivo}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-neutral-500">Hash do arquivo</dt>
                      <dd className="font-mono text-xs text-neutral-700">{truncarHash(hashEntregaDoArquivo())}</dd>
                    </div>
                  </dl>
                ) : null}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo} disabled={processando}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo} disabled={processando}>
                    {processando ? "Lacrando…" : "Emitir e lacrar"}
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "transmitir" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Transmitir ao órgão?</DialogTitle>
                  <DialogDescription>
                    Transmissão simulada: nenhum arquivo real é enviado. A plataforma gera o protocolo,
                    lacra o comprovante na cadeia do período e leva a competência para Aguardando retorno.
                  </DialogDescription>
                </DialogHeader>
                <dl className="grid gap-3 rounded-md bg-neutral-50 p-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-neutral-500">Objeto transmitido</dt>
                    <dd className="break-all text-neutral-700">
                      {objetoDaEntrega()?.nome ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-neutral-500">Hash</dt>
                    <dd className="font-mono text-xs text-neutral-700">
                      {objetoDaEntrega() ? truncarHash(objetoDaEntrega()?.hashSha256 ?? "") : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-neutral-500">Canal</dt>
                    <dd className="text-neutral-700">
                      {disponibilidadeTransmissao.cadastro
                        ? rotuloCanalCompletoDoCadastro(disponibilidadeTransmissao.cadastro)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-neutral-500">Responsável pela transmissão</dt>
                    <dd className="text-neutral-700">
                      {ROTULO_RESPONSAVEL_TRANSMISSAO[disponibilidadeTransmissao.responsavel]}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-neutral-500">Cadastro prévio utilizado</dt>
                    <dd className="text-neutral-700">
                      {disponibilidadeTransmissao.cadastro
                        ? `${disponibilidadeTransmissao.cadastro.identificador ?? disponibilidadeTransmissao.cadastro.id} · ${
                            disponibilidadeTransmissao.cadastro.validoAte
                              ? `válido até ${formatarData(disponibilidadeTransmissao.cadastro.validoAte)}`
                              : "sem validade informada"
                          }`
                        : "—"}
                    </dd>
                  </div>
                </dl>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo} disabled={processando}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo} disabled={processando}>
                    {processando ? "Lacrando…" : "Transmitir e lacrar comprovante"}
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "registrar_protocolo_manual" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Registrar protocolo manualmente</DialogTitle>
                  <DialogDescription>
                    Use quando a transmissão automática não está disponível. O registro exige
                    justificativa, fica na trilha de auditoria e gera um recibo lacrado.
                  </DialogDescription>
                </DialogHeader>
                {disponibilidadeTransmissao.motivo ? (
                  <p
                    role="note"
                    className="rounded-md border border-status-warning-border bg-status-warning-bg p-3 text-sm text-status-warning-text"
                  >
                    Por que manual: {disponibilidadeTransmissao.motivo}.
                  </p>
                ) : null}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="justificativa-manual">Justificativa</Label>
                    <Textarea
                      id="justificativa-manual"
                      value={campoTextarea}
                      onChange={(evento) => setCampoTextarea(evento.target.value)}
                      rows={3}
                      placeholder={`Explique o envio fora da plataforma (mínimo ${TAMANHO_MINIMO_JUSTIFICATIVA_MANUAL} caracteres).`}
                    />
                    {campoTextarea.trim().length > 0 &&
                    campoTextarea.trim().length < TAMANHO_MINIMO_JUSTIFICATIVA_MANUAL ? (
                      <p className="text-xs text-status-error-text">
                        Descreva a justificativa com pelo menos {TAMANHO_MINIMO_JUSTIFICATIVA_MANUAL}{" "}
                        caracteres.
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="numero-protocolo-manual">Número do protocolo</Label>
                      <Input
                        id="numero-protocolo-manual"
                        value={campoTexto}
                        placeholder={ehFiscalPeriodo ? "Protocolo do emissor" : "BCB-C212-2026100112345678"}
                        onChange={(evento) => setCampoTexto(evento.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="data-protocolo-manual">Data do protocolo</Label>
                      <Input
                        id="data-protocolo-manual"
                        type="date"
                        value={campoData}
                        onChange={(evento) => setCampoData(evento.target.value)}
                      />
                    </div>
                  </div>
                  {ehFiscalPeriodo ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="emissor-manual">Nome do emissor</Label>
                      <Input
                        id="emissor-manual"
                        value={campoTexto2}
                        placeholder="Ex.: NFS-e Prefeitura de São Paulo"
                        onChange={(evento) => setCampoTexto2(evento.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="canal-manual">Canal</Label>
                      <Select value={campoSelect} onValueChange={(valor) => setCampoSelect(valor ?? "")}>
                        <SelectTrigger id="canal-manual" className="w-full">
                          <SelectValue placeholder="Selecione o canal">
                            {(valor: string | null) =>
                              valor ? ROTULO_CANAL_BCB[valor as CanalEnvioBcb] : "Selecione o canal"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {CANAIS_BCB_OFERECIDOS.map((canal) => (
                            <SelectItem key={canal} value={canal}>
                              {ROTULO_CANAL_BCB[canal]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="anexo-manual">Comprovante do protocolo (opcional)</Label>
                    <Input
                      id="anexo-manual"
                      type="file"
                      className="h-auto py-1.5"
                      onChange={(evento) => setCampoAnexo(evento.currentTarget.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-neutral-500">
                      Se anexado, o arquivo é lacrado e encadeado junto com o recibo do registro manual.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fecharDialogo} disabled={processando}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo} disabled={processando}>
                    {processando ? "Lacrando…" : "Registrar e lacrar"}
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "marcar_encaminhado" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Confirmar o encaminhamento?</DialogTitle>
                  <DialogDescription>
                    A emissão da NFS-e não faz parte do contrato desta instituição: a DPS é encaminhada ao
                    emissor definido pelo cliente. O encaminhamento gera um recibo lacrado na cadeia do
                    período.
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
                  <Button type="button" variant="outline" onClick={fecharDialogo} disabled={processando}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={confirmarDialogo} disabled={processando}>
                    {processando ? "Lacrando…" : "Confirmar e lacrar"}
                  </Button>
                </DialogFooter>
              </>
            ) : null}

            {dialogoAberto === "registrar_retorno" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Registrar retorno {complementoRetorno}</DialogTitle>
                  <DialogDescription>
                    {retornoSimples
                      ? "Informe se o regulador ou o emissor aprovou o documento enviado."
                      : rotuloRetorno === "ACAM213"
                        ? "Registre o retorno de processamento do ACAM212 recebido do Banco Central."
                        : "Registre o retorno recebido do regulador ou do emissor para o protocolo informado."}
                    {protocoloCorrente ? ` Protocolo ${protocoloCorrente.numeroProtocolo}.` : ""}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {retornoSimples ? (
                    <>
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-medium text-neutral-700">Aprovado</legend>
                        <RadioGroup value={campoSelect} onValueChange={(valor) => setCampoSelect(String(valor))}>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="aceito" id="situacao-aprovado-sim" />
                            <Label htmlFor="situacao-aprovado-sim" className="font-normal">
                              Sim
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="rejeitado" id="situacao-aprovado-nao" />
                            <Label htmlFor="situacao-aprovado-nao" className="font-normal">
                              Não
                            </Label>
                          </div>
                        </RadioGroup>
                      </fieldset>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
                    Retorno {complementoRetorno}:{" "}
                    {retornoSimples
                      ? protocoloCorrente?.situacaoRetorno === "aceito"
                        ? "aprovado"
                        : "não aprovado"
                      : (protocoloCorrente?.codigoRetorno ?? "—")}
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
