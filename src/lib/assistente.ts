import {
  ESPECIFICACAO_MODULOS,
  ROTULO_DELIMITADOR,
  listarExtensoes,
} from "@/lib/ingestao/especificacoes";
import { buscarModulo, modulos } from "@/lib/mock/modulos";
import { PERFIS } from "@/lib/permissoes";
import type { EtapaId, ModuloId } from "@/lib/tipos";

export type ConfiancaResposta = "alta" | "media" | "baixa";

export interface TopicoAssistente {
  id: string;
  titulo: string;
  categoria: string;
  perguntaExemplo: string;
  palavrasChave: string[];
  resposta: string;
  relacionados: string[];
}

export interface RespostaAssistente {
  topicoId: string | null;
  titulo: string;
  texto: string;
  confianca: ConfiancaResposta;
  sugestoes: string[];
}

export interface PerguntaRapida {
  id: string;
  rotulo: string;
  pergunta: string;
}

export const AVISO_ASSISTENTE =
  "Assistente de demonstração. Responde a partir de uma base local de conhecimento sobre o produto, sem consultar dados reais, a internet ou qualquer serviço externo.";

const ROTULO_ETAPA: Record<EtapaId, string> = {
  ingestao: "Ingestão",
  geracao: "Geração",
  contador: "Contador",
  validacao: "Validação",
  auditoria: "Auditoria",
  entrega: "Entrega",
};

const ROTULO_CADENCIA: Record<string, string> = {
  mensal: "mensal",
  diaria_consolidada_mensal: "posição diária consolidada e entregue mensalmente",
};

const BASE_NORMATIVA: Record<ModuloId, string> = {
  acam212: "Circular BCB 3.978, art. 6º",
  cadoc5711: "Circular BCB 3.966, art. 4º",
  cadoc5710: "Circular BCB 3.966, art. 9º",
  fiscal: "Convênio Nacional NFS-e — Nota Técnica 001/2025",
};

const ANTECEDENCIA_ALERTA: Record<ModuloId, number> = {
  acam212: 5,
  cadoc5711: 3,
  cadoc5710: 5,
  fiscal: 3,
};

function textoModulo(moduloId: ModuloId): string {
  const modulo = buscarModulo(moduloId);
  const especificacao = ESPECIFICACAO_MODULOS[moduloId];
  const obrigatorias = especificacao.colunas
    .filter((coluna) => coluna.obrigatoria)
    .map((coluna) => coluna.chave);
  const opcionais = especificacao.colunas
    .filter((coluna) => !coluna.obrigatoria)
    .map((coluna) => coluna.chave);
  const delimitadores = especificacao.delimitadoresAceitos
    .map((delimitador) => ROTULO_DELIMITADOR[delimitador] ?? delimitador)
    .join(" ou ");

  const linhas = [
    `${modulo.nomeCompleto} (sigla ${modulo.sigla}).`,
    modulo.descricaoCurta,
    `Destino: ${modulo.orgaoDestino}. Cadência: ${ROTULO_CADENCIA[modulo.cadencia] ?? modulo.cadencia}.`,
    `Prazo: dia ${modulo.diaPrazo} — base normativa ${BASE_NORMATIVA[moduloId]}. O alerta de proximidade acende ${ANTECEDENCIA_ALERTA[moduloId]} dias antes do vencimento.`,
    `Schema ${modulo.schema}, versão ${modulo.versaoSchema}.`,
    `Etapas: ${modulo.etapas.map((etapa) => ROTULO_ETAPA[etapa]).join(" > ")}.`,
    `Arquivo de entrada: ${especificacao.padraoNome}, em ${listarExtensoes(moduloId)}, com colunas separadas por ${delimitadores}.`,
    `Colunas obrigatórias: ${obrigatorias.join(", ")}.`,
    opcionais.length > 0 ? `Colunas opcionais: ${opcionais.join(", ")}.` : "",
    modulo.candidato
      ? "Selo Candidato: funcionalidade candidata, sujeita a decisão de produto."
      : "",
  ];

  return linhas.filter((linha) => linha.length > 0).join("\n");
}

function textoPerfis(): string {
  const linhas = PERFIS.map((perfil) => {
    const lado = perfil.lado === "cliente" ? "lado cliente" : "lado Videnas";
    const tenant = perfil.multiTenant
      ? "atende várias instituições e pode trocar de tenant"
      : perfil.contextoFixo
        ? "é pré-cadastrado pelo operador do tenant e entra direto na instituição vinculada ao seu cadastro"
        : "atua em uma única instituição";
    return `• ${perfil.rotuloCompleto} (${lado}): ${perfil.descricao} — ${tenant}.`;
  });

  return [
    "A plataforma tem 6 perfis, e cada um enxerga apenas as ações do seu papel:",
    ...linhas,
    "O perfil ativo é escolhido no seletor de perfil do header e muda a navegação, os módulos visíveis e os botões disponíveis em cada competência. O seletor cobre os 5 perfis simuláveis: o Cliente / Fornecedor de dados não aparece ali porque é pré-cadastrado pelo operador do tenant — chega-se a ele pelo login do próprio usuário, e no header ele vê apenas a identidade estática (nome, instituição e papel).",
  ].join("\n");
}

const LISTA_MODULOS = modulos
  .map((modulo) => `• ${modulo.nome} (${modulo.sigla}) — ${modulo.descricaoCurta} Prazo: dia ${modulo.diaPrazo}.`)
  .join("\n");

export const TOPICOS_ASSISTENTE: TopicoAssistente[] = [
  {
    id: "plataforma",
    titulo: "O que é a Videnas",
    categoria: "Plataforma",
    perguntaExemplo: "O que é a Videnas?",
    palavrasChave: [
      "videnas",
      "plataforma",
      "produto",
      "regtech",
      "o que e",
      "para que serve",
      "posicionamento",
      "responsabilidade",
    ],
    resposta: [
      "A Videnas é uma prestadora de serviços tecnológicos (RegTech). Ela recebe os dados que a instituição envia, estrutura os arquivos no formato exigido pelo regulador, valida contra o schema oficial e registra a trilha de auditoria de cada etapa.",
      "A Videnas não é instituição financeira, PSAV ou SPSAV, não custodia ativos virtuais, não transmite o arquivo ao Banco Central em nome da instituição, não emite NFS-e e não substitui contador ou advogado.",
      "A responsabilidade pela obrigação regulatória perante o Banco Central, o município e a Receita Federal permanece da instituição cliente.",
      "A plataforma é organizada por obrigação: cada módulo tem suas competências (uma por mês) e cada competência percorre as mesmas etapas.",
    ].join("\n\n"),
    relacionados: ["modulos-visao-geral", "etapas", "perfis"],
  },
  {
    id: "modulos-visao-geral",
    titulo: "Os módulos da plataforma",
    categoria: "Módulos",
    perguntaExemplo: "Quais módulos existem na plataforma?",
    palavrasChave: [
      "modulos",
      "obrigacoes",
      "quais modulos",
      "obrigacao",
      "visao geral",
      "contratados",
    ],
    resposta: [
      "São 4 módulos, um por obrigação:",
      LISTA_MODULOS,
      "Cada instituição só enxerga os módulos que contratou. Os três primeiros vão ao Banco Central do Brasil; o Fiscal estrutura a DPS para o emissor definido pelo cliente.",
    ].join("\n\n"),
    relacionados: ["modulo-acam212", "modulo-cadoc5711", "modulo-cadoc5710", "modulo-fiscal"],
  },
  {
    id: "modulo-acam212",
    titulo: "Módulo ACAM212 / C212",
    categoria: "Módulos",
    perguntaExemplo: "O que é o módulo ACAM212?",
    palavrasChave: ["acam212", "acam", "c212", "cambio", "operacoes de cambio", "212"],
    resposta: textoModulo("acam212"),
    relacionados: ["envio-lote", "prazos", "etapas"],
  },
  {
    id: "modulo-cadoc5711",
    titulo: "Módulo Cadoc 5711",
    categoria: "Módulos",
    perguntaExemplo: "O que é o Cadoc 5711?",
    palavrasChave: ["cadoc 5711", "5711", "custodia diaria", "posicao diaria", "data base"],
    resposta: textoModulo("cadoc5711"),
    relacionados: ["modulo-cadoc5710", "envio-lote", "prazos"],
  },
  {
    id: "modulo-cadoc5710",
    titulo: "Módulo Cadoc 5710",
    categoria: "Módulos",
    perguntaExemplo: "Qual a diferença entre o Cadoc 5710 e o 5711?",
    palavrasChave: [
      "cadoc 5710",
      "5710",
      "carteira",
      "endereco",
      "staking",
      "posicao mensal",
      "diferenca entre 5710 e 5711",
    ],
    resposta: [
      textoModulo("cadoc5710"),
      "Diferença para o 5711: o 5711 reporta a posição diária por cliente (uma linha por data-base e por cliente); o 5710 reporta a posição mensal agregada por carteira/endereço, incluindo saldo em staking e recompensa acumulada.",
    ].join("\n\n"),
    relacionados: ["modulo-cadoc5711", "envio-lote", "prazos"],
  },
  {
    id: "modulo-fiscal",
    titulo: "Módulo Fiscal / DPS",
    categoria: "Módulos",
    perguntaExemplo: "Como funciona o módulo Fiscal (DPS)?",
    palavrasChave: [
      "fiscal",
      "dps",
      "nfs-e",
      "nfse",
      "nota fiscal",
      "iss",
      "aliquota",
      "retencao",
      "enquadramento",
      "tributario",
      "candidato",
    ],
    resposta: [
      textoModulo("fiscal"),
      "É o único módulo com a etapa Contador: depois de estruturada, a DPS vai para o Contador / Fiscal confirmar alíquota de ISS, retenção na fonte e enquadramento tributário. A Videnas calcula a sugestão a partir dos dicionários configurados, mas a decisão é sempre do contador responsável.",
      "Limite importante: a Videnas estrutura a DPS, mas não emite a NFS-e. A emissão acontece fora da plataforma, pelo emissor que a instituição definir. Na etapa Entrega o registro é \"Marcar como encaminhado ao emissor\", e não o protocolo do BCB.",
    ].join("\n\n"),
    relacionados: ["etapa-contador", "perfis", "etapa-entrega"],
  },
  {
    id: "etapas",
    titulo: "As etapas de uma competência",
    categoria: "Fluxo",
    perguntaExemplo: "Quais são as etapas de uma competência?",
    palavrasChave: [
      "etapas",
      "fluxo",
      "stepper",
      "passos",
      "ingestao geracao validacao",
      "como funciona o fluxo",
      "ciclo",
    ],
    resposta: [
      "Toda competência percorre 5 etapas, na ordem: Ingestão > Geração > Validação > Auditoria > Entrega.",
      "No módulo Fiscal existe uma etapa a mais, entre a Geração e a Validação: Contador. O fluxo fica Ingestão > Geração > Contador > Validação > Auditoria > Entrega.",
      "• Ingestão: a instituição envia os dados de origem e cada arquivo é pré-validado contra o layout da obrigação.\n• Geração: o Executor Videnas produz o arquivo no schema oficial e calcula o hash SHA-256.\n• Validação: o Validador Videnas roda o schema e as regras determinísticas, e libera para o cliente.\n• Auditoria: a trilha registra quem gerou, quem liberou e quem aprovou, comprovando a segregação de funções.\n• Entrega: a instituição transmite ao órgão e registra o protocolo recebido.",
    ].join("\n\n"),
    relacionados: ["etapa-ingestao", "etapa-geracao", "etapa-validacao", "etapa-entrega"],
  },
  {
    id: "etapa-ingestao",
    titulo: "Etapa de Ingestão",
    categoria: "Fluxo",
    perguntaExemplo: "Como funciona a etapa de Ingestão?",
    palavrasChave: [
      "ingestao",
      "upload",
      "subir dados",
      "enviar dados",
      "dropzone",
      "arquivo de origem",
      "recepcao",
    ],
    resposta: [
      "A Ingestão é a única etapa em que o Operacional / Backoffice atua. Sem dados enviados, não há o que gerar.",
      "O arquivo é lido no próprio navegador e conferido contra o layout da obrigação: nome do arquivo, competência, instituição, delimitador, cabeçalho, colunas obrigatórias e o tipo de cada campo.",
      "O aceite acontece arquivo a arquivo, na pré-visualização que abre no ato do envio: você confere a amostra dos registros e as não conformidades antes de clicar em \"Aceitar lote\". Assim que um lote é aceito, a competência passa de \"Aguardando dados\" para \"Dados recebidos\".",
      "Cada arquivo fica na tabela de recebidos com um status: Aceito, Aceito com ressalvas, Não conforme ou Rejeitado pelo operador.",
    ].join("\n\n"),
    relacionados: ["envio-lote", "nao-conformidades", "perfil-cliente"],
  },
  {
    id: "etapa-geracao",
    titulo: "Etapa de Geração e hash",
    categoria: "Fluxo",
    perguntaExemplo: "O que acontece na etapa de Geração?",
    palavrasChave: [
      "geracao",
      "gerar arquivo",
      "gerar novamente",
      "regerar",
      "hash",
      "sha-256",
      "sha256",
      "integridade",
      "versao do arquivo",
    ],
    resposta: [
      "A Geração é feita pelo Executor Videnas. O botão \"Gerar arquivo\" só fica disponível com a competência em \"Dados recebidos\" e ao menos um lote ingerido.",
      "Cada geração calcula um hash SHA-256 do arquivo produzido e grava um evento ARQUIVO_GERADO na trilha de auditoria, com schema, versão e quantidade de registros. Alterar um único caractere muda o hash por inteiro — é assim que a integridade é comprovada.",
      "\"Gerar novamente\" cria uma nova versão sem apagar a anterior: a versão antiga permanece na trilha, marcada como substituída.",
      "Depois de gerado, o arquivo segue com \"Enviar para validação\". No módulo Fiscal esse passo é substituído por \"Enviar ao contador\".",
    ].join("\n\n"),
    relacionados: ["etapa-validacao", "segregacao-funcoes", "trilha-auditoria"],
  },
  {
    id: "etapa-contador",
    titulo: "Etapa do Contador (só no Fiscal)",
    categoria: "Fluxo",
    perguntaExemplo: "Por que o Fiscal tem uma etapa a mais?",
    palavrasChave: [
      "etapa contador",
      "contador",
      "confirmar enquadramento",
      "devolver para correcao",
      "aguardando contador",
      "etapa a mais",
    ],
    resposta: [
      "O Fiscal é o único módulo em que a Videnas depende de uma validação humana de enquadramento. Por isso ele tem a etapa Contador entre a Geração e a Validação.",
      "Com a competência em \"Aguardando contador\", o Contador / Fiscal confere, DPS a DPS, a alíquota de ISS sugerida, se há retenção na fonte e o enquadramento tributário.",
      "\"Confirmar enquadramento fiscal\" registra a confirmação em nome do contador na trilha e libera a competência para a validação de schema. \"Devolver para correção\" volta a competência para o estado Gerado, com justificativa, e aciona o time Videnas.",
    ].join("\n\n"),
    relacionados: ["modulo-fiscal", "etapa-validacao", "perfis"],
  },
  {
    id: "etapa-validacao",
    titulo: "Etapa de Validação",
    categoria: "Fluxo",
    perguntaExemplo: "O que a etapa de Validação verifica?",
    palavrasChave: [
      "validacao",
      "validar",
      "schema",
      "erros e avisos",
      "bloqueante",
      "executar validacao",
      "liberar",
      "liberar para o cliente",
    ],
    resposta: [
      "A Validação é feita pelo Validador Videnas, que nunca gera arquivos. \"Executar validação de schema\" roda o schema oficial e as regras determinísticas do módulo contra o arquivo gerado.",
      "Cada item encontrado traz severidade, código, mensagem e localização — por exemplo 5711-E008, bloqueante: \"Data-base 2026-08-17 ausente na sequência de posições diárias.\" Erros bloqueantes impedem a liberação até serem tratados.",
      "Com zero erro bloqueante, a competência fica \"Validada\". Em seguida, \"Liberar para o cliente\" torna o arquivo visível e baixável pela instituição e grava o evento PERIODO_LIBERADO com o hash.",
    ].join("\n\n"),
    relacionados: ["pendencias-excecoes", "segregacao-funcoes", "etapa-auditoria"],
  },
  {
    id: "etapa-auditoria",
    titulo: "Etapa de Auditoria",
    categoria: "Fluxo",
    perguntaExemplo: "O que a etapa de Auditoria mostra?",
    palavrasChave: ["auditoria", "aprovar", "aprovacao", "diretor aprova", "assumir responsabilidade"],
    resposta: [
      "A Auditoria consolida a evidência da competência: o card de segregação de funções mostra quem gerou, quem liberou e quem aprovou — nunca a mesma pessoa.",
      "O botão \"Aprovar e assumir responsabilidade\" é exclusivo do Diretor / Compliance e só aparece depois que o Validador libera a competência (estado Liberado).",
      "Ao aprovar, o Diretor declara formalmente que revisou o conteúdo e assume a obrigação perante o órgão competente. Isso fica registrado na trilha com nome, cargo e o hash do arquivo.",
    ].join("\n\n"),
    relacionados: ["segregacao-funcoes", "trilha-auditoria", "etapa-entrega"],
  },
  {
    id: "etapa-entrega",
    titulo: "Etapa de Entrega e protocolo",
    categoria: "Fluxo",
    perguntaExemplo: "Como registro o protocolo do Banco Central?",
    palavrasChave: [
      "entrega",
      "protocolo",
      "registrar protocolo",
      "transmissao",
      "enviar ao bcb",
      "banco central",
      "retorno do bcb",
      "encaminhado ao emissor",
    ],
    resposta: [
      "A transmissão ao Banco Central é feita pela própria instituição, fora da Videnas. Depois de enviar, é na etapa Entrega que se registra o protocolo recebido — número, canal e data/hora — para manter a trilha completa.",
      "No módulo Fiscal não há protocolo do BCB: o registro equivalente é \"Marcar como encaminhado ao emissor\", já que a emissão da NFS-e acontece fora da plataforma.",
      "Se o órgão devolver o arquivo, \"Registrar retorno do BCB\" leva a competência para o estado \"Retorno com erro\", e a partir daí ela pode ser reaberta para correção.",
    ].join("\n\n"),
    relacionados: ["estados-periodo", "prazos", "modulo-fiscal"],
  },
  {
    id: "estados-periodo",
    titulo: "Estados de uma competência",
    categoria: "Fluxo",
    perguntaExemplo: "Quais são os estados possíveis de uma competência?",
    palavrasChave: [
      "estados",
      "estado do periodo",
      "status da competencia",
      "aguardando dados",
      "dados recebidos",
      "liberado",
      "aprovado",
      "entregue",
      "com excecoes",
      "reabrir",
    ],
    resposta: [
      "Uma competência passa por estes estados:",
      "• Aguardando dados — nenhum lote recebido.\n• Dados recebidos — ao menos um lote aceito na ingestão.\n• Gerado — arquivo produzido, com hash.\n• Aguardando contador — só no Fiscal.\n• Em validação — schema em conferência.\n• Validada — zero erro bloqueante.\n• Com exceções — há itens bloqueantes ou avisos a tratar.\n• Liberado — visível e baixável pelo cliente.\n• Aprovado — o Diretor assumiu a responsabilidade.\n• Entregue — protocolo registrado (ou encaminhado ao emissor, no Fiscal).\n• Retorno com erro — o órgão devolveu o arquivo.",
      "\"Reabrir período para correção\" volta a competência de Retorno com erro, Liberado ou Aprovado para Dados recebidos, sem apagar nada da trilha.",
    ].join("\n\n"),
    relacionados: ["etapas", "pendencias-excecoes", "trilha-auditoria"],
  },
  {
    id: "prazos",
    titulo: "Prazos regulatórios",
    categoria: "Prazos",
    perguntaExemplo: "Quais são os prazos de cada obrigação?",
    palavrasChave: [
      "prazo",
      "prazos",
      "vencimento",
      "atraso",
      "atrasado",
      "calendario",
      "data limite",
      "quando entregar",
      "dia",
    ],
    resposta: [
      "Cada obrigação tem seu dia de vencimento e sua base normativa:",
      modulos
        .map(
          (modulo) =>
            `• ${modulo.nome}: dia ${modulo.diaPrazo} — ${BASE_NORMATIVA[modulo.id]} (alerta ${ANTECEDENCIA_ALERTA[modulo.id]} dias antes).`
        )
        .join("\n"),
      "No painel, a lista de próximos prazos ordena as competências por urgência: atrasadas primeiro, depois por proximidade do vencimento. Quando algo está atrasado, o card e o badge ficam vermelhos.",
      "O Calendário reúne todos os prazos de todos os módulos contratados pela instituição, mês a mês, sem precisar abrir competência por competência.",
    ].join("\n\n"),
    relacionados: ["modulos-visao-geral", "estados-periodo", "etapa-entrega"],
  },
  {
    id: "envio-lote",
    titulo: "Envio de lote: nome, formato e modelo",
    categoria: "Ingestão",
    perguntaExemplo: "Qual o padrão de nome do arquivo que devo enviar?",
    palavrasChave: [
      "enviar lote",
      "lote",
      "nome do arquivo",
      "padrao de nome",
      "renomear",
      "formato aceito",
      "extensao",
      "csv",
      "xlsx",
      "modelo",
      "baixar modelo",
      "delimitador",
      "separador",
      "cabecalho",
      "colunas",
    ],
    resposta: [
      "O nome do arquivo segue sempre o padrão {modulo}_{instituicao}_{AAAAMM}.{ext} — sem sufixos, espaços ou segmentos extras. Exemplo: acam212_meridian_202609.csv.",
      "Formatos aceitos por obrigação:",
      modulos
        .map((modulo) => {
          const especificacao = ESPECIFICACAO_MODULOS[modulo.id];
          const delimitadores = especificacao.delimitadoresAceitos
            .map((delimitador) => ROTULO_DELIMITADOR[delimitador] ?? delimitador)
            .join(" ou ");
          return `• ${modulo.nome}: ${especificacao.padraoNome} — ${listarExtensoes(modulo.id)}, separado por ${delimitadores}.`;
        })
        .join("\n"),
      "No Fiscal, arquivos .xlsx são aceitos pelo layout mas não podem ser pré-visualizados nem conferidos linha a linha antes do aceite (ING-E002): exporte como CSV para conseguir conferir o conteúdo.",
      "O botão \"Baixar modelo (CSV)\" gera um arquivo já com o nome no padrão exigido, o cabeçalho completo e uma linha de exemplo. Preencher a partir dele evita a maior parte das não conformidades.",
    ].join("\n\n"),
    relacionados: ["nao-conformidades", "etapa-ingestao", "modulos-visao-geral"],
  },
  {
    id: "nao-conformidades",
    titulo: "Não conformidades da ingestão (ING-E / ING-A)",
    categoria: "Ingestão",
    perguntaExemplo: "O que significam os códigos ING-E e ING-A?",
    palavrasChave: [
      "nao conformidade",
      "nao conforme",
      "ing-e",
      "ing-a",
      "codigo de erro",
      "erro no upload",
      "rejeitado",
      "ressalva",
      "por que meu arquivo foi recusado",
    ],
    resposta: [
      "A pré-validação da ingestão numera cada achado. Códigos ING-E são bloqueantes (impedem o aceite do lote); ING-A são avisos (o lote pode ser aceito com ressalvas).",
      "Bloqueantes mais comuns:\n• ING-E001 — formato/extensão não previsto no layout.\n• ING-E002 — arquivo binário (.xlsx) não pode ser pré-visualizado.\n• ING-E003 — cabeçalho ausente ou coluna obrigatória faltando.\n• ING-E004 — arquivo vazio ou sem conteúdo legível.\n• ING-E005 — arquivo abaixo do tamanho mínimo da obrigação.\n• ING-E006 — delimitador de colunas não aceito.\n• ING-E007 — tem cabeçalho, mas nenhuma linha de dados.\n• ING-E008 — linha com número de campos diferente do cabeçalho.\n• ING-E009 — não foi possível ler o arquivo neste navegador.",
      "Bloqueantes de identificação do arquivo:\n• ING-E010 — nome fora do padrão {modulo}_{instituicao}_{AAAAMM}.\n• ING-E011 — o nome aponta para outra obrigação.\n• ING-E012 — competência divergente da competência aberta.\n• ING-E013 — instituição divergente da instituição do período.",
      "Bloqueantes de conteúdo:\n• ING-E020 — campo obrigatório vazio.\n• ING-E021 — data inválida (use ISO 8601: AAAA-MM-DD).\n• ING-E022 — CPF/CNPJ inválido.\n• ING-E023 — valor não numérico, negativo, inteiro com caractere inválido ou booleano fora de Sim/Não.\n• ING-E024 — quantidade não numérica ou negativa.",
      "Avisos:\n• ING-A001 — coluna opcional não enviada.\n• ING-A002 — coluna fora do layout, será ignorada.\n• ING-A003 — linha em branco ignorada.\n• ING-A004 — valor ou quantidade zerada.\n• ING-A005 — caracteres que não puderam ser decodificados.\n• ING-A006 — data fora da competência do período.\n• ING-A007 — data em DD/MM/AAAA, convertida para AAAA-MM-DD na ingestão.",
      "Cada não conformidade vem acompanhada do ajuste sugerido, da linha e do campo em que ocorreu.",
    ].join("\n\n"),
    relacionados: ["envio-lote", "etapa-ingestao", "pendencias-excecoes"],
  },
  {
    id: "pendencias-excecoes",
    titulo: "Pendências e exceções",
    categoria: "Exceções",
    perguntaExemplo: "Como trato uma exceção bloqueante?",
    palavrasChave: [
      "excecao",
      "excecoes",
      "pendencia",
      "pendencias",
      "tratar excecao",
      "bloqueante",
      "aviso",
      "informativo",
      "justificativa",
    ],
    resposta: [
      "Exceções são os achados que impedem ou ressalvam o avanço de uma competência. Elas têm origem na validação, na ingestão, no retorno do BCB ou em registro manual.",
      "Severidades: bloqueante (impede liberar ou aprovar), aviso (registra a ressalva) e informativo.",
      "Status de tratamento: aberta, em tratamento, tratada e aceita com justificativa. Enquanto houver exceção bloqueante aberta, a ação \"Reprocessar validação\" fica indisponível e a plataforma informa quantas estão pendentes.",
      "A competência com exceções aparece no estado \"Com exceções\" e pode voltar para a geração com \"Gerar novamente\", criando uma nova versão do arquivo.",
    ].join("\n\n"),
    relacionados: ["etapa-validacao", "nao-conformidades", "estados-periodo"],
  },
  {
    id: "perfis",
    titulo: "Perfis de usuário",
    categoria: "Perfis",
    perguntaExemplo: "Quais perfis existem e o que cada um faz?",
    palavrasChave: [
      "perfil",
      "perfis",
      "papeis",
      "quem faz o que",
      "diretor",
      "operacional",
      "backoffice",
      "cliente",
      "fornecedor de dados",
      "executor",
      "validador",
      "permissao",
      "permissoes",
      "acesso",
    ],
    resposta: textoPerfis(),
    relacionados: ["perfil-cliente", "segregacao-funcoes", "selecao-instituicao"],
  },
  {
    id: "segregacao-funcoes",
    titulo: "Segregação de funções (regra de 4 olhos)",
    categoria: "Perfis",
    perguntaExemplo: "Como funciona a segregação de funções?",
    palavrasChave: [
      "segregacao",
      "segregacao de funcoes",
      "quatro olhos",
      "4 olhos",
      "quem gerou nao libera",
      "botao desabilitado",
      "por que nao vejo o botao",
    ],
    resposta: [
      "A regra de 4 olhos da Videnas é fixa e vale para todos os módulos: Executor gera, Validador libera, Diretor aprova — nunca a mesma pessoa.",
      "Se o usuário que gerou o arquivo tentar liberá-lo, o botão fica desabilitado com o aviso: \"Quem gerou o arquivo não pode liberá-lo. Segregação de funções obrigatória.\"",
      "Por isso o botão \"Gerar arquivo\" nunca aparece para o Validador, e \"Liberar para o cliente\" nunca aparece para o Executor nem para o Diretor. Cada perfil só enxerga as ações do seu próprio papel.",
      "O card de segregação de funções, na etapa Auditoria, mostra quem executou cada um desses três passos.",
    ].join("\n\n"),
    relacionados: ["perfis", "etapa-auditoria", "etapa-validacao"],
  },
  {
    id: "selecao-instituicao",
    titulo: "Seleção de instituição (multi-tenant)",
    categoria: "Plataforma",
    perguntaExemplo: "Como troco de instituição?",
    palavrasChave: [
      "instituicao",
      "instituicoes",
      "trocar instituicao",
      "tenant",
      "multi tenant",
      "selecionar instituicao",
      "cliente",
      "meridian",
      "cofre atlantico",
      "pampulha",
    ],
    resposta: [
      "Perfis do lado cliente (Diretor, Operacional e Contador) trabalham em uma única instituição, definida no cadastro do usuário.",
      "O perfil Cliente / Fornecedor de dados é pré-cadastrado pelo operador do tenant — instituição e pessoa responsável pelo envio já vêm cadastradas antes do primeiro acesso. Por isso ele entra direto na instituição dele, sem passar pela tela de seleção, e o header mostra apenas a identidade estática (nome, instituição e papel), sem seletor de instituição nem simulador de perfil.",
      "Perfis do lado Videnas (Executor e Validador) são multi-tenant: atendem várias instituições e podem trocar de contexto pelo seletor de instituição do header ou pelos chips da fila em Operação. A troca muda toda a aplicação, inclusive a barra lateral.",
      "A tela de seleção de instituição existe para os perfis multi-tenant e para a simulação de perfis da demonstração, e a escolha pode ser \"todas\" para ver a fila consolidada.",
    ].join("\n\n"),
    relacionados: ["perfis", "prazos", "plataforma"],
  },
  {
    id: "trilha-auditoria",
    titulo: "Trilha de auditoria",
    categoria: "Auditoria",
    perguntaExemplo: "O que fica registrado na trilha de auditoria?",
    palavrasChave: [
      "trilha",
      "trilha de auditoria",
      "log",
      "evento",
      "eventos",
      "exportar auditoria",
      "csv da auditoria",
      "historico",
      "evidencia",
    ],
    resposta: [
      "Cada ação relevante grava um evento na trilha: ARQUIVO_GERADO, PERIODO_LIBERADO, aprovação, registro de protocolo, tratamento de exceção, reabertura e troca de perfil.",
      "Os eventos guardam autor, cargo, data/hora e, quando aplicável, o hash SHA-256 do arquivo, o schema e a versão. Versões substituídas não são apagadas: permanecem na trilha marcadas como substituídas.",
      "Diretor, Executor e Validador podem exportar a trilha em CSV pela ação \"Exportar trilha (CSV)\".",
    ].join("\n\n"),
    relacionados: ["etapa-auditoria", "cadeia-custodia", "segregacao-funcoes"],
  },
  {
    id: "perfil-cliente",
    titulo: "Perfil Cliente / Fornecedor de dados",
    categoria: "Perfis",
    perguntaExemplo: "O que o perfil Cliente faz e como ele difere do Operacional?",
    palavrasChave: [
      "cliente",
      "fornecedor de dados",
      "perfil cliente",
      "fornecer dados",
      "fornecimento",
      "fornecimento de dados",
      "quem envia os dados",
      "diferenca entre cliente e operacional",
      "superficie reduzida",
      "natalia",
    ],
    resposta: [
      "O Cliente / Fornecedor de dados é quem FORNECE os dados de origem de cada obrigação. Ele abre a competência em Fornecimento de dados, vê o checklist de insumos obrigatórios, envia arquivos e preenche os formulários curtos — e é só isso que ele faz.",
      "O Operacional / Backoffice é outro papel: ele OPERA o pipeline do lado da instituição — ingestão dentro dos módulos, tratamento de exceções e dicionários. Os dois são do lado cliente, mas não se confundem: o Cliente alimenta, o Operacional conduz.",
      "Por isso a superfície do Cliente é reduzida de propósito: ele acessa apenas o painel, Fornecimento de dados, Arquivos entregues e Calendário. Não há módulos, auditoria, configurações nem fila de operação para esse perfil. As ações liberadas são fornecer dados, baixar comprovante, baixar arquivo e verificar integridade.",
      "A tela de Fornecimento de dados abre em modo consulta para os demais perfis: eles acompanham o andamento, mas o envio é sempre do Cliente.",
      "O Cliente é pré-cadastrado pelo operador do tenant em Configurações > Usuários e papéis, na seção \"Responsáveis pelo envio de dados\": instituição e pessoa responsável já existem antes do primeiro acesso. Por isso ele entra direto na instituição dele e não aparece no simulador de perfil.",
      "Na demonstração, o Cliente é Natália Queiroz (natalia.queiroz@meridiandigital.com.br), analista de dados regulatórios da Meridian Digital Assets; no Cofre Atlântico, o responsável é Diego Vasconcelos (diego.vasconcelos@cofreatlantico.com.br).",
    ].join("\n\n"),
    relacionados: ["insumos-obrigacao", "completude-faltantes", "perfis"],
  },
  {
    id: "insumos-obrigacao",
    titulo: "Insumos exigidos por obrigação",
    categoria: "Fornecimento",
    perguntaExemplo: "Quais insumos cada obrigação exige?",
    palavrasChave: [
      "insumo",
      "insumos",
      "checklist",
      "checklist de insumos",
      "o que preciso enviar",
      "quais documentos",
      "quais dados enviar",
      "cadastro de clientes",
      "saldos de encerramento",
      "posicoes de clientes",
      "datas base",
      "staking",
      "parametros tributarios",
    ],
    resposta: [
      "Cada obrigação tem seu próprio checklist de insumos obrigatórios. Uns são arquivo, outros são formulário curto preenchido na própria plataforma.",
      "ACAM212:\n• Cadastro de clientes com KYC resolvido (arquivo).\n• Operações de câmbio com ativo virtual da competência (arquivo).\n• Saldos de encerramento da competência (arquivo).\n• Parâmetros da competência (formulário: responsável pela declaração, data do fechamento contábil, houve operação anulada, observação).",
      "Cadoc 5711:\n• Datas-base da competência (formulário: primeira e última data-base, dias úteis).\n• Posição de custódia diária por cliente (arquivo).\n• Conciliação de custódia própria e de terceiros (formulário: percentual sob custódia própria, custodiante terceiro, conciliação conferida).",
      "Cadoc 5710:\n• Inventário de carteiras e endereços por rede (arquivo).\n• Posição consolidada por ativo na data-base mensal (arquivo).\n• Declaração de staking (formulário).\n• Data-base e fonte de cotação (formulário).",
      "Fiscal / DPS:\n• Serviços prestados na competência, que viram as DPS (arquivo).\n• Parâmetros tributários da instituição (formulário: regime tributário, inscrição municipal, alíquota de ISS padrão, retenção na fonte como padrão).",
      "Cada insumo traz a sua base normativa e um texto de \"como fornecer\", com o padrão de nome do arquivo e as colunas esperadas.",
    ].join("\n\n"),
    relacionados: ["completude-faltantes", "perfil-cliente", "envio-lote"],
  },
  {
    id: "completude-faltantes",
    titulo: "Completude e o painel \"O que ainda falta\"",
    categoria: "Fornecimento",
    perguntaExemplo: "Como o sistema calcula o que ainda falta fornecer?",
    palavrasChave: [
      "completude",
      "o que falta",
      "o que ainda falta",
      "pendencia de fornecimento",
      "percentual",
      "campos faltantes",
      "contagem regressiva",
      "quanto falta",
      "faltando",
      "barra de progresso",
    ],
    resposta: [
      "A completude é calculada insumo a insumo e, nos formulários, campo a campo. Um insumo só conta como fornecido quando o último envio foi aceito e, no caso de formulário, quando todos os campos obrigatórios estão preenchidos.",
      "O percentual é a razão entre insumos obrigatórios completos e o total de insumos obrigatórios daquela obrigação. Insumos opcionais não entram na conta enquanto ninguém os envia.",
      "O painel \"O que ainda falta\" lista cada pendência com o motivo real: nenhum arquivo enviado, envio recusado na conferência de layout, envio incompleto, ou a lista nominal dos campos obrigatórios em aberto. Junto vem o texto de como fornecer aquele insumo, e clicar no item leva direto ao cartão dele no checklist.",
      "Ao lado ficam o prazo regulatório da competência e a contagem regressiva — vence hoje, faltam N dias, ou vencido há N dias. Prazo vencido ou a até 3 dias aparece em vermelho.",
      "O painel do Cliente e o distintivo no menu Fornecimento de dados usam exatamente esse mesmo cálculo, então os números nunca divergem entre as telas.",
    ].join("\n\n"),
    relacionados: ["status-canonico", "insumos-obrigacao", "prazos"],
  },
  {
    id: "status-canonico",
    titulo: "Status canônico do lote",
    categoria: "Fornecimento",
    perguntaExemplo: "O que significa o status canônico do lote?",
    palavrasChave: [
      "canonico",
      "status canonico",
      "modelo canonico",
      "modelagem",
      "modelado canonicamente",
      "completo aguardando modelagem",
      "incompleto",
      "tabela normalizada",
      "previa canonica",
      "normalizacao",
    ],
    resposta: [
      "O status canônico resume, em um único selo, o estágio do lote fornecido pelo cliente naquela competência. Ele tem três valores:",
      "• Incompleto — ainda falta ao menos um insumo obrigatório. Nada segue adiante.\n• Completo, aguardando modelagem — todos os insumos obrigatórios chegaram e a Videnas ainda não normalizou o lote.\n• Modelado canonicamente — o lote foi normalizado no modelo interno que alimenta a geração do arquivo da obrigação.",
      "Assim que a competência fica completa, a plataforma mostra a pré-visualização do modelo canônico: uma tabela normalizada, com as colunas canônicas e uma amostra dos registros, montada a partir dos insumos que o cliente forneceu.",
      "O status canônico é do lote de entrada. Ele não substitui o estado da competência (Aguardando dados, Dados recebidos, Gerado, Validada e assim por diante), que descreve o ciclo completo da obrigação.",
    ].join("\n\n"),
    relacionados: ["completude-faltantes", "estados-periodo", "etapa-geracao"],
  },
  {
    id: "lacre-prova-envio",
    titulo: "Lacre, prova de envio e prova de entrega",
    categoria: "Evidências",
    perguntaExemplo: "O que é o lacre e por que ele existe?",
    palavrasChave: [
      "lacre",
      "lacrado",
      "selar",
      "prova",
      "prova de envio",
      "prova de entrega",
      "comprovante",
      "comprovante de envio",
      "hash sha 256",
      "carimbo de tempo",
      "contestacao",
      "contestar",
      "adulterar",
      "alterar depois",
      "por que lacrar",
    ],
    resposta: [
      "Todo envio aceito gera um lacre: hash SHA-256 do conteúdo real (calculado no navegador com a Web Crypto API), data e hora, usuário, instituição, módulo e competência, mais o conteúdo guardado em um envelope cifrado em AES-GCM.",
      "Existem dois sentidos. Entrada é a prova de envio: o que o cliente forneceu. Saída é a prova de entrega: o arquivo que a Videnas liberou para a instituição, o mesmo que ela apresenta aos órgãos reguladores.",
      "O lacre protege as duas partes. Se o cliente alterar a base dele depois do envio e alegar que mandou outros valores, o hash e o carimbo de tempo provam exatamente o que foi recebido. E quando a Videnas devolve o arquivo final, o hash prova exatamente o que foi entregue, por quem e quando.",
      "Do lado do cliente, cada envio aceito rende um comprovante de envio em JSON, com o identificador do lacre, o hash, o algoritmo, o momento do selo e o responsável. O mesmo vale para os arquivos entregues, em Arquivos entregues.",
    ].join("\n\n"),
    relacionados: ["imutabilidade-encadeamento", "verificar-integridade", "cadeia-custodia"],
  },
  {
    id: "imutabilidade-encadeamento",
    titulo: "Por que o conteúdo lacrado não pode ser editado",
    categoria: "Evidências",
    perguntaExemplo: "Posso corrigir um arquivo que já enviei?",
    palavrasChave: [
      "editar envio",
      "corrigir envio",
      "sobrescrever",
      "apagar envio",
      "reenvio",
      "reenviar",
      "imutavel",
      "imutabilidade",
      "hash anterior",
      "hashanterior",
      "encadeamento",
      "encadeado",
      "versao anterior",
    ],
    resposta: [
      "Conteúdo lacrado nunca é editado nem sobrescrito. Não existe \"corrigir o arquivo enviado\": o que foi recebido permanece como foi recebido.",
      "Para corrigir, você reenvia. O reenvio cria um lacre novo, que aponta para o lacre anterior pelo campo hashAnterior — é isso que forma a cadeia. Cada elo guarda o hash do elo que veio antes, então qualquer remoção ou troca no meio da sequência quebra o encadeamento e fica evidente.",
      "A competência passa a valer pelo último lacre da cadeia, mas os anteriores continuam visíveis e auditáveis, com autor, data e hash próprios. É a mesma lógica das versões substituídas do arquivo gerado, que também permanecem na trilha.",
      "Na prática, isso significa que a linha do tempo de um insumo conta a história inteira: o que chegou primeiro, o que foi retificado, quando e por quem.",
    ].join("\n\n"),
    relacionados: ["lacre-prova-envio", "cadeia-custodia", "trilha-auditoria"],
  },
  {
    id: "verificar-integridade",
    titulo: "Verificar a integridade de um arquivo entregue",
    categoria: "Evidências",
    perguntaExemplo: "Como verifico a integridade de um arquivo entregue?",
    palavrasChave: [
      "verificar integridade",
      "integridade",
      "conferir arquivo",
      "hash confere",
      "hash nao confere",
      "recalcular hash",
      "arquivos entregues",
      "arquivo adulterado",
      "bate o hash",
      "conferencia",
    ],
    resposta: [
      "Em Arquivos entregues, cada entrega traz o hash SHA-256 do lacre e um botão Verificar integridade.",
      "Você seleciona o arquivo que está em suas mãos; a plataforma recalcula o SHA-256 no próprio navegador e compara com o hash lacrado. Nada é enviado a servidor algum — o arquivo não sai do seu dispositivo.",
      "Confere: o arquivo é byte a byte o mesmo que a Videnas entregou, e pode seguir para o regulador com segurança. Não confere: algo mudou desde a entrega, nem que seja um único byte, e o arquivo não deve ser encaminhado sem antes baixar novamente a versão lacrada.",
      "Cada verificação fica registrada com data, hora, resultado e o hash calculado. A mesma verificação existe na cadeia de custódia, em Evidências, para os perfis que a acessam.",
    ].join("\n\n"),
    relacionados: ["lacre-prova-envio", "cadeia-custodia", "envelope-kms"],
  },
  {
    id: "cadeia-custodia",
    titulo: "Cadeia de custódia (Evidências)",
    categoria: "Evidências",
    perguntaExemplo: "O que é a cadeia de custódia e quem acessa?",
    palavrasChave: [
      "cadeia de custodia",
      "custodia",
      "evidencias",
      "tela de evidencias",
      "linha do tempo",
      "entrada e saida",
      "sentido do lacre",
      "quem acessa evidencias",
      "detalhe do lacre",
    ],
    resposta: [
      "A tela Evidências reúne a cadeia de custódia completa da instituição: todos os lacres de entrada (o que o cliente forneceu) e de saída (o que a Videnas entregou), em ordem, com filtros por módulo, competência e sentido.",
      "Cada lacre abre um detalhe com o hash SHA-256 completo, o algoritmo, o identificador da chave do envelope, o autor e o perfil, a data e hora do selo, o tamanho e um resumo do conteúdo — além da linha do tempo da cadeia, ligando cada elo ao anterior pelo hashAnterior. A verificação de integridade também está disponível ali.",
      "Quem acessa: Diretor / Compliance, Executor Videnas e Validador Videnas. O Cliente não entra em Evidências — ele vê a sua parte da cadeia no comprovante de cada envio e em Arquivos entregues.",
      "É a cadeia de custódia que torna a conversa objetiva em qualquer contestação: em vez de discutir versões de planilha, compara-se hash com hash.",
    ].join("\n\n"),
    relacionados: ["lacre-prova-envio", "imutabilidade-encadeamento", "trilha-auditoria"],
  },
  {
    id: "envelope-kms",
    titulo: "Envelope cifrado: a ressalva da chave simulada",
    categoria: "Evidências",
    perguntaExemplo: "A criptografia do envelope é real?",
    palavrasChave: [
      "criptografia",
      "cifrado",
      "envelope",
      "envelope cifrado",
      "aes",
      "aes-gcm",
      "chave",
      "chave simulada",
      "kms",
      "hsm",
      "web crypto",
      "seguranca do lacre",
      "producao",
    ],
    resposta: [
      "A criptografia é real e roda no navegador pela Web Crypto API: crypto.subtle.digest para o hash SHA-256 e AES-GCM para o envelope que guarda o conteúdo lacrado.",
      "A ressalva é a chave. Nesta demonstração ela é derivada localmente no navegador a partir do identificador da instituição, e nada sai do dispositivo. Em produção, essa chave é gerada e custodiada em KMS/HSM, com rotação, segregação por tenant e registro de uso — o conteúdo lacrado nunca fica legível para quem não tem a chave.",
      "O aviso aparece na própria interface, junto do comprovante de envio e do detalhe do lacre, para que ninguém confunda a demonstração com o desenho de produção.",
      "Se o navegador não expuser a Web Crypto API (por exemplo fora de HTTPS), a plataforma bloqueia o envio e explica o motivo, em vez de gravar um lacre sem garantia criptográfica.",
    ].join("\n\n"),
    relacionados: ["lacre-prova-envio", "verificar-integridade", "cadeia-custodia"],
  },
  {
    id: "tutorial-ajuda",
    titulo: "Tutorial guiado e ajuda",
    categoria: "Plataforma",
    perguntaExemplo: "Como reabro o tutorial guiado?",
    palavrasChave: [
      "tutorial",
      "tour",
      "guiado",
      "onboarding",
      "ajuda",
      "rever tutorial",
      "botao flutuante",
      "passo a passo",
    ],
    resposta: [
      "O tutorial guiado é um tour com destaque nos elementos da tela, montado sob medida para cada perfil: ele segue a jornada de quem usa aquele papel no dia a dia.",
      "Ele é oferecido na primeira visita e sempre que você troca de perfil. Depois disso, pode ser reaberto a qualquer momento pelo botão flutuante de ajuda, no canto inferior direito, em \"Ver tutorial guiado\".",
      "Durante o tour: seta direita ou Enter avança, seta esquerda volta e Esc encerra. O botão \"Pular tutorial\" encerra a qualquer momento.",
    ].join("\n\n"),
    relacionados: ["perfis", "plataforma", "etapas"],
  },
];

const INDICE_TOPICOS = new Map(TOPICOS_ASSISTENTE.map((topico) => [topico.id, topico]));

export function buscarTopico(id: string): TopicoAssistente | undefined {
  return INDICE_TOPICOS.get(id);
}

const IDS_PERGUNTAS_RAPIDAS = [
  "etapas",
  "envio-lote",
  "prazos",
  "perfis",
  "nao-conformidades",
  "modulo-fiscal",
  "completude-faltantes",
  "lacre-prova-envio",
];

export const PERGUNTAS_RAPIDAS: PerguntaRapida[] = IDS_PERGUNTAS_RAPIDAS.flatMap((id) => {
  const topico = INDICE_TOPICOS.get(id);
  if (!topico) return [];
  return [{ id: topico.id, rotulo: topico.titulo, pergunta: topico.perguntaExemplo }];
});

const PALAVRAS_IGNORADAS = new Set([
  "para",
  "como",
  "onde",
  "quando",
  "quem",
  "qual",
  "quais",
  "que",
  "com",
  "sem",
  "por",
  "pelo",
  "pela",
  "uma",
  "uns",
  "umas",
  "dos",
  "das",
  "nos",
  "nas",
  "sobre",
  "isso",
  "essa",
  "esse",
  "este",
  "esta",
  "meu",
  "minha",
  "seu",
  "sua",
  "eu",
  "voce",
  "tem",
  "ter",
  "fazer",
  "faco",
  "posso",
  "pode",
  "preciso",
  "quero",
  "saber",
  "explique",
  "explicar",
  "diga",
  "fala",
  "aqui",
  "mais",
  "muito",
  "entao",
  "ainda",
  "nao",
  "sim",
  "the",
]);

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .split(" ")
    .filter((token) => token.length > 0)
    .filter((token) => !PALAVRAS_IGNORADAS.has(token))
    .filter((token) => token.length > 2 || /\d/.test(token));
}

function pontuar(topico: TopicoAssistente, perguntaNormalizada: string, tokens: string[]): number {
  let pontos = 0;

  for (const chave of topico.palavrasChave) {
    const chaveNormalizada = normalizar(chave);
    if (chaveNormalizada.length === 0) continue;

    const palavras = chaveNormalizada.split(" ");
    if (palavras.length > 1) {
      if (perguntaNormalizada.includes(chaveNormalizada)) {
        pontos += 4 * palavras.length;
      }
      continue;
    }

    if (tokens.includes(chaveNormalizada)) {
      pontos += 4;
      continue;
    }

    if (chaveNormalizada.length >= 5) {
      const raiz = chaveNormalizada.slice(0, 5);
      if (tokens.some((token) => token.length >= 5 && token.startsWith(raiz))) {
        pontos += 2;
      }
    }
  }

  for (const token of tokenizar(topico.titulo)) {
    if (tokens.includes(token)) {
      pontos += 1;
    }
  }

  return pontos;
}

const PONTUACAO_MINIMA = 4;
const PONTUACAO_ALTA_CONFIANCA = 8;

const TEXTO_SEM_RESPOSTA = [
  "Não encontrei isso na minha base de conhecimento.",
  "Esta demonstração cobre os módulos ACAM212, Cadoc 5711, Cadoc 5710 e Fiscal/DPS, as etapas Ingestão > Geração > Validação > Auditoria > Entrega, prazos regulatórios, envio de lote e não conformidades, pendências e exceções, perfis de usuário e seleção de instituição, o fornecimento de dados por checklist de insumos (completude, status canônico do lote) e a cadeia de custódia criptográfica (lacre, prova de envio, prova de entrega e verificação de integridade).",
  "Tente reformular com uma dessas palavras, ou escolha uma das perguntas sugeridas abaixo.",
].join("\n\n");

function sugestoesDe(topico: TopicoAssistente): string[] {
  const sugestoes = topico.relacionados.flatMap((id) => {
    const relacionado = INDICE_TOPICOS.get(id);
    return relacionado ? [relacionado.perguntaExemplo] : [];
  });
  return sugestoes.slice(0, 3);
}

function sugestoesPadrao(): string[] {
  return PERGUNTAS_RAPIDAS.slice(0, 3).map((item) => item.pergunta);
}

export async function responder(pergunta: string): Promise<RespostaAssistente> {
  const perguntaNormalizada = normalizar(pergunta);

  if (perguntaNormalizada.length === 0) {
    return {
      topicoId: null,
      titulo: "Faça uma pergunta",
      texto: "Digite uma dúvida sobre a plataforma ou escolha uma das perguntas sugeridas.",
      confianca: "baixa",
      sugestoes: sugestoesPadrao(),
    };
  }

  const tokens = tokenizar(pergunta);

  let melhorTopico: TopicoAssistente | null = null;
  let melhorPontuacao = 0;

  for (const topico of TOPICOS_ASSISTENTE) {
    const pontuacao = pontuar(topico, perguntaNormalizada, tokens);
    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao;
      melhorTopico = topico;
    }
  }

  if (!melhorTopico || melhorPontuacao < PONTUACAO_MINIMA) {
    return {
      topicoId: null,
      titulo: "Não encontrei esse assunto",
      texto: TEXTO_SEM_RESPOSTA,
      confianca: "baixa",
      sugestoes: sugestoesPadrao(),
    };
  }

  return {
    topicoId: melhorTopico.id,
    titulo: melhorTopico.titulo,
    texto: melhorTopico.resposta,
    confianca: melhorPontuacao >= PONTUACAO_ALTA_CONFIANCA ? "alta" : "media",
    sugestoes: sugestoesDe(melhorTopico),
  };
}
