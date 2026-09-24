"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { banco, schema } from "@/db";
import { CAMPEONATOS, LADOS, PERIODOS_TEMPORADA, REGIOES, TIPOS_LESAO } from "@/lib/catalogos";
import { diferencaDias, ehDataISO, hojeISO } from "@/lib/dominio/datas";
import { lesaoAfasta } from "@/lib/dominio/status";
import { exigir } from "@/lib/sessao";

const valores = (l: readonly { valor: string }[]) => l.map((o) => o.valor) as [string, ...string[]];
const textoOpcional = (max: number) =>
  z.string().trim().max(max, `Pode ter até ${max} caracteres`).transform((v) => v || null);

const Lesao = z.object({
  atletaId: z.coerce.number().int().positive("Escolha o atleta"),
  dia: z.string().refine(ehDataISO, "Informe o dia da lesão"),
  tipo: z.enum(valores(TIPOS_LESAO), { message: "Escolha o tipo de lesão" }),
  estrutura: textoOpcional(120),
  regiao: z.enum(valores(REGIOES), { message: "Escolha a região no corpo ou na lista" }),
  lado: z.enum(valores(LADOS), { message: "Escolha o lado" }),
  reincidencia: z.enum(["sim", "nao"], { message: "Informe se é reincidência" }).transform((v) => v === "sim"),
  emAberto: z.boolean(),
  diasAfastamento: z.coerce.number().int("Use um número inteiro de dias").min(0, "Não pode ser negativo").max(730, "Confira o número de dias").nullable(),
  campeonato: z.enum(valores(CAMPEONATOS), { message: "Escolha o campeonato" }),
  periodo: z.enum(valores(PERIODOS_TEMPORADA), { message: "Escolha o período" }),
  observacao: textoOpcional(2000),
});

type Campos = keyof z.infer<typeof Lesao> | "geral";
export type EstadoLesao = { ok?: boolean; erros?: Partial<Record<Campos, string>>; afastado?: boolean; atletaId?: number; envio?: number };

export async function salvarLesao(_: EstadoLesao, form: FormData): Promise<EstadoLesao> {
  const sessao = await exigir("editar");
  const envio = Date.now();
  const id = Number(form.get("id")) || null;
  const emAberto = form.get("emAberto") === "sim";
  const dias = String(form.get("diasAfastamento") ?? "").trim();
  const lido = Lesao.safeParse({
    atletaId: form.get("atletaId") || undefined,
    dia: form.get("dia"),
    tipo: form.get("tipo") || undefined,
    estrutura: form.get("estrutura") ?? "",
    regiao: form.get("regiao") || undefined,
    lado: form.get("lado") || undefined,
    reincidencia: form.get("reincidencia") || undefined,
    emAberto,
    diasAfastamento: emAberto || dias === "" ? null : dias,
    campeonato: form.get("campeonato") || undefined,
    periodo: form.get("periodo") || undefined,
    observacao: form.get("observacao") ?? "",
  });
  if (!lido.success) {
    const erros: EstadoLesao["erros"] = {};
    for (const e of lido.error.issues) erros[e.path[0] as Campos] ??= e.message;
    return { erros, envio };
  }
  const { emAberto: afastamentoEmAberto, ...dados } = lido.data;
  if (!afastamentoEmAberto && dados.diasAfastamento == null) {
    return { erros: { diasAfastamento: "Informe os dias de afastamento ou marque “Em aberto”" }, envio };
  }
  const hoje = hojeISO();
  if (dados.dia > hoje) return { erros: { dia: "O dia da lesão não pode ser no futuro" }, envio };

  const db = await banco();
  if (id) {
    await db.update(schema.lesoes).set(dados).where(eq(schema.lesoes.id, id));
  } else {
    await db.insert(schema.lesoes).values({ ...dados, registradoPor: sessao.id });
  }
  revalidatePath("/", "layout");
  return { ok: true, afastado: lesaoAfasta(dados, hoje), atletaId: dados.atletaId, envio };
}

export type EstadoRetorno = { ok?: boolean; erro?: string; envio?: number; atletaId?: number };

/** Encerra uma lesão em aberto: dias de afastamento = retorno − dia da lesão. */
export async function registrarRetorno(_: EstadoRetorno, form: FormData): Promise<EstadoRetorno> {
  await exigir("editar");
  const envio = Date.now();
  const id = Number(form.get("id"));
  const retorno = String(form.get("retorno") ?? "");
  if (!ehDataISO(retorno)) return { erro: "Informe a data de retorno", envio };
  const db = await banco();
  const [lesao] = await db.select().from(schema.lesoes).where(eq(schema.lesoes.id, id));
  if (!lesao) return { erro: "Lesão não encontrada", envio };
  const dias = diferencaDias(lesao.dia, retorno);
  if (dias < 0) return { erro: "O retorno não pode ser antes do dia da lesão", envio };
  await db.update(schema.lesoes).set({ diasAfastamento: dias }).where(eq(schema.lesoes.id, id));
  revalidatePath("/", "layout");
  return { ok: true, envio, atletaId: lesao.atletaId };
}

export async function excluirLesao(id: number): Promise<void> {
  await exigir("editar");
  const db = await banco();
  await db.delete(schema.lesoes).where(eq(schema.lesoes.id, id));
  revalidatePath("/", "layout");
}
