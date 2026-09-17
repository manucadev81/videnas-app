# Sentinellus — Mockup Front-end

Mockup de front-end (Next.js 16 + React 19) da Sentinellus, uma RegTech de conformidade regulatória para instituições brasileiras que operam com criptoativos (SPSAVs, exchanges, custodiantes, mesas de OTC). Cobre os módulos **ACAM212**, **Cadoc 5711/5710** e **Fiscal (NFS-e/DPS, candidato)**.

**Este projeto é 100% mockado**: não há backend, API routes, autenticação real, `fetch` de rede ou banco de dados. Todo o estado (sessão, perfil ativo, períodos regulatórios, arquivos, validações, exceções, trilha de auditoria) vive em memória, em stores Zustand, e é reiniciado a cada reload da página.

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
| `/selecionar-instituicao` | Escolha de instituição (tenant) e simulação de perfil |
| `/onboarding` | Wizard guiado de configuração do ambiente (7 etapas) |
| `/app` | Dashboard — visão consolidada por perfil |
| `/app/acam212` e `/app/acam212/[periodoId]` | Lista e detalhe de competências ACAM212 |
| `/app/cadoc` e `/app/cadoc/[periodoId]` | Lista e detalhe de competências Cadoc 5711/5710 |
| `/app/fiscal` e `/app/fiscal/[periodoId]` | Lista e detalhe de competências Fiscal (DPS) |
| `/app/calendario` | Calendário regulatório |
| `/app/auditoria` | Trilha de auditoria transversal |
| `/app/operacao` | Fila de trabalho multi-tenant (Executor/Validador) |
| `/app/configuracoes/instituicao` | Dados cadastrais e módulos contratados |
| `/app/configuracoes/usuarios` | Usuários, papéis e matriz de permissões |
| `/app/configuracoes/dicionarios` | Dicionários de ativos, contas/carteiras, KYC, fiscal e países |

## Como trocar de perfil e de instituição no mock

Não existe autenticação real: qualquer e-mail e senha entram no ambiente de demonstração.

1. Em `/login`, use um dos 5 atalhos de demonstração (ou digite qualquer e-mail — cai automaticamente no perfil Operacional/Backoffice da Meridian Digital Assets, com um toast avisando que o e-mail não foi reconhecido).
2. Em `/selecionar-instituicao`, é possível **simular qualquer um dos 5 perfis** (Diretor/Compliance, Operacional/Backoffice, Contador/Fiscal — lado cliente; Executor e Validador — lado Sentinellus) e escolher a instituição de trabalho entre as 3 do mock: Meridian Digital Assets (exchange), Cofre Atlântico (custodiante) e Pampulha Capital (mesa OTC, com onboarding incompleto).
3. Depois de entrar em `/app`, o **header** sempre expõe os dois seletores (instituição e perfil) para trocar de contexto sem precisar sair da aplicação. Perfis do lado cliente veem só a própria instituição; Executor e Validador podem alternar entre as 3 ou escolher "Todas as instituições" (que leva à fila de operação em `/app/operacao`).

Trocar de perfil **não recarrega dados** — apenas reavalia permissões e re-renderiza as ações disponíveis em cada tela, o que é a base para demonstrar a segregação de funções abaixo.

## Como o cliente envia os documentos

Quem sobe os dados de origem, do lado do cliente, é o perfil **Operacional/Backoffice** (`operacional`). É o único perfil "cliente" com a ação `subir_dados` liberada (ver `src/lib/permissoes.ts`): Diretor/Compliance só aprova e responde perante o BCB, e Contador/Fiscal só confirma enquadramento tributário — nenhum dos dois tem `subir_dados` em `acoesPermitidas`. Do lado Sentinellus, o Executor também carrega `subir_dados` na sua lista de ações (para poder operar em nome do cliente quando necessário), mas o fluxo abaixo descreve o caminho normal, pelo cliente.

O upload fica na primeira aba do detalhe do período — etapa **"Ingestão"** (`ingestao`), a primeira do stepper em todos os módulos —, renderizada pelo componente `RecepcaoDocumentos` (`src/components/dominio/modulo-recepcao-documentos.tsx`) dentro de `DetalhePeriodo`. As rotas são `/app/acam212/[periodoId]`, `/app/cadoc/[periodoId]` e `/app/fiscal/[periodoId]`. Para testar com um período parado em "aguardando dados", use por exemplo:

- `/app/acam212/per-meridian-acam212-202609` (ACAM212, Setembro/2026)
- `/app/cadoc/per-meridian-cadoc5711-202609` (Cadoc 5711, Setembro/2026)
- `/app/cadoc/per-meridian-cadoc5710-202609` (Cadoc 5710, Setembro/2026)

Com o perfil Operacional ativo, o passo a passo é:

1. **Baixar modelo (CSV)** — no card "Layout esperado do arquivo", o botão gera um CSV com o cabeçalho das colunas esperadas do módulo e uma linha de exemplo (`modelo_<moduloId>.csv`).
2. **Arrastar ou selecionar o arquivo** — no card "Enviar arquivos", a dropzone aceita `.csv`, `.xlsx` ou `.txt`, um ou vários arquivos por vez (por drag-and-drop ou clique).
3. **Pré-validação automática** — cada arquivo passa por `recebido` → `em pré-validação` (~650ms) → `aceito` ou `rejeitado` (~1500ms depois), sem nenhuma ação manual.
4. **Tabela de arquivos recebidos** — lista tanto os lotes já confirmados (histórico) quanto os pendentes da sessão atual, com status, motivo do erro quando rejeitado, e um botão para remover pendentes antes de confirmar.
5. **Confirmar envio dos dados** — no card "Resumo da pré-validação", com contagem de arquivos aceitos/rejeitados e linhas reconhecidas/com pendência. O botão só habilita quando há ao menos um arquivo aceito e nenhum ainda em processamento. Ao confirmar, o período sai de `aguardando_dados` (ou permanece em `dados_ingeridos` se já havia lote) e os arquivos aceitos entram no histórico de lotes da competência.

A pré-validação (`prevalidarArquivo`, no mesmo componente) é **determinística** — não usa nada aleatório, propositalmente, para a demo ser sempre reprodutível:

| Código | Quando dispara | Mensagem |
|---|---|---|
| `ING-E001` | Extensão do arquivo fora de `.csv`, `.xlsx`, `.txt` | Formato não aceito ("ext"). Envie um arquivo .csv, .xlsx ou .txt. |
| `ING-E003` | Nome do arquivo contém a substring `erro` (case-insensitive) | Coluna obrigatória "&lt;primeira coluna do módulo&gt;" ausente na linha 1. |

Quando o arquivo é aceito, o número de linhas reconhecidas é derivado do tamanho do arquivo (bytes ÷ 180, arredondado) e a quantidade de linhas "com pendência" é derivada da soma dos códigos de caractere do nome do arquivo (`% 7`) — ou seja, o mesmo arquivo (mesmo nome e tamanho) sempre produz o mesmo resultado.

A Sentinellus recebe e estrutura esses dados para o módulo regulatório correspondente, mas a transmissão ao órgão (BCB, prefeitura/Receita) e a responsabilidade pela obrigação continuam sendo da instituição cliente — ver [Posicionamento](#posicionamento).

## Como testar o fluxo de 4 olhos (segregação de funções)

A regra fixa da Sentinellus é: **quem executa nunca é quem valida**. Para ver isso na prática, use um período em `com_excecoes`, `em_validacao` ou `validado` (por exemplo `per-meridian-acam212-202608`) e alterne perfil no header:

1. **Executor** (ex.: Tomoe Nakamura) — vê e executa `Enviar dados do período`, `Gerar arquivo`, `Enviar para validação`. Nunca vê `Liberar` nem `Aprovar`.
2. **Validador** (ex.: Clarice Veloso) — vê `Executar validação de schema` e, se o resultado não tiver erro bloqueante, `Liberar para o cliente`. Se o usuário ativo for o mesmo que gerou o arquivo, o botão `Liberar` fica **desabilitado** com o tooltip "Quem gerou o arquivo não pode liberá-lo. Segregação de funções obrigatória." — é a forma de demonstrar a trava mesmo dentro do mock.
3. **Diretor/Compliance** (ex.: Ricardo Menezes) — só depois de `liberado` vê `Aprovar e assumir responsabilidade` habilitado; antes disso o botão aparece desabilitado com o motivo.

No módulo **Fiscal**, existe uma etapa adicional: depois de `Enviar ao contador`, o perfil **Contador/Fiscal** (João Beraldo) precisa `Confirmar enquadramento fiscal` antes que o Validador possa validar o schema — nenhum outro perfil decide alíquota, retenção ou enquadramento tributário.

Toda ação fica registrada na trilha de auditoria (`/app/auditoria` e na etapa "Auditoria" do detalhe do período), com hash, carimbo de tempo, usuário e payload resumido.

## Posicionamento

> A Sentinellus é prestadora de serviços tecnológicos (RegTech). Não é instituição financeira, PSAV ou SPSAV, não realiza custódia de ativos virtuais, não emite NFS-e e não substitui contador ou advogado. A responsabilidade pela obrigação regulatória perante o Banco Central do Brasil, o município e a Receita Federal é da instituição cliente.

Esse disclaimer aparece no rodapé de todas as telas autenticadas e da landing, em versão longa na landing e em banners de contexto nos módulos Fiscal e de entrega.

## Tutorial interativo

Cada um dos 5 perfis tem um roteiro guiado próprio (`src/components/tutorial/roteiros.ts`), com passos que apontam para elementos reais da tela (`data-tour="..."`) e destacam um deles por vez com um recorte (spotlight) sobre um card explicativo.

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
| **Contador/Fiscal** (6 passos) | Por que só o Fiscal aparece para esse perfil → selo "Candidato" e o limite de que a Sentinellus não emite NFS-e → DPS aguardando validação → conferir alíquota, retenção e enquadramento → confirmar ou devolver |
| **Executor (Sentinellus)** (7 passos) | Fila multi-tenant em `/app/operacao` → troca de instituição sem sair da tela → rodar a ingestão e gerar o arquivo → hash e log de geração → enviar para validação → por que o botão "Liberar" nunca aparece para esse perfil |
| **Validador (Sentinellus)** (7 passos) | Fila multi-tenant → executar a validação de schema → ler erros/avisos com código → liberar para o cliente → a trava de segregação de funções (quem gerou não libera) → por que "Gerar" nunca aparece para esse perfil |

## Design system

Ver [`DESIGN.md`](./DESIGN.md) para paleta, tipografia, raios, sombras e onde os tokens vivem.

---

Este repositório mantém os arquivos `AGENTS.md`/`CLAUDE.md` gerados automaticamente pelo Next.js (regras de agente específicas desta versão do framework) — não os remova.
