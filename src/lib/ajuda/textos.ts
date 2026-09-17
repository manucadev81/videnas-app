import type { EstadoPeriodo, EtapaId, ModuloId } from "@/lib/tipos";

export interface TextoAjuda {
  titulo: string;
  pergunta?: string;
  descricao: string;
}

export const TEXTOS_AJUDA = {
  "modulo.acam212": {
    titulo: "ACAM212 (C212)",
    pergunta: "O que é a obrigação ACAM212?",
    descricao:
      "Declaração mensal ao Banco Central do Brasil das operações de câmbio com ativos virtuais, no schema oficial ACAM212 2.1. O prazo de entrega é o dia 10 de cada mês. O período percorre ingestão, geração, validação, auditoria e entrega.",
  },
  "modulo.cadoc5711": {
    titulo: "Cadoc 5711 (5711)",
    pergunta: "O que é a obrigação Cadoc 5711?",
    descricao:
      "Posição diária de custódia por cliente, consolidada e enviada mensalmente ao Banco Central no schema CADOC5711 1.4. O prazo de entrega é o dia 15. Cada data-base da competência precisa estar presente no arquivo recebido.",
  },
  "modulo.cadoc5710": {
    titulo: "Cadoc 5710 (5710)",
    pergunta: "O que é a obrigação Cadoc 5710?",
    descricao:
      "Posição mensal de custódia agregada por carteira ou endereço, incluindo saldo em staking, entregue ao Banco Central no schema CADOC5710 1.4. O prazo de entrega é o dia 20 de cada mês.",
  },
  "modulo.fiscal": {
    titulo: "Fiscal (DPS)",
    pergunta: "O que é o módulo Fiscal?",
    descricao:
      "Estruturação da Declaração de Prestação de Serviços (NFS-e / DPS) para conferência do contador antes do encaminhamento ao emissor definido pelo cliente. O prazo é o dia 5 e é o único módulo com etapa de Contador. Está marcado como candidato: o escopo ainda está em validação com o cliente.",
  },

  "etapa.ingestao": {
    titulo: "Etapa Ingestão",
    pergunta: "O que é a etapa Ingestão?",
    descricao:
      "Recepção dos arquivos de origem da competência. Cada arquivo é lido e conferido contra o layout da obrigação antes de entrar no período. O lote só passa a contar para a competência depois do aceite explícito do operador.",
  },
  "etapa.geracao": {
    titulo: "Etapa Geração",
    pergunta: "O que é a etapa Geração?",
    descricao:
      "O Executor Videnas monta o arquivo no schema oficial a partir dos lotes aceitos na ingestão. Sem nenhum lote recebido a geração fica indisponível. Quem gera nunca libera o arquivo: a segregação de funções é obrigatória.",
  },
  "etapa.contador": {
    titulo: "Etapa Contador",
    pergunta: "O que é a etapa Contador?",
    descricao:
      "Existe apenas no módulo Fiscal. O contador confere alíquota, retenção e enquadramento tributário da DPS estruturada. Ele pode confirmar o enquadramento e seguir para validação ou devolver o período para correção.",
  },
  "etapa.validacao": {
    titulo: "Etapa Validação",
    pergunta: "O que é a etapa Validação?",
    descricao:
      "O Validador Videnas confere o arquivo gerado contra o schema oficial da obrigação. Se aparecerem não conformidades, o período vai para Com exceções e as bloqueantes precisam ser tratadas antes de reprocessar. Aprovada a validação, o arquivo é liberado para o cliente.",
  },
  "etapa.auditoria": {
    titulo: "Etapa Auditoria",
    pergunta: "O que é a etapa Auditoria?",
    descricao:
      "Trilha imutável de tudo que aconteceu no período: quem executou cada ação, com qual perfil e em que momento. É a evidência usada para responder ao Banco Central e pode ser exportada em CSV.",
  },
  "etapa.entrega": {
    titulo: "Etapa Entrega",
    pergunta: "O que é a etapa Entrega?",
    descricao:
      "Fecha o ciclo depois da aprovação do Diretor. Nas obrigações do Banco Central, registra-se o protocolo devolvido pelo órgão; no módulo Fiscal, marca-se o encaminhamento ao emissor. Um retorno com erro reabre o período para correção.",
  },

  "estado.aguardando_dados": {
    titulo: "Aguardando dados",
    pergunta: "O que significa o status Aguardando dados?",
    descricao:
      "Nenhum lote foi aceito nesta competência ainda. O time Operacional da instituição precisa enviar os arquivos de origem para que a obrigação avance. Enquanto isso, a geração do arquivo fica indisponível.",
  },
  "estado.dados_ingeridos": {
    titulo: "Dados recebidos",
    pergunta: "O que significa o status Dados recebidos?",
    descricao:
      "Pelo menos um lote foi conferido e aceito na competência. O Executor Videnas já pode gerar o arquivo no schema oficial. Novos lotes ainda podem ser enviados enquanto o período não é gerado.",
  },
  "estado.gerado": {
    titulo: "Arquivo gerado",
    pergunta: "O que significa o status Arquivo gerado?",
    descricao:
      "O arquivo foi montado no schema oficial a partir dos lotes aceitos. Nas obrigações do Banco Central ele segue para validação; no módulo Fiscal, vai antes para a conferência do contador.",
  },
  "estado.aguardando_contador": {
    titulo: "Aguardando contador",
    pergunta: "O que significa o status Aguardando contador?",
    descricao:
      "Status exclusivo do módulo Fiscal. A DPS foi estruturada e aguarda o contador confirmar alíquota, retenção e enquadramento tributário. Ele também pode devolver o período para correção antes da validação.",
  },
  "estado.em_validacao": {
    titulo: "Em validação",
    pergunta: "O que significa o status Em validação?",
    descricao:
      "O Validador Videnas está conferindo o arquivo contra o schema oficial da obrigação. Nesta fase ainda é possível tratar exceções abertas. Quem gerou o arquivo não pode liberá-lo.",
  },
  "estado.validado": {
    titulo: "Validado",
    pergunta: "O que significa o status Validado?",
    descricao:
      "O arquivo passou na validação de schema sem pendências bloqueantes. Falta o Validador liberá-lo para o cliente, o que habilita a aprovação pelo Diretor.",
  },
  "estado.com_excecoes": {
    titulo: "Com exceções",
    pergunta: "O que significa o status Com exceções?",
    descricao:
      "A validação apontou não conformidades no arquivo. As exceções bloqueantes precisam ser tratadas antes de reprocessar a validação; as de aviso apenas sinalizam risco. Também é possível gerar o arquivo novamente após corrigir a origem.",
  },
  "estado.liberado": {
    titulo: "Liberado",
    pergunta: "O que significa o status Liberado?",
    descricao:
      "O Validador Videnas liberou o arquivo para a instituição. Agora o Diretor precisa aprovar, assumindo a responsabilidade pela entrega perante o Banco Central.",
  },
  "estado.aprovado": {
    titulo: "Aprovado",
    pergunta: "O que significa o status Aprovado?",
    descricao:
      "O Diretor aprovou o arquivo e assumiu a responsabilidade pela obrigação. Falta registrar o protocolo do Banco Central ou, no módulo Fiscal, marcar o encaminhamento ao emissor.",
  },
  "estado.entregue": {
    titulo: "Entregue",
    pergunta: "O que significa o status Entregue?",
    descricao:
      "A obrigação foi cumprida na competência e o comprovante está registrado na trilha de auditoria. Se o órgão devolver o arquivo com erro, o período passa para Retorno com erro.",
  },
  "estado.retorno_com_erro": {
    titulo: "Retorno com erro",
    pergunta: "O que significa o status Retorno com erro?",
    descricao:
      "O órgão destinatário recusou o arquivo entregue. O período precisa ser reaberto para correção, o que devolve a obrigação para a etapa de dados recebidos. O prazo regulatório continua contando.",
  },

  "painel.prazos": {
    titulo: "Próximos prazos regulatórios",
    pergunta: "O que mostra a seção Próximos prazos regulatórios?",
    descricao:
      "Lista os períodos ainda não entregues, ordenados pelo prazo mais próximo. Cada obrigação tem seu próprio vencimento mensal: Fiscal no dia 5, ACAM212 no dia 10, Cadoc 5711 no dia 15 e Cadoc 5710 no dia 20.",
  },
  "painel.excecoes": {
    titulo: "Pendências e exceções",
    pergunta: "O que mostra a seção Pendências e exceções?",
    descricao:
      "Reúne as não conformidades abertas ou em tratamento nas obrigações do seu escopo. Exceções bloqueantes impedem o período de avançar até serem resolvidas; as de aviso apenas sinalizam risco e não travam o fluxo.",
  },

  "recepcao.layout": {
    titulo: "Layout esperado do arquivo",
    pergunta: "O que é o layout esperado do arquivo?",
    descricao:
      "É o contrato de dados da obrigação: as colunas aceitas, quais são obrigatórias, os formatos de arquivo e os delimitadores permitidos. A ausência de qualquer coluna obrigatória bloqueia o aceite do lote. O modelo em CSV já vem com o cabeçalho e o nome corretos.",
  },
  "recepcao.envio": {
    titulo: "Envio de arquivos",
    pergunta: "Como funciona o envio de arquivos?",
    descricao:
      "Cada arquivo é lido no próprio navegador e conferido contra o layout antes de entrar na competência. O nome deve seguir o padrão {modulo}_{instituicao}_{AAAAMM}.{extensao}, e cada obrigação aceita apenas suas extensões (CSV ou TXT nas obrigações do Banco Central, CSV ou XLSX no Fiscal). A pré-visualização abre no ato do envio e nada é registrado sem o seu aceite.",
  },
  "recepcao.tabela": {
    titulo: "Arquivos recebidos",
    pergunta: "O que mostra a tabela Arquivos recebidos?",
    descricao:
      "Reúne tudo que passou pela conferência desta competência: os lotes aceitos e também os arquivos recusados, com tamanho, momento da recepção e canal de origem. Apenas os lotes aceitos alimentam a geração do arquivo da obrigação.",
  },
  "recepcao.status": {
    titulo: "Coluna Status dos arquivos",
    pergunta: "O que significam os status da coluna Status?",
    descricao:
      "Aceito é o lote conforme, sem ressalvas. Aceito com ressalvas entrou na competência mas acumulou avisos de código ING-A, que não travam o fluxo. Não conforme reúne os arquivos com não conformidades bloqueantes de código ING-E, que nunca entram na competência. Rejeitado pelo operador é o arquivo conforme que você recusou na conferência.",
  },

  "nav.dashboard": {
    titulo: "Dashboard",
    pergunta: "O que é o Dashboard?",
    descricao:
      "Visão consolidada da competência corrente: um card por obrigação contratada, prazos mais próximos, pendências abertas e os últimos eventos de auditoria. É o ponto de partida para abrir qualquer período.",
  },
  "nav.acam212": {
    titulo: "ACAM212",
    pergunta: "O que há na área ACAM212?",
    descricao:
      "Área da declaração mensal de operações de câmbio com ativos virtuais ao Banco Central, com prazo no dia 10. Reúne os períodos por competência e todo o fluxo de ingestão, geração, validação, auditoria e entrega.",
  },
  "nav.cadoc": {
    titulo: "Cadoc 5710/5711",
    pergunta: "O que há na área Cadoc 5710/5711?",
    descricao:
      "Área das duas obrigações de custódia junto ao Banco Central: a 5711, com posição diária por cliente e prazo no dia 15, e a 5710, com posição mensal por carteira e prazo no dia 20.",
  },
  "nav.fiscal": {
    titulo: "Fiscal",
    pergunta: "O que há na área Fiscal?",
    descricao:
      "Área da Declaração de Prestação de Serviços (NFS-e / DPS), com prazo no dia 5 e uma etapa extra de conferência pelo contador. É o único módulo marcado como candidato, com escopo ainda em validação com o cliente.",
  },
  "nav.calendario": {
    titulo: "Calendário",
    pergunta: "O que há no Calendário?",
    descricao:
      "Mostra todos os vencimentos regulatórios das obrigações do seu escopo, mês a mês, com destaque para o que está atrasado. Cada prazo leva direto ao período correspondente.",
  },
  "nav.auditoria": {
    titulo: "Auditoria",
    pergunta: "O que há na Auditoria?",
    descricao:
      "Trilha completa de eventos da plataforma: quem fez o quê, com qual perfil, em qual período e quando. Serve como evidência de conformidade e pode ser exportada em CSV.",
  },
  "nav.operacao": {
    titulo: "Operação",
    pergunta: "O que há na área Operação?",
    descricao:
      "Fila de trabalho dos perfis Videnas, visível apenas para Executor e Validador. Reúne os períodos de todas as instituições atendidas que aguardam geração, validação ou liberação.",
  },
  "nav.configuracoes": {
    titulo: "Configurações",
    pergunta: "O que há em Configurações?",
    descricao:
      "Dados da instituição, usuários e dicionários usados na ingestão e na geração dos arquivos. O que você consegue editar depende do seu perfil: só o Diretor administra instituição e usuários.",
  },
} as const satisfies Record<string, TextoAjuda>;

export type ChaveAjuda = keyof typeof TEXTOS_AJUDA;

export function buscarAjuda(chave: ChaveAjuda): TextoAjuda {
  return TEXTOS_AJUDA[chave];
}

export function chaveAjudaModulo(moduloId: ModuloId): ChaveAjuda {
  return `modulo.${moduloId}`;
}

export function chaveAjudaEtapa(etapaId: EtapaId): ChaveAjuda {
  return `etapa.${etapaId}`;
}

export function chaveAjudaEstado(estado: EstadoPeriodo): ChaveAjuda {
  return `estado.${estado}`;
}
