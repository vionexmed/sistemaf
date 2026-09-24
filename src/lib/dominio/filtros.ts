import { TEMPORADA } from "../catalogos";
import { somarDias } from "./datas";
import type { Janela } from "./metricas";

export const VISOES_ATENDIMENTO = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "ontem", rotulo: "Ontem" },
  { valor: "7d", rotulo: "7 dias" },
  { valor: "todos", rotulo: "Temporada" },
] as const;
export type VisaoAtendimento = (typeof VISOES_ATENDIMENTO)[number]["valor"];

export function janelaDaVisao(visao: VisaoAtendimento, hoje: string, dia: string = hoje): Janela {
  if (visao === "hoje") return { de: dia, ate: dia };
  if (visao === "ontem") return { de: somarDias(hoje, -1), ate: somarDias(hoje, -1) };
  if (visao === "7d") return { de: somarDias(hoje, -6), ate: hoje };
  return { de: TEMPORADA.inicio, ate: hoje };
}

type FiltrosAtendimento = Partial<Record<"periodo" | "status" | "hd" | "local" | "objetivo", string[]>>;

/** Filtro vazio = não filtra. Vários valores no mesmo filtro = qualquer um deles. */
export function filtrarAtendimentos<T extends Record<"periodo" | "status" | "hd" | "local" | "objetivo", string>>(
  atendimentos: readonly T[],
  filtros: FiltrosAtendimento,
): T[] {
  return atendimentos.filter((a) =>
    (Object.keys(filtros) as (keyof FiltrosAtendimento)[]).every((k) => {
      const valores = filtros[k];
      return !valores || valores.length === 0 || valores.includes(a[k]);
    }),
  );
}

export const VISOES_LESAO = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "abertas", rotulo: "Em aberto" },
  { valor: "encerradas", rotulo: "Encerradas" },
] as const;
export type VisaoLesao = (typeof VISOES_LESAO)[number]["valor"];

type FiltrosLesao = Partial<Record<"campeonato" | "periodo" | "tipo" | "regiao", string[]>>;

export function filtrarLesoes<T extends { diasAfastamento: number | null; campeonato: string; periodo: string; tipo: string; regiao: string }>(
  lesoes: readonly T[],
  visao: VisaoLesao,
  filtros: FiltrosLesao,
): T[] {
  return lesoes.filter((l) => {
    if (visao === "abertas" && l.diasAfastamento != null) return false;
    if (visao === "encerradas" && l.diasAfastamento == null) return false;
    return (Object.keys(filtros) as (keyof FiltrosLesao)[]).every((k) => {
      const v = filtros[k];
      return !v || v.length === 0 || v.includes(l[k]);
    });
  });
}
