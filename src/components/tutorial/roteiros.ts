import type { PerfilId } from "@/lib/tipos";

export type PosicaoTour = "top" | "bottom" | "left" | "right" | "auto";

export interface AcaoSugeridaTour {
  seletor: string;
}

export interface PassoTour {
  id: string;
  titulo: string;
  descricao: string;
  seletor: string;
  rota?: string;
  posicao?: PosicaoTour;
  acaoSugerida?: AcaoSugeridaTour;
}

const PASSOS_OPERACIONAL: PassoTour[] = [
  {
    id: "operacional-boas-vindas",
    titulo: "Bem-vinda, Operacional / Suporte ao cliente",
    descricao:
      "Este tour mostra a jornada de quem apoia o cliente no fornecimento das competências. Quem sobe os dados é sempre o Cliente / Fornecedor de dados — você acompanha, orienta e cobra. A qualquer momento você pode trocar de visão pelo seletor de perfil aqui no header — hoje ele está fixado em Operacional / Suporte ao cliente para esta demonstração.",
    seletor: '[data-tour="seletor-perfil"]',
    rota: "/app",
    posicao: "bottom",
  },
  {
    id: "operacional-dashboard-pendencias",
    titulo: "O que está pendente",
    descricao:
      "Os cards por módulo mostram a competência corrente de cada obrigação, o estado atual e um mini-stepper das 5 etapas. Quando algo está atrasado, o card e o badge ficam vermelhos — é o primeiro lugar para checar o que precisa da sua atenção.",
    seletor: '[data-tour="dashboard-cards-modulo"]',
    rota: "/app",
    posicao: "top",
  },
  {
    id: "operacional-navegar-modulo",
    titulo: "Entrar em um módulo",
    descricao:
      "Use a barra lateral para entrar em ACAM212, Cadoc 5711/5710 ou Fiscal. Cada módulo tem sua própria lista de competências, uma por mês.",
    seletor: '[data-tour="nav-acam212"]',
    rota: "/app",
    posicao: "right",
  },
  {
    id: "operacional-periodo-aguardando",
    titulo: "Competência aguardando dados",
    descricao:
      "Setembro/2026 do ACAM212 ainda está em branco — o Cliente ainda não forneceu nenhum insumo. Sem dados fornecidos por ele, o Executor da Videnas não tem o que gerar; seu papel aqui é acompanhar esse fornecimento e cobrar o cliente quando algo atrasar.",
    seletor: '[data-tour="periodo-cabecalho"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "bottom",
  },
  {
    id: "operacional-stepper",
    titulo: "As 5 etapas da obrigação",
    descricao:
      "Ingestão → Geração → Validação → Auditoria → Entrega. Quem alimenta a Ingestão é sempre o Cliente / Fornecedor de dados; você acompanha esse fornecimento e trata as exceções que aparecerem. As demais etapas são conduzidas pelo time da Videnas e ficam visíveis aqui para acompanhamento.",
    seletor: '[data-tour="stepper-etapas"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "bottom",
  },
  {
    id: "operacional-acompanhamento",
    titulo: "Acompanhe o fornecimento do cliente",
    descricao:
      "Como você não sobe dados em nome do cliente, esta é a sua tela na etapa Ingestão: completude da competência, o checklist de insumos exigidos × já fornecidos, o que ainda falta e as evidências de entrada já lacradas por quem enviou.",
    seletor: '[data-tour="acompanhamento-fornecimento"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "top",
  },
  {
    id: "operacional-notificar-cliente",
    titulo: "Cobre o que falta",
    descricao:
      "O botão \"Notificar cliente do que falta\" registra um evento na trilha de auditoria — é o seu jeito de cobrar prazo sem precisar sair da plataforma nem subir nada em nome do cliente. Ele fica desabilitado quando não há pendência para cobrar.",
    seletor: '[data-tour="acompanhamento-notificar-cliente"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "bottom",
  },
  {
    id: "operacional-tabela-arquivos",
    titulo: "Histórico de arquivos recebidos",
    descricao:
      "Esta tabela lista somente os lotes que o Cliente enviou e que entraram nesta competência — arquivo, tamanho, data de recebimento, canal e o status Aceito. A conferência de formato e de layout acontece no ato do envio, na tela do Cliente; nada que não tenha sido aceito por ele chega até aqui. Quando a tabela está vazia, é porque o Cliente ainda não forneceu os dados desta competência.",
    seletor: '[data-tour="recepcao-tabela-arquivos"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "top",
  },
];

const PASSOS_CLIENTE: PassoTour[] = [
  {
    id: "cliente-boas-vindas",
    titulo: "Bem-vinda, Cliente / Fornecedora de dados",
    descricao:
      "Aqui no topo fica a sua identidade: nome, instituição e papel. Você foi cadastrada previamente pelo operador do tenant, já vinculada a esta instituição — por isso entra direto nela, sem tela de seleção. Seu papel é fornecer os dados de origem de cada obrigação, o combustível de todo o resto: você não gera nem valida arquivos, isso é da Videnas. O Operacional da sua instituição não sobe dados por você — ele só acompanha o que você já forneceu e cobra o que falta. Por isso sua superfície é enxuta de propósito — fornecer, acompanhar o que falta e retirar os arquivos lacrados.",
    seletor: '[data-tour="identidade-usuario"]',
    rota: "/app",
    posicao: "bottom",
  },
  {
    id: "cliente-dashboard-fornecimento",
    titulo: "O que a Videnas espera de você hoje",
    descricao:
      "O card \"Dados a fornecer\" reúne as competências abertas que ainda dependem de algum insumo seu: módulo, competência, quantos insumos faltam e quanto tempo resta até o prazo regulatório. Quando a contagem fica vermelha, o prazo está vencido ou vence em até 3 dias.",
    seletor: '[data-tour="dashboard-fornecimento"]',
    rota: "/app",
    posicao: "top",
  },
  {
    id: "cliente-menu-fornecimento",
    titulo: "Fornecimento de dados",
    descricao:
      "Este é o seu item de menu principal. O distintivo ao lado do nome conta quantas competências ainda têm pendência — ele some sozinho quando tudo é entregue.",
    seletor: '[data-tour="nav-fornecimento"]',
    rota: "/app",
    posicao: "right",
  },
  {
    id: "cliente-completude",
    titulo: "Completude da competência",
    descricao:
      "Aqui a plataforma mede insumo a insumo, e campo a campo nos formulários, quanto da competência já foi fornecido. O selo à direita mostra o status canônico do lote: Incompleto, Completo aguardando modelagem ou Modelado canonicamente. Ao lado ficam o prazo regulatório e a contagem regressiva.",
    seletor: '[data-tour="fornecimento-completude"]',
    rota: "/app/fornecimento",
    posicao: "bottom",
  },
  {
    id: "cliente-faltantes",
    titulo: "O que ainda falta",
    descricao:
      "Este painel não diz apenas que falta algo: diz exatamente o quê, por quê e como fornecer. Em formulários ele lista os campos obrigatórios em aberto, um a um. Clicar em um item leva direto ao insumo correspondente no checklist abaixo.",
    seletor: '[data-tour="fornecimento-faltantes"]',
    rota: "/app/fornecimento",
    posicao: "top",
  },
  {
    id: "cliente-insumo",
    titulo: "Checklist de insumos e o lacre do envio",
    descricao:
      "Cada obrigação tem seu próprio checklist: uns insumos são arquivo, outros são formulário curto. No envio de arquivo você confere a pré-visualização e aceita explicitamente. Todo envio aceito é lacrado no ato — hash SHA-256 do conteúdo real, data, hora, seu nome e a instituição — e você baixa o comprovante de envio em JSON. Conteúdo lacrado nunca é editado: reenviar cria um lacre novo, encadeado ao anterior.",
    seletor: '[data-tour="fornecimento-insumo"]',
    rota: "/app/fornecimento",
    posicao: "top",
  },
  {
    id: "cliente-entregas",
    titulo: "Arquivos entregues pela Videnas",
    descricao:
      "Quando a Videnas libera o arquivo final da competência, ele aparece aqui com o hash SHA-256 da entrega — a prova de entrega. É esse o arquivo que a sua instituição apresenta aos órgãos reguladores.",
    seletor: '[data-tour="entregas-lista"]',
    rota: "/app/entregas",
    posicao: "top",
  },
  {
    id: "cliente-verificar-integridade",
    titulo: "Verificar integridade antes de encaminhar",
    descricao:
      "Selecione o arquivo que está em suas mãos e a plataforma recalcula o hash no próprio navegador, comparando com o lacre. Confere: o arquivo é exatamente o que a Videnas entregou. Não confere: um único byte mudou desde a entrega. É a mesma prova que protege os dois lados em qualquer contestação.",
    seletor: '[data-tour="entregas-verificar-tabela"], [data-tour="entregas-verificar-cartao"]',
    rota: "/app/entregas",
    posicao: "left",
  },
];

const PASSOS_DIRETOR: PassoTour[] = [
  {
    id: "diretor-boas-vindas",
    titulo: "Bem-vindo, Diretor / Compliance",
    descricao:
      "Este tour segue o caminho de quem aprova e responde pela obrigação perante o Banco Central. O seletor de perfil aqui no header é como este mock alterna entre as visões do produto.",
    seletor: '[data-tour="seletor-perfil"]',
    rota: "/app",
    posicao: "bottom",
  },
  {
    id: "diretor-dashboard-prazos",
    titulo: "Prazos e pendências em um só lugar",
    descricao:
      "A lista de próximos prazos regulatórios traz cada competência ordenada por urgência, com o estado atual e o link direto para abrir o período. É o ponto de partida do seu dia.",
    seletor: '[data-tour="dashboard-prazos"]',
    rota: "/app",
    posicao: "top",
  },
  {
    id: "diretor-abrir-detalhe",
    titulo: "Abrindo o detalhe da competência",
    descricao:
      "Agosto/2026 do ACAM212 está com exceções e 6 dias de atraso. Os chips no topo mostram o estado, o atraso, o prazo regulatório e a instituição — tudo que você precisa antes de decidir o que fazer.",
    seletor: '[data-tour="periodo-cabecalho"]',
    rota: "/app/acam212/per-meridian-acam212-202608",
    posicao: "bottom",
  },
  {
    id: "diretor-arquivo-gerado",
    titulo: "Arquivo gerado: hash e schema",
    descricao:
      "Cada arquivo tem um hash SHA-256 completo, calculado no momento da geração. Qualquer alteração de um único caractere muda o hash por inteiro — é assim que a integridade é comprovada antes da sua aprovação.",
    seletor: '[data-tour="painel-arquivo"]',
    rota: "/app/acam212/per-meridian-acam212-202608",
    posicao: "left",
    acaoSugerida: { seletor: '[data-tour="stepper-item-geracao"]' },
  },
  {
    id: "diretor-auditoria-segregacao",
    titulo: "Segregação de funções",
    descricao:
      "Este card mostra quem gerou, quem liberou e quem aprovou a competência — nunca a mesma pessoa. É a regra de 4 olhos da Videnas tornada visível: Executor gera, Validador libera, Diretor aprova.",
    seletor: '[data-tour="card-segregacao-funcoes"]',
    rota: "/app/acam212/per-meridian-acam212-202608",
    posicao: "top",
    acaoSugerida: { seletor: '[data-tour="stepper-item-auditoria"]' },
  },
  {
    id: "diretor-aprovar",
    titulo: "Aprovar e assumir responsabilidade",
    descricao:
      "O botão \"Aprovar e assumir responsabilidade\" só fica disponível depois que o Validador Videnas libera a competência. Ao aprovar, você declara formalmente que revisou o conteúdo e assume a obrigação perante o órgão competente — isso fica registrado na trilha com seu nome, cargo e o hash do arquivo.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/acam212/per-meridian-acam212-202608",
    posicao: "bottom",
  },
  {
    id: "diretor-protocolo-bcb",
    titulo: "Protocolo do Banco Central na entrega",
    descricao:
      "A transmissão ao Banco Central é feita pela sua instituição, fora da Videnas. Depois de enviar, é aqui na etapa Entrega que você registra o protocolo recebido — número, canal e data/hora — para manter a trilha de auditoria completa.",
    seletor: '[data-tour="entrega-conteudo"]',
    rota: "/app/cadoc/per-meridian-cadoc5710-202608",
    posicao: "top",
    acaoSugerida: { seletor: '[data-tour="stepper-item-entrega"]' },
  },
  {
    id: "diretor-calendario",
    titulo: "Calendário regulatório",
    descricao:
      "O calendário reúne todos os prazos de todos os módulos contratados pela sua instituição, mês a mês. Use-o para planejar a semana sem precisar abrir cada competência individualmente.",
    seletor: '[data-tour="nav-calendario"]',
    posicao: "right",
  },
];

const PASSOS_CONTADOR: PassoTour[] = [
  {
    id: "contador-boas-vindas",
    titulo: "Bem-vindo, Contador / Fiscal",
    descricao:
      "Seu acesso é o mais restrito dos perfis do lado cliente: você só trabalha no módulo Fiscal. O seletor de perfil no header é como esta demonstração alterna entre as visões — o seu está ativo agora.",
    seletor: '[data-tour="seletor-perfil"]',
    rota: "/app",
    posicao: "bottom",
  },
  {
    id: "contador-somente-fiscal",
    titulo: "Por que só o Fiscal aparece para você",
    descricao:
      "ACAM212 e Cadoc 5711/5710 não têm componente tributário, então ficam fora do seu escopo. O Fiscal é o único módulo onde a Videnas depende de uma validação humana de enquadramento — a sua.",
    seletor: '[data-tour="nav-fiscal"]',
    rota: "/app",
    posicao: "right",
  },
  {
    id: "contador-selo-candidato",
    titulo: "Selo \"Candidato\" e o limite do módulo",
    descricao:
      "O Fiscal ainda é uma funcionalidade candidata, sujeita a decisão de produto. E há um limite importante: a Videnas estrutura a DPS, mas não emite a NFS-e. A emissão acontece fora da plataforma, pelo emissor que a sua instituição definir.",
    seletor: '[data-tour="fiscal-banner"]',
    rota: "/app/fiscal",
    posicao: "bottom",
  },
  {
    id: "contador-dps-aguardando",
    titulo: "DPS aguardando sua validação",
    descricao:
      "Agosto/2026 tem 47 DPS estruturadas, R$ 892.400,00 em serviços, pendentes há 11 dias. Nada avança para a validação de schema enquanto você não confirmar o enquadramento tributário desta competência.",
    seletor: '[data-tour="contador-resumo"]',
    rota: "/app/fiscal/per-meridian-fiscal-202608",
    posicao: "bottom",
  },
  {
    id: "contador-conferir-tabela",
    titulo: "Alíquota, retenção e enquadramento",
    descricao:
      "Nesta tabela você confere, DPS a DPS, a alíquota de ISS sugerida pelo dicionário, se há retenção na fonte e o enquadramento tributário. A Videnas calcula a sugestão a partir dos dicionários configurados — a decisão final é sempre sua.",
    seletor: '[data-tour="contador-tabela-dps"]',
    rota: "/app/fiscal/per-meridian-fiscal-202608",
    posicao: "top",
  },
  {
    id: "contador-confirmar",
    titulo: "Confirmar ou devolver",
    descricao:
      "\"Confirmar enquadramento fiscal\" registra sua confirmação em seu nome na trilha de auditoria e libera a competência para a validação de schema. Se algo estiver incorreto, use \"Devolver para correção\" com uma justificativa — o time Videnas será acionado para ajustar.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/fiscal/per-meridian-fiscal-202608",
    posicao: "bottom",
  },
];

const PASSOS_EXECUTOR: PassoTour[] = [
  {
    id: "executor-boas-vindas",
    titulo: "Bem-vinda, Executor Videnas",
    descricao:
      "Você roda a ingestão técnica e a geração dos arquivos para todas as instituições atendidas, sempre partindo do que o Cliente já forneceu — você nunca sobe dados em nome dele. O seletor de perfil no header alterna entre as visões desta demonstração — o seu está ativo agora.",
    seletor: '[data-tour="seletor-perfil"]',
    rota: "/app",
    posicao: "bottom",
  },
  {
    id: "executor-fila-operacao",
    titulo: "Sua fila em Operação",
    descricao:
      "A fila reúne o trabalho de todos os tenants em um só lugar, ordenado por urgência: atrasados primeiro, depois por proximidade do prazo. É daqui que você trabalha no dia a dia, sem precisar entrar módulo por módulo.",
    seletor: '[data-tour="operacao-fila"]',
    rota: "/app/operacao",
    posicao: "top",
  },
  {
    id: "executor-multi-tenant",
    titulo: "Troca de instituição sem sair da tela",
    descricao:
      "Como perfil da Videnas, você atende várias instituições. Os chips filtram a fila por tenant e trocam o contexto de toda a aplicação — inclusive a sidebar reflete a mudança.",
    seletor: '[data-tour="operacao-chips-instituicao"]',
    rota: "/app/operacao",
    posicao: "bottom",
  },
  {
    id: "executor-ingestao-fornecimento",
    titulo: "Sua etapa Ingestão é o fornecimento do cliente",
    descricao:
      "Na Pampulha Capital, a etapa Ingestão do ACAM212 de agosto não tem dropzone para você: quem fornece os insumos é exclusivamente o Cliente / Fornecedor de dados, em Fornecimento de dados. Aqui você confere a completude da competência, o checklist de insumos exigidos × fornecidos e as evidências de entrada já lacradas — é o insumo do seu trabalho.",
    seletor: '[data-tour="acompanhamento-fornecimento"]',
    rota: "/app/acam212/per-pampulha-acam212-202608",
    posicao: "top",
    acaoSugerida: { seletor: '[data-tour="stepper-item-ingestao"]' },
  },
  {
    id: "executor-gerar-arquivo",
    titulo: "Gerar o arquivo a partir do que o cliente entregou",
    descricao:
      "A Pampulha Capital tem o ACAM212 de agosto com dados já fornecidos pelo Cliente e 6 dias de atraso — prioridade máxima na fila. O botão \"Gerar arquivo\" só fica disponível quando o Cliente já entregou pelo menos um lote nesta competência; sem fornecimento dele, não há o que gerar e o caminho é cobrar o cliente, não subir os dados por ele.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/acam212/per-pampulha-acam212-202608",
    posicao: "bottom",
    acaoSugerida: { seletor: '[data-tour="stepper-item-geracao"]' },
  },
  {
    id: "executor-hash-log",
    titulo: "Hash e log de geração",
    descricao:
      "Cada geração calcula um hash SHA-256 do arquivo produzido e grava um evento ARQUIVO_GERADO na trilha de auditoria, com schema, versão e quantidade de registros. Se algo estiver errado, \"Gerar novamente\" cria uma nova versão sem apagar a anterior — ela permanece na trilha, marcada como substituída.",
    seletor: '[data-tour="stepper-etapas"]',
    rota: "/app/acam212/per-pampulha-acam212-202608",
    posicao: "bottom",
  },
  {
    id: "executor-enviar-validacao",
    titulo: "Enviar para validação",
    descricao:
      "Depois de gerado, o arquivo segue para o Validador Videnas com o botão \"Enviar para validação\". No módulo Fiscal esse mesmo passo é substituído por \"Enviar ao contador\", já que a DPS precisa da confirmação de enquadramento antes da validação de schema.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/acam212/per-pampulha-acam212-202608",
    posicao: "bottom",
  },
  {
    id: "executor-sem-liberar",
    titulo: "Por que você não vê \"Liberar\"",
    descricao:
      "Segregação de funções: quem gera não libera. O botão \"Liberar para o cliente\" pertence só ao papel de Validador — mesmo trocando de instituição, ele nunca aparece para o Executor. É essa separação que a Videnas garante em todos os módulos.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/acam212/per-pampulha-acam212-202608",
    posicao: "bottom",
  },
];

const PASSOS_VALIDADOR: PassoTour[] = [
  {
    id: "validador-boas-vindas",
    titulo: "Bem-vinda, Validadora Videnas",
    descricao:
      "Você confere a validação de schema e libera as competências para os clientes — nunca gera arquivos. O seletor de perfil no header alterna entre as visões desta demonstração.",
    seletor: '[data-tour="seletor-perfil"]',
    rota: "/app",
    posicao: "bottom",
  },
  {
    id: "validador-fila",
    titulo: "Fila de operação, visão multi-tenant",
    descricao:
      "Assim como o Executor, você atende várias instituições a partir desta única fila. Os tiles de contadores mostram, de relance, quanto está aguardando validação, em validação, com exceções e vencendo em 3 dias.",
    seletor: '[data-tour="operacao-contadores"]',
    rota: "/app/operacao",
    posicao: "bottom",
  },
  {
    id: "validador-executar-validacao",
    titulo: "Executar a validação de schema",
    descricao:
      "O Cadoc 5711 de agosto/2026 do Cofre Atlântico está em validação, com um buraco na sequência de datas-base. \"Executar validação de schema\" roda o schema oficial e as regras determinísticas do módulo contra o arquivo gerado.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/cadoc/per-cofre-atlantico-cadoc5711-202608",
    posicao: "bottom",
  },
  {
    id: "validador-erros-avisos",
    titulo: "Erros e avisos com código",
    descricao:
      "Cada item traz severidade, código, mensagem e localização. Exemplo real deste período: 5711-E008, bloqueante — \"Data-base 2026-08-17 ausente na sequência de posições diárias.\" Erros bloqueantes impedem a liberação até serem tratados.",
    seletor: '[data-tour="lista-erros-avisos"]',
    rota: "/app/cadoc/per-cofre-atlantico-cadoc5711-202608",
    posicao: "top",
  },
  {
    id: "validador-liberar",
    titulo: "Liberar para o cliente",
    descricao:
      "Com zero erro bloqueante, a competência fica \"Validada\" e pronta para liberação. Ao liberar, o cliente passa a ver e baixar o arquivo — e o evento PERIODO_LIBERADO grava o hash e a confirmação de que a segregação de funções foi respeitada.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/cadoc/per-meridian-cadoc5711-202608",
    posicao: "bottom",
  },
  {
    id: "validador-segregacao",
    titulo: "A trava de segregação de funções",
    descricao:
      "Se o usuário que gerou o arquivo for o mesmo que tenta liberar, o botão fica desabilitado com o aviso: \"Quem gerou o arquivo não pode liberá-lo. Segregação de funções obrigatória.\" Essa regra é fixa e vale para todos os módulos.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/cadoc/per-meridian-cadoc5711-202608",
    posicao: "bottom",
  },
  {
    id: "validador-sem-gerar",
    titulo: "Por que você não vê \"Gerar\"",
    descricao:
      "Assim como o Diretor não vê \"Gerar\" nem \"Liberar\", o botão \"Gerar arquivo\" nunca aparece para o Validador — é um botão do papel de Executor. Cada perfil só enxerga as ações do seu próprio papel no fluxo de 4 olhos.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/cadoc/per-meridian-cadoc5711-202608",
    posicao: "bottom",
  },
];

const PASSOS_ADMIN: PassoTour[] = [
  {
    id: "admin-boas-vindas",
    titulo: "Bem-vinda, Administradora Videnas",
    descricao:
      "Você é o lado comercial e de implantação da Videnas: cadastra os clientes, contrata os módulos de cada um e convida os usuários iniciais. O que você não faz é operar o pipeline regulatório — não sobe dados, não gera, não valida e não libera arquivos. Esses papéis são do Executor, do Validador e do próprio cliente. O seletor de perfil aqui no header alterna entre as visões desta demonstração.",
    seletor: '[data-tour="seletor-perfil"]',
    rota: "/app",
    posicao: "bottom",
  },
  {
    id: "admin-dashboard",
    titulo: "A carteira em uma tela",
    descricao:
      "Seu painel não mostra prazos regulatórios nem fila de trabalho: mostra a carteira. Os quatro tiles somam quantos clientes existem, quantos já estão ativos, quantos ainda estão em implantação e quantos foram suspensos. Logo abaixo, a lista de clientes que precisam de atenção separa os dois casos que travam a operação: o cliente cadastrado cujo convite ainda não saiu e o cliente suspenso.",
    seletor: '[data-tour="dashboard-admin"]',
    rota: "/app",
    posicao: "top",
  },
  {
    id: "admin-menu-clientes",
    titulo: "O menu Clientes",
    descricao:
      "Este item só existe para o Administrador — os demais perfis nem o enxergam na barra lateral, porque a rota é bloqueada pela matriz de permissões. É daqui que se chega à carteira completa, com busca, filtros e a ficha de cada cliente.",
    seletor: '[data-tour="nav-clientes"]',
    rota: "/app",
    posicao: "right",
  },
  {
    id: "admin-contadores",
    titulo: "Os quatro status de implantação",
    descricao:
      "Provisionado: cadastrado, mas o convite inicial ainda não foi enviado. Onboarding em andamento: o Diretor recebeu o convite e ainda não terminou a configuração guiada. Ativo: a configuração guiada foi concluída e as competências dos módulos contratados foram abertas. Suspenso: o atendimento está interrompido, com motivo registrado na trilha. Clicar em um tile filtra a tabela por aquele status.",
    seletor: '[data-tour="clientes-contadores"]',
    rota: "/app/clientes",
    posicao: "bottom",
  },
  {
    id: "admin-tabela",
    titulo: "Diretor e responsável pelo envio como colunas",
    descricao:
      "A tabela traz, além dos dados cadastrais e dos módulos contratados, as duas pessoas que determinam se o cliente sai do papel: o Diretor responsável, que conclui a configuração guiada, e o responsável pelo envio de dados, que alimenta as competências. Quando a segunda coluna mostra \"Não designado\", o cliente ainda não tem quem forneça os dados — e nenhuma obrigação avança sem isso.",
    seletor: '[data-tour="clientes-tabela"]',
    rota: "/app/clientes",
    posicao: "top",
  },
  {
    id: "admin-cadastrar",
    titulo: "Cadastrar um cliente novo",
    descricao:
      "É por aqui que um tenant nasce. O cadastro cria a instituição, os módulos contratados e os usuários iniciais em um único passo — nada disso depende do cliente, que só entra na história depois de receber o convite.",
    seletor: '[data-tour="clientes-novo"]',
    rota: "/app/clientes",
    posicao: "left",
  },
  {
    id: "admin-formulario",
    titulo: "O que o formulário exige",
    descricao:
      "Três blocos: dados da instituição, com CNPJ único na plataforma — cadastrar o mesmo CNPJ duas vezes é recusado; módulos contratados, com pelo menos um obrigatório, porque são eles que definem quais competências serão abertas; e usuários iniciais, onde o Diretor responsável é obrigatório e o responsável pelo envio de dados é opcional, já que o próprio cliente pode designá-lo depois em Configurações → Usuários e papéis. Cadastrado o cliente, o botão \"Enviar convite\" leva o status de Provisionado para Onboarding em andamento.",
    seletor: '[data-tour="cliente-novo-formulario"]',
    rota: "/app/clientes/novo",
    posicao: "top",
  },
  {
    id: "admin-ficha-cliente",
    titulo: "A ficha de um cliente",
    descricao:
      "Abrir um cliente da carteira leva à visão consolidada que antecede qualquer decisão administrativa. O cabeçalho identifica a instituição pelo nome fantasia e pela razão social, mostra o CNPJ, o badge com o status de implantação e a data de entrada na carteira. A Pampulha Capital está em Onboarding em andamento: o convite já saiu, mas o Diretor ainda não terminou a configuração guiada. Todo o resto da ficha — dados cadastrais, módulos contratados, usuários, obrigações da competência — se lê a partir do que este cabeçalho declara.",
    seletor: '[data-tour="cliente-detalhe-cabecalho"]',
    rota: "/app/clientes/inst-pampulha",
    posicao: "bottom",
  },
  {
    id: "admin-usuarios-tenant",
    titulo: "Quem existe do lado do cliente",
    descricao:
      "Esta tabela lista os usuários do lado Cliente vinculados ao tenant. Na implantação, dois nomes decidem se o cliente sai do papel: o Diretor responsável, único que pode concluir a configuração guiada, e o responsável pelo envio de dados, sem o qual nenhuma competência recebe insumo. O Administrador da Videnas atua aqui apenas reenviando convites; incluir usuários, trocar perfis e desativar acessos é responsabilidade contínua do próprio cliente, em Configurações → Usuários e papéis.",
    seletor: '[data-tour="cliente-detalhe-usuarios"]',
    rota: "/app/clientes/inst-pampulha",
    posicao: "top",
  },
  {
    id: "admin-acoes-administrativas",
    titulo: "Suspender preserva a trilha",
    descricao:
      "No rodapé da ficha ficam as ações que mudam o estado da implantação, e elas variam conforme o status. Para um cliente em implantação como a Pampulha Capital aparecem duas: \"Reenviar convite inicial\", que dispara de novo o convite ao Diretor responsável enquanto ele não concluiu a configuração guiada, e \"Suspender cliente\". Suspender exige um motivo escrito e não apaga nada — o cliente continua visível para a operação e toda a trilha de auditoria é preservada; o que muda é que novas competências deixam de ser abertas. Quando o cliente já está suspenso, \"Reativar cliente\" ocupa o lugar de \"Suspender cliente\" e o devolve ao status Ativo. Cada uma dessas ações grava um evento na trilha com o seu nome e o horário.",
    seletor: '[data-tour="cliente-detalhe-acoes"]',
    rota: "/app/clientes/inst-pampulha",
    posicao: "top",
  },
];

export const ROTEIROS: Record<PerfilId, PassoTour[]> = {
  operacional: PASSOS_OPERACIONAL,
  diretor: PASSOS_DIRETOR,
  contador: PASSOS_CONTADOR,
  cliente: PASSOS_CLIENTE,
  executor: PASSOS_EXECUTOR,
  validador: PASSOS_VALIDADOR,
  admin: PASSOS_ADMIN,
};
