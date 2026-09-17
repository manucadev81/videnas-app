# Videnas — Mockup Front-end

Mockup de front-end (Next.js 16 + React 19) da Videnas, uma RegTech de conformidade regulatória para instituições brasileiras que operam com criptoativos (SPSAVs, exchanges, custodiantes, mesas de OTC). Cobre os módulos **ACAM212**, **Cadoc 5711/5710** e **Fiscal (NFS-e/DPS, candidato)**.

**Este projeto é 100% mockado**: não há backend, API routes, autenticação real, `fetch` de rede ou banco de dados. Todo o estado (sessão, perfil ativo, períodos regulatórios, arquivos, validações, exceções, trilha de auditoria, fornecimentos e lacres criptográficos) vive em stores Zustand no navegador.

Dois recortes desse estado são persistidos em `localStorage`, para a demonstração sobreviver a um reload: a sessão (`videnas-sessao`) e as evidências criptográficas — fornecimentos, lacres e verificações (`videnas-evidencias`). O restante (períodos, eventos, exceções) vive em memória e volta à semente a cada reload. A única exceção real à regra "nada de rede" é a criptografia: os hashes SHA-256 e o envelope AES-GCM são calculados de verdade, pela Web Crypto API do próprio navegador, sem sair do dispositivo.

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
| `/selecionar-instituicao` | Escolha de instituição (tenant) e simulação de perfil — **não se aplica ao perfil Cliente / Fornecedor de dados**, que entra direto em `/app` |
| `/onboarding` | Wizard guiado de configuração do ambiente (7 etapas) |
| `/app` | Dashboard — visão consolidada por perfil |
| `/app/fornecimento` | Fornecimento de dados por checklist de insumos — **Cliente** envia; Diretor, Operacional, Executor e Validador entram em modo consulta |
| `/app/entregas` | Arquivos entregues pela Videnas, com hash, download do arquivo lacrado e verificação de integridade — Cliente, Diretor, Operacional, Executor e Validador |
| `/app/evidencias` | Cadeia de custódia completa (entrada e saída) — Diretor/Compliance, Executor e Validador |
| `/app/acam212` e `/app/acam212/[periodoId]` | Lista e detalhe de competências ACAM212 |
| `/app/cadoc` e `/app/cadoc/[periodoId]` | Lista e detalhe de competências Cadoc 5711/5710 |
| `/app/fiscal` e `/app/fiscal/[periodoId]` | Lista e detalhe de competências Fiscal (DPS) |
| `/app/calendario` | Calendário regulatório |
| `/app/auditoria` | Trilha de auditoria transversal |
| `/app/operacao` | Fila de trabalho multi-tenant (Executor/Validador) |
| `/app/configuracoes/instituicao` | Dados cadastrais e módulos contratados |
| `/app/configuracoes/usuarios` | Usuários, papéis e matriz de permissões |
| `/app/configuracoes/dicionarios` | Dicionários de ativos, contas/carteiras, KYC, fiscal e países |

## Perfis

São **6 perfis**, três deles com papéis facilmente confundíveis entre si. A definição canônica está em `src/lib/permissoes.ts` (`PERFIS`), com rotas e ações permitidas por perfil.

| Perfil | Lado | O que faz | Multi-tenant |
|---|---|---|---|
| **Diretor / Compliance Responsável** (`diretor`) | Cliente | Aprova a competência, assume a responsabilidade perante o BCB, revisa exceções e acessa a cadeia de custódia | Não |
| **Operacional / Backoffice** (`operacional`) | Cliente | **Opera o pipeline** do lado da instituição: ingestão dentro dos módulos, tratamento de exceções, dicionários | Não |
| **Cliente / Fornecedor de dados** (`cliente`) | Cliente | **Fornece os dados de origem** por checklist de insumos e retira os arquivos lacrados | Não |
| **Contador / Fiscal** (`contador`) | Cliente | Confirma alíquota de ISS, retenção e enquadramento tributário — só no módulo Fiscal | Não |
| **Executor — Videnas** (`executor`) | Videnas | Roda a ingestão e gera os arquivos. Nunca libera | Sim |
| **Validador — Videnas** (`validador`) | Videnas | Valida o schema e libera para o cliente. Nunca gera | Sim |

### Cliente ≠ Operacional

Essa distinção é deliberada e é a decisão de produto mais importante do fluxo novo:

- O **Cliente / Fornecedor de dados** é quem **fornece** os insumos brutos. Ele entra em `/app/fornecimento`, vê o checklist de insumos obrigatórios da competência, envia arquivos, preenche formulários curtos e baixa comprovantes. É só isso.
- O **Operacional / Backoffice** é quem **opera** o pipeline do lado da instituição: ingestão dentro do detalhe de cada módulo, tratamento de exceções e manutenção dos dicionários.

Por isso a superfície do Cliente é **reduzida de propósito**: `/app`, `/app/fornecimento`, `/app/entregas` e `/app/calendario`. Sem módulos, sem auditoria, sem configurações, sem fila de operação. As ações liberadas são `fornecer_dados`, `baixar_comprovante`, `baixar_arquivo` e `verificar_integridade`.

`/app/fornecimento` abre em **modo consulta** para os demais perfis: eles acompanham a completude e o histórico, mas o envio é sempre do Cliente.

### O Cliente é pré-cadastrado pelo operador do tenant

O Cliente / Fornecedor de dados não se autocadastra e não escolhe onde trabalhar. A instituição e a **pessoa responsável pelo envio de dados** são cadastradas antes, pelo operador do tenant, em `/app/configuracoes/usuarios` (seção **"Responsáveis pelo envio de dados"**, botão "Designar responsável"). O vínculo aparece em somente leitura em `/app/configuracoes/instituicao`, na seção "Responsável pelo envio de dados".

Consequências no produto:

- Ao entrar, o Cliente vai **direto para `/app`**, sem passar por `/selecionar-instituicao` (a rota nem consta em `rotasPermitidas` desse perfil, e a tela redireciona sozinha se alguém chegar nela).
- O header dele **não tem seletor de instituição nem simulador de perfil**: mostra uma **identidade estática** (`src/components/dominio/identidade-usuario.tsx`) no formato nome · instituição · papel — por exemplo "Natália Queiroz · Meridian Digital Assets · Cliente / Fornecedor de dados" — além do botão Sair.
- O Cliente **não aparece no simulador de perfis** (`PERFIS_SIMULAVEIS`, em `src/lib/permissoes.ts`, filtra os perfis com `contextoFixo`), justamente para ninguém cair nesse perfil por simulação e ficar sem saída.

## Como trocar de perfil e de instituição no mock

Não existe autenticação real: qualquer e-mail e senha entram no ambiente de demonstração.

1. Em `/login`, use um dos **6 atalhos de demonstração** (ou digite qualquer e-mail — cai automaticamente no perfil Operacional/Backoffice da Meridian Digital Assets, com um toast avisando que o e-mail não foi reconhecido):

   | Atalho | E-mail | Instituição |
   |---|---|---|
   | Diretor / Compliance | `ricardo.menezes@meridiandigital.com.br` | Meridian Digital Assets |
   | Operacional / Backoffice | `paula.arantes@meridiandigital.com.br` | Meridian Digital Assets |
   | **Cliente / Fornecedor de dados** | `natalia.queiroz@meridiandigital.com.br` | Meridian Digital Assets |
   | Contador / Fiscal | `joao.beraldo@contabilberaldo.com.br` | Atende os 3 tenants |
   | Executor | `t.nakamura@videnas.com.br` | Videnas |
   | Validador | `c.veloso@videnas.com.br` | Videnas |

   O usuário do perfil Cliente é **Natália Queiroz**, analista de dados regulatórios da Meridian Digital Assets (`usr-natalia`, em `src/lib/mock/usuarios.ts`).

2. Em `/selecionar-instituicao`, é possível **simular os 5 perfis simuláveis** (Diretor/Compliance, Operacional/Backoffice e Contador/Fiscal — lado cliente; Executor e Validador — lado Videnas) e escolher a instituição de trabalho entre as 3 do mock: Meridian Digital Assets (exchange), Cofre Atlântico (custodiante) e Pampulha Capital (mesa OTC, com onboarding incompleto). O **Cliente / Fornecedor de dados não está nessa lista**: por ser pré-cadastrado pelo operador do tenant, só se chega a ele pelo atalho de login próprio — `natalia.queiroz@meridiandigital.com.br` (Meridian Digital Assets) ou `diego.vasconcelos@cofreatlantico.com.br` (Cofre Atlântico, `usr-diego`), que entram direto em `/app`.
3. Depois de entrar em `/app`, o **header** expõe os dois seletores (instituição e perfil) para trocar de contexto sem precisar sair da aplicação — exceto para o Cliente, que vê apenas a identidade estática (nome · instituição · papel). Perfis do lado cliente veem só a própria instituição; Executor e Validador podem alternar entre as 3 ou escolher "Todas as instituições" (que leva à fila de operação em `/app/operacao`).

Trocar de perfil **não recarrega dados** — apenas reavalia permissões e re-renderiza as ações disponíveis em cada tela, o que é a base para demonstrar a segregação de funções abaixo.

## Como o cliente envia os documentos

O caminho principal é o perfil **Cliente / Fornecedor de dados**, em `/app/fornecimento`. O fluxo antigo, de upload solto dentro da etapa Ingestão de cada módulo (perfil Operacional), continua existindo e está descrito no fim desta seção.

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

### Fluxo antigo: ingestão dentro do módulo (perfil Operacional)

O perfil **Operacional / Backoffice** continua com a ação `subir_dados` na etapa **Ingestão** do detalhe de cada competência (`/app/acam212/[periodoId]`, `/app/cadoc/[periodoId]`, `/app/fiscal/[periodoId]`), pelo componente `RecepcaoDocumentos` (`src/components/dominio/modulo-recepcao-documentos.tsx`). Ali o operador baixa o modelo CSV, arrasta os arquivos, confere a pré-visualização e aceita lote a lote. Os códigos de não conformidade (`ING-E001`…`ING-E024` bloqueantes, `ING-A001`…`ING-A007` avisos) são os mesmos nos dois caminhos e são **determinísticos**, de propósito, para a demo ser sempre reprodutível.

A Videnas recebe e estrutura esses dados para o módulo regulatório correspondente, mas a transmissão ao órgão (BCB, prefeitura/Receita) e a responsabilidade pela obrigação continuam sendo da instituição cliente — ver [Posicionamento](#posicionamento).

## Prova de envio e prova de entrega (cadeia de custódia)

### O que é lacrado

Todo envio aceito do Cliente e todo arquivo liberado pela Videnas geram um **lacre** (`RegistroLacre`, em `src/lib/tipos`), com:

- **hash SHA-256** do conteúdo real, calculado com `crypto.subtle.digest` sobre os bytes do arquivo (ou sobre o JSON serializado, no caso de formulário);
- **carimbo de tempo**, autor (nome, id e perfil), instituição, módulo, competência, período e insumo;
- o conteúdo guardado em um **envelope cifrado em AES-GCM**, com vetor de inicialização próprio e identificador de chave;
- o **sentido** do lacre: `entrada` (dado recebido do cliente) ou `saida` (arquivo devolvido pela Videnas).

### Encadeamento por `hashAnterior` — nada é sobrescrito

Conteúdo lacrado **nunca é editado nem sobrescrito**. Não existe "corrigir o arquivo enviado": o que foi recebido permanece como foi recebido.

Para corrigir, reenvia-se. O reenvio cria um **lacre novo**, que aponta para o anterior pelo campo `hashAnterior` — é isso que forma a cadeia. Cada elo guarda o hash do elo anterior, então qualquer remoção ou troca no meio da sequência quebra o encadeamento e fica evidente. A competência passa a valer pelo último lacre, mas os anteriores continuam visíveis e auditáveis, com autor, data e hash próprios (mesma lógica das versões substituídas do arquivo gerado).

### Os dois comprovantes

- **Prova de envio** (sentido `entrada`) — o Cliente baixa, a cada insumo aceito, um comprovante em JSON com o hash do que enviou.
- **Prova de entrega** (sentido `saida`) — quando a Videnas libera o arquivo final da competência, o mesmo tipo de evidência é gerado. O Cliente vê o arquivo em `/app/entregas`, com hash, data, quem liberou, o comprovante em JSON e o **próprio arquivo entregue para download**.

O conteúdo do arquivo entregue é montado por `montarConteudoArquivoEntregue` (`src/lib/evidencias/conteudo-arquivo.ts`): um documento completo — XML nos módulos do BCB, coerente com o `schema`/`versão` do arquivo — com cabeçalho (CNPJ, razão social, competência, órgão de destino, identificação e versão do arquivo, totais declarados) e um corpo com registros derivados dos dados da competência. A montagem é **determinística**: a mesma competência produz sempre exatamente os mesmos bytes, sem `Date.now()` nem aleatoriedade.

É sobre **esses bytes** que o SHA-256 do lacre de saída é calculado — nunca sobre um trecho de pré-visualização nem sobre o nome do arquivo. Se o conteúdo não puder ser reconstruído, a prova de entrega **não** é gerada e o motivo aparece na interface, em vez de lacrar um metadado qualquer. Por consequência, existindo lacre de saída, **o hash exibido para aquele arquivo é sempre o do lacre**, em qualquer tela (painel do arquivo, prova de entrega, lista de entregues); o hash determinístico de mock só aparece enquanto o arquivo ainda não foi lacrado.

### Verificação de integridade

Em `/app/entregas` (Cliente e demais perfis com acesso) e em `/app/evidencias` (Diretor, Executor, Validador), o botão **"Verificar integridade"** pede o arquivo que está em mãos, recalcula o SHA-256 **no próprio navegador** e compara com o hash lacrado. Nada é enviado a servidor algum. Confere: o arquivo é byte a byte o mesmo que a Videnas entregou. Não confere: algo mudou desde a entrega. Cada verificação fica registrada com data, hora, resultado e o hash calculado.

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

O mock já vem semeado com uma competência propositalmente incompleta: **`per-meridian-acam212-202609`** (ACAM212, Setembro/2026, Meridian Digital Assets). Dos 4 insumos obrigatórios, só o cadastro de clientes foi fornecido — enviado pela própria Natália, em 15/09/2026. A instituição também já tem lacres de saída semeados (competências de julho/2026), então `/app/entregas` nunca aparece vazia.

1. **Entrar como Cliente** — em `/login`, atalho "Cliente / Fornecedor de dados" (`natalia.queiroz@meridiandigital.com.br`). Siga até `/app`.
2. **Ver o que falta** — no painel, o card **"Dados a fornecer"** lista as competências abertas com pendência, quantos insumos faltam e a contagem regressiva; o card "Pendências de fornecimento" mostra os insumos em aberto, um a um. Clique em "Ir para o fornecimento".
3. **Enviar um arquivo** — em `/app/fornecimento`, com Setembro/2026 do ACAM212 selecionado, envie um CSV em "Operações de câmbio com ativo virtual da competência". Confira a pré-visualização e clique em **Aceitar lote**. O comprovante de envio abre na hora — baixe o JSON e guarde o hash.
4. **Preencher um formulário** — conclua "Parâmetros da competência" (responsável, data do fechamento contábil, operação anulada). Enquanto faltar campo obrigatório, o insumo fica "Parcial" e aparece no painel "O que ainda falta" com os campos nominados.
5. **Acompanhar a completude** — envie também os "Saldos de encerramento". A barra chega a 100%, o selo passa de **Incompleto** para **Completo, aguardando modelagem** e a **pré-visualização do modelo canônico** aparece com a tabela normalizada. Quando a competência avança para `dados_ingeridos`, o selo vira **Modelado canonicamente**.
6. **Gerar e liberar, do lado Videnas** — troque de perfil no header para **Executor** e abra `/app/acam212/per-meridian-acam212-202609`: "Gerar arquivo" e depois "Enviar para validação". Troque para **Validador**: "Executar validação de schema" e, sem erro bloqueante, **"Liberar para o cliente"**.
7. **Lacrar a entrega** — ainda como Videnas, na aba **Entrega** do período liberado, clique em **"Gerar prova de entrega"**. O lacre de saída é calculado sobre o conteúdo completo do arquivo, e o hash que aparece no painel do arquivo passa a ser exatamente o hash do lacre. (Um período já aprovado, como `per-meridian-cadoc5710-202608` em `/app/cadoc`, serve para ver isso sem passar pelas etapas anteriores.)
8. **Voltar como Cliente, baixar e verificar** — o Cliente não está no seletor de perfil do header, então é preciso **sair** (botão "Sair") e **entrar de novo** com `natalia.queiroz@meridiandigital.com.br`, que cai direto em `/app`. Em `/app/entregas`, o arquivo lacrado aparece com hash, data e quem liberou. Clique em **"Baixar arquivo"** e depois em **"Verificar integridade"**, selecionando o arquivo que acabou de baixar: o hash recalculado bate com o do lacre e o resultado é **Confere**. Abra o arquivo, mude um caractere, salve e repita: o resultado vira "não confere".
9. **Conferir a cadeia inteira** — troque para **Diretor / Compliance** (ou Executor/Validador) e abra `/app/evidencias`: entrada e saída lado a lado, com filtros, badge de sentido, detalhe do lacre (hash completo, algoritmo, identificador da chave, autor) e a linha do tempo do encadeamento por `hashAnterior`.

**Reiniciar o mock**: não há botão de reset na interface. Como fornecimentos, lacres e verificações são persistidos, apague as chaves `videnas-evidencias` e `videnas-sessao` do `localStorage` (DevTools → Application → Local Storage) e recarregue — tudo volta à semente. Em código, a ação equivalente é `useEvidenciasStore.getState().reiniciarEvidencias()`.

## Como testar o fluxo de 4 olhos (segregação de funções)

A regra fixa da Videnas é: **quem executa nunca é quem valida**. Para ver isso na prática, use um período em `com_excecoes`, `em_validacao` ou `validado` (por exemplo `per-meridian-acam212-202608`) e alterne perfil no header:

1. **Executor** (ex.: Tomoe Nakamura) — vê e executa `Enviar dados do período`, `Gerar arquivo`, `Enviar para validação`. Nunca vê `Liberar` nem `Aprovar`.
2. **Validador** (ex.: Clarice Veloso) — vê `Executar validação de schema` e, se o resultado não tiver erro bloqueante, `Liberar para o cliente`. Se o usuário ativo for o mesmo que gerou o arquivo, o botão `Liberar` fica **desabilitado** com o tooltip "Quem gerou o arquivo não pode liberá-lo. Segregação de funções obrigatória." — é a forma de demonstrar a trava mesmo dentro do mock.
3. **Diretor/Compliance** (ex.: Ricardo Menezes) — só depois de `liberado` vê `Aprovar e assumir responsabilidade` habilitado; antes disso o botão aparece desabilitado com o motivo.

No módulo **Fiscal**, existe uma etapa adicional: depois de `Enviar ao contador`, o perfil **Contador/Fiscal** (João Beraldo) precisa `Confirmar enquadramento fiscal` antes que o Validador possa validar o schema — nenhum outro perfil decide alíquota, retenção ou enquadramento tributário.

Toda ação fica registrada na trilha de auditoria (`/app/auditoria` e na etapa "Auditoria" do detalhe do período), com hash, carimbo de tempo, usuário e payload resumido.

## Posicionamento

> A Videnas é prestadora de serviços tecnológicos (RegTech). Não é instituição financeira, PSAV ou SPSAV, não realiza custódia de ativos virtuais, não emite NFS-e e não substitui contador ou advogado. A responsabilidade pela obrigação regulatória perante o Banco Central do Brasil, o município e a Receita Federal é da instituição cliente.

Esse disclaimer aparece no rodapé de todas as telas autenticadas e da landing, em versão longa na landing e em banners de contexto nos módulos Fiscal e de entrega.

## Tutorial interativo

Cada um dos 6 perfis tem um roteiro guiado próprio (`src/components/tutorial/roteiros.ts`), com passos que apontam para elementos reais da tela (`data-tour="..."`) e destacam um deles por vez com um recorte (spotlight) sobre um card explicativo.

- **Disparo automático**: na primeira vez que um perfil fica ativo dentro da sessão (assim que `/app` termina de carregar), o tour correspondente abre sozinho. A marca de "já visto" fica em `sessionStorage`, então recarregar a página não repete o tour, mas uma nova aba/sessão volta a oferecê-lo.
- **Reabrir manualmente**: o ícone de ajuda (**Tutorial**) no header, ao lado do seletor de perfil, reinicia a qualquer momento o roteiro do perfil ativo no momento.
- **Ao trocar de perfil**: o seletor de perfil no header dispara um toast (`sonner`) com a ação "Ver tutorial" oferecendo o roteiro do novo perfil, sem forçar a abertura.
- **Navegação entre telas**: quando um passo pertence a outra rota, o motor do tour navega automaticamente (`useRouter().push`) e só desenha o spotlight depois que o elemento-alvo aparece no DOM; se o alvo nunca aparecer (ex.: estado do mock diferente do esperado), o passo é pulado sozinho em vez de travar.
- **Acessibilidade**: o card é um `role="dialog"` modal, com foco movido para ele ao abrir e devolvido ao elemento anterior ao fechar, foco preso dentro do card, atalhos de teclado (`Esc` fecha, `→`/`Enter` avança, `←` volta) e alvos de toque ≥ 44px. Em telas estreitas o card vira uma folha inferior. Respeita `prefers-reduced-motion` (sem animação do spotlight quando ativado).

Roteiros cobertos:

| Perfil | O que o tour ensina |
|---|---|
| **Operacional/Backoffice** (9 passos) | Onde ver pendências no dashboard → navegar ao módulo → abrir período `aguardando_dados` → entender o stepper de 5 etapas → baixar o modelo CSV → área de upload e pré-validação → tabela de arquivos recebidos → confirmar o envio dos dados |
| **Diretor/Compliance** (8 passos) | Prazos e pendências no dashboard → abrir o detalhe de uma competência com exceções → conferir o arquivo gerado (hash SHA-256, schema) → segregação de funções na auditoria → aprovar e assumir responsabilidade → registrar o protocolo do BCB na entrega → calendário regulatório |
| **Contador/Fiscal** (6 passos) | Por que só o Fiscal aparece para esse perfil → selo "Candidato" e o limite de que a Videnas não emite NFS-e → DPS aguardando validação → conferir alíquota, retenção e enquadramento → confirmar ou devolver |
| **Cliente / Fornecedor de dados** (8 passos) | Identidade estática no header (nome · instituição · papel), o pré-cadastro pelo operador do tenant e por que a superfície desse perfil é reduzida → card "Dados a fornecer" no dashboard → item de menu Fornecimento de dados e o distintivo de pendências → painel de completude e status canônico → painel "O que ainda falta" → checklist de insumos e o lacre de cada envio → arquivos entregues com hash → verificar integridade antes de encaminhar ao regulador |
| **Executor (Videnas)** (7 passos) | Fila multi-tenant em `/app/operacao` → troca de instituição sem sair da tela → rodar a ingestão e gerar o arquivo → hash e log de geração → enviar para validação → por que o botão "Liberar" nunca aparece para esse perfil |
| **Validador (Videnas)** (7 passos) | Fila multi-tenant → executar a validação de schema → ler erros/avisos com código → liberar para o cliente → a trava de segregação de funções (quem gerou não libera) → por que "Gerar" nunca aparece para esse perfil |

## Design system

Ver [`DESIGN.md`](./DESIGN.md) para paleta, tipografia, raios, sombras e onde os tokens vivem.

---

Este repositório mantém os arquivos `AGENTS.md`/`CLAUDE.md` gerados automaticamente pelo Next.js (regras de agente específicas desta versão do framework) — não os remova.
