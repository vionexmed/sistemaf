// Leitura dos parâmetros de URL nas páginas (filtros, visões, página).

export type Params = Record<string, string | string[] | undefined>;

export function texto(p: Params, chave: string): string | undefined {
  const v = p[chave];
  return (Array.isArray(v) ? v[0] : v) || undefined;
}

export function lista(p: Params, chave: string): string[] {
  return (texto(p, chave) ?? "").split(",").filter(Boolean);
}

export function inteiro(p: Params, chave: string, padrao: number): number {
  const n = Number(texto(p, chave));
  return Number.isInteger(n) && n > 0 ? n : padrao;
}

/** Um dos valores permitidos, ou o padrão. */
export function umDe<T extends string>(p: Params, chave: string, permitidos: readonly T[], padrao: T): T {
  const v = texto(p, chave);
  return permitidos.includes(v as T) ? (v as T) : padrao;
}

export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export const POR_PAGINA = 50;

export function paginar<T>(itens: readonly T[], pagina: number) {
  const total = Math.max(1, Math.ceil(itens.length / POR_PAGINA));
  const atual = Math.min(pagina, total);
  return { itens: itens.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA), pagina: atual, totalPaginas: total };
}
