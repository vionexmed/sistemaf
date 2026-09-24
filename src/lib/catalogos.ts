// Listas da planilha. Toda opção mostrada nas telas vem daqui.
// Para incluir uma opção nova, adicione no fim da lista (a chave vai para o banco; o rótulo, para a tela).

type Opcao<K extends string = string> = { readonly valor: K; readonly rotulo: string };

function lista<const T extends readonly Opcao[]>(itens: T) {
  return itens;
}

export function rotulo(opcoes: readonly Opcao[], valor: string | null | undefined): string {
  if (!valor) return "";
  return opcoes.find((o) => o.valor === valor)?.rotulo ?? valor;
}

export const HD = lista([
  { valor: "tendinopatia", rotulo: "Tendinopatia" },
  { valor: "dmt", rotulo: "DMT" },
  { valor: "contratura", rotulo: "Contratura" },
  { valor: "entorse", rotulo: "Entorse" },
  { valor: "lesao_muscular", rotulo: "Lesão muscular" },
  { valor: "outro", rotulo: "Outro" },
]);
export type HD = (typeof HD)[number]["valor"];

// Uma lista só de regiões para o local da queixa (atendimento) e a região da lesão,
// para as duas se somarem no mapa de queixas.
export const REGIOES = lista([
  { valor: "joelho", rotulo: "Joelho" },
  { valor: "posterior_coxa", rotulo: "Posterior de coxa" },
  { valor: "anterior_coxa", rotulo: "Anterior de coxa" },
  { valor: "panturrilha", rotulo: "Panturrilha" },
  { valor: "adutor", rotulo: "Adutor" },
  { valor: "lombar", rotulo: "Lombar" },
  { valor: "tornozelo", rotulo: "Tornozelo" },
  { valor: "quadril", rotulo: "Quadril" },
  { valor: "ombro", rotulo: "Ombro" },
  { valor: "pe", rotulo: "Pé" },
  { valor: "outro", rotulo: "Outro" },
]);
export type Regiao = (typeof REGIOES)[number]["valor"];

// Ordem da lista de regiões na tela Registrar lesão (a mesma do prompt).
export const REGIOES_LESAO: readonly Regiao[] = [
  "joelho", "tornozelo", "anterior_coxa", "adutor", "quadril",
  "ombro", "pe", "posterior_coxa", "panturrilha", "lombar", "outro",
];

export const OBJETIVOS = lista([
  { valor: "forca_muscular", rotulo: "Força muscular" },
  { valor: "estabilidade", rotulo: "Estabilidade" },
  { valor: "relaxamento", rotulo: "Relaxamento Mm." },
  { valor: "hiit_core", rotulo: "HIIT + CORE" },
  { valor: "potencia", rotulo: "Potência" },
  { valor: "cardio_volume", rotulo: "Cardio (volume)" },
  { valor: "recovery", rotulo: "Recovery" },
]);
export type Objetivo = (typeof OBJETIVOS)[number]["valor"];

export const STATUS_ATENDIMENTO = lista([
  { valor: "em_tratamento", rotulo: "Em tratamento" },
  { valor: "queixa_pos_treino", rotulo: "Queixa pós-treino" },
]);
export type StatusAtendimento = (typeof STATUS_ATENDIMENTO)[number]["valor"];

export const PERIODOS_DIA = lista([
  { valor: "matutino", rotulo: "Matutino" },
  { valor: "vespertino", rotulo: "Vespertino" },
]);
export type PeriodoDia = (typeof PERIODOS_DIA)[number]["valor"];

export const TIPOS_LESAO = lista([
  { valor: "contratura", rotulo: "Contratura" },
  { valor: "tendinopatia", rotulo: "Tendinopatia" },
  { valor: "entorse", rotulo: "Entorse" },
  { valor: "lesao_muscular", rotulo: "Lesão muscular" },
  { valor: "lesao_ligamentar", rotulo: "Lesão ligamentar" },
  { valor: "outra", rotulo: "Outra" },
]);
export type TipoLesao = (typeof TIPOS_LESAO)[number]["valor"];

export const LADOS = lista([
  { valor: "D", rotulo: "Direito" },
  { valor: "E", rotulo: "Esquerdo" },
  { valor: "bilateral", rotulo: "Bilateral" },
]);
export type Lado = (typeof LADOS)[number]["valor"];

export const PERIODOS_TEMPORADA = lista([
  { valor: "pre_temporada", rotulo: "Pré-temporada" },
  { valor: "temporada", rotulo: "Temporada" },
]);
export type PeriodoTemporada = (typeof PERIODOS_TEMPORADA)[number]["valor"];

export const POSICOES = lista([
  { valor: "goleiro", rotulo: "Goleiro" },
  { valor: "zagueiro", rotulo: "Zagueiro" },
  { valor: "lateral", rotulo: "Lateral" },
  { valor: "volante", rotulo: "Volante" },
  { valor: "meia", rotulo: "Meia" },
  { valor: "extremo", rotulo: "Extremo" },
  { valor: "atacante", rotulo: "Atacante" },
]);
export type Posicao = (typeof POSICOES)[number]["valor"];

export const GRUPOS_POSICAO = lista([
  { valor: "goleiros", rotulo: "Goleiros" },
  { valor: "defensores", rotulo: "Defensores" },
  { valor: "meio", rotulo: "Meio-campistas" },
  { valor: "atacantes", rotulo: "Atacantes" },
]);
export type GrupoPosicao = (typeof GRUPOS_POSICAO)[number]["valor"];

export const GRUPO_DA_POSICAO: Record<Posicao, GrupoPosicao> = {
  goleiro: "goleiros",
  zagueiro: "defensores",
  lateral: "defensores",
  volante: "meio",
  meia: "meio",
  extremo: "atacantes",
  atacante: "atacantes",
};

export const PES = lista([
  { valor: "destro", rotulo: "Destro" },
  { valor: "canhoto", rotulo: "Canhoto" },
  { valor: "ambidestro", rotulo: "Ambidestro" },
]);
export type Pe = (typeof PES)[number]["valor"];

export const TIPOS_TESTE = lista([
  { valor: "dinamometria_joelho", rotulo: "Dinamometria de joelho" },
  { valor: "dinamometria_quadril", rotulo: "Dinamometria de quadril" },
  { valor: "dinamometria_ombro", rotulo: "Dinamometria de ombro" },
  { valor: "hop_test", rotulo: "Hop tests" },
]);

export const TIPOS_DOCUMENTO = lista([
  { valor: "exame_imagem", rotulo: "Exames de imagem" },
  { valor: "laudo", rotulo: "Laudos" },
  { valor: "avaliacao", rotulo: "Avaliações" },
  { valor: "outro", rotulo: "Outros" },
]);
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]["valor"];

export const PERFIS = lista([
  { valor: "fisioterapia", rotulo: "Fisioterapia" },
  { valor: "medico", rotulo: "Médico" },
  { valor: "comissao", rotulo: "Comissão técnica" },
]);
export type Perfil = (typeof PERFIS)[number]["valor"];

// Campeonatos. As datas alimentam o filtro de campeonato do Painel, já que atendimento não tem campeonato.
// [confirmar datas da temporada 2026 com o Thales]
export const CAMPEONATOS = [
  { valor: "paulistao", rotulo: "Paulistão", inicio: "2026-01-10", fim: "2026-04-12" },
  { valor: "copa_paulista", rotulo: "Copa Paulista", inicio: "2026-06-27", fim: "2026-10-31" },
  { valor: "serie_d", rotulo: "Série D", inicio: "2026-04-18", fim: "2026-09-13" },
  { valor: "amistoso", rotulo: "Amistoso", inicio: null, fim: null },
] as const;
export type Campeonato = (typeof CAMPEONATOS)[number]["valor"];

// Temporada: a pré-temporada vai do início até a véspera do primeiro jogo oficial.
export const TEMPORADA = {
  ano: 2026,
  inicio: "2026-01-02",
  fimPreTemporada: "2026-01-09",
} as const;

// Quem assina o relatório do jogador. [confirmar nome e CREFITO]
export const ASSINATURA = { nome: "[NOME DO FISIOTERAPEUTA]", crefito: "[NÚMERO]" } as const;

/** "no joelho", "na lombar" */
export function naRegiao(regiao: string): string {
  const femininas = ["panturrilha", "lombar"];
  return `${femininas.includes(regiao) ? "na" : "no"} ${rotulo(REGIOES, regiao).toLowerCase()}`;
}
