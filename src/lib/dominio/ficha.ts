import { diferencaDias } from "./datas";
import { contarPor, type AtendimentoMin, type LesaoMin } from "./metricas";

// ─── Mapa de queixas ──────────────────────────────────────────────────────────

export type LadoCorpo = "D" | "E";

export type RegiaoQueixa = {
  regiao: string;
  atendimentos: number;
  lesoes: number;
  /** HD mais frequente nos atendimentos, ou o tipo da última lesão se só há lesão */
  tipoQueixa: string;
  /** "atual" = região do atendimento mais recente */
  atual: boolean;
  /** lados onde o brilho aparece */
  lados: LadoCorpo[];
  primeiraData: string;
  ultimaData: string;
  /** intervalo só dos atendimentos (para "9 atendimentos em 10 semanas") */
  primeiroAtendimento: string | null;
  ultimoAtendimento: string | null;
};

function ladosDaLesao(lado: string): LadoCorpo[] {
  return lado === "bilateral" ? ["D", "E"] : lado === "E" ? ["E"] : ["D"];
}

/**
 * Cada região soma os atendimentos com aquele local e as lesões com aquela região.
 * Atendimento não tem lado: usa o lado da última lesão na região; sem lesão, os dois lados.
 */
export function mapaDeQueixas(
  atendimentos: readonly Pick<AtendimentoMin, "data" | "local" | "hd">[],
  lesoes: readonly Pick<LesaoMin, "dia" | "regiao" | "lado" | "tipo">[],
): RegiaoQueixa[] {
  const regioes = new Set<string>([...atendimentos.map((a) => a.local), ...lesoes.map((l) => l.regiao)]);
  const maisRecente = [...atendimentos].sort((a, b) => (a.data < b.data ? 1 : -1))[0];

  const lista = [...regioes].map((regiao): RegiaoQueixa => {
    const at = atendimentos.filter((a) => a.local === regiao);
    const ls = [...lesoes.filter((l) => l.regiao === regiao)].sort((a, b) => (a.dia < b.dia ? 1 : -1));
    const datas = [...at.map((a) => a.data), ...ls.map((l) => l.dia)].sort();
    const datasAt = at.map((a) => a.data).sort();
    return {
      regiao,
      atendimentos: at.length,
      lesoes: ls.length,
      tipoQueixa: at.length > 0 ? contarPor(at, (a) => a.hd)[0].valor : ls[0].tipo,
      atual: maisRecente?.local === regiao,
      lados: ls.length > 0 ? ladosDaLesao(ls[0].lado) : ["D", "E"],
      primeiraData: datas[0],
      ultimaData: datas[datas.length - 1],
      primeiroAtendimento: datasAt[0] ?? null,
      ultimoAtendimento: datasAt[datasAt.length - 1] ?? null,
    };
  });

  return lista.sort((a, b) =>
    a.atual !== b.atual ? (a.atual ? -1 : 1) : a.ultimaData < b.ultimaData ? 1 : -1,
  );
}

/** "9 atendimentos em 10 semanas, 2 lesões registradas aqui" */
export function resumoDaRegiao(r: RegiaoQueixa): string {
  const partes: string[] = [];
  if (r.primeiroAtendimento && r.ultimoAtendimento) {
    const semanas = Math.max(1, Math.ceil((diferencaDias(r.primeiroAtendimento, r.ultimoAtendimento) + 1) / 7));
    partes.push(
      `${r.atendimentos} ${r.atendimentos === 1 ? "atendimento" : "atendimentos"} em ${semanas} ${semanas === 1 ? "semana" : "semanas"}`,
    );
  }
  if (r.lesoes > 0) {
    partes.push(`${r.lesoes} ${r.lesoes === 1 ? "lesão registrada" : "lesões registradas"} aqui`);
  } else {
    partes.push("nenhuma lesão registrada aqui");
  }
  return partes.join(", ");
}

// ─── Períodos de tratamento ───────────────────────────────────────────────────

export type PeriodoTratamento = {
  hd: string;
  local: string;
  de: string;
  ate: string;
  atendimentos: number;
  /** status do último atendimento do período */
  status: string;
};

/** Sequência de atendimentos com o mesmo HD e local, sem intervalo maior que `intervaloMaximo` dias. */
export function periodosDeTratamento(
  atendimentos: readonly Pick<AtendimentoMin, "data" | "hd" | "local" | "status">[],
  intervaloMaximo = 7,
): PeriodoTratamento[] {
  const ordenados = [...atendimentos].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  const abertos = new Map<string, PeriodoTratamento>();
  const todos: PeriodoTratamento[] = [];
  for (const a of ordenados) {
    const chave = `${a.hd}|${a.local}`;
    const atual = abertos.get(chave);
    if (atual && diferencaDias(atual.ate, a.data) <= intervaloMaximo) {
      atual.ate = a.data;
      atual.atendimentos++;
      atual.status = a.status;
    } else {
      const novo = { hd: a.hd, local: a.local, de: a.data, ate: a.data, atendimentos: 1, status: a.status };
      abertos.set(chave, novo);
      todos.push(novo);
    }
  }
  return todos.sort((a, b) => (a.ate < b.ate ? 1 : a.ate > b.ate ? -1 : a.de < b.de ? 1 : -1));
}

/** Atletas atendidos com mais frequência (atalhos "Quem está na sala?"). */
export function maisFrequentes(atendimentos: readonly Pick<AtendimentoMin, "atletaId">[], limite = 8): number[] {
  return contarPor(atendimentos, (a) => a.atletaId)
    .slice(0, limite)
    .map((c) => c.valor);
}
