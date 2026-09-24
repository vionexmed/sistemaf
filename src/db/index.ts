import "server-only";
import path from "node:path";
import { mkdirSync } from "node:fs";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { semearDemonstracao } from "./semente";

export type Banco = PgDatabase<PgQueryResultHKT, typeof schema>;

// Produção: DATABASE_URL (Postgres). Desenvolvimento: PGlite em .data/pglite, criado e populado na 1ª vez.
// A conexão fica em globalThis para sobreviver ao recarregamento do `next dev`.
const PASTA_DADOS = path.join(process.cwd(), ".data");
const PASTA_MIGRACOES = path.join(process.cwd(), "drizzle");

const global = globalThis as unknown as { __banco?: Promise<Banco> };

async function conectar(): Promise<Banco> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const db = drizzle(url, { schema });
    await migrate(db, { migrationsFolder: PASTA_MIGRACOES });
    if (process.env.SEMEAR_DEMONSTRACAO === "1") await semearDemonstracao(db as unknown as Banco);
    return db as unknown as Banco;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  mkdirSync(PASTA_DADOS, { recursive: true });
  const cliente = new PGlite(path.join(PASTA_DADOS, "pglite"));
  const db = drizzle(cliente, { schema });
  await migrate(db, { migrationsFolder: PASTA_MIGRACOES });
  await semearDemonstracao(db as unknown as Banco);
  return db as unknown as Banco;
}

export function banco(): Promise<Banco> {
  global.__banco ??= conectar().catch((erro) => {
    global.__banco = undefined;
    throw erro;
  });
  return global.__banco;
}

export { schema };
