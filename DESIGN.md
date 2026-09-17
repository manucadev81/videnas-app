# Design System — Videnas

Referência curta do design system usado no mockup. Todos os tokens vivem em `src/app/globals.css` (bloco `@theme inline` + `:root`); os componentes de UI ficam em `src/components/ui/` (shadcn) e os componentes de domínio em `src/components/dominio/`. Modo claro apenas — não existe `.dark` nem `prefers-color-scheme` neste projeto.

## Paleta

### Brand (azul institucional)

Derivada do gradiente do logo (`#2457E8` → `#1A3FBE`).

| Token | Hex | Uso |
|---|---|---|
| `brand-50` | `#EBF1FF` | Fundo muito claro, hover de área secundária |
| `brand-100` | `#D1DFFF` | Fundo claro, badge informativo |
| `brand-200` | `#A8C2FF` | Borda de input focado |
| `brand-300`–`500` | `#739CFC`…`#386CF0` | Estados intermediários, ícones |
| `brand-600` | `#2D63EB` | Primary — botões, links, item ativo |
| `brand-700` | `#2457E8` | Hero, gradiente esquerda (logo) |
| `brand-800` | `#1A3FBE` | Dark, gradiente direita (logo), hover de brand-700 |
| `brand-900` | `#163392` | Texto sobre brand-700, footer institucional |
| `brand-950` | `#0F1E57` | Ênfase máxima, texto sobre fundo claro em alto contraste |

### Neutros

`neutral-0` (`#FFFFFF`, fundo principal) até `neutral-800` (`#111827`, texto de máxima ênfase), passando por `neutral-500` (`#6B7280`, texto secundário) e `neutral-600` (`#374151`, foreground padrão).

### Status

| Status | Fundo | Borda | Texto |
|---|---|---|---|
| Neutro | `#F3F4F6` | `#D1D5DB` | `#6B7280` |
| Info | `#EBF1FF` | `#A8C2FF` | `#2D63EB` |
| Sucesso | `#ECFDF5` | `#A7F3D0` | `#047857` |
| Atenção | `#FFFBEB` | `#FCD34D` | `#B45309` |
| Erro | `#FEF2F2` | `#FECACA` | `#DC2626` |
| Candidato (módulo Fiscal) | `#F3E8FF` | `#DDD6FE` | `#6D28D9` |

Classes prontas: `.status-badge` + `.status-badge-{neutral,info,success,warning,error,candidate}`.

## Tipografia

Três famílias, carregadas via `next/font/google` em `src/app/layout.tsx` e expostas como `--font-family-sans`, `--font-family-display`, `--font-family-mono`.

| Papel | Fonte | Tamanho | Peso | Onde |
|---|---|---|---|---|
| Display / H1–H4 | Quicksand | 20–48px | 600–700 | Títulos de página e seção — aplicada automaticamente em `h1,h2,h3,h4` no globals.css |
| Body | Inter | 16px | 400 | Texto de corpo, descrições |
| Body sm / Small | Inter | 12–14px | 400 | Labels, metadata de tabela, helper text |
| Mono | Roboto Mono | 13px | 500 | Hash SHA-256, número de controle, protocolo BCB |

Classes utilitárias: `font-sans`, `font-display`, `font-mono`.

## Raios

| Componente | Token | Valor |
|---|---|---|
| Botão, input, badge | `rounded-md` | 8px (`--radius-md`) |
| Card, painel | `rounded-lg` | 12px (`--radius-lg`) |
| Modal, popover | `rounded-xl` | 16px (`--radius-xl`) |
| Avatar | `rounded-full` | 9999px |

## Sombras

Três níveis sutis, definidos como `--shadow-elevado-{1,2,3}` em `globals.css`:

1. **Elevado 1** — card em fundo neutro, hover de elemento.
2. **Elevado 2** — dropdown, tooltip.
3. **Elevado 3** — modal, popover em primeiro plano.

## Espaçamento e densidade

Interface densa, adequada a dados regulatórios: gutter horizontal padrão de 16px, gap vertical de 12px. Tabelas usam padding de célula `12px` (vertical) × `16px` (horizontal) e altura mínima de linha de 44px (alvo de toque WCAG). Cards usam `--card-spacing` de 16px (4px em variante `sm`).

## Onde os tokens vivem

- **`src/app/globals.css`** — única fonte de verdade dos tokens (`@theme inline` para cores/raios/sombras Tailwind 4, `:root` para variáveis shadcn como `--primary`, `--border`, `--ring`). Não editado por este agente (é fundação).
- **`src/components/ui/`** — primitivos shadcn/ui (Button, Card, Dialog, Select, Table etc.), construídos sobre `@base-ui/react` com `class-variance-authority`.
- **`src/components/dominio/`** — componentes que já embutem regra de negócio visual (badge de estado, stepper de etapas, banner de posicionamento, selo Candidato).
- **`src/components/marca/`** — `LogoVidenas` e `SimboloVidenas`, ambos SVG com `fill="currentColor"`, servindo qualquer fundo via classe de cor: `text-brand-700` em fundo claro e `text-white` sobre fundo azul (`brand-700`/`brand-800`).

## Padrões visuais de fornecimento e evidências

### Status canônico do lote

Selo `.status-badge` no cabeçalho do painel de completude, mapeado em `CLASSE_STATUS_CANONICO` (`src/components/fornecimento/constantes.ts`):

| Status canônico | Classe | Leitura |
|---|---|---|
| Incompleto | `status-badge-warning` | Ainda falta insumo obrigatório |
| Completo, aguardando modelagem | `status-badge-info` | Tudo recebido, nada normalizado ainda |
| Modelado canonicamente | `status-badge-success` | Lote normalizado no modelo interno |

### Status de insumo

Mesmo componente visual, escala própria (`CLASSE_STATUS_INSUMO`), no cartão de cada insumo do checklist:

| Status do insumo | Classe |
|---|---|
| Pendente | `status-badge-neutral` |
| Parcial | `status-badge-warning` |
| Fornecido | `status-badge-success` |
| Rejeitado | `status-badge-error` |

Atenção (`warning`) é sempre "falta algo do cliente"; erro (`error`) é sempre "o que chegou não serve". Nunca se usa `error` para pendência — pendência não é falha.

### Exibição de hash

Componente `ValorHash` (`src/components/evidencias/valor-hash.tsx`): `<code>` em `font-mono text-xs`, fundo `neutral-50`, `rounded-md`, `break-all`, com o hash completo sempre no `title`.

- **Em lista/tabela** — prop `truncado`, que corta em 10 caracteres + reticências + 10 via `truncarHash`, para a coluna não dominar a linha.
- **Em detalhe** — hash completo, sem truncar.
- **Sempre** — botão-ícone de copiar ao lado (`variant="ghost"`, `size="icon-xs"`), com `aria-label` explícito e confirmação por toast.

### Badge de sentido do lacre

Componente `BadgeSentido`: `.status-badge` com ícone direcional e rótulo curto visível, mais o rótulo completo em `sr-only`.

| Sentido | Ícone | Classe | Rótulo curto / leitor de tela |
|---|---|---|---|
| Entrada | `ArrowDownToLine` | `status-badge-info` | "Entrada" / "Entrada — dado recebido do cliente" |
| Saída | `ArrowUpFromLine` | `status-badge-success` | "Saída" / "Saída — arquivo devolvido pela Videnas" |

### Bloco de ressalva

Para avisos que qualificam o que está na tela sem alarmar (o aviso de simulação do envelope, em `AvisoEnvelope`): `role="note"`, caixa `rounded-lg border border-neutral-200 bg-neutral-50 p-4`, ícone `Lock` neutro à esquerda, título curto em `neutral-700` e o texto em `neutral-600 leading-relaxed`, com badge de ajuda ao lado do título.

É deliberadamente **neutro, não colorido**: ressalva não é erro nem alerta. Quando a condição de fato bloqueia a ação (Web Crypto indisponível, por exemplo), aí sim o bloco vira `role="alert"` com os tokens de `error`.
