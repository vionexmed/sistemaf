import { CAMPEONATOS, TEMPORADA, type Campeonato } from "../catalogos";
import {
  diasEntre,
  diferencaDias,
  inicioMes,
  inicioSemana,
  somarDias,
} from "./datas";
import { diaRetorno, lesaoEmAberto } from "./status";

// ─── Janelas de tempo ─────────────────────────────────────────────────────────

export type PeriodoPainel = "7d" | "30d" | "temporada";
export type Janela = { de: string; ate: string };

export function janelaDoPeriodo(periodo: PeriodoPainel, hoje: string): Janela {
  if (periodo === "7d") return { de: somarDias(hoje, -6), ate: hoje };
  if (periodo === "30d") return { de: somarDias(hoje, -29), ate: hoje };
  return { de: TEMPORADA.inicio, ate: hoje };
}

/** Período anterior de mesmo tamanho. Na temporada não há comparação. */
export function janelaAnterior(periodo: PeriodoPainel, janela: Janela): Janela | null {
  if (periodo === "temporada") return null;
  const tamanho = diferencaDias(janela.de, janela.ate) + 1;
  return { de: somarDias(janela.de, -tamanho), ate: somarDias(janela.de, -1) };
}

/** Recorta a janela às datas do campeonato. null = o campeonato não cruza a janela. */
export function recortarPorCampeonato(janela: Janela, campeonato: Campeonato | null): Janela | null {
  if (!campeonato) return janela;
  const c = CAMPEONATOS.find((x) => x.valor === campeonato);
  if (!c || !c.inicio || !c.fim) return null;
  const de = janela.de > c.inicio ? janela.de : c.inicio;
  const ate = janela.ate < c.fim ? janela.ate : c.fim;
  return de <= ate ? { de, ate } : null;
}

export function dentro(data: string, janela: Janela | null): boolean {
  return janela != null && data >= janela.de && data <= janela.ate;
}

// ─── Contagens ────────────────────────────────────────────────────────────────

export type Contagem<K = string> = { valor: K; total: number };

/** Conta por chave e ordena do maior para o menor (empate: ordem de aparição). */
export function contarPor<T, K>(itens: readonly T[], chave: (item: T) => K): Contagem<K>[] {
  const mapa = new Map<K, number>();
  for (const item of itens) {
    const k = chave(item);
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([valor, total]) => ({ valor, total }))
    .sort((a, b) => b.total - a.total);
}

/** Variação percentual contra o período anterior. null quando não há base de comparação. */
export function variacao(atual: number, anterior: number | null): number | null {
  if (anterior == null || anterior === 0) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

// ─── Atendimentos ─────────────────────────────────────────────────────────────

export type AtendimentoMin = {
  atletaId: number;
  data: string;
  periodo: string;
  hd: string;
  local: string;
  objetivo: string;
  status: string;
};

export function resumoAtendimentos(atendimentos: readonly AtendimentoMin[]) {
  const total = atendimentos.length;
  const diasComAtendimento = new Set(atendimentos.map((a) => a.data)).size;
  const emTratamento = atendimentos.filter((a) => a.status === "em_tratamento").length;
  const matutino = atendimentos.filter((a) => a.periodo === "matutino").length;
  return {
    total,
    atletasAtendidos: new Set(atendimentos.map((a) => a.atletaId)).size,
    diasComAtendimento,
    /** atendimentos ÷ dias com atendimento (folgas não entram) */
    mediaPorDiaDeTreino: diasComAtendimento === 0 ? 0 : total / diasComAtendimento,
    emTratamento,
    queixaPosTreino: total - emTratamento,
    matutino,
    vespertino: total - matutino,
    porLocal: contarPor(atendimentos, (a) => a.local),
    porHd: contarPor(atendimentos, (a) => a.hd),
    porObjetivo: contarPor(atendimentos, (a) => a.objetivo),
    porAtleta: contarPor(atendimentos, (a) => a.atletaId),
  };
}

export type Granularidade = "dia" | "semana" | "mes";

export function granularidadeDoPeriodo(periodo: PeriodoPainel): Granularidade {
  return periodo === "7d" ? "dia" : periodo === "30d" ? "semana" : "mes";
}

export type Coluna = { inicio: string; emTratamento: number; queixa: number; total: number };

/** Colunas empilhadas por dia, semana (começa na segunda) ou mês, cobrindo a janela inteira. */
export function colunasPorTempo(
  atendimentos: readonly Pick<AtendimentoMin, "data" | "status">[],
  janela: Janela,
  granularidade: Granularidade,
): Coluna[] {
  const chave = (d: string) =>
    granularidade === "dia" ? d : granularidade === "semana" ? inicioSemana(d) : inicioMes(d);
  const colunas = new Map<string, Coluna>();
  for (const d of diasEntre(janela.de, janela.ate)) {
    const k = chave(d);
    if (!colunas.has(k)) colunas.set(k, { inicio: k, emTratamento: 0, queixa: 0, total: 0 });
  }
  for (const a of atendimentos) {
    const c = colunas.get(chave(a.data));
    if (!c) continue;
    if (a.status === "em_tratamento") c.emTratamento++;
    else c.queixa++;
    c.total++;
  }
  return [...colunas.values()];
}

/** Uma vela por dia: quantos atendimentos e o status que predomina (em tratamento vence empate). */
export function velasPorDia(
  atendimentos: readonly Pick<AtendimentoMin, "data" | "status">[],
  janela: Janela,
): { data: string; total: number; status: "em_tratamento" | "queixa_pos_treino" | null }[] {
  return diasEntre(janela.de, janela.ate).map((data) => {
    const doDia = atendimentos.filter((a) => a.data === data);
    const trat = doDia.filter((a) => a.status === "em_tratamento").length;
    return {
      data,
      total: doDia.length,
      status: doDia.length === 0 ? null : trat >= doDia.length - trat ? "em_tratamento" : "queixa_pos_treino",
    };
  });
}

// ─── Lesões ───────────────────────────────────────────────────────────────────

export type LesaoMin = {
  atletaId: number;
  dia: string;
  tipo: string;
  regiao: string;
  lado: string;
  reincidencia: boolean;
  diasAfastamento: number | null;
};

/** Dias perdidos por uma lesão: os dias de afastamento, ou os dias corridos até hoje se está em aberto. */
export function diasPerdidosDaLesao(lesao: Pick<LesaoMin, "dia" | "diasAfastamento">, hoje: string): number {
  if (lesao.diasAfastamento != null) return lesao.diasAfastamento;
  return Math.max(0, diferencaDias(lesao.dia, hoje));
}

export function resumoLesoes(lesoes: readonly LesaoMin[], hoje: string) {
  const total = lesoes.length;
  const encerradas = lesoes.filter((l) => !lesaoEmAberto(l));
  const somaEncerradas = encerradas.reduce((s, l) => s + (l.diasAfastamento ?? 0), 0);
  return {
    total,
    emAberto: total - encerradas.length,
    /** lesões com reincidência ÷ total × 100 */
    reincidenciaPct: total === 0 ? 0 : Math.round((lesoes.filter((l) => l.reincidencia).length / total) * 100),
    /** soma dos dias ÷ lesões encerradas (as em aberto ficam fora) */
    mediaAfastamento: encerradas.length === 0 ? null : somaEncerradas / encerradas.length,
    diasPerdidos: lesoes.reduce((s, l) => s + diasPerdidosDaLesao(l, hoje), 0),
    porRegiao: contarPor(lesoes, (l) => l.regiao),
    porTipo: contarPor(lesoes, (l) => l.tipo),
  };
}

/** Dias da janela cobertos por alguma lesão (relatório: "dias afastado"). */
export function diasAfastadoNaJanela(
  lesoes: readonly Pick<LesaoMin, "dia" | "diasAfastamento">[],
  janela: Janela,
  hoje: string,
): number {
  const ate = janela.ate < hoje ? janela.ate : hoje;
  const dias = new Set<string>();
  for (const l of lesoes) {
    const fimExclusivo = diaRetorno(l) ?? somarDias(hoje, 1);
    for (const d of diasEntre(l.dia, somarDias(fimExclusivo, -1))) {
      if (d >= janela.de && d <= ate) dias.add(d);
    }
  }
  return dias.size;
}

/** Relatório: dias diferentes com atendimento "em tratamento". */
export function diasEmTratamento(atendimentos: readonly Pick<AtendimentoMin, "data" | "status">[]): number {
  return new Set(atendimentos.filter((a) => a.status === "em_tratamento").map((a) => a.data)).size;
}

/** Período da temporada sugerido pela data da lesão. */
export function periodoTemporadaDaData(dia: string): "pre_temporada" | "temporada" {
  return dia >= TEMPORADA.inicio && dia <= TEMPORADA.fimPreTemporada ? "pre_temporada" : "temporada";
}
