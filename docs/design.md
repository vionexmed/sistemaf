# Design — Fisioterapia EC Santo André

Toda UI do sistema segue este arquivo. Ordem de prioridade quando algo conflita:

1. **Facilidade para a fisio.** Quem usa está na sala, com o atleta na frente, e quer registrar e sair. Na dúvida, menos elementos, menos palavras, menos cliques.
2. **Referências visuais reais** estudadas na coleção `awesome-design-md` (Vercel/Geist, Linear, Cal.com): neutros puros, ação primária em tinta preta, bordas finas com sombras empilhadas bem leves, tipografia com espaçamento justo nos títulos.
3. **Preset 3 · Admin/Dados** para a estrutura (índice, detalhe, formulário, tabela, estados) e **Preset 1 · Utilitário** para barra de comando, atalhos e modo escuro.

O prompt do sistema (em `CLAUDE.md`) define **o que** existe. **Como** fica na tela vem daqui. O visual do MVP antigo (azul-marinho, amarelo, Barlow Condensed) não é usado.

Ao terminar uma entrega, rode o [checklist](#checklist-antes-de-entregar) e `/ui-ux-ai-slop` quando estiver disponível.

## Princípios de facilidade

- **A ação do dia fica sempre no mesmo lugar:** "Registrar atendimento" é o botão preto no topo da lateral, em todas as telas. Na ficha de um jogador ele vira "Atendimento do Rafael" e já abre com ele.
- **Um botão preto por tela.** O da lateral é o principal do sistema; ações das páginas (Adicionar jogador, Registrar lesão, Exportar, Relatório) são secundárias (brancas). Nos formulários, o preto é o Salvar.
- **Nada de seleção em massa, caixinhas ou configurações escondidas** nas listas do dia a dia. Uma linha = um clique abre a ficha; `···` tem o resto.
- **Menos texto de apoio.** Card tem título; descrição só quando ensina algo que não é óbvio ("Preenchido com o último atendimento").
- **Palavras da fisio:** "Atendimentos de hoje", "Jogadores", "Lesões", "Avisos". Nada de jargão técnico.
- **Número da camisa é opcional** e nunca identifica, ordena ou filtra nada. Aparece só como detalhe discreto ("Rafael · #9") quando existe.

## Arquitetura da informação

Três tipos de página, e só três:

| Tipo | Telas |
|---|---|
| **Índice** | Atendimentos, Jogadores, Lesões, Painel (índice agregado) |
| **Detalhe** | Ficha do jogador, Relatório do jogador |
| **Formulário** | Registrar/editar atendimento, Registrar/editar lesão, Registrar retorno, Adicionar/editar jogador, Configurações |

### Índice

```
Atendimentos de hoje 6                                        [Exportar]
Quinta-feira, 24 de setembro · 4 em tratamento · 2 queixa pós-treino

(Hoje) Ontem  7 dias  Temporada                              ‹ Hoje ›
[🔍 Buscar atleta]  [Filtros]
┌───────────────────────────────────────────────────────────────────────┐
│ Atleta           Status            Posição   Período   HD    …    ··· │
│ ◯ Rafael Moura   ● Em tratamento   Atacante  Matutino  …          ··· │
└───────────────────────────────────────────────────────────────────────┘
```

- Cabeçalho: título grande + contagem em cinza, frase de resumo, ação secundária à direita.
- Visões em pílulas (a ativa em tinta cheia). Busca e "Filtros" logo abaixo; filtros ativos viram chips removíveis.
- A tabela fica sozinha num card, encostada nas bordas.
- Filtros, ordenação, busca, página e aba vivem na URL.

### Detalhe

- Cabeçalho: foto redonda, nome grande, camisa (se houver) e status; à direita Relatório e `···` (Registrar lesão, Editar cadastro).
- Abas sublinhadas em tinta; a aba ativa fica na URL.
- Corpo em 2/3 + 1/3. Um card por assunto.

### Formulário

- Grupos numerados (1. Atleta, 2. Queixa, 3. Trabalho de hoje) em cards; lateral com o histórico do jogador num card só.
- Barra de salvar fixa no rodapé do painel: Cancelar (texto), secundário, primário (preto).
- Cadastro em etapas com barra de progresso; botões que trocam de papel têm `key` próprias.

## Layout (app shell)

```
 fundo cinza #f4f4f5                     painel branco com borda fina e cantos 12 px
┌──────────────┐ ┌──────────────────────────────────────────────────────────┐
│ ⛨ EC Santo   │ │ Jogadores / Rafael Moura                   🔔  (T) Thales │
│   André   ◫  │ ├──────────────────────────────────────────────────────────┤
│ [+ Registrar │ │                                                          │
│  atendimento]│ │  conteúdo · padding 32 px                                │
│ 🔍 Buscar  ⌃K│ │                                                          │
│ ──────────── │ │                                                          │
│ ▣ Atend.   6 │ │                                                          │
│ ◯ Jogadores 3│ │                                                          │
│ ♡ Lesões   2 │ │                                                          │
│ ▦ Painel     │ │                                                          │
│ Temporada 26 │ │                                                          │
└──────────────┘ └──────────────────────────────────────────────────────────┘
```

**Lateral** (240 px; recolhe para 64 px só com ícones):

- **Clube:** escudo (tile azul do clube, 32 px, espaço para o escudo oficial), "EC Santo André" / "Fisioterapia · 2026" e o botão de recolher.
- **Botão preto "Registrar atendimento"** com a tecla `N` à mostra (só Fisioterapia). Na ficha vira "Atendimento do [apelido]".
- **"Buscar jogador"** com `Ctrl K`, como uma linha de navegação.
- **4 itens**: Atendimentos, Jogadores, Lesões, Painel. Ícone 16 px cinza + texto 14 px/500; contador discreto à direita (atendimentos de hoje, afastados, lesões em aberto). Ativo = fundo branco "levantado", texto em tinta.
- **Afastados agora:** até 5 jogadores afastados, com foto, apelido e "volta 26/09" ou "há 9 dias" (em vermelho quando está em aberto há mais de 14 dias). Clicar abre a ficha. Seção recolhível.
- **Vistos por último:** os 4 últimos jogadores abertos neste navegador, para voltar rápido a quem está sendo atendido.
- **Rodapé "Hoje":** cartão com o total de atendimentos do dia, quantos atletas, e a barra manhã × tarde. Clicar abre Atendimentos de hoje.
- Recolhida (64 px): só ícones, com tooltip; as seções de jogadores e o cartão somem.

**Topo** (48 px, dentro do painel): caminho de navegação, Avisos (sino com pontinho azul quando há algo) e o **menu do perfil** (avatar + nome), que reúne **Configurações**, tema claro/escuro, "Trocar perfil (demonstração)" e Sair.

**Celular:** sem lateral; a tela de registro tem cabeçalho próprio.

## Tokens

Em `src/app/globals.css`, expostos ao Tailwind via `@theme` (a paleta, os tamanhos e os raios padrão do Tailwind ficam desligados).

| Grupo | Valores |
|---|---|
| Fonte | **Geist** (texto e números, `tabular-nums`), Geist Mono reservada |
| Tamanhos | 12 · 13 · 14 (base) · 16 · 20 · 24 (título de página) |
| Pesos | 400 · 500 · 600 |
| Espaçamento de letras | títulos −0,011 em; título de página −0,022 em; texto normal 0 |
| Espaçamento | grid de 4/8 px (4, 8, 12, 16, 24, 32, 48) |
| Raios | 4 (etiquetas) · 6 (botões, campos) · 10 (cards) · 12 (painel, dialogs) · cheio (pílulas, avatares, badges) |
| Alturas | controles 36 px · linhas de tabela 44 px · linha da lateral 32 px |
| Larguras | índice até 1400 px · detalhe e formulário 1000 px |

### Superfícies e elevação (Vercel)

| Nível | Uso | Valor |
|---|---|---|
| Fundo | lateral e área fora do painel | `#f4f4f5` |
| Painel | área de conteúdo | branco, hairline + sombra 1–2 px |
| Card | seções | branco, hairline `gray-a4` + sombra empilhada de 2–4 px a 2–4 % |
| Ativo | item de lateral, botão secundário, pílula não marcada | hairline + sombra 1 px |
| Overlay | menus, popovers, dialogs, toasts | hairline + sombra empilhada até 32 px a 6–8 % |

Nunca uma sombra única pesada. Bordas de 1 px em `gray-a5`.

## Cor

Escalas Radix de 12 passos. Papel fixo: 1–2 fundos, 3–5 componentes, 6–8 bordas, 9–10 sólidos, 11–12 texto.

| Papel | Cor | Onde |
|---|---|---|
| Neutra | `gray` (sem tom azul) | tudo que não é status nem dado |
| Tinta | `#171717` | botão primário, pílula/opção selecionada, sublinhado da aba, tooltip |
| Acento | azul Santo André `#1f4f9c` (`blue` Radix para foco e links) | escudo, foco (anel `blue-8`), links, pontinho de aviso, gráficos |
| Semânticas | `red`, `blue`, `amber` | badges de status, erro, validação |

- Modo escuro pelos mesmos tokens (a tinta vira quase branco).
- Contraste AA em todo texto.
- Gráficos: paleta categórica (`--chart-1` azul do clube, `--chart-2` areia), nunca as cores semânticas.

### Status

Badge em pílula (altura 20 px) com ponto. **Só o que exige atenção tem cor**; o normal é cinza.

| Status | Cor |
|---|---|
| Afastado | `red` |
| Em tratamento | `blue` |
| Queixa pós-treino | `amber` |
| Liberado | neutro (cinza) |

## Componentes

| Componente | Regra |
|---|---|
| Botão primário | tinta, texto branco, 36 px, raio 6, sombra 1 px |
| Botão secundário | branco com hairline e sombra 1 px; hover `#fafafa` |
| Botão fantasma | texto cinza, hover fundo `gray-a3` |
| Campo | borda `gray-a7`, hover `gray-a8`, foco anel azul 2 px |
| Opções da planilha | **pílulas** de 36 px; selecionada = tinta cheia com texto branco (fácil de ver de longe na sala) |
| Visões do índice | pílulas de 32 px; ativa em tinta |
| Filtro segmentado (Painel) | trilho cinza; opção ativa em branco "levantado" |
| Abas da ficha | texto 14 px; ativa em tinta com sublinhado 2 px |
| Tabela | cabeçalho branco com rótulos 12 px cinza-claro; linhas de 44 px; hover `gray-a3`; `···` sempre visível |
| Avatar | redondo; sem foto, iniciais em cinza sobre `gray-a3` |
| Toast | 3 s, canto inferior direito, nível overlay |
| Dialog | só para confirmar exclusão, nomeando o item |

### Gráficos (feitos à mão, `src/components/graficos`)

- Barras horizontais: uma cor (`--chart-1`), número à direita, maior para menor.
- Barras por tempo: empilhadas (`--chart-1` em tratamento, `--chart-2` queixa), total acima, legenda visível.
- Velas de 14 dias: coluna fina por dia; dia vazio = tracinho cinza.
- Manequim: corpo cinza claro com contorno fino; queixa atual em `--chart-1`, antigas em azul claro; seleção com contorno tracejado em tinta; brilho sempre mascarado pelo corpo.
- Sem pizza, donut, gauge ou 3D.

## Estados obrigatórios

- **Vazio:** ícone 24 px, uma frase, um botão.
- **Sem resultados:** frase + "Limpar filtros".
- **Carregando:** skeleton com a geometria da tela (`loading.tsx`).
- **Erro:** banner vermelho com a causa e "Tentar de novo" (`error.tsx`).
- **Sucesso:** toast; criar recurso leva ao detalhe.
- **Não salvo:** aviso na barra de salvar e confirmação ao sair.

## Motion

120–160 ms, `ease-out`, só em hover e overlays. Respeita `prefers-reduced-motion`.

## Proibido (o que dá "cara de IA")

- Acento colorido em tudo (botões, seleções, ícones, fundos azuis claros por toda parte).
- Pílula colorida no item ativo da lateral; seções com títulos na lateral para 4 itens.
- Quadrado colorido com iniciais como logo; gradientes; ícones em tiles coloridos.
- Todo card com título **e** descrição; textos de apoio repetindo o título.
- Status "normal" colorido (verde em todas as linhas).
- Cinza azulado (`slate`) como neutro; sombras únicas pesadas.
- Mais de um botão preto por tela; ações duplicadas.
- Modal para criar ou editar registro; placeholder no lugar de label.

## Checklist antes de entregar

- [ ] A fisio acha a ação principal em 2 segundos, sem ler nada.
- [ ] Um botão preto por tela (o da lateral conta).
- [ ] Só tokens deste arquivo; nenhuma cor ou tamanho avulso.
- [ ] Status: só afastado, em tratamento e queixa com cor.
- [ ] Filtros e aba na URL.
- [ ] 6 estados presentes.
- [ ] Contraste AA; modo escuro sem cor avulsa.
- [ ] Ctrl/Cmd+K cobre jogadores, telas e ações.
- [ ] Perfil sem permissão não vê o botão nem consegue a ação por POST.

## Referências

Estudadas em `github.com/VoltAgent/awesome-design-md` (os sites de origem ficam bloqueados no ambiente de desenvolvimento):

- `design-md/vercel/DESIGN.md` — neutros, hairline `#ebebeb`, tinta `#171717`, sombras empilhadas, tracking negativo, linha de lateral ativa.
- `design-md/linear.app/DESIGN.md` — um acento só, nunca decorativo; badges em pílula neutra; densidade.
- `design-md/cal/DESIGN.md` — botões primários pretos, cards com cantos suaves, muito espaço em branco.

Estrutura: Shopify Polaris (*resource index*, *resource details*, *app settings*), IBM Carbon (*data table*), Radix Colors (papel de cada passo), Refactoring UI.
