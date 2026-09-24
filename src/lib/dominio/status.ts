import { somarDias } from "./datas";

export type StatusAtleta = "afastado" | "em_tratamento" | "queixa_pos_treino" | "liberado";

export const ROTULO_STATUS: Record<StatusAtleta, string> = {
  afastado: "Afastado",
  em_tratamento: "Em tratamento",
  queixa_pos_treino: "Queixa pós-treino",
  liberado: "Liberado",
};

export type AtendimentoParaStatus = { atletaId: number; data: string; status: string };
export type LesaoParaStatus = { atletaId: number; dia: string; diasAfastamento: number | null };

/** Dia em que o atleta volta, ou null se a lesão está em aberto. */
export function diaRetorno(lesao: Pick<LesaoParaStatus, "dia" | "diasAfastamento">): string | null {
  return lesao.diasAfastamento == null ? null : somarDias(lesao.dia, lesao.diasAfastamento);
}

/** Lesão em aberto (sem dias de afastamento). */
export function lesaoEmAberto(lesao: Pick<LesaoParaStatus, "diasAfastamento">): boolean {
  return lesao.diasAfastamento == null;
}

/** O atleta ainda está fora por causa desta lesão: em aberto, ou a data da lesão + os dias ainda não chegou. */
export function lesaoAfasta(lesao: Pick<LesaoParaStatus, "dia" | "diasAfastamento">, hoje: string): boolean {
  if (lesao.dia > hoje) return false;
  const retorno = diaRetorno(lesao);
  return retorno == null || hoje < retorno;
}

/** Último dia de treino = data mais recente, antes de hoje, com algum atendimento no departamento. */
export function ultimoDiaDeTreino(datasComAtendimento: Iterable<string>, hoje: string): string | null {
  let ultimo: string | null = null;
  for (const d of datasComAtendimento) {
    if (d < hoje && (ultimo == null || d > ultimo)) ultimo = d;
  }
  return ultimo;
}

/**
 * Status do atleta, na ordem do CLAUDE.md (vale a primeira que der certo):
 * afastado → em tratamento (hoje ou último dia de treino) → queixa pós-treino (hoje) → liberado.
 */
export function statusDoAtleta(
  atendimentosDoAtleta: readonly Pick<AtendimentoParaStatus, "data" | "status">[],
  lesoesDoAtleta: readonly Pick<LesaoParaStatus, "dia" | "diasAfastamento">[],
  hoje: string,
  ultimoDiaTreino: string | null,
): StatusAtleta {
  if (lesoesDoAtleta.some((l) => lesaoAfasta(l, hoje))) return "afastado";
  const recentes = atendimentosDoAtleta.filter(
    (a) => a.data === hoje || (ultimoDiaTreino != null && a.data === ultimoDiaTreino),
  );
  if (recentes.some((a) => a.status === "em_tratamento")) return "em_tratamento";
  if (recentes.some((a) => a.data === hoje && a.status === "queixa_pos_treino")) return "queixa_pos_treino";
  return "liberado";
}

/** Status de todos os atletas de uma vez. */
export function statusDoElenco(
  atletaIds: readonly number[],
  atendimentos: readonly AtendimentoParaStatus[],
  lesoes: readonly LesaoParaStatus[],
  hoje: string,
): Map<number, StatusAtleta> {
  const ultimo = ultimoDiaDeTreino(
    atendimentos.map((a) => a.data),
    hoje,
  );
  const porAtleta = new Map<number, AtendimentoParaStatus[]>();
  for (const a of atendimentos) {
    if (a.data !== hoje && a.data !== ultimo) continue;
    const lista = porAtleta.get(a.atletaId) ?? [];
    lista.push(a);
    porAtleta.set(a.atletaId, lista);
  }
  const lesoesPorAtleta = new Map<number, LesaoParaStatus[]>();
  for (const l of lesoes) {
    const lista = lesoesPorAtleta.get(l.atletaId) ?? [];
    lista.push(l);
    lesoesPorAtleta.set(l.atletaId, lista);
  }
  return new Map(
    atletaIds.map((id) => [
      id,
      statusDoAtleta(porAtleta.get(id) ?? [], lesoesPorAtleta.get(id) ?? [], hoje, ultimo),
    ]),
  );
}
