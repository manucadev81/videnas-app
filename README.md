# Videnas — Mockup Front-end

Mockup de front-end (Next.js 16 + React 19) da Videnas, uma RegTech de conformidade regulatória para instituições brasileiras que operam com criptoativos (SPSAVs, exchanges, custodiantes, mesas de OTC). Cobre os módulos **ACAM212**, **Cadoc 5711/5710** e **Fiscal (NFS-e/DPS, candidato)**.

**Este projeto é 100% mockado**: não há backend, API routes, autenticação real, `fetch` de rede ou banco de dados. Todo o estado (sessão, perfil ativo, períodos regulatórios, arquivos, validações, exceções, trilha de auditoria, fornecimentos e lacres criptográficos) vive em stores Zustand no navegador.

Quatro recortes desse estado são persistidos em `localStorage`, para a demonstração sobreviver a um reload ou a uma troca de login: a sessão (`videnas-sessao`), as evidências criptográficas — fornecimentos, lacres e verificações (`videnas-evidencias`) —, a carteira de clientes provisionados pelo Administrador, com os usuários iniciais criados junto (`videnas-tenants`), e os períodos regulatórios com arquivos, validações, protocolos, exceções e a trilha de auditoria (`videnas-periodos`, versão 13, `videnas-tenants`, versão 3, e `videnas-evidencias`, versão 2: dados salvos de outra versão são descartados e voltam à semente). O logout não zera mais esses dados — só a sessão é limpa. A única exceção real à regra "nada de rede" é a criptografia: os hashes SHA-256 e o envelope AES-GCM são calculados de verdade, pela Web Crypto API do próprio navegador, sem sair do dispositivo.

## Stack

- Next.js 16.3.5 (App Router, React Server Components, Turbopack)
- React 19.2.8 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (sobre `@base-ui/react`)
- Zustand para estado de sessão e de períodos regulatórios
- `sonner` para toasts

## Como rodar

```bash
pnpm install
pnpm dev      # ambiente de desenvolvimento em http://localhost:3000
pnpm build    # build de produção
pnpm start    # serve o build de produção
pnpm lint     # eslint
```

## Mapa de rotas

| Rota | Descrição |
|---|---|
| `/` | Landing institucional pública |
| `/login` | Login mockado (qualquer credencial é aceita) |
| `/selecionar-instituicao` | Escolha de instituição (tenant) e simulação de perfil — **não se aplica ao perfil Cliente / Fornecedor de dados**, que entra direto em `/app`. O cartão tracejado "todas" muda por perfil: Executor e Validador vão para a fila de operação; o **Administrador** vai para a carteira de clientes |
| `/onboarding` | **Configuração guiada de um tenant que a Videnas já cadastrou** (7 etapas), conduzida pelo Responsável de Compliance que recebeu o convite inicial. Concluí-la ativa o tenant (status **Ativo**) e abre as competências da competência corrente dos módulos contratados |
| `/app` | Dashboard — visão consolidada por perfil |
| `/app/fornecimento` | Fornecimento de dados por checklist de insumos — **Cliente** envia; Compliance e Operacional entram em modo consulta (podem notificar o cliente do que falta); Executor e Validador não têm acesso a esta rota |
| `/app/entregas` | Arquivos entregues pela Videnas, com hash, download do arquivo lacrado e verificação de integridade — Cliente, Compliance, Operacional, Executor e Validador |
| `/app/evidencias` | Cadeia de custódia completa (entrada e saída) — Compliance, Executor e Validador |
| `/app/acam212` e `/app/acam212/[periodoId]` | Lista e detalhe de competências ACAM212 |
| `/app/cadoc` e `/app/cadoc/[periodoId]` | Lista e detalhe de competências Cadoc 5711/5710 |
| `/app/fiscal` e `/app/fiscal/[periodoId]` | Lista e detalhe de competências Fiscal (DPS) |
| `/app/calendario` | Calendário regulatório |
| `/app/auditoria` | Trilha de auditoria transversal |
| `/app/operacao` | Fila de trabalho multi-tenant (Executor/Validador) |
| `/app/clientes` | Carteira de clientes da Videnas, com contadores por status de implantação, busca, filtros e o botão de reinício da demonstração — **exclusiva do Administrador** |
| `/app/clientes/novo` | Provisionamento de um cliente novo: dados da instituição, módulos contratados e usuários iniciais — **exclusiva do Administrador** |
| `/app/clientes/[id]` | Ficha do cliente: cadastro, módulos contratados, **contrato por módulo** (emissão, transmissão e responsável pela transmissão, editáveis, com evento `MODULOS_CONTRATADOS_ALTERADOS`) e **cadastros prévios por canal** (somente leitura), usuários, competências correntes, evidências recentes e as ações de convite, suspensão e reativação — **exclusiva do Administrador** |
| `/app/configuracoes/instituicao` | Dados cadastrais, módulos contratados e, em somente leitura, o contrato e os cadastros prévios da instituição (acessível também ao Responsável de Compliance) |
| `/app/configuracoes/usuarios` | Usuários, papéis e matriz de permissões |
| `/app/configuracoes/dicionarios` | Dicionários de ativos, contas/carteiras, KYC, fiscal e países |

## Perfis

São **7 perfis**, três deles com papéis facilmente confundíveis entre si. A definição canônica está em `src/lib/permissoes.ts` (`PERFIS`), com rotas e ações permitidas por perfil.

| Perfil | Lado | O que faz | Multi-tenant |
|---|---|---|---|
| **Responsável de Compliance** (`diretor`) | Cliente | Aprova o que a Videnas já validou e acompanha a entrega ao órgão: transmite quando o cadastro prévio é dele, registra o protocolo manualmente quando não há transmissão disponível e encaminha a DPS ao emissor quando a emissão não está contratada. Não escolhe tenant, não configura o que é da Videnas | Não |
| **Operacional / Suporte ao cliente** (`operacional`) | Cliente | **Apoia o cliente**: acompanha a completude do fornecimento, orienta pendências, cobra prazos, trata exceções e dicionários, e cuida do cadastro do responsável pelo envio de dados. Não sobe dados em nome do cliente | Não |
| **Cliente / Fornecedor de dados** (`cliente`) | Cliente | **Fornece os dados de origem** por checklist de insumos e retira os arquivos lacrados | Não |
| **Contador / Fiscal** (`contador`) | Cliente | Confirma alíquota de ISS, retenção e enquadramento tributário — só no módulo Fiscal. Não tem auditoria nem configurações | Não |
| **Executor — Videnas** (`executor`) | Videnas | Roda a ingestão técnica e gera os arquivos **a partir do que o Cliente já forneceu**. Nunca fornece dados, nunca libera, nunca aprova | Sim |
| **Validador — Videnas** (`validador`) | Videnas | Valida o schema e libera para o cliente. Nunca gera nem reabre período. Pode emitir o documento fiscal e transmitir quando o contrato e o cadastro prévio da instituição colocam isso com a Videnas | Sim |
| **Administrador — Videnas** (`admin`) | Videnas | **Provisiona e administra os clientes**: cadastra o tenant, contrata os módulos, convida os usuários iniciais, suspende e reativa. Não opera o pipeline regulatório; preside o Comitê de Qualidade e registra a decisão | Sim |

### Matriz de permissões (espelho de `src/lib/permissoes.ts`)

Esta tabela reproduz **exatamente** `rotasPermitidas` e `acoesPermitidas` de cada perfil. A checagem de rota é centralizada em `podeVerRota` e aplicada em três lugares: o filtro da sidebar (`src/components/layout/sidebar-app.tsx`), o filtro de abas de Configurações (`src/app/app/configuracoes/layout.tsx`) e o `GuardiaSessao` (`src/components/layout/guardia-sessao.tsx`), que bloqueia o acesso por URL direta, mostra um toast e devolve o usuário a `/app`.

Rotas listadas com um prefixo (`/app/acam212`, `/app/cadoc`, `/app/fiscal`, `/app/clientes`) liberam também as rotas dinâmicas abaixo dele (`/app/acam212/[periodoId]`, `/app/clientes/[id]`, …). `/`, `/app` e `/app/configuracoes` **não** liberam descendentes: cada sub-rota de Configurações precisa constar explicitamente.

| Perfil | Rotas permitidas | Ações permitidas |
|---|---|---|
| `diretor` | `/`, `/login`, `/onboarding`, `/app`, `/app/acam212`, `/app/cadoc`, `/app/fiscal`, `/app/entregas`, `/app/calendario`, `/app/auditoria`, `/app/evidencias`, `/app/configuracoes`, `/app/configuracoes/instituicao` (só a aba Instituição, somente leitura) | `aprovar`, `negar_aprovacao`, `transmitir` (só quando o contrato põe a transmissão com o Responsável de Compliance e o cadastro prévio dele está ativo), `marcar_encaminhado` (Fiscal sem emissão contratada), `registrar_protocolo_manual` (só sem transmissão disponível), `arquivar` (oculta — só equipe Videnas, D14), `exportar_auditoria`, `baixar_arquivo`, `baixar_comprovante`, `verificar_integridade`, `ver_evidencias` |
| `operacional` | `/`, `/login`, `/selecionar-instituicao`, `/onboarding`, `/app`, `/app/fornecimento`, `/app/acam212`, `/app/cadoc`, `/app/fiscal`, `/app/entregas`, `/app/calendario`, `/app/auditoria`, `/app/configuracoes`, `/app/configuracoes/instituicao`, `/app/configuracoes/usuarios`, `/app/configuracoes/dicionarios` | `baixar_arquivo`, `tratar_excecao`, `editar_dicionarios`, `notificar_cliente`, `gerenciar_usuarios` |
| `contador` | `/`, `/login`, `/selecionar-instituicao`, `/onboarding`, `/app`, `/app/fiscal`, `/app/calendario` | `validar_fiscal`, `devolver_fiscal`, `baixar_arquivo` |
| `cliente` | `/`, `/login`, `/app`, `/app/fornecimento`, `/app/entregas`, `/app/calendario` | `fornecer_dados`, `baixar_comprovante`, `baixar_arquivo`, `verificar_integridade` |
| `executor` | `/`, `/login`, `/selecionar-instituicao`, `/app`, `/app/operacao`, `/app/acam212`, `/app/cadoc`, `/app/fiscal`, `/app/calendario`, `/app/auditoria`, `/app/evidencias`, `/app/configuracoes`, `/app/configuracoes/dicionarios` | `gerar`, `regerar` (inclui reenvio após devolução do Responsável de Compliance), `enviar_validacao`, `enviar_contador`, `emitir_fiscal` (Fiscal com emissão contratada), `transmitir` (contrato e cadastro prévio da Videnas ativos), `registrar_retorno`, `arquivar`, `reabrir`, `tratar_excecao`, `editar_dicionarios`, `trocar_tenant`, `exportar_auditoria`, `baixar_arquivo`, `baixar_comprovante`, `verificar_integridade`, `ver_evidencias` |
| `validador` | `/`, `/login`, `/selecionar-instituicao`, `/app`, `/app/operacao`, `/app/acam212`, `/app/cadoc`, `/app/fiscal`, `/app/calendario`, `/app/auditoria`, `/app/evidencias` | `executar_validacao`, `liberar`, `emitir_fiscal`, `transmitir` (mesmas regras do Executor), `registrar_retorno`, `arquivar` (oculta — só equipe Videnas, D14), `trocar_tenant`, `exportar_auditoria`, `baixar_arquivo`, `baixar_comprovante`, `verificar_integridade`, `ver_evidencias` |
| `admin` | `/`, `/login`, `/selecionar-instituicao`, `/app`, `/app/clientes`, `/app/acam212`, `/app/cadoc`, `/app/fiscal` (só para abrir períodos em comitê, sem item no menu), `/app/auditoria`, `/app/evidencias` | `decidir_comite` (preside o Comitê de Qualidade), `editar_areas_cliente` (áreas do cliente e mapeamento, na ficha do cliente), `provisionar_tenant`, `gerenciar_clientes`, `convidar_usuario_inicial`, `suspender_tenant`, `alterar_modulos_contratados`, `trocar_tenant`, `exportar_auditoria`, `ver_evidencias`, `verificar_integridade` |

Fronteiras que a matriz deixa explícitas:

- **Só o Cliente fornece dados.** `fornecer_dados` é exclusiva dele, e `subir_dados`/`remover_lote` não existem mais em `AcaoId`.
- **Clientes e Operação são áreas fechadas.** `/app/clientes` é só do Administrador; `/app/operacao` é só de Executor e Validador.
- **O Executor entra em Configurações apenas por Dicionários** — `/app/configuracoes/dicionarios` é a única sub-rota que ele tem, e a aba Instituição/Usuários nem é renderizada para ele.
- **O Contador só enxerga o Fiscal** (mais dashboard e calendário): sem auditoria, sem configurações, sem dicionários.
- **Compliance não configura, operação não aprova.** O Responsável de Compliance perdeu `editar_dicionarios` (config operacional) e `notificar_cliente` (cobrança é do Operacional); o Validador perdeu `reabrir` (quem corrige e regera é o Executor) e `tratar_excecao` (tratamento é do Executor; o Validador as vê em leitura).
- **A configuração guiada (`/onboarding`) é do tenant, não do fornecedor de dados**: Compliance, Operacional e Contador a acessam; o Cliente, não.

### Cliente ≠ Operacional

Essa distinção é deliberada e é a decisão de produto mais importante do fluxo novo: **o Cliente fornece e o Operacional apoia.**

- O **Cliente / Fornecedor de dados** é quem **fornece** os insumos brutos, com exclusividade. Ele entra em `/app/fornecimento`, vê o checklist de insumos obrigatórios da competência, envia arquivos, preenche formulários curtos e baixa comprovantes. É só isso.
- O **Operacional / Suporte ao cliente** é suporte, não fornecedor: ele **não sobe dados em nome do cliente**. Acompanha a completude do fornecimento (painel dedicado na etapa Ingestão de cada módulo e em `/app/fornecimento`, em modo consulta), orienta o que falta, cobra prazos com a ação **"Notificar cliente do que falta"** (`notificar_cliente`, registrada na trilha de auditoria), trata exceções, mantém os dicionários e cuida do cadastro do responsável pelo envio de dados em `/app/configuracoes/usuarios`.

Por isso a superfície do Cliente é **reduzida de propósito**: `/app`, `/app/fornecimento`, `/app/entregas` e `/app/calendario`. Sem módulos, sem auditoria, sem configurações, sem fila de operação. As ações liberadas são `fornecer_dados`, `baixar_comprovante`, `baixar_arquivo` e `verificar_integridade`.

`/app/fornecimento` abre em **modo consulta** para os demais perfis com acesso à rota (Compliance e Operacional): um aviso "Modo consulta" explica que só o Cliente fornece os dados, e eles acompanham a completude e o histórico e podem notificar o cliente do que falta, mas o envio é sempre do Cliente.

### O Cliente é pré-cadastrado pelo operador do tenant

O Cliente / Fornecedor de dados não se autocadastra e não escolhe onde trabalhar. A instituição e a **pessoa responsável pelo envio de dados** são cadastradas antes, pelo operador do tenant (perfis Compliance e Operacional, ambos com a ação `gerenciar_usuarios`), em `/app/configuracoes/usuarios` (seção **"Responsáveis pelo envio de dados"**, botão "Designar responsável"). O vínculo aparece em somente leitura em `/app/configuracoes/instituicao`, na seção "Responsável pelo envio de dados".

Consequências no produto:

- Ao entrar, o Cliente vai **direto para `/app`**, sem passar por `/selecionar-instituicao` (a rota nem consta em `rotasPermitidas` desse perfil, e a tela redireciona sozinha se alguém chegar nela).
- O header dele **não tem seletor de instituição nem simulador de perfil**: mostra uma **identidade estática** (`src/components/dominio/identidade-usuario.tsx`) no formato nome · instituição · papel — por exemplo "Natália Queiroz · Meridian Digital Assets · Cliente / Fornecedor de dados" — além do botão Sair.
- O Cliente **não aparece no simulador de perfis** (`PERFIS_SIMULAVEIS`, em `src/lib/permissoes.ts`, filtra os perfis com `contextoFixo`), justamente para ninguém cair nesse perfil por simulação e ficar sem saída.

### O Administrador provisiona os clientes

O tenant também não se autocadastra. Antes de qualquer coisa, a instituição é cadastrada **pela Videnas**, pelo perfil **Administrador — Videnas** (`admin`), em `/app/clientes/novo`. A cadeia completa tem quatro elos, e cada um só existe porque o anterior aconteceu:

**Administrador (Videnas)** provisiona a instituição, contrata os módulos e convida o Responsável de Compliance → **Responsável de Compliance (cliente)** entra com o e-mail cadastrado e conclui a configuração guiada em `/onboarding`, o que ativa o tenant e abre as competências → **operador do tenant** (Compliance ou Operacional, ambos com `gerenciar_usuarios`) designa o responsável pelo envio de dados em `/app/configuracoes/usuarios` → **Cliente / Fornecedor de dados** alimenta as competências em `/app/fornecimento`.

O que o Administrador pode: `decidir_comite` (como presidente do Comitê de Qualidade, só em períodos `em_comite_qualidade`), `provisionar_tenant`, `gerenciar_clientes`, `convidar_usuario_inicial`, `suspender_tenant`, `alterar_modulos_contratados`, `trocar_tenant`, `exportar_auditoria`, `ver_evidencias` e `verificar_integridade`.

O que ele **deliberadamente não pode**: subir dados, gerar arquivo, executar validação de schema, liberar para o cliente, aprovar competência, registrar protocolo, tratar exceção ou editar dicionários. As rotas dele são apenas `/app`, `/app/clientes` (e filhas), `/app/auditoria` e `/app/evidencias` — sem módulos, sem calendário, sem fornecimento, sem fila de operação e sem as configurações do tenant.

Por que ele fica fora da segregação de funções: a regra de 4 olhos é **Executor gera → Validador libera → Compliance aprova**. Quem decide quais clientes existem e quais módulos eles contratam não pode ter mão em nenhum desses três passos, senão a mesma pessoa poderia criar o tenant, gerar o arquivo e liberá-lo. O Administrador provisiona o cliente e sai do caminho; o painel dele nem mostra prazos regulatórios, e sim a carteira.

O Administrador é **multi-tenant**, mas por um motivo diferente do Executor e do Validador: ele não atende várias instituições, ele **administra todas**. Por isso, em `/selecionar-instituicao`, o cartão tracejado "todas" o leva para `/app/clientes` e não para `/app/operacao`.

## Máquina de estados do período (R1 a R5 — aprovação, devolução, escalonamento, contrato e transmissão, retorno e arquivamento)

`entregue` e `retorno_com_erro` não existem mais. Antes da liberação, `enviar_validacao` (e, no Fiscal, `validar_fiscal`) sorteia um único validador designado para o período; só ele valida e libera (R5, D7, ver abaixo). A partir de `liberado`, o fluxo é:

`liberado` → **`aprovar`** (Compliance) → `aprovado`, ou **`negar_aprovacao`** (Compliance, motivo mínimo 10 caracteres) → `devolvido_diretor` na 1ª negativa da competência, ou `em_comite_qualidade` na 2ª (R3, ver abaixo).

`devolvido_diretor` → **`regerar`** (Executor) → `gerado` (nova versão do arquivo; a anterior vira `substituida`; a nova versão é selada e encadeada na cadeia de custódia do período) → o único caminho adiante é `enviar_validacao` (não-fiscal) ou `enviar_contador` (Fiscal) → validação e liberação de novo, antes de qualquer nova aprovação.

`aprovado` → o caminho depende do **contrato do cliente e do cadastro prévio** (R4, ver abaixo): **`transmitir`** (ACAM212 e Cadoc), **`emitir_fiscal`** (Fiscal com emissão contratada) → `emitido_fiscal` → **`transmitir`**, **`marcar_encaminhado`** (Fiscal sem emissão contratada) ou **`registrar_protocolo_manual`** (sem transmissão disponível) → `aguardando_retorno` (as listas e a fila do Validador mostram os dias desde a transmissão e o número do protocolo) → **`registrar_retorno`** (Executor ou Validador — equipe Videnas, D14). No ACAM212, 3 desfechos obrigatórios: aceito / aceito com ressalvas / rejeitado, com código e mensagem sempre obrigatórios e texto de ressalva obrigatório para o desfecho intermediário → `retorno_aceito`, `retorno_com_ressalvas` ou `retorno_rejeitado`. No Cadoc 5710/5711 e no Fiscal, só "Aprovado: Sim/Não" (D6) → `retorno_aceito` ou `retorno_rejeitado`.

**Contrato, emissão e transmissão (R4).** O que a Videnas emite e transmite é dado de cada cliente, não regra do produto. Em cada módulo contratado, `Instituicao.contrato` guarda `emissaoIncluida` (só Fiscal), `transmissaoIncluida` e `responsavelTransmissao` (`videnas` ou `diretor`), editáveis pelo Administrador em `/app/clientes/[id]`; os **cadastros prévios** por canal (canal BCB ou emissor municipal, módulos, responsável, situação, identificador, registro e validade) são somente leitura e aparecem na ficha do Administrador, em `/app/configuracoes/instituicao` (Compliance) e num bloco na aba Entrega de cada período (qualquer perfil que abra o período, inclusive Executor e Validador). Uma validade vencida (`validoAte` antes do "hoje" do mock) conta como cadastro expirado. As regras vivem em `src/lib/contrato.ts` e são as mesmas na UI, em `podeExecutar` e na store:

- **`emitir_fiscal`** — só Fiscal, só em `aprovado`, só com emissão contratada, para os perfis de `emissaoFiscalPerfis` (premissa da D5: `executor` e `validador`). Quem gerou a versão corrente do arquivo não pode emitir (D18). Sela um documento fiscal de demonstração em XML (`documento_fiscal`), grava `DOCUMENTO_FISCAL_EMITIDO` e leva a `emitido_fiscal`.
- **`transmitir`** — de `aprovado` (ACAM212 e Cadoc) ou de `emitido_fiscal` (Fiscal com emissão), com transmissão contratada e cadastro prévio **ativo** do lado responsável: Executor/Validador (`transmissaoPerfisVidenas`) quando o responsável é a Videnas, o Compliance quando é ele. Quem gerou o arquivo não pode transmitir e, no Fiscal, quem emitiu o documento também não (D18). Simulada: gera o protocolo, sela o comprovante (`comprovante_transmissao`), grava `TRANSMISSAO_REALIZADA` e leva a `aguardando_retorno`; daí `registrar_retorno` e `arquivar` seguem como no R2. `registrar_protocolo` foi unificada nesta ação (fica só como linha histórica e nunca aparece).
- **`registrar_protocolo_manual`** — só o Responsável de Compliance, só quando a transmissão não está disponível (não contratada, sem cadastro, pendente ou expirada, com o motivo na tela, por exemplo "Cadastro STA expirado em 15/08/2026"): justificativa (mínimo 10 caracteres), número, data e canal (BCB: só os canais do `CanalEnvioBcb`; Fiscal: nome do emissor) e comprovante **opcional**. Sem as regras de segregação da D18 (o Responsável de Compliance nunca gera nem emite). Sela o anexo (quando há) e um recibo (`recibo_protocolo_manual`) e grava `PROTOCOLO_MANUAL_REGISTRADO`.
- **`marcar_encaminhado`** — só Fiscal sem emissão contratada: o Responsável de Compliance informa o emissor definido pelo cliente; sela um recibo (`recibo_encaminhamento`).

**Segregação na emissão e na transmissão (D18) e contrato congelado (D19).** Mensagens exatas, em botão desabilitado com o motivo e revalidadas na store com toast: "Quem gerou o arquivo não pode emiti-lo. Segregação de funções obrigatória.", "Quem gerou o arquivo não pode transmiti-lo. Segregação de funções obrigatória." e "Quem emitiu o documento fiscal não pode transmiti-lo. Segregação de funções obrigatória." Na aprovação, o contrato do módulo é congelado no período (`PeriodoObrigacao.contratoCongelado`: `emissaoIncluida`, `transmissaoIncluida`, `responsavelTransmissao`, data e id do cadastro prévio); emissão, transmissão, registro manual e encaminhamento seguem esse retrato, e mudanças de contrato só valem para períodos aprovados depois. A aba Entrega mostra "Contrato vigente na aprovação (dd/mm/aaaa)" e avisa quando o contrato atual mudou. A situação do cadastro prévio (inclusive a validade) continua sendo avaliada na hora da ação. Os cadastros prévios continuam somente leitura (sem tela de edição).

Demonstração (depois de "Reiniciar demo", competências `r4*` em `aprovado`, todas de setembro/2026, geradas por Tomoe Nakamura e aprovadas em 01/10/2026, com vencimento entre 05/10 e 20/10 e portanto dentro do prazo): `per-meridian-acam212-r4videnas` e `per-meridian-cadoc5711-r4videnas` (a Videnas transmite: Clarice Veloso ou Igor Salgado; Tomoe fica bloqueada), `per-meridian-fiscal-r4emissao` (Igor emite e Clarice transmite, ou o inverso; Tomoe fica bloqueada nas duas), `per-cofre-atlantico-cadoc5711-r4diretor` (a Responsável de Compliance Helena Drummond transmite, `helena.drummond@cofreatlantico.com.br`), `per-cofre-atlantico-cadoc5710-r4semcontrato` (transmissão não contratada, só registro manual), `per-meridian-cadoc5710-r4expirado` (cadastro expirado, registro manual com Ricardo Menezes), `per-pampulha-acam212-r4pendente` (cadastro pendente) e `per-cofre-atlantico-fiscal-r4encaminhar` (encaminhar ao emissor). Todos os atalhos de login existem na tela de login. Detalhes em `docs/backlog-front-approval-flow.md` (seções 14 e 14.1).

**Retorno do regulador (R2).** No ACAM212 o retorno é registrado como **ACAM213**: identificador, data, código, mensagem e arquivo anexado opcional. Nos demais módulos o rótulo é genérico ("Retorno do regulador/emissor") e o registro pede só "Aprovado: Sim/Não" e um anexo opcional (D6, decisão de 2026-10-01; ver R5). O anexo é lacrado e um **recibo do retorno** em JSON também é lacrado; os dois entram na mesma cadeia `hashAnterior` do período, logo depois do lacre do arquivo entregue. O rótulo vem de `rotuloRetornoDoModulo`, em `src/lib/mock/configuracao-fluxo.ts`.

`retorno_rejeitado` abre uma exceção bloqueante de origem `retorno_bcb` (responsável: Executor) e → **`reabrir`** (Executor) → `dados_ingeridos`, encerrando a exceção do retorno. `retorno_com_ressalvas` (só ACAM212) aceita os dois caminhos (D12, decisão de 2026-09-30): **`arquivar`** (a ressalva registrada no retorno segue no dossiê) e **`reabrir`** (Executor, volta a `dados_ingeridos` como no retorno rejeitado). Ambos vêm de `caminhosAposRessalvas: ["arquivar", "reabrir"]` em `src/lib/mock/configuracao-fluxo.ts`; retirar um item esconde a ação correspondente.

`retorno_aceito` → **`arquivar`** → `arquivado`. A ação aparece para os perfis de `arquivamentoPerfis` (D14: `executor` e `validador`, equipe Videnas) em `src/lib/mock/configuracao-fluxo.ts`; também a partir de `retorno_com_ressalvas` (D12). **Segregação no arquivamento (D17):** quem gerou a versão corrente do arquivo não pode arquivar ("Quem gerou o arquivo não pode arquivá-lo. Segregação de funções obrigatória.") e quem registrou o retorno do regulador também não ("Quem registrou o retorno não pode arquivar o período. Segregação de funções obrigatória."); as duas valem juntas, na UI (botão desabilitado com o motivo) e na store, e não se aplicam a `reabrir`. Ao arquivar, um **dossiê** (hash do arquivo, aprovações, negações, protocolo e retorno) é lacrado como último elo da cadeia do período, `PERIODO_ARQUIVADO` entra na trilha e o período fica **somente leitura**. `retencaoAte` = data de arquivamento + `retencao.anos` (D2: 5 anos, só na config), gravado no período, no dossiê e no evento, e exibido como "Retido até"; nada é expurgado. Períodos arquivados ficam ocultos por padrão nas listas dos módulos, em entregas, na fila de operação e no calendário, com a chave "Mostrar arquivados".

Para ver o arquivamento na demonstração: entre como **Igor Salgado** (atalho "Executor (arquivamento)", `i.salgado@videnas.com.br`), único usuário da semente que não gerou os arquivos (Tomoe Nakamura) nem registrou os retornos (Clarice Veloso), abra `/app/acam212/per-meridian-acam212-r2aceito` (ou `/app/acam212/per-meridian-acam212-r2ressalvasb`, que tem ressalva) e use "Arquivar período". Como Tomoe ou Clarice o botão fica desabilitado com o motivo. Para demonstrar a reabertura após ressalvas, use `per-meridian-acam212-r2ressalvas` como Executor.

**Escalonamento ao Comitê de Qualidade (R3).** A contagem de negativas é **por ciclo de envio** (D8, resolvida em 2026-10-01 pelo Manuca; `contagemNegacoes: "por_ciclo_envio"` em `src/lib/mock/configuracao-fluxo.ts`): dentro do ciclo ela nunca zera, nem quando o período é reaberto nem quando o retorno é "Não" (rejeição técnica); ela só zera quando uma remessa de substituição "S" abre um novo ciclo (seção "Substituição" abaixo). A negativa de número `limiarNegacoesComite` (2) leva o período a `em_comite_qualidade` em vez de `devolvido_diretor`; com `escaladaComiteAutomaticaHabilitada: false` o comportamento volta a ser sempre `devolvido_diretor`. Devoluções do Contador (`devolver_fiscal`) **não** contam por padrão (D9, resolvida: `devolucaoContadorContaComoNegacao` é `false`); com a flag `true`, cada devolução entra no histórico com origem "contador" e pode escalar ao Comitê, mas o dossiê desse caminho ainda não é lacrado. O diálogo de negação mostra "Negativa n de 2" e, na negativa que atinge o limite, avisa que o período seguirá ao Comitê. Ao confirmar, o histórico de negativas (versão, hash, motivo, autor e data) é lacrado em um **dossiê de escalonamento** (`tipoArtefato` `dossie_comite`, na cadeia do período), e entram na trilha `APROVACAO_NEGADA` (com `numeroNegativa`) e `COMITE_QUALIDADE_ACIONADO` (com o histórico). Em `em_comite_qualidade` o período fica **somente leitura** para todos os perfis (só download, evidências e exportação), exceto para o **Administrador**, que preside o **Comitê de Qualidade da Videnas** (D3, opção A, aprovada em 2026-10-01) e registra a decisão com `decidir_comite`. O Comitê tem dois membros, o Administrador e um segundo membro da equipe Videnas (Administrador, Executor ou Validador) **elegível**: ficam de fora, por segregação de funções, quem gerou ou liberou qualquer versão negada, o Responsável de Compliance que negou e, se houver, o Contador que devolveu. O quórum é 2 de 2, por unanimidade; sem acordo a negativa é mantida. Há dois desfechos: **manter a negativa** com plano de correção obrigatório (volta a `devolvido_diretor` e o Executor precisa gerar uma nova versão; o plano aparece para ele) ou **negativa superada** (volta a `liberado` e o Responsável de Compliance vê a justificativa do Comitê no diálogo de aprovação); não existe "aprovar por exceção". A decisão exige justificativa (mínimo 10 caracteres), gera o evento `COMITE_QUALIDADE_DECIDIU` e uma **ata lacrada** (`tipoArtefato` `ata_comite`, encadeada depois do dossiê de escalonamento e verificável em `/app/evidencias`). O prazo do Comitê é de 2 dias úteis após o escalonamento ou 3 dias antes do prazo regulatório, o que vier primeiro, e fica em destaque crítico a menos de 3 dias do prazo regulatório. Dentro do ciclo a contagem de negativas não zera: da 3ª negativa do ciclo em diante o período volta direto ao Comitê (rótulo "Negativa 3 (limite 2)"). O Administrador chega a esses períodos pelo grupo "Em Comitê de Qualidade" do painel. O painel, a fila de operação e o calendário destacam esses períodos com os dias até o prazo. A semente tem, nos quatro módulos, `r3negativa1` (março/2026, `liberado` com 1 negativa, pronto para a 2ª; ex.: `/app/acam212/per-meridian-acam212-r3negativa1` como Ricardo Menezes) e `r1comite` (setembro/2025, já em comitê com 2 negativas, 2 versões e dossiê lacrado). As ações `emitir_fiscal`, `transmitir`, `registrar_protocolo_manual` e `arquivar` (esta última só para a equipe Videnas) seguem amarradas a decisões pendentes ou flags em `src/lib/mock/configuracao-fluxo.ts`. Detalhe completo em `docs/backlog-front-approval-flow.md` (seções 5, 7 e 13).

## Substituição "S" no Cadoc 5710/5711 (D8)

Decisão do Manuca em 2026-10-01: depois do aceite do BCB, uma remessa de substituição "S" zera o contador de negativas e abre um novo ciclo de envio. Base: leiautes 5710/5711 V0, §3.1.2(e), em que `tipoRemessa` "I" é a primeira remessa da data-base e "S" substitui um documento já aceito; se o BCB rejeitar, o próximo envio continua "I", por isso a rejeição técnica (retorno "Não") e a reabertura antes do protocolo **não** zeram o contador.

- **Ação `iniciar_substituicao` ("Iniciar substituição (remessa S)").** Só no Cadoc 5710/5711 (chave por módulo `modulos.<id>.substituicao` em `src/lib/mock/configuracao-fluxo.ts`; ACAM212 e Fiscal não têm a ação, pergunta aberta D20 no backlog), só a partir de `retorno_aceito` e só para o **Executor** (equipe Videnas), com justificativa de pelo menos 10 caracteres (por exemplo, "erro apontado pelo BCB após o aceite"). O período volta a `dados_ingeridos` no **Ciclo 2 (S)**, com o contador em "0 de 2". Em período `arquivado` o botão aparece desabilitado com o motivo (o arquivamento é imutável); nos demais estados ele não aparece.
- **Ciclo e histórico.** `PeriodoObrigacao.cicloEnvio` e `tipoRemessa` ("I" no ciclo 1, "S" nos seguintes); cada negativa grava o seu `cicloEnvio`. O cabeçalho mostra o selo "Ciclo 2 (S)", o banner, os diálogos e o "Negativa n de 2" contam só o ciclo atual, e o limiar do Comitê vale por ciclo. Um painel no período lista as negativas agrupadas por ciclo ("Ciclo 1 (I)", "Ciclo 2 (S)") e o protocolo substituído.
- **Auditoria e lacres.** O evento `SUBSTITUICAO_INICIADA` registra ciclo anterior e novo, justificativa, protocolo substituído e o último lacre da cadeia. Os lacres do ciclo 2 seguem na mesma cadeia do período (`hashAnterior`). O comprovante de transmissão, o recibo do protocolo manual e o recibo do retorno do ciclo 2 trazem `tipoRemessa: "S"` e o protocolo substituído.
- **Para ver na demonstração.** Entre como **Tomoe Nakamura** (Executor, `t.nakamura@videnas.com.br`), na Meridian, e abra `/app/cadoc/per-meridian-cadoc5711-d8substituicao` (Fevereiro/2026, `retorno_aceito`, com uma negativa no ciclo 1). Depois de iniciar a substituição, o ciclo segue o fluxo normal: gerar, validador sorteado, liberar, Compliance (Ricardo Menezes) aprova ou nega, Videnas transmite.

## Organização (R5): validador sorteado, áreas do cliente, CSV da trilha, rótulo Compliance e retorno por posicionamento

Decisões de 2026-10-01 (Manuca), todas implementadas: D7 (validador por módulo e aleatório), D10 (áreas como medida informativa do cliente), D11 (rótulo "Compliance") e D6 (retorno do Cadoc e do Fiscal só com o posicionamento "aprovado ou não"). As configurações vivem em `src/lib/mock/configuracao-fluxo.ts` (objeto `configuracaoFluxo`); detalhes na seção 15 de `docs/backlog-front-approval-flow.md`.

- **Exportar trilha (CSV) (E11-S4).** Em `/app/auditoria`, o botão baixa um CSV gerado no navegador (sem rede) com exatamente os eventos filtrados na tela: data e hora ISO, tipo, rótulo, usuário e perfil, instituição, período, módulo, referência, hash e um resumo do payload. UTF-8 com BOM, aspas e vírgulas escapadas, nome `trilha-auditoria-<tenant>-<aaaa-mm-dd>.csv`. Cada exportação grava `TRILHA_EXPORTADA` (quantidade, filtros, nome do arquivo). O menu "Exportar trilha do período" faz o mesmo para um período.
- **Validador designado por sorteio (E10, D7: "é por modulo e é aleatorio").** Cada período tem **um único** validador designado, sorteado com `crypto.getRandomValues` entre os validadores elegíveis do módulo e da instituição, excluindo quem gerou a versão atual do arquivo. O sorteio acontece em `enviar_validacao` e, no Fiscal, quando o Contador confirma (`validar_fiscal`); fica no período (`validadorDesignadoId`, `designadoEm`, `criterioDesignacao: "sorteio"`) e na trilha (`VALIDADOR_SORTEADO`, com a lista de elegíveis e o sorteado). Só o designado executa a validação e libera; os demais validadores veem "Validação designada por sorteio para <nome> (Vn)". Sem validador elegível, o envio fica bloqueado com aviso. Todo reenvio (após negativa, devolução ou reabertura) refaz o sorteio, e o validador anterior **não** é excluído. Não existe validação sequencial V1 → V2 → V3. Validadores da semente: Clarice Veloso (V1, `c.veloso@videnas.com.br`), Rafael Tavares (V2, `r.tavares@videnas.com.br`) e Beatriz Nogueira (V3, `b.nogueira@videnas.com.br`), todos com atalho no login. O designado aparece no cabeçalho do período, na fila de Operação (coluna "Validador"; o filtro "Meus" inclui os períodos em que você é o designado) e nos diálogos de liberar e de aprovar; o nível (V1, V2, V3) aparece também no bloco de identidade e em `/app/configuracoes/usuarios`.
- **Áreas do cliente (E9, D10: "medida informativa do cliente no inicio do contrato").** Controles internos, Custódia e Contábil são áreas da instituição cliente (`Instituicao.areasCliente`), e o mapeamento área → módulo/controle fica na própria instituição (`Instituicao.mapeamentoAreas`). Os dois são informados pelo cliente no início do contrato, só como informação. O **Administrador** edita as áreas (nome, contato, e-mail) e o mapeamento em `/app/clientes/[id]`; salvar grava `CONFIG_INSTITUICAO_ALTERADA` (escopo `areas_cliente`) com antes e depois. O **Compliance** os vê, só leitura, em `/app/configuracoes/instituicao`. O mapeamento aparece no período por padrão. As áreas não aprovam nem registram aceite. Ao **aprovar** e ao **arquivar** um período, a store grava um `AREA_CLIENTE_NOTIFICADA` por área destinatária e a tela mostra uma notificação simulada; por padrão só as áreas mapeadas ao módulo são notificadas (`destinatariosNotificacao: "areas_mapeadas"`).
- **Rótulo do aprovador (E4-S4, D11: "compliance").** O perfil aparece como **Compliance** e, nas frases, como **Responsável de Compliance**; o id interno continua `diretor` (e o estado `devolvido_diretor`). `rotuloAprovador` alimenta `PERFIS`, e os textos de ajuda, tutorial, assistente e telas seguem o mesmo termo.
- **Retorno por posicionamento (E7-S4, D6: "posicionamento se foi aprovado ou nao, somente o campo de aprovado").** No Cadoc 5710/5711 e no Fiscal, o registro do retorno pede só **"Aprovado: Sim/Não"** e um anexo opcional (`modulos.<id>.retorno.somentePosicionamento`). Sim → `retorno_aceito`; Não → `retorno_rejeitado`, com a exceção bloqueante `RETORNO_NAO_APROVADO` e reabertura. Não há código, mensagem, "aceito com ressalvas" nem tipo de remessa; o recibo lacrado do retorno guarda só `aprovado`. O ACAM212 continua com o ACAM213 e os três desfechos.
- **Persistência.** `videnas-periodos` v14, `videnas-tenants` v3 e `videnas-evidencias` v2; dados salvos em outra versão voltam à semente. "Reiniciar demo" restaura áreas, eventos e períodos.

## Como nasce um cliente novo

Passo a passo clicável, de ponta a ponta, do cadastro à primeira competência aberta:

1. **Entrar como Administrador** — em `/login`, atalho "Administrador" (`m.fontes@videnas.com.br`, Marina Fontes, `usr-marina`). O painel em `/app` mostra a carteira: quantos clientes existem, quantos estão ativos, quantos em implantação e quantos suspensos, mais a lista dos que precisam de atenção.
2. **Cadastrar o cliente** — em `/app/clientes`, botão **"Cadastrar novo cliente"** (`/app/clientes/novo`). São três blocos: dados da instituição (razão social, nome fantasia, CNPJ, tipo, município, UF, CEP), **módulos contratados** (pelo menos um — são eles que definem quais competências serão abertas) e **usuários iniciais**, com o **Responsável de Compliance obrigatório** e o responsável pelo envio de dados **opcional**. O CNPJ é único na plataforma e cada e-mail também.
3. **Status Provisionado** — cadastrado, o cliente entra na carteira como **Provisionado**: o convite ainda não saiu e ninguém do lado do cliente consegue configurar nada. Evento `TENANT_PROVISIONADO` na trilha.
4. **Enviar o convite** — na ficha do cliente (`/app/clientes/[id]`), botão **"Enviar convite"**. O status passa a **Onboarding em andamento** e o evento `CONVITE_INICIAL_ENVIADO` é gravado. O envio é simulado: nenhum e-mail sai da máquina.
5. **Entrar como o Responsável de Compliance recém-cadastrado** — saia (botão "Sair") e entre em `/login` com **o e-mail que você digitou** no cadastro do Responsável de Compliance. Ele é reconhecido como qualquer usuário da semente, porque o registro em memória (`src/lib/tenants/registro.ts`) é mantido em sincronia com o store de tenants.
6. **Concluir a configuração guiada** — o Responsável de Compliance percorre as 7 etapas de `/onboarding`. Ao concluir, o tenant vira **Ativo**, o evento `ONBOARDING_CONCLUIDO` é gravado e as competências da competência corrente dos módulos contratados são abertas (`abrirCompetenciasIniciais`, em `src/lib/store/periodos.ts`).
7. **Designar quem fornece os dados** — se o responsável pelo envio não foi cadastrado no passo 2, o operador do tenant o designa em `/app/configuracoes/usuarios`, seção "Responsáveis pelo envio de dados". A partir daí o fluxo é o de sempre: o Cliente fornece, o Executor gera, o Validador libera, o Responsável de Compliance aprova.

Na ficha do cliente o Administrador ainda pode **alterar os módulos contratados** (`MODULOS_CONTRATADOS_ALTERADOS`) e **suspender/reativar** o atendimento (`TENANT_SUSPENSO` / `TENANT_REATIVADO`, a suspensão exigindo um motivo escrito de pelo menos 10 caracteres). Todos esses eventos aparecem na mesma trilha de `/app/auditoria`, sem período, módulo nem competência associados, porque valem para o tenant inteiro.

**Persistência e reinício**: os tenants provisionados e os usuários iniciais criados junto ficam em `localStorage`, sob a chave `videnas-tenants`. Consequência prática: **um CNPJ já cadastrado bloqueia o recadastro enquanto o storage não for limpo** — e o mesmo vale para os e-mails. Para voltar à semente sem abrir o DevTools, use o botão **"Reiniciar demo"**, no cabeçalho de `/app` (visível para qualquer perfil autenticado), ou o botão equivalente no rodapé de `/app/clientes` (só o Administrador o vê): um diálogo de confirmação explica que todos os dados da demonstração — clientes, períodos, evidências, protocolos, exceções e a trilha de auditoria — voltam ao estado inicial da semente. Em código, a ação equivalente é `reiniciarDemo()`, em `src/lib/store/demo.ts`.

## Como trocar de perfil e de instituição no mock

Não existe autenticação real: qualquer e-mail e senha entram no ambiente de demonstração.

1. Em `/login`, use um dos **8 atalhos de demonstração** (ou digite qualquer e-mail — cai automaticamente no perfil Operacional/Suporte ao cliente da Meridian Digital Assets, com um toast avisando que o e-mail não foi reconhecido):

   | Atalho | E-mail | Instituição |
   |---|---|---|
   | Compliance | `ricardo.menezes@meridiandigital.com.br` | Meridian Digital Assets |
   | Operacional / Suporte ao cliente | `paula.arantes@meridiandigital.com.br` | Meridian Digital Assets |
   | **Cliente / Fornecedor de dados** | `natalia.queiroz@meridiandigital.com.br` | Meridian Digital Assets |
   | Contador / Fiscal | `joao.beraldo@contabilberaldo.com.br` | Atende todos os tenants |
   | Executor | `t.nakamura@videnas.com.br` | Videnas |
   | Validador | `c.veloso@videnas.com.br` | Videnas |
   | Executor (arquivamento) | `i.salgado@videnas.com.br` | Videnas |
   | **Administrador** | `m.fontes@videnas.com.br` | Videnas |

   O usuário do perfil Cliente é **Natália Queiroz**, analista de dados regulatórios da Meridian Digital Assets (`usr-natalia`, em `src/lib/mock/usuarios.ts`). O do perfil Administrador é **Marina Fontes** (`usr-marina`), do lado Videnas. Responsáveis de Compliance cadastrados pelo Administrador durante a demonstração também entram por este mesmo formulário, com o e-mail que foi digitado no cadastro.

2. Em `/selecionar-instituicao`, escolhe-se **apenas a instituição de trabalho** — a troca de perfil acontece no seletor de perfil do header (item 3) ou entrando por outro atalho de login. A **semente** traz três instituições — Meridian Digital Assets (exchange), Cofre Atlântico (custodiante) e Pampulha Capital (mesa OTC, ainda em *Onboarding em andamento*) —, mas a lista **não é fixa**: todo cliente cadastrado pelo Administrador em `/app/clientes/novo` passa a aparecer aqui, com o seu status de implantação no cartão. O **Cliente / Fornecedor de dados não está nessa lista**: por ser pré-cadastrado pelo operador do tenant, só se chega a ele pelo atalho de login próprio — `natalia.queiroz@meridiandigital.com.br` (Meridian Digital Assets) ou `diego.vasconcelos@cofreatlantico.com.br` (Cofre Atlântico, `usr-diego`), que entram direto em `/app`.
3. Depois de entrar em `/app`, o **header** expõe os dois seletores (instituição e perfil) para trocar de contexto sem precisar sair da aplicação — exceto para o Cliente, que vê apenas a identidade estática (nome · instituição · papel). Perfis do lado cliente veem só a própria instituição; os três perfis do lado Videnas alternam entre todas as instituições cadastradas ou escolhem o cartão "todas" — que leva Executor e Validador à fila de operação em `/app/operacao` e o Administrador à carteira de clientes em `/app/clientes`.

Trocar de perfil **não recarrega dados** — apenas reavalia permissões e re-renderiza as ações disponíveis em cada tela, o que é a base para demonstrar a segregação de funções abaixo.

## Como o cliente envia os documentos

O caminho é único: o perfil **Cliente / Fornecedor de dados**, em `/app/fornecimento`. O fluxo antigo, de upload solto dentro da etapa Ingestão de cada módulo, foi removido — aquela aba virou somente leitura para todos os perfis, como descrito no fim desta seção.

### 1. Escolher a competência aberta

A tela lista, na coluna da esquerda, todas as competências da instituição ativa em `aguardando_dados` ou `dados_ingeridos`, ordenadas por prazo. A primeira já vem selecionada. O dashboard e o distintivo no item de menu "Fornecimento de dados" apontam para as mesmas competências, usando exatamente o mesmo cálculo.

### 2. Checklist de insumos obrigatórios

Cada obrigação tem o seu checklist (`src/lib/fornecimento/insumos.ts`). Uns insumos são **arquivo**, outros são **formulário curto** preenchido na própria plataforma:

| Obrigação | Insumos obrigatórios |
|---|---|
| **ACAM212** | Cadastro de clientes com KYC resolvido (arquivo) · Operações de câmbio com ativo virtual da competência (arquivo) · Saldos de encerramento (arquivo) · Parâmetros da competência (formulário) |
| **Cadoc 5711** | Datas-base da competência (formulário) · Posição de custódia diária por cliente (arquivo) · Conciliação de custódia própria e de terceiros (formulário) |
| **Cadoc 5710** | Inventário de carteiras e endereços por rede (arquivo) · Posição consolidada por ativo na data-base mensal (arquivo) · Declaração de staking (formulário) · Data-base e fonte de cotação (formulário) |
| **Fiscal / DPS** | Serviços prestados na competência, que viram as DPS (arquivo) · Parâmetros tributários da instituição (formulário) |

Cada cartão de insumo traz a base normativa e um texto de "como fornecer", com o padrão de nome do arquivo e as colunas esperadas.

### 3. Enviar

- **Arquivo** — a dropzone reaproveita o parser de pré-validação: o conteúdo é lido no navegador, conferido contra o layout (nome, competência, instituição, delimitador, cabeçalho, colunas obrigatórias, tipo de cada campo) e mostrado em **pré-visualização**, com a amostra dos registros e as não conformidades encontradas. O lote só entra depois do **aceite explícito**.
- **Formulário** — campos curtos, validados campo a campo. Enquanto faltar campo obrigatório, o insumo fica `parcial`.

### 4. Completude e "O que ainda falta"

A completude é calculada **insumo a insumo e campo a campo**: um insumo só conta como fornecido quando o último envio foi aceito e, em formulário, quando todos os campos obrigatórios estão preenchidos. O painel "O que ainda falta" nomeia cada pendência com o motivo real (nada enviado, envio recusado, envio incompleto, ou a lista nominal dos campos em aberto), junto do prazo regulatório e da contagem regressiva — em vermelho quando vencido ou a até 3 dias.

### 5. Status canônico do lote

Um selo resume o estágio do lote de entrada:

| Status | Quando |
|---|---|
| **Incompleto** | Falta ao menos um insumo obrigatório |
| **Completo, aguardando modelagem** | Todos os insumos obrigatórios chegaram; a Videnas ainda não normalizou |
| **Modelado canonicamente** | O lote foi normalizado no modelo interno que alimenta a geração do arquivo |

Assim que a competência fica completa, a plataforma mostra a **pré-visualização do modelo canônico**: uma tabela normalizada, com as colunas canônicas e uma amostra dos registros, montada a partir do que o cliente forneceu. O status canônico descreve o **lote de entrada** e não substitui o estado da competência (Aguardando dados, Dados recebidos, Gerado, Validada…).

### 6. Lacre e comprovante

Todo envio aceito gera um **lacre** e um **comprovante de envio em JSON**, com o identificador do lacre, o hash SHA-256, o algoritmo, o momento do selo e o responsável. Detalhes na seção [Prova de envio e prova de entrega](#prova-de-envio-e-prova-de-entrega-cadeia-de-custódia).

### Ingestão dentro do módulo: painel de acompanhamento (somente leitura)

A etapa **Ingestão** do detalhe de cada competência (`/app/acam212/[periodoId]`, `/app/cadoc/[periodoId]`, `/app/fiscal/[periodoId]`) é **somente leitura para todos os perfis**: quem fornece insumos é exclusivamente o **Cliente / Fornecedor de dados**, em `/app/fornecimento`. Não existe mais dropzone dentro do módulo, e as ações `subir_dados` e `remover_lote` foram removidas do produto.

O componente `RecepcaoDocumentos` (`src/components/dominio/modulo-recepcao-documentos.tsx`) renderiza sempre o `PainelAcompanhamentoFornecimento` (`src/components/dominio/painel-acompanhamento-fornecimento.tsx`) — completude da competência, checklist de insumos exigidos × fornecidos, o que ainda falta e as evidências de entrada já lacradas pelo Cliente — seguido da tabela **"Arquivos recebidos"**, que lista apenas os lotes que o Cliente enviou e que entraram na competência (arquivo, tamanho, recebido em, canal e o status Aceito), sem coluna de ações nem remoção.

O botão **"Notificar cliente do que falta"** só é renderizado para quem tem a ação `notificar_cliente` — hoje, apenas o **Operacional / Suporte ao cliente** —, e registra um evento `CLIENTE_NOTIFICADO` na trilha de auditoria. O botão-link "Ver fornecimento do cliente" só aparece para quem tem a rota `/app/fornecimento` (Compliance, Operacional e Cliente). O **Executor — Videnas** não acessa essa rota: na Ingestão ele só consulta a completude e os lotes já aceitos. O **Validador** nem vê o painel de fornecimento: entra depois que o arquivo já foi gerado, e "Gerar arquivo" só fica disponível para o Executor quando existe pelo menos um lote na competência.

Os códigos de não conformidade (`ING-E001`…`ING-E024` bloqueantes, `ING-A001`…`ING-A007` avisos) são avaliados **apenas em `/app/fornecimento`**, no ato do envio pelo Cliente, e são **determinísticos**, de propósito, para a demo ser sempre reprodutível. O que não é aceito ali nunca chega à tabela "Arquivos recebidos" do módulo.

A Videnas recebe e estrutura esses dados para o módulo regulatório correspondente, mas a transmissão ao órgão (BCB, prefeitura/Receita) e a responsabilidade pela obrigação continuam sendo da instituição cliente — ver [Posicionamento](#posicionamento).

## Prova de envio e prova de entrega (cadeia de custódia)

### O que é lacrado

Todo envio aceito do Cliente e todo arquivo liberado pela Videnas geram um **lacre** (`RegistroLacre`, em `src/lib/tipos`), com:

- **hash SHA-256** do conteúdo real, calculado com `crypto.subtle.digest` sobre os bytes do arquivo (ou sobre o JSON serializado, no caso de formulário);
- **carimbo de tempo**, autor (nome, id e perfil), instituição, módulo, competência, período e insumo;
- o conteúdo guardado em um **envelope cifrado em AES-GCM**, com vetor de inicialização próprio e identificador de chave;
- o **sentido** do lacre: `entrada` (dado recebido do cliente) ou `saida` (arquivo devolvido pela Videnas);
- o **tipo de artefato** (`tipoArtefato`): insumo do cliente, arquivo entregue, anexo do retorno, recibo do retorno, dossiê de arquivamento, dossiê de escalonamento ao Comitê, ata do Comitê de Qualidade, documento fiscal emitido, comprovante de transmissão, anexo e recibo do protocolo manual ou recibo de encaminhamento ao emissor. Lacres antigos sem o campo são lidos como insumo (entrada) ou arquivo entregue (saída). Os artefatos de retorno e de arquivamento entram na mesma cadeia do período e podem ser filtrados em `/app/evidencias`.

### Encadeamento por `hashAnterior` — nada é sobrescrito

Conteúdo lacrado **nunca é editado nem sobrescrito**. Não existe "corrigir o arquivo enviado": o que foi recebido permanece como foi recebido.

Para corrigir, reenvia-se. O reenvio cria um **lacre novo**, que aponta para o anterior pelo campo `hashAnterior` — é isso que forma a cadeia. Cada elo guarda o hash do elo anterior, então qualquer remoção ou troca no meio da sequência quebra o encadeamento e fica evidente. A competência passa a valer pelo último lacre, mas os anteriores continuam visíveis e auditáveis, com autor, data e hash próprios (mesma lógica das versões substituídas do arquivo gerado).

### Os dois comprovantes

- **Prova de envio** (sentido `entrada`) — o Cliente baixa, a cada insumo aceito, um comprovante em JSON com o hash do que enviou.
- **Prova de entrega** (sentido `saida`) — quando a Videnas libera o arquivo final da competência, o mesmo tipo de evidência é gerado. O Cliente vê o arquivo em `/app/entregas`, com hash, data, quem liberou, o comprovante em JSON e o **próprio arquivo entregue para download**.

O conteúdo do arquivo entregue é montado por `montarConteudoArquivoEntregue` (`src/lib/evidencias/conteudo-arquivo.ts`): um documento completo — XML nos módulos do BCB, coerente com o `schema`/`versão` do arquivo — com cabeçalho (CNPJ, razão social, competência, órgão de destino, identificação e versão do arquivo, totais declarados) e um corpo com registros derivados dos dados da competência. A montagem é **determinística**: a mesma competência produz sempre exatamente os mesmos bytes, sem `Date.now()` nem aleatoriedade.

É sobre **esses bytes** que o SHA-256 do lacre de saída é calculado — nunca sobre um trecho de pré-visualização nem sobre o nome do arquivo. Se o conteúdo não puder ser reconstruído, a prova de entrega **não** é gerada e o motivo aparece na interface, em vez de lacrar um metadado qualquer. Por consequência, existindo lacre de saída, **o hash exibido para aquele arquivo é sempre o do lacre**, em qualquer tela (painel do arquivo, prova de entrega, lista de entregues); o hash determinístico de mock só aparece enquanto o arquivo ainda não foi lacrado.

### Verificação de integridade

Em `/app/entregas` (Cliente e demais perfis com acesso) e em `/app/evidencias` (Compliance, Executor, Validador), o botão **"Verificar integridade"** pede o arquivo que está em mãos, recalcula o SHA-256 **no próprio navegador** e compara com o hash lacrado. Nada é enviado a servidor algum. Confere: o arquivo é byte a byte o mesmo que a Videnas entregou. Não confere: algo mudou desde a entrega. Cada verificação fica registrada com data, hora, resultado e o hash calculado.

O ciclo fecha de verdade nesta demonstração: em `/app/entregas` (e no painel do arquivo, na etapa Entrega do módulo) o botão **"Baixar arquivo"** entrega os bytes reais do documento, como `Blob`, com o nome de `arquivo.nomeArquivo` e o mime do formato. Baixe o arquivo, selecione **esse mesmo arquivo** em "Verificar integridade" e o resultado é **Confere** — o hash recalculado é idêntico ao do lacre. Altere um único caractere e o resultado vira "Não confere".

Entregas semeadas de competências históricas (julho/2026 e anteriores) existem só como lacre — o arquivo correspondente fica no repositório da instituição, não na plataforma. Nessas linhas o download do arquivo não é oferecido; o comprovante e a verificação continuam disponíveis.

### Por que isso existe (motivação de negócio)

O lacre protege **as duas partes**:

- se o cliente alterar a base dele depois do envio e alegar que mandou outros valores, o hash e o carimbo de tempo provam exatamente o que foi recebido;
- quando a Videnas entrega o arquivo que o cliente apresenta aos órgãos reguladores, o hash prova exatamente o que foi devolvido, por quem e quando.

Em uma contestação, em vez de discutir versões de planilha, compara-se hash com hash.

### Ressalva: chave simulada no navegador, KMS/HSM em produção

A criptografia é **real** — Web Crypto API, `crypto.subtle.digest` para o SHA-256 e AES-GCM para o envelope. A ressalva é a **chave**: nesta demonstração ela é derivada localmente no navegador a partir do identificador da instituição (PBKDF2 sobre um material de derivação fixo), e nada sai do dispositivo. **Em produção, essa chave é gerada e custodiada em KMS/HSM**, com rotação, segregação por tenant e registro de uso — o conteúdo lacrado nunca fica legível para quem não tem a chave.

O aviso está na própria interface, junto do comprovante de envio e do detalhe do lacre (constante `AVISO_SIMULACAO_ENVELOPE`, em `src/lib/evidencias/cripto.ts`, e chave de ajuda `evidencia.envelope`). Se o navegador não expuser a Web Crypto API (por exemplo, fora de HTTPS), a plataforma **bloqueia o envio** e explica o motivo, em vez de gravar um lacre sem garantia criptográfica.

## Como testar o fluxo completo

A data de referência do mock é 01/10/2026 (`HOJE_ISO`, em `src/lib/mock/data-referencia.ts`): a competência corrente é Outubro/2026 e a última competência encerrada é Setembro/2026, com vencimentos de 05/10 a 20/10. O mock já vem semeado com uma competência propositalmente incompleta: **`per-meridian-acam212-202610`** (ACAM212, Outubro/2026, Meridian Digital Assets). Dos 4 insumos obrigatórios, só o cadastro de clientes foi fornecido — enviado pela própria Natália, em 01/10/2026. A instituição também já tem lacres de saída semeados (competências de julho/2026), então `/app/entregas` nunca aparece vazia.

1. **Entrar como Cliente** — em `/login`, atalho "Cliente / Fornecedor de dados" (`natalia.queiroz@meridiandigital.com.br`). Siga até `/app`.
2. **Ver o que falta** — no painel, o card **"Dados a fornecer"** lista as competências abertas com pendência, quantos insumos faltam e a contagem regressiva; o card "Pendências de fornecimento" mostra os insumos em aberto, um a um. Clique em "Ir para o fornecimento".
3. **Enviar um arquivo** — em `/app/fornecimento`, com Outubro/2026 do ACAM212 selecionado, envie um CSV em "Operações de câmbio com ativo virtual da competência". Confira a pré-visualização e clique em **Aceitar lote**. O comprovante de envio abre na hora — baixe o JSON e guarde o hash.
4. **Preencher um formulário** — conclua "Parâmetros da competência" (responsável, data do fechamento contábil, operação anulada). Enquanto faltar campo obrigatório, o insumo fica "Parcial" e aparece no painel "O que ainda falta" com os campos nominados.
5. **Acompanhar a completude** — envie também os "Saldos de encerramento". A barra chega a 100%, o selo passa de **Incompleto** para **Completo, aguardando modelagem** e a **pré-visualização do modelo canônico** aparece com a tabela normalizada. Quando a competência avança para `dados_ingeridos`, o selo vira **Modelado canonicamente**.
6. **Gerar e liberar, do lado Videnas** — troque de perfil no header para **Executor** e abra `/app/acam212/per-meridian-acam212-202610`: "Gerar arquivo" e depois "Enviar para validação". Troque para **Validador**: "Executar validação de schema" e, sem erro bloqueante, **"Liberar para o cliente"**.
7. **Lacrar a entrega** — ainda como Videnas, na aba **Entrega** do período liberado, clique em **"Gerar prova de entrega"**. O lacre de saída é calculado sobre o conteúdo completo do arquivo, e o hash que aparece no painel do arquivo passa a ser exatamente o hash do lacre. (Um período já aprovado, como `per-meridian-cadoc5710-202608` em `/app/cadoc`, serve para ver isso sem passar pelas etapas anteriores.)
8. **Voltar como Cliente, baixar e verificar** — o Cliente não está no seletor de perfil do header, então é preciso **sair** (botão "Sair") e **entrar de novo** com `natalia.queiroz@meridiandigital.com.br`, que cai direto em `/app`. Em `/app/entregas`, o arquivo lacrado aparece com hash, data e quem liberou. Clique em **"Baixar arquivo"** e depois em **"Verificar integridade"**, selecionando o arquivo que acabou de baixar: o hash recalculado bate com o do lacre e o resultado é **Confere**. Abra o arquivo, mude um caractere, salve e repita: o resultado vira "não confere".
9. **Conferir a cadeia inteira** — troque para **Compliance** (ou Executor/Validador) e abra `/app/evidencias`: entrada e saída lado a lado, com filtros, badge de sentido, detalhe do lacre (hash completo, algoritmo, identificador da chave, autor) e a linha do tempo do encadeamento por `hashAnterior`.

**Reiniciar o mock**: use o botão **"Reiniciar demo"**, no cabeçalho de `/app` (global, qualquer perfil autenticado) ou o botão **"Reiniciar dados da demonstração"**, no rodapé de `/app/clientes` (só o Administrador o vê) — os dois chamam a mesma ação e zeram tenants, períodos, arquivos, validações, protocolos, exceções, a trilha de auditoria, fornecimentos, lacres e verificações de uma vez, sem deixar estado órfão. Se o usuário logado só existia entre os tenants/usuários provisionados na demo, a sessão é encerrada automaticamente e a tela volta para `/login`. Em código, a ação equivalente é `reiniciarDemo()`, em `src/lib/store/demo.ts`, que chama `useTenantsStore.getState().reiniciarTenants()`, `usePeriodosStore.getState().reiniciarMock()` e `useEvidenciasStore.getState().reiniciarEvidencias()` em sequência. A sessão (`videnas-sessao`) não é zerada — só é encerrada quando o usuário atual deixa de existir na semente.

## Como testar o fluxo de 4 olhos (segregação de funções)

A regra fixa da Videnas é: **quem executa nunca é quem valida**. Para ver isso na prática, use um período em `com_excecoes`, `em_validacao` ou `validado` (por exemplo `per-meridian-acam212-202608`) e alterne perfil no header:

1. **Executor** (ex.: Tomoe Nakamura) — vê e executa `Enviar dados do período`, `Gerar arquivo`, `Enviar para validação`. Nunca vê `Liberar` nem `Aprovar`.
2. **Validador** (ex.: Clarice Veloso) — vê `Executar validação de schema` e, se o resultado não tiver erro bloqueante, `Liberar para o cliente`. Se o usuário ativo for o mesmo que gerou o arquivo, o botão `Liberar` fica **desabilitado** com o tooltip "Quem gerou o arquivo não pode liberá-lo. Segregação de funções obrigatória." — é a forma de demonstrar a trava mesmo dentro do mock.
3. **Compliance** (ex.: Ricardo Menezes) — só depois de `liberado` vê `Aprovar e assumir responsabilidade` habilitado; antes disso o botão aparece desabilitado com o motivo.

Na fase de arquivamento a regra vale em dobro (D17): quem gerou a versão corrente do arquivo e quem registrou o retorno do regulador não arquivam o período; na semente, só Igor Salgado pode. `reabrir` não tem essa trava.

No módulo **Fiscal**, existe uma etapa adicional: depois de `Enviar ao contador`, o perfil **Contador/Fiscal** (João Beraldo) precisa `Confirmar enquadramento fiscal` antes que o Validador possa validar o schema — nenhum outro perfil decide alíquota, retenção ou enquadramento tributário.

Toda ação fica registrada na trilha de auditoria (`/app/auditoria` e na etapa "Auditoria" do detalhe do período), com hash, carimbo de tempo, usuário e payload resumido.

## Posicionamento

> A Videnas é prestadora de serviços tecnológicos (RegTech). Não é instituição financeira, PSAV ou SPSAV, não realiza custódia de ativos virtuais, só emite NFS-e e transmite ao órgão quando isso está no contrato do cliente (e com cadastro prévio válido) e não substitui contador ou advogado. A responsabilidade pela obrigação regulatória perante o Banco Central do Brasil, o município e a Receita Federal é da instituição cliente.

Esse disclaimer aparece no rodapé de todas as telas autenticadas e da landing, em versão longa na landing e em banners de contexto nos módulos Fiscal e de entrega.

## Tutorial interativo

Cada um dos 7 perfis tem um roteiro guiado próprio (`src/components/tutorial/roteiros.ts`), com passos que apontam para elementos reais da tela (`data-tour="..."`) e destacam um deles por vez com um recorte (spotlight) sobre um card explicativo.

- **Disparo automático**: na primeira vez que um perfil fica ativo dentro da sessão (assim que `/app` termina de carregar), o tour correspondente abre sozinho. A marca de "já visto" fica em `sessionStorage`, então recarregar a página não repete o tour, mas uma nova aba/sessão volta a oferecê-lo.
- **Reabrir manualmente**: o ícone de ajuda (**Tutorial**) no header, ao lado do seletor de perfil, reinicia a qualquer momento o roteiro do perfil ativo no momento.
- **Ao trocar de perfil**: o seletor de perfil no header dispara um toast (`sonner`) com a ação "Ver tutorial" oferecendo o roteiro do novo perfil, sem forçar a abertura.
- **Navegação entre telas**: quando um passo pertence a outra rota, o motor do tour navega automaticamente (`useRouter().push`) e só desenha o spotlight depois que o elemento-alvo aparece no DOM; se o alvo nunca aparecer (ex.: estado do mock diferente do esperado), o passo é pulado sozinho em vez de travar.
- **Acessibilidade**: o card é um `role="dialog"` modal, com foco movido para ele ao abrir e devolvido ao elemento anterior ao fechar, foco preso dentro do card, atalhos de teclado (`Esc` fecha, `→`/`Enter` avança, `←` volta) e alvos de toque ≥ 44px. Em telas estreitas o card vira uma folha inferior. Respeita `prefers-reduced-motion` (sem animação do spotlight quando ativado).

Roteiros cobertos:

| Perfil | O que o tour ensina |
|---|---|
| **Operacional/Suporte ao cliente** (8 passos) | Onde ver pendências no dashboard → navegar ao módulo → abrir período `aguardando_dados` → entender o stepper de 5 etapas → painel de acompanhamento do fornecimento do cliente → notificar o cliente do que falta → histórico de arquivos recebidos |
| **Compliance** (8 passos) | Prazos e pendências no dashboard → abrir o detalhe de uma competência com exceções → conferir o arquivo gerado (hash SHA-256, schema) → segregação de funções na auditoria → aprovar e assumir responsabilidade → registrar o protocolo do BCB na entrega → calendário regulatório |
| **Contador/Fiscal** (6 passos) | Por que só o Fiscal aparece para esse perfil → selo "Candidato" e o limite de que a emissão da NFS-e depende do contrato do cliente → DPS aguardando validação → conferir alíquota, retenção e enquadramento → confirmar ou devolver |
| **Cliente / Fornecedor de dados** (8 passos) | Identidade estática no header (nome · instituição · papel), o pré-cadastro pelo operador do tenant e por que a superfície desse perfil é reduzida → card "Dados a fornecer" no dashboard → item de menu Fornecimento de dados e o distintivo de pendências → painel de completude e status canônico → painel "O que ainda falta" → checklist de insumos e o lacre de cada envio → arquivos entregues com hash → verificar integridade antes de encaminhar ao regulador |
| **Executor (Videnas)** (8 passos) | Fila multi-tenant em `/app/operacao` → troca de instituição sem sair da tela → por que a etapa Ingestão dele é o painel de acompanhamento do fornecimento do Cliente, e não uma dropzone → gerar o arquivo a partir do que o Cliente entregou → hash e log de geração → enviar para validação → por que o botão "Liberar" nunca aparece para esse perfil |
| **Validador (Videnas)** (7 passos) | Fila multi-tenant → executar a validação de schema → ler erros/avisos com código → liberar para o cliente → a trava de segregação de funções (quem gerou não libera) → por que "Gerar" nunca aparece para esse perfil |
| **Administrador (Videnas)** (10 passos) | O que o perfil faz e o que deliberadamente não faz (não sobe dados, não gera, não valida, não libera) → painel da carteira em vez de prazos regulatórios → o menu Clientes, exclusivo desse perfil → os quatro status de implantação e o que dispara cada transição → Compliance e responsável pelo envio como colunas da carteira → cadastrar um cliente novo → o que o formulário exige (CNPJ único, ao menos um módulo, Compliance obrigatório) → a ficha do cliente (identificação, CNPJ, status de implantação, entrada na carteira) → usuários e papéis do tenant e o limite do Administrador (só reenvia convites) → suspender preservando a trilha |

## Design system

Ver [`DESIGN.md`](./DESIGN.md) para paleta, tipografia, raios, sombras e onde os tokens vivem.

---

Este repositório mantém os arquivos `AGENTS.md`/`CLAUDE.md` gerados automaticamente pelo Next.js (regras de agente específicas desta versão do framework) — não os remova.
