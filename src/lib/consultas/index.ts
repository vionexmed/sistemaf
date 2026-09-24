import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { banco, schema } from "@/db";
import type { Atendimento, Atleta, Documento, Lesao } from "@/db/schema";
import { hojeISO, somarDias } from "@/lib/dominio/datas";
import { statusDoElenco, type StatusAtleta } from "@/lib/dominio/status";

// Leitura do banco. O volume é pequeno (um elenco, uma temporada), então os cálculos
// são feitos em memória com as funções puras de src/lib/dominio.

export type AtletaComStatus = Atleta & { status: StatusAtleta };

export const hoje = cache(() => hojeISO());

export const listarAtletas = cache(async (incluirInativos = false): Promise<Atleta[]> => {
  const db = await banco();
  const q = db.select().from(schema.atletas).orderBy(asc(schema.atletas.nome));
  return incluirInativos ? q : q.where(eq(schema.atletas.ativo, true));
});

export const buscarAtleta = cache(async (id: number): Promise<Atleta | null> => {
  if (!Number.isInteger(id)) return null;
  const db = await banco();
  const [a] = await db.select().from(schema.atletas).where(eq(schema.atletas.id, id));
  return a ?? null;
});

export const listarLesoes = cache(async (): Promise<Lesao[]> => {
  const db = await banco();
  return db.select().from(schema.lesoes).orderBy(desc(schema.lesoes.dia), desc(schema.lesoes.id));
});

export const atendimentosEntre = cache(async (de: string, ate: string): Promise<Atendimento[]> => {
  const db = await banco();
  return db
    .select()
    .from(schema.atendimentos)
    .where(and(gte(schema.atendimentos.data, de), lte(schema.atendimentos.data, ate)))
    .orderBy(desc(schema.atendimentos.data), desc(schema.atendimentos.criadoEm));
});

export const atendimentosDoAtleta = cache(async (atletaId: number): Promise<Atendimento[]> => {
  const db = await banco();
  return db
    .select()
    .from(schema.atendimentos)
    .where(eq(schema.atendimentos.atletaId, atletaId))
    .orderBy(desc(schema.atendimentos.data), desc(schema.atendimentos.periodo));
});

export const buscarAtendimento = cache(async (id: number): Promise<Atendimento | null> => {
  if (!Number.isInteger(id)) return null;
  const db = await banco();
  const [a] = await db.select().from(schema.atendimentos).where(eq(schema.atendimentos.id, id));
  return a ?? null;
});

export const buscarLesao = cache(async (id: number): Promise<Lesao | null> => {
  if (!Number.isInteger(id)) return null;
  const db = await banco();
  const [l] = await db.select().from(schema.lesoes).where(eq(schema.lesoes.id, id));
  return l ?? null;
});

export const documentosDoAtleta = cache(async (atletaId: number): Promise<Documento[]> => {
  const db = await banco();
  return db
    .select()
    .from(schema.documentos)
    .where(eq(schema.documentos.atletaId, atletaId))
    .orderBy(desc(schema.documentos.criadoEm));
});

export const listarUsuarios = cache(async () => {
  const db = await banco();
  return db.select().from(schema.usuarios);
});

/** Status de todos os atletas hoje. Usa os últimos 45 dias para achar o último dia de treino. */
export const statusHoje = cache(async (): Promise<Map<number, StatusAtleta>> => {
  const h = hoje();
  const [atletas, recentes, lesoes] = await Promise.all([
    listarAtletas(true),
    atendimentosEntre(somarDias(h, -45), h),
    listarLesoes(),
  ]);
  return statusDoElenco(
    atletas.map((a) => a.id),
    recentes,
    lesoes,
    h,
  );
});

export const elencoComStatus = cache(async (): Promise<AtletaComStatus[]> => {
  const [atletas, status] = await Promise.all([listarAtletas(), statusHoje()]);
  return atletas.map((a) => ({ ...a, status: status.get(a.id) ?? "liberado" }));
});

/** Mapa id → atleta (inclui inativos, para o histórico). */
export const mapaAtletas = cache(async (): Promise<Map<number, Atleta>> => {
  const atletas = await listarAtletas(true);
  return new Map(atletas.map((a) => [a.id, a]));
});
