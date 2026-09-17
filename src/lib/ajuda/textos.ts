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
  "nav.fornecimento": {
    titulo: "Fornecimento de dados",
    pergunta: "O que há em Fornecimento de dados?",
    descricao:
      "É a sua central de entrega para a Videnas. Reúne, competência a competência, tudo o que a instituição precisa fornecer em cada obrigação: quais arquivos e formulários faltam, até quando, e o que já foi recebido. Cada envio sai daqui lacrado, com data, hora e autor registrados.",
  },
  "nav.entregas": {
    titulo: "Entregas",
    pergunta: "O que há em Entregas?",
    descricao:
      "Os arquivos que a Videnas devolveu à instituição depois de gerados e validados. Cada entrega traz o hash do arquivo e o comprovante de saída, para que você consiga provar, a qualquer momento, exatamente qual versão recebeu e quando.",
  },
  "nav.evidencias": {
    titulo: "Evidências",
    pergunta: "O que há em Evidências?",
    descricao:
      "A cadeia de custódia completa da operação: todos os lacres de entrada e de saída, por instituição, obrigação e competência. É a área usada pelos times Videnas e pelo Diretor da instituição para responder a qualquer questionamento sobre o que foi enviado e o que foi devolvido.",
  },

  "fornecimento.checklist": {
    titulo: "Checklist de fornecimento",
    pergunta: "Como funciona o checklist da competência?",
    descricao:
      "Cada obrigação tem um conjunto fixo de insumos — arquivos e formulários — que precisam chegar à Videnas para que a competência possa ser gerada. O checklist mostra item a item o que já foi fornecido, o que está pendente e como fornecer cada coisa, sem depender de troca de e-mails.",
  },
  "fornecimento.insumo": {
    titulo: "Insumo",
    pergunta: "O que é um insumo?",
    descricao:
      "É cada peça de dado de origem que a instituição fornece para uma obrigação: um arquivo exportado do sistema da casa ou um formulário preenchido na plataforma. Todo insumo traz a descrição do que a Videnas espera, o formato aceito e a base normativa que justifica a exigência.",
  },
  "fornecimento.formulario": {
    titulo: "Insumo do tipo formulário",
    pergunta: "Por que alguns insumos são formulários?",
    descricao:
      "Nem tudo cabe num arquivo. Parâmetros como regime tributário, data-base adotada, fonte de cotação ou responsável pela declaração são informações pontuais que a Videnas precisa registrar de forma estruturada. Ao salvar, os valores são lacrados junto com os arquivos e passam a constar do comprovante de envio.",
  },
  "fornecimento.completude": {
    titulo: "Completude da competência",
    pergunta: "O que o percentual de completude mede?",
    descricao:
      "A proporção de insumos obrigatórios já fornecidos em relação ao total exigido pela obrigação. Um formulário só conta como fornecido quando todos os seus campos obrigatórios estão preenchidos. Enquanto a completude não chega a 100%, a Videnas não consegue modelar os dados nem gerar o arquivo.",
  },
  "fornecimento.faltantes": {
    titulo: "O que ainda falta",
    pergunta: "Como sei exatamente o que falta fornecer?",
    descricao:
      "A lista de pendências aponta o insumo, o motivo (não enviado, envio recusado ou campos obrigatórios em branco) e a instrução de como fornecer. No caso de formulários, os campos faltantes aparecem pelo nome, para que você saiba o que preencher sem precisar abrir cada tela.",
  },
  "fornecimento.prazo": {
    titulo: "Prazo de fornecimento",
    pergunta: "Até quando preciso fornecer os dados?",
    descricao:
      "O prazo mostrado é a data-limite regulatória da entrega da competência. A Videnas ainda precisa gerar, validar e liberar o arquivo depois que os dados chegam, por isso fornecer com antecedência é o que garante folga para corrigir qualquer inconsistência antes do vencimento.",
  },
  "fornecimento.canonico": {
    titulo: "Modelagem canônica",
    pergunta: "O que é a modelagem canônica?",
    descricao:
      "É a tradução dos seus arquivos e formulários para o modelo de dados único da Videnas: colunas com nomes estáveis, tipos normalizados e chave por registro. É esse modelo canônico — e não o arquivo bruto — que alimenta a geração no schema oficial de cada obrigação.",
  },
  "fornecimento.statusCanonico": {
    titulo: "Status do lote canônico",
    pergunta: "O que significam os status do lote?",
    descricao:
      "Incompleto: ainda falta insumo obrigatório e nada pode ser modelado. Completo — aguardando modelagem: tudo chegou e a Videnas ainda vai normalizar os dados. Modelado canonicamente: os dados já estão no modelo único e prontos para a geração do arquivo da obrigação.",
  },

  "evidencia.lacre": {
    titulo: "Lacre criptográfico",
    pergunta: "O que é o lacre e para que ele serve?",
    descricao:
      "Todo dado que entra e todo arquivo que sai recebe um lacre: uma impressão digital criptográfica do conteúdo, somada a data, hora, autor e perfil de quem executou a ação. O lacre protege as duas partes numa contestação — prova o que o cliente enviou e prova o que a Videnas devolveu. Se a base de origem for alterada depois, o hash deixa de bater e a divergência fica evidente.",
  },
  "evidencia.hash": {
    titulo: "Hash SHA-256",
    pergunta: "O que é o hash do arquivo?",
    descricao:
      "Um código de 64 caracteres calculado a partir do conteúdo do arquivo. Basta um único byte diferente para o hash mudar por completo, e não é possível partir do hash e reconstruir o arquivo. É por isso que ele serve como prova de que um arquivo é exatamente aquele que foi lacrado.",
  },
  "evidencia.encadeamento": {
    titulo: "Encadeamento de lacres",
    pergunta: "Por que um lacre aponta para o anterior?",
    descricao:
      "Cada novo lacre de um mesmo insumo guarda o hash do lacre anterior, formando uma corrente. Reenvios não apagam o histórico: eles se somam a ele. Remover ou adulterar um elo no meio quebra a corrente e fica visível na cadeia de custódia.",
  },
  "evidencia.envelope": {
    titulo: "Envelope cifrado",
    pergunta: "O conteúdo fica protegido como?",
    descricao:
      "Além do hash, o conteúdo é guardado dentro de um envelope cifrado com AES-GCM de 256 bits, usando um vetor de inicialização próprio para cada lacre. Nesta demonstração, a chave é derivada localmente no seu navegador a partir do identificador da instituição e nada sai do dispositivo. Em produção, essa chave é gerada e custodiada em KMS/HSM, com rotação, segregação por instituição e registro de cada uso — quem não tem a chave nunca lê o conteúdo lacrado.",
  },
  "evidencia.comprovanteEnvio": {
    titulo: "Comprovante de envio",
    pergunta: "O que vem no comprovante de envio?",
    descricao:
      "Um arquivo JSON legível com o identificador do lacre, a instituição, a obrigação, a competência, quem enviou, a data e a hora, o hash do conteúdo e o hash do lacre anterior. É o documento que a instituição guarda para comprovar o que foi fornecido à Videnas naquela competência.",
  },
  "evidencia.comprovanteEntrega": {
    titulo: "Comprovante de entrega",
    pergunta: "O que o comprovante de entrega prova?",
    descricao:
      "Prova qual arquivo a Videnas disponibilizou à instituição, com hash, data, hora e nome de quem liberou. Junto com o comprovante de envio, ele fecha o ciclo: mostra o que entrou, o que saiu e que nenhuma das duas pontas foi alterada depois.",
  },
  "evidencia.verificarIntegridade": {
    titulo: "Verificar integridade",
    pergunta: "Como confirmo que um arquivo não foi alterado?",
    descricao:
      "Selecione o arquivo que você tem em mãos e a plataforma recalcula o hash SHA-256 dele no seu próprio navegador, comparando com o hash registrado no lacre. Conferindo, é o mesmo arquivo, byte a byte. Não conferindo, o arquivo sofreu alguma alteração depois do lacre e a verificação fica registrada.",
  },
  "evidencia.cadeiaCustodia": {
    titulo: "Cadeia de custódia",
    pergunta: "O que é a cadeia de custódia?",
    descricao:
      "A linha do tempo completa dos lacres de uma obrigação: cada entrada de dado do cliente e cada saída de arquivo da Videnas, em ordem, com autor, perfil, data, hora e hash. É a evidência usada quando alguém contesta o que foi informado — ela protege as duas partes, porque mostra tanto o que o cliente enviou quanto o que a Videnas devolveu.",
  },

  "entrega.arquivosEntregues": {
    titulo: "Arquivos entregues",
    pergunta: "O que aparece em arquivos entregues?",
    descricao:
      "Cada arquivo que a Videnas liberou para a instituição, com versão, formato, tamanho, quantidade de registros e o hash do lacre de saída. Ao baixar, você pode conferir a integridade na hora e guardar o comprovante de entrega junto com o arquivo.",
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
