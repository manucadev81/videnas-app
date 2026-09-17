export type PerfilId = "diretor" | "operacional" | "contador" | "executor" | "validador";

export type LadoId = "cliente" | "sentinellus";

export type ModuloId = "acam212" | "cadoc5711" | "cadoc5710" | "fiscal";

export type TipoInstituicao = "exchange" | "custodiante" | "mesa_otc";

export type EtapaId = "ingestao" | "geracao" | "contador" | "validacao" | "auditoria" | "entrega";

export type EstadoPeriodo =
  | "aguardando_dados"
  | "dados_ingeridos"
  | "gerado"
  | "aguardando_contador"
  | "em_validacao"
  | "validado"
  | "com_excecoes"
  | "liberado"
  | "aprovado"
  | "entregue"
  | "retorno_com_erro";

export type SeveridadeValidacao = "bloqueante" | "aviso" | "informativo";

export type SituacaoUsuario = "ativo" | "convite_pendente" | "desativado";

export type CanalIngestao = "upload" | "sftp" | "api";

export type SituacaoLote = "processado" | "processando" | "com_erro";

export type ContadorStatus = "nao_aplicavel" | "pendente" | "confirmado" | "devolvido";

export type StatusDps = "pendente" | "confirmada" | "ajustada" | "devolvida";

export type Enquadramento =
  | "tributado_prestador"
  | "tributado_tomador"
  | "imune"
  | "isento"
  | "nao_incidencia"
  | null;

export type FormatoArquivo = "xml" | "json";

export type SituacaoArquivo = "corrente" | "substituida";

export type ResultadoValidacao = "aprovado" | "reprovado";

export type CanalEnvioBcb = "sisbacen" | "pstaw10" | "portal_cidadao" | "outro";

export type SituacaoRetornoBcb = "aguardando" | "aceito" | "aceito_com_ressalvas" | "rejeitado";

export type OrigemExcecao = "validacao" | "ingestao" | "retorno_bcb" | "manual";

export type StatusExcecao = "aberta" | "em_tratamento" | "tratada" | "aceita_com_justificativa";

export type CriticidadePrazo = "alta" | "media";

export type TipoEventoAuditoria =
  | "PERIODO_CRIADO"
  | "INGESTAO_CONCLUIDA"
  | "INGESTAO_COMPLEMENTAR"
  | "LOTE_REMOVIDO"
  | "ARQUIVO_GERADO"
  | "ARQUIVO_REGERADO"
  | "ENVIADO_PARA_VALIDACAO"
  | "DPS_ENVIADA_AO_CONTADOR"
  | "ENQUADRAMENTO_FISCAL_CONFIRMADO"
  | "DPS_DEVOLVIDA_PELO_CONTADOR"
  | "VALIDACAO_CONCLUIDA"
  | "VALIDACAO_COM_EXCECOES"
  | "EXCECAO_ABERTA"
  | "EXCECAO_TRATADA"
  | "REPROCESSAMENTO_SOLICITADO"
  | "PERIODO_LIBERADO"
  | "PERIODO_APROVADO"
  | "ENTREGA_REGISTRADA"
  | "DPS_ENCAMINHADA_AO_EMISSOR"
  | "RETORNO_BCB_ACEITO"
  | "RETORNO_BCB_REJEITADO"
  | "PERIODO_REABERTO"
  | "HASH_REVERIFICADO"
  | "USUARIO_CONVIDADO"
  | "PERFIL_ALTERADO"
  | "DICIONARIO_ATUALIZADO"
  | "CONFIG_INSTITUICAO_ALTERADA"
  | "TRILHA_EXPORTADA";

export type AcaoId =
  | "subir_dados"
  | "remover_lote"
  | "gerar"
  | "regerar"
  | "enviar_validacao"
  | "enviar_contador"
  | "validar_fiscal"
  | "devolver_fiscal"
  | "executar_validacao"
  | "liberar"
  | "registrar_retorno"
  | "reabrir"
  | "aprovar"
  | "baixar_arquivo"
  | "registrar_protocolo"
  | "marcar_encaminhado"
  | "tratar_excecao"
  | "editar_config_instituicao"
  | "gerenciar_usuarios"
  | "editar_dicionarios"
  | "trocar_tenant"
  | "exportar_auditoria";

export interface ResponsavelBcb {
  nome: string;
  cpf: string;
  cargo: string;
  email: string;
  telefone: string;
}

export interface Instituicao {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  tipo: TipoInstituicao;
  inscricaoMunicipal: string;
  municipio: string;
  uf: string;
  codigoIbge: string;
  cep: string;
  situacaoRegulatoria: string;
  responsavelBcb: ResponsavelBcb;
  modulosContratados: ModuloId[];
  onboardingConcluido: boolean;
  etapaOnboardingAtual: number;
  criadoEm: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  perfilId: PerfilId;
  lado: LadoId;
  instituicaoIds: string[];
  moduloIds: ModuloId[];
  cargo: string;
  registroProfissional: string | null;
  situacao: SituacaoUsuario;
  ultimoAcesso: string;
  avatarIniciais: string;
}

export interface Perfil {
  id: PerfilId;
  rotulo: string;
  rotuloCompleto: string;
  descricao: string;
  lado: LadoId;
  corBadge: string;
  icone: string;
  rotasPermitidas: string[];
  acoesPermitidas: AcaoId[];
  multiTenant: boolean;
}

export interface Modulo {
  id: ModuloId;
  sigla: string;
  nome: string;
  nomeCompleto: string;
  descricaoCurta: string;
  orgaoDestino: string;
  cadencia: "mensal" | "diaria_consolidada_mensal";
  diaPrazo: number;
  schema: string;
  versaoSchema: string;
  etapas: EtapaId[];
  candidato: boolean;
  cor: string;
  rota: string;
}

export interface LoteIngestao {
  id: string;
  nomeArquivo: string;
  tamanhoBytes: number;
  recebidoEm: string;
  recebidoPorUsuarioId: string;
  canal: CanalIngestao;
  linhasRecebidas: number;
  linhasResolvidas: number;
  linhasComPendencia: number;
  situacao: SituacaoLote;
}

export interface PeriodoObrigacao {
  id: string;
  instituicaoId: string;
  moduloId: ModuloId;
  competencia: string;
  competenciaRotulo: string;
  estado: EstadoPeriodo;
  prazoEntrega: string;
  dataAbertura: string;
  lotes: LoteIngestao[];
  arquivoCorrenteId: string | null;
  arquivoIds: string[];
  validacaoId: string | null;
  protocoloId: string | null;
  excecaoIds: string[];
  totaisResumo: Record<string, number | string>;
  geradoPorUsuarioId: string | null;
  geradoEm: string | null;
  liberadoPorUsuarioId: string | null;
  liberadoEm: string | null;
  aprovadoPorUsuarioId: string | null;
  aprovadoEm: string | null;
  entregueEm: string | null;
  contadorStatus: ContadorStatus;
  contadorUsuarioId: string | null;
  contadorConfirmadoEm: string | null;
}

export interface PeriodoDerivado extends PeriodoObrigacao {
  atrasado: boolean;
  diasDeAtraso: number;
  diasParaPrazo: number;
  etapaAtual: EtapaId;
  progressoPercentual: number;
}

export interface OperacaoCambio {
  id: string;
  periodoId: string;
  numeroControle: string;
  grupo: "G01" | "G10" | "G20" | "G30" | "G40" | "G90";
  naturezaOperacao: string;
  dataOperacao: string;
  clienteNome: string;
  clienteDocumento: string;
  clienteTipo: "PF" | "PJ";
  kycResolvido: boolean;
  paisContraparte: string;
  codigoPais: string;
  moeda: string;
  valorMoedaEstrangeira: number;
  taxaCambio: number;
  valorReais: number;
  ativoVirtual: string;
  codigoAtivoOficial: string;
  quantidadeAtivo: string;
  enderecoDestino: string | null;
  redeBlockchain: string | null;
  operacaoAnuladaRef: string | null;
}

export interface PosicaoCustodiaDiaria {
  id: string;
  periodoId: string;
  dataBase: string;
  clienteDocumento: string;
  clienteNome: string;
  clienteTipo: "PF" | "PJ";
  paisResidencia: string;
  ativoVirtual: string;
  codigoAtivoOficial: string;
  quantidadeCustodiada: string;
  cotacaoDataBase: number;
  valorReais: number;
  tipoCustodia: "propria" | "terceirizada";
  custodianteTerceiro: string | null;
}

export interface Staking {
  saldoEmStaking: string;
  protocolo: string;
  tipoStaking: "liquido" | "nativo" | "delegado";
  recompensasPeriodo: string;
  valorRecompensasReais: number;
  prazoDesbloqueioDias: number | null;
  valorEmStakingReais: number;
}

export interface PosicaoCustodiaMensal {
  id: string;
  periodoId: string;
  dataBase: string;
  carteiraApelido: string;
  enderecoCarteira: string;
  redeBlockchain: string;
  titularidade: "propria" | "de_cliente" | "terceiro";
  ativoVirtual: string;
  codigoAtivoOficial: string;
  saldoTotal: string;
  cotacaoDataBase: number;
  valorReais: number;
  possuiStaking: boolean;
  staking: Staking | null;
}

export interface ServicoPrestadoDPS {
  id: string;
  periodoId: string;
  numeroDocumentoInterno: string;
  dataPrestacao: string;
  tomadorNome: string;
  tomadorDocumento: string;
  tomadorTipo: "PF" | "PJ";
  tomadorMunicipio: string;
  tomadorCodigoIbge: string;
  municipioPrestacao: string;
  codigoIbgePrestacao: string;
  codigoServico: string;
  descricaoServico: string;
  discriminacao: string;
  valorServico: number;
  deducoes: number;
  baseCalculo: number;
  aliquotaIssSugerida: number;
  aliquotaIssConfirmada: number | null;
  valorIss: number;
  retencaoNaFonte: boolean;
  valorRetido: number;
  enquadramento: Enquadramento;
  regimeTributario: string;
  statusContador: StatusDps;
  observacaoContador: string | null;
  emissorDestino: string | null;
}

export interface ArquivoGerado {
  id: string;
  periodoId: string;
  versao: number;
  nomeArquivo: string;
  formato: FormatoArquivo;
  hashSha256: string;
  algoritmoHash: string;
  tamanhoBytes: number;
  tamanhoLegivel: string;
  schema: string;
  versaoSchema: string;
  quantidadeRegistros: number;
  geradoEm: string;
  geradoPorUsuarioId: string;
  situacao: SituacaoArquivo;
  previewConteudo: string;
  urlDownload: string;
}

export interface ValidacaoItem {
  codigo: string;
  severidade: SeveridadeValidacao;
  mensagem: string;
  localizacaoLinha: number | null;
  localizacaoNo: string | null;
  campo: string | null;
  valorEncontrado: string | null;
  valorEsperado: string | null;
  registroRefId: string | null;
}

export interface RegraDeterministica {
  regra: string;
  aprovada: boolean;
}

export interface ValidacaoResultado {
  id: string;
  periodoId: string;
  arquivoId: string;
  schema: string;
  versaoSchema: string;
  executadaEm: string;
  executadaPorUsuarioId: string;
  duracaoMs: number;
  totalErros: number;
  totalAvisos: number;
  resultado: ResultadoValidacao;
  itens: ValidacaoItem[];
  regrasDeterministicas: RegraDeterministica[];
}

export interface ProtocoloBCB {
  id: string;
  periodoId: string;
  numeroProtocolo: string;
  dataHoraEnvio: string;
  canalEnvio: CanalEnvioBcb;
  registradoPorUsuarioId: string;
  reciboHash: string;
  situacaoRetorno: SituacaoRetornoBcb;
  codigoRetorno: string | null;
  mensagemRetorno: string | null;
  dataRetorno: string | null;
  observacao: string | null;
}

export interface Excecao {
  id: string;
  periodoId: string;
  instituicaoId: string;
  moduloId: ModuloId;
  origem: OrigemExcecao;
  codigo: string;
  severidade: "bloqueante" | "aviso";
  titulo: string;
  descricao: string;
  abertaEm: string;
  abertaPorUsuarioId: string;
  responsavelAtualPerfil: PerfilId;
  status: StatusExcecao;
  justificativa: string | null;
  tratadaPorUsuarioId: string | null;
  tratadaEm: string | null;
  registroRefId: string | null;
}

export interface EventoAuditoria {
  id: string;
  ocorridoEm: string;
  instituicaoId: string;
  periodoId: string | null;
  moduloId: ModuloId | null;
  competencia: string | null;
  tipo: TipoEventoAuditoria;
  rotuloTipo: string;
  usuarioId: string;
  usuarioNome: string;
  perfilId: PerfilId;
  lado: LadoId;
  referencia: string | null;
  payload: Record<string, unknown>;
  ip: string;
  userAgent: string;
}

export interface PrazoRegulatorio {
  id: string;
  instituicaoId: string;
  moduloId: ModuloId;
  competencia: string;
  dataVencimento: string;
  descricao: string;
  baseNormativa: string;
  periodoId: string;
  criticidade: CriticidadePrazo;
  diasAntecedenciaAlerta: number;
}

export interface Acao {
  id: AcaoId;
  rotulo: string;
  estadoDestino: EstadoPeriodo | null;
  variante: "primario" | "secundario" | "destrutivo-suave" | "ghost";
}
