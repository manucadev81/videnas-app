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
    titulo: "Bem-vinda, Operacional / Backoffice",
    descricao:
      "Este tour mostra a jornada de quem alimenta os dados das competências. A qualquer momento você pode trocar de visão pelo seletor de perfil aqui no header — hoje ele está fixado em Operacional / Backoffice para esta demonstração.",
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
      "Setembro/2026 do ACAM212 ainda está em branco — nenhum lote foi recebido. É aqui que o time Operacional entra: sem dados enviados, o Executor da Videnas não tem o que gerar.",
    seletor: '[data-tour="periodo-cabecalho"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "bottom",
  },
  {
    id: "operacional-stepper",
    titulo: "As 5 etapas da obrigação",
    descricao:
      "Ingestão → Geração → Validação → Auditoria → Entrega. Você só atua na primeira etapa; as demais são conduzidas pelo time da Videnas e ficam visíveis aqui para acompanhamento.",
    seletor: '[data-tour="stepper-etapas"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "bottom",
  },
  {
    id: "operacional-modelo-csv",
    titulo: "Baixe o modelo antes de enviar",
    descricao:
      "O botão \"Baixar modelo (CSV)\" gera um arquivo já com o nome no padrão exigido (acam212_meridian_202609.csv), o cabeçalho completo e um exemplo de linha. Preencher a partir dele evita a maior parte das não conformidades.",
    seletor: '[data-tour="upload-baixar-modelo"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "bottom",
  },
  {
    id: "operacional-upload",
    titulo: "Área de upload e pré-validação",
    descricao:
      "Arraste o arquivo aqui, ou clique para selecionar. O conteúdo é lido no próprio navegador e conferido contra o layout da obrigação: nome do arquivo, competência, cabeçalho, colunas obrigatórias e o tipo de cada campo. Cada não conformidade recebe um código, como ING-E003 (coluna obrigatória ausente) ou ING-E010 (nome fora do padrão).",
    seletor: '[data-tour="upload-dropzone"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "top",
  },
  {
    id: "operacional-tabela-arquivos",
    titulo: "Arquivos recebidos",
    descricao:
      "Esta tabela reúne os lotes já aceitos e os arquivos que não passaram na conferência, com o status de cada um: Aceito, Aceito com ressalvas, Não conforme ou Rejeitado pelo operador. Nas linhas não aceitas o motivo e o ajuste necessário aparecem logo abaixo do status.",
    seletor: '[data-tour="upload-tabela-arquivos"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "top",
  },
  {
    id: "operacional-confirmar-envio",
    titulo: "Resumo da conferência",
    descricao:
      "O aceite acontece arquivo a arquivo, na pré-visualização que abre no ato do envio: você confere a amostra dos registros e as não conformidades antes de clicar em \"Aceitar lote\". Não existe confirmação adicional — assim que um lote é aceito, a competência muda de \"Aguardando dados\" para \"Dados recebidos\" e fica disponível para o Executor gerar o arquivo. Este card consolida o que foi aceito, o que ficou não conforme e o que você rejeitou.",
    seletor: '[data-tour="upload-confirmar-envio"]',
    rota: "/app/acam212/per-meridian-acam212-202609",
    posicao: "top",
  },
];

const PASSOS_DIRETOR: PassoTour[] = [
  {
    id: "diretor-boas-vindas",
    titulo: "Bem-vindo, Diretor / Compliance",
    descricao:
      "Este tour segue o caminho de quem aprova e responde pela obrigação perante o Banco Central. O seletor de perfil aqui no header é como este mock alterna entre as 5 visões do produto.",
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
      "Seu acesso é o mais restrito dos 5 perfis: você só trabalha no módulo Fiscal. O seletor de perfil no header é como esta demonstração alterna entre as visões — o seu está ativo agora.",
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
      "Você roda a ingestão e a geração dos arquivos para todas as instituições atendidas. O seletor de perfil no header alterna entre as 5 visões desta demonstração — o seu está ativo agora.",
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
    id: "executor-gerar-arquivo",
    titulo: "Rodar a ingestão e gerar o arquivo",
    descricao:
      "A Pampulha Capital tem o ACAM212 de agosto com dados recebidos e 6 dias de atraso — prioridade máxima na fila. O botão \"Gerar arquivo\" só aparece quando há pelo menos um lote ingerido; sem dados enviados pelo Operacional, não há o que gerar.",
    seletor: '[data-tour="barra-acoes"]',
    rota: "/app/acam212/per-pampulha-acam212-202608",
    posicao: "bottom",
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
      "Você confere a validação de schema e libera as competências para os clientes — nunca gera arquivos. O seletor de perfil no header alterna entre as 5 visões desta demonstração.",
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

export const ROTEIROS: Record<PerfilId, PassoTour[]> = {
  operacional: PASSOS_OPERACIONAL,
  diretor: PASSOS_DIRETOR,
  contador: PASSOS_CONTADOR,
  executor: PASSOS_EXECUTOR,
  validador: PASSOS_VALIDADOR,
};
