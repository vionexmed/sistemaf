# Design — Fisioterapia EC Santo André

Toda UI do sistema segue este arquivo. Ele junta os dois presets enviados:

- **Preset 3 · Admin/Dados** é a **base**: a unidade de trabalho é o registro (atendimento, lesão, jogador). O usuário filtra, abre, registra e exporta o dia todo.
- **Preset 1 · Utilitário** entra com a barra de comando, os atalhos de teclado, o motion e o modo escuro, porque a fisio abre o sistema todo dia.

O prompt do sistema (em `CLAUDE.md`) define **o que** existe: telas, fluxos, campos e regras. **Como** fica na tela vem daqui. O CSS do MVP antigo (azul-marinho, amarelo, Barlow Condensed, medidas em px) não é usado.

Antes de criar uma tela, leia as [referências](#referências). Ao terminar uma entrega, rode o [checklist](#checklist-antes-de-entregar) e `/ui-ux-ai-slop` quando estiver disponível.

**Referência mental:** Shopify Admin (Polaris), IBM Carbon e Linear. Claro, alto contraste, tabela como protagonista, formulários previsíveis.

## Regras universais

1. Uma ação primária por tela. O resto é secundário ou some.
2. Grid de 8 px e no máximo 3 tamanhos de texto por tela.
3. Neutros + 1 acento para ações + 4 cores semânticas com papel fixo. Cor nunca é decoração.
4. Card = seção de página com um propósito. Nunca card dentro de card. Tabela nunca dentro de card com padding.
5. Um único design system: shadcn/ui com as regras Polaris/Carbon. Proibido inventar componente novo se já existe um.
6. Estados vazio, sem resultados, carregando, erro e sucesso são obrigatórios.

## Arquitetura da informação

Três tipos de página, e só três. Toda tela do sistema é um deles:

| Tipo | Telas | Rota |
|---|---|---|
| **Índice** | Atendimentos, Jogadores, Lesões, Painel (índice agregado) | `/atendimentos`, `/jogadores`, `/lesoes`, `/painel` |
| **Detalhe** | Ficha do jogador, Relatório do jogador (versão impressa do detalhe) | `/jogadores/:id`, `/jogadores/:id/relatorio` |
| **Formulário** | Registrar/editar atendimento, Registrar/editar lesão, Registrar retorno, Adicionar/editar jogador, Configurações | `/atendimentos/novo`, `/atendimentos/:id/editar`, `/lesoes/nova`, `/lesoes/:id/editar`, `/jogadores/novo`, `/jogadores/:id/editar`, `/configuracoes/*` |

### 1. Índice — ex.: `/atendimentos`

```
Atendimentos (9)                                        [Exportar ▾]
──────────────────────────────────────────────────────────────────────
[Hoje] [Ontem] [7 dias] [Todos]      🔍 buscar atleta    [Filtros ▾]
Matutino ×  Tendinopatia ×                               Limpar filtros
──────────────────────────────────────────────────────────────────────
☐  Nº  Atleta          Posição   HD           Local    Status          ···
☐  9   Rafael Moura    Atacante  Tendinopatia Joelho   ● Em tratamento ···
...
◂ 1 2 3 ▸                                             50 por página ▾
```

- Cabeçalho: título + contagem, 1 ação primária (quando a tela tem uma), demais ações em menu.
- Abas = visões salvas (filtros preestabelecidos). Filtros avançados em popover; filtros ativos aparecem como chips removíveis.
- Seleção em massa: ao marcar linhas, uma barra de ações (Exportar, Excluir) substitui a barra de filtros.
- Largura total quando a tabela tem 5+ colunas (máx. 1600 px); ~1000 px caso contrário.
- Filtros, ordenação, busca e página refletidos na URL.

### 2. Detalhe — ex.: `/jogadores/24`

```
← Jogadores   Rafael Moura  #9   ● Em tratamento     [Relatório] [···] [Registrar atendimento]
[Visão geral] [Atendimentos] [Lesões] [Testes] [Documentos]
──────────────────────────────────────────────────────────────────────
┌ Mapa de queixas ───────────────────┐  ┌ Perfil ──────────────────┐
│ manequim + regiões                 │  │ posição, idade, altura…  │
└────────────────────────────────────┘  └──────────────────────────┘
┌ Frequência · 14 dias ──────────────┐  ┌ Hoje ────────────────────┐
│ velas                              │  │ período, objetivo, evol. │
└────────────────────────────────────┘  └──────────────────────────┘
```

- Cabeçalho: voltar, título, badge de status, ações (primária à direita, secundárias antes dela, o resto em `···`).
- Subseções viram abas dentro da página; a aba ativa fica na URL (`?aba=lesoes`).
- Corpo em **2/3 conteúdo principal** + **1/3 lateral** (metadados, contexto). Cada card = uma subtarefa.
- Celular: colunas empilham, lateral vai para baixo.

### 3. Formulário — ex.: `/atendimentos/novo`

- Coluna de 640 px, grupos com título e descrição curta, campos com label acima.
- **Exceção declarada:** Registrar atendimento e Registrar lesão têm uma lateral de contexto (1/3) com o histórico do atleta, porque a regra de ouro do produto é registrar olhando o último atendimento.
- Configurações: descrição do grupo à esquerda (1/3), campos em card à direita (2/3).
- Barra de salvar fixa no rodapé quando há alterações não salvas ("Alterações não salvas · [Descartar] [Salvar]").
- Validação inline ao sair do campo; resumo de erros no topo ao tentar salvar.

### Navegação

- **Lateral** (240 px, colapsa para 56 px só com ícones), agrupada por seção, ≤ 8 itens, sem terceiro nível:
  - *Trabalho:* Atendimentos, Jogadores, Lesões
  - *Análise:* Painel
  - *Sistema:* Configurações
  - Topo: escudo/nome do clube e busca (abre Ctrl+K). Rodapé: usuário e perfil.
- **Topo** (48–56 px): breadcrumb à esquerda; busca global, notificações e usuário à direita.
- **Barra de comando (Ctrl/Cmd+K):** jogadores (por nome ou camisa), todas as telas e as ações Registrar atendimento, Registrar lesão e Adicionar jogador. Toda ação de menu também existe nela.
- **Atalhos** (mostrar no tooltip): `N` registrar atendimento, `L` registrar lesão, `/` buscar, `G` + `A/J/L/P` para ir a Atendimentos, Jogadores, Lesões, Painel. Setas navegam em listas; `Esc` fecha tudo.

## Layout (app shell)

```
┌─────────────┬──────────────────────────────────────────────────────┐
│ Sidebar     │ Topo 56px · breadcrumb          🔍  🔔  usuário       │
│ 240px       ├──────────────────────────────────────────────────────┤
│ colapsa p/  │ Cabeçalho da página: título (contagem) · [Ação primária]│
│ 56px ícones │ Conteúdo: tabela / detalhe / formulário              │
│             │ padding 24px · máx. 1600px (índice) / 1000px (resto)  │
└─────────────┴──────────────────────────────────────────────────────┘
```

Base de implementação: blocos `sidebar-01` e `dashboard-01` do shadcn/ui, escritos à mão em `src/components/ui` (o registro do shadcn não é acessível daqui; o código segue o mesmo padrão).

## Tokens

Definidos em `src/app/globals.css` e expostos ao Tailwind via `@theme`. Não usar valor fora desta lista.

```css
:root {
  --font-sans: "Inter", system-ui, sans-serif;
  --text-xs: 12px;   /* badges, ajuda de campo, cabeçalho de tabela */
  --text-sm: 13px;   /* tabelas, metadados, sidebar */
  --text-base: 14px; /* corpo, inputs, botões */
  --text-lg: 16px;   /* título de card/seção */
  --text-xl: 20px;   /* título de página */
  --leading: 1.5;

  /* grid 8px */
  --space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 24px; --space-5: 32px; --space-6: 48px;

  --radius: 8px;     /* cards, inputs, botões */
  --radius-sm: 4px;  /* badges, checkboxes */
  --border: 1px solid var(--slate-6);
  --shadow-overlay: 0 4px 16px rgba(0,0,0,.10); /* só popovers, menus, modais */

  --page-max: 1000px;
  --page-max-wide: 1600px;
  --row-h: 44px;  --row-h-compact: 36px;
  --control-h: 36px;
  --icon: 16px;      /* dentro de botões e linhas; 20px na navegação */
}
```

- Pesos de fonte: 400, 500 e 600.
- Números em tabelas e cartões com `font-variant-numeric: tabular-nums`, alinhados à direita.
- Títulos em sentence case ("Registrar atendimento"). Nada em caixa alta.

## Cor

Escalas de 12 passos do Radix Colors (pacote `@radix-ui/colors`). Papel fixo por passo:

| Passos | Uso |
|---|---|
| 1–2 | fundo do app (2) e fundos sutis (sidebar, cabeçalho de tabela) |
| 3–5 | fundo de componente: normal / hover / pressionado ou selecionado |
| 6–8 | bordas e separadores (6 sutil, 7 interativo, 8 forte) |
| 9–10 | preenchimento sólido (botão primário) e seu hover |
| 11–12 | texto: 11 secundário, 12 primário |

| Papel | Escala | Onde aparece |
|---|---|---|
| Neutra | `slate` | fundo do app (2), cards (branco/1), bordas (6), texto (11–12) |
| Acento | `indigo` (azul profundo, conversa com o azul e branco do clube; o `blue` 9 do Radix não passa AA com texto branco) | botão primário, links, foco, aba ativa, seleção |
| Sucesso | `green` | toast de sucesso, status **Liberado** |
| Atenção | `amber` | status **Queixa pós-treino**, banner de aviso |
| Crítico | `red` | erro, ação destrutiva, status **Afastado** |
| Informativo | `blue` | status **Em tratamento**, banner informativo |

- Tema claro por padrão; **modo escuro** pelos mesmos tokens (`slateDark`, `indigoDark`…), alternado no menu do usuário. Nenhuma cor avulsa para o escuro.
- Contraste AA (4,5:1) obrigatório em texto de tabela e badges.
- **Gráficos:** paleta categórica de no máximo 6 cores dessaturadas (`--chart-1` a `--chart-6`); nunca a paleta semântica em gráficos.

### Status do atleta e do atendimento

Sempre badge pequena: fundo passo 3, texto passo 11 da cor semântica, ponto colorido à esquerda. Nunca célula inteira colorida; nunca só cor (o texto sempre aparece).

| Status | Cor |
|---|---|
| Afastado | `red` |
| Em tratamento | `blue` |
| Queixa pós-treino | `amber` |
| Liberado | `green` |

## Tabela (componente principal)

- Colunas alinhadas por tipo: texto à esquerda, números à direita com `tabular-nums`; datas relativas ("há 2 h") com data absoluta no tooltip quando o dado é "quando foi registrado"; datas clínicas (dia do atendimento, da lesão) sempre absolutas (23/09).
- Header fixo ao rolar; ordenável (indicador na coluna ativa).
- Densidade: 44 px por linha; "compacta" 36 px no menu da tabela. Fonte 13 px.
- Texto longo truncado com `…` e tooltip. Nunca quebrar linha dentro da célula.
- Ações por linha em menu `···` sempre visível (Editar, Excluir, Registrar retorno).
- Linha inteira clicável abre o detalhe; checkbox só na primeira coluna.
- Separador 1 px; sem zebra.
- Ordem das colunas: identificador (camisa) → atleta → status → valores → datas → ações.

## Formulários

- Label acima do campo, peso 500; ajuda abaixo em 12 px cinza; erro em vermelho com ícone e mensagem específica ("Escolha o local da queixa", não "Campo inválido").
- Largura proporcional ao dado: data, camisa, altura e peso curtos; nome e observação largos.
- Obrigatório é o padrão; marcar só os opcionais ("(opcional)").
- **Listas da planilha (HD, local, objetivo, status, tipo de lesão…) usam `ToggleGroup`** (botões de opção, um toque), mesmo acima de 8 opções. Exceção declarada à regra "select com busca acima de 8": o produto exige registro em 2 ou 3 toques. Select com busca fica para escolher o atleta.
- Datas com input digitável + calendário.
- Botões: primário à direita, cancelar como texto à esquerda dele. Destrutivo separado, em vermelho, à esquerda.
- Destrutivo sempre confirma em modal nomeando o item e a consequência: "Excluir o atendimento de Rafael Moura em 23/09 (matutino)? Isso não pode ser desfeito."

## Dashboard (Painel)

- Máximo 4 KPIs, cada um com número, variação vs. período anterior e **link para o índice filtrado** que explica o número.
- Um gráfico principal respondendo uma pergunta explícita: "Atendimentos por dia/semana/mês no período". Barras; sem gauge, donut, pizza ou 3D.
- Abaixo, a tabela **Precisa de atenção**: atletas afastados, lesões em aberto há mais de 14 dias, retornos previstos para hoje e amanhã.
- Depois, a seção **Distribuição**: listas de barras horizontais (local da queixa, HD, objetivo, posição, lesões por região e por tipo, atletas com mais atendimentos). Cada linha é um link para o índice filtrado.
- Sem cards de KPI com ícone colorido; sem widgets arrastáveis.

## Componentes do produto

| Componente | Base shadcn | Regra |
|---|---|---|
| Badge de status | `Badge` | cores da tabela de status acima |
| Opções da planilha | `ToggleGroup` | selecionado = acento passo 3 de fundo, borda passo 8, texto 12 |
| Seleção de atleta | `Command` em `Popover` | busca por nome, apelido ou camisa |
| Filtros | `Tabs` (visões) + `Popover` + chips | chips removíveis, "Limpar filtros" |
| Avatar do jogador | `Avatar` | foto quadrada com raio 8 px; sem foto, iniciais em slate 11 sobre slate 3 |
| Barras horizontais | à mão (HTML) | uma cor categórica, número à direita, ordenado do maior para o menor |
| Colunas por tempo | à mão (SVG) | empilhadas em `--chart-1` (em tratamento) e `--chart-2` (queixa), legenda sempre visível, total acima |
| Velas · 14 dias | à mão (SVG) | uma coluna fina por dia, altura = atendimentos, cor categórica pelo status; dia vazio = tracinho slate 6 |
| Manequim | à mão (SVG) | frente e costas; corpo em slate 3 com contorno slate 7; queixa atual em acento 9, antigas em acento 6; região selecionada com contorno tracejado; brilho sempre mascarado pelo corpo |

## Estados obrigatórios

- **Vazio (primeiro uso):** ícone 24 px, frase de uma linha, botão "Adicionar o primeiro jogador" / "Registrar o primeiro atendimento".
- **Sem resultados (filtro):** frase + "Limpar filtros". Nunca a mesma tela do vazio.
- **Carregando:** skeleton da tabela com o mesmo número de colunas; skeleton de cards no detalhe (`loading.tsx` de cada rota).
- **Erro de carregamento:** banner crítico com a causa e "Tentar de novo" (`error.tsx`); nunca tela em branco.
- **Sucesso:** toast 3 s; ao criar um recurso, redirecionar para o detalhe (novo jogador → ficha).
- **Alterações não salvas:** barra fixa + confirmação ao sair da página.

## Motion

120–160 ms, `ease-out`, só em abrir/fechar overlays e hover. Sem animação de entrada de página. Respeitar `prefers-reduced-motion`.

## Proibido

- Dashboard de boas-vindas com saudação; banners; ilustrações decorativas; copy de marketing.
- KPI cards com ícone colorido em tile, gradientes ou sombras; gráficos decorativos (gauge, donut, pizza, 3D).
- Card dentro de card; tabela dentro de card com padding; cards com sombra.
- Mais de uma cor de acento; cor de fundo em linhas de tabela; badges saturadas; texto colorido como único indicador de status.
- Modal para criar/editar registros (abre página). Modal só para confirmar destrutivo.
- Ícones sem rótulo em ações principais; menu `···` escondido só no hover.
- Terceiro nível de navegação; sidebar com mais de 8 itens.
- Campos todos em largura total; placeholder no lugar de label.
- Tipografia acima de 20 px (inclusive números de KPI: 20 px, 600).
- A mesma informação em mais de um lugar (princípio "um lugar por informação" do `CLAUDE.md`).

## Conflitos entre os presets (resolvidos)

| Tema | Preset 1 | Preset 3 | Decidido |
|---|---|---|---|
| Espaçamento | 4/8/12/16/24/32 | grid 8: 4/8/16/24/32/48 | Preset 3 |
| Controles | 32 px | 36 px | 36 px (toque na sala de fisioterapia) |
| Linha de tabela | 36 px | 44 px (compacta 36) | Preset 3 |
| Raio | 4/6/8 | 4/8 | Preset 3 |
| Modo escuro | obrigatório | opcional | incluído (custa pouco com os tokens Radix) |
| Home | lista de trabalho | — | Fisioterapia → Atendimentos (Hoje); Médico e Comissão → Painel |
| Status | badge fundo 3 / texto 11 | idem + ponto | badge com ponto |
| Lista da planilha com 8+ opções | — | select com busca | ToggleGroup (exceção declarada acima) |
| "Registrar atendimento" na barra superior (prompt) | 1 primária por tela | primária no cabeçalho da página | É a primária do cabeçalho em **Atendimentos** e na **ficha** (lá já abre com o jogador). Nas outras telas, que têm a própria primária, fica no atalho `N` e na barra de comando. Nunca aparece duas vezes na mesma tela |

## Checklist antes de entregar

- [ ] Toda tela é um dos 3 tipos (índice, detalhe, formulário) e segue o esqueleto.
- [ ] Exatamente 1 ação primária identificável em 2 segundos.
- [ ] Índice: abas de visão, busca, filtros em chips, seleção em massa, paginação, URL sincronizada.
- [ ] Tabela: alinhamento por tipo, `tabular-nums`, header fixo, truncamento com tooltip, `···` sempre visível.
- [ ] Detalhe: 2/3 + 1/3, um card por subtarefa, badge de status no cabeçalho, aba na URL.
- [ ] Formulário: labels acima, larguras proporcionais, erros específicos, barra de salvar fixa.
- [ ] Destrutivo confirma nomeando o item.
- [ ] 6 estados presentes (vazio, sem resultados, carregando, erro, sucesso, não salvo).
- [ ] Só tokens do grid de 8 px; contraste AA em tabela e badges; modo escuro sem cor avulsa.
- [ ] Ctrl/Cmd+K cobre navegação + ações principais.
- [ ] Perfil sem permissão não vê o botão nem consegue a ação por POST.
- [ ] `/ui-ux-ai-slop` executado sem achados críticos.

## Referências

Estudar antes de começar.

- Shopify Polaris — *Resource index layout*: https://polaris-react.shopify.com/patterns/resource-index-layout
- Shopify Polaris — *Resource details layout*: https://polaris-react.shopify.com/patterns/resource-details-layout
- Shopify Polaris — *App settings layout*: https://polaris-react.shopify.com/patterns/app-settings-layout
- Shopify Polaris — princípios de layout: https://polaris-react.shopify.com/design/layout
- Shopify — diretrizes de layout para apps: https://shopify.dev/docs/apps/design/layout
- IBM Carbon — *Data table*: https://carbondesignsystem.com/components/data-table/usage/
- IBM Carbon — *2x Grid*: https://carbondesignsystem.com/elements/2x-grid/usage/
- Linear — como redesenharam a UI: https://linear.app/now/how-we-redesigned-the-linear-ui
- Linear — refresh mais recente: https://linear.app/now/behind-the-latest-design-refresh
- Vercel Geist: https://vercel.com/geist/introduction
- shadcn/ui — blocos de sidebar: https://ui.shadcn.com/blocks/sidebar
- shadcn/ui — bloco `dashboard-01`: https://ui.shadcn.com/blocks
- Radix Colors — papel de cada passo: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Radix Colors — compor a paleta: https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
- NN/g — princípios de design visual: https://www.nngroup.com/articles/principles-visual-design/
- Refactoring UI: https://refactoringui.com/
- Refero — padrões reais: https://refero.design/patterns
- Coleção de `DESIGN.md`: https://github.com/voltagent/awesome-design-md
