"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { banco, schema } from "@/db";
import { HD, OBJETIVOS, PERIODOS_DIA, REGIOES, STATUS_ATENDIMENTO } from "@/lib/catalogos";
import { ehDataISO, hojeISO } from "@/lib/dominio/datas";
import { exigir } from "@/lib/sessao";

const valores = (l: readonly { valor: string }[]) => l.map((o) => o.valor) as [string, ...string[]];

const Atendimento = z.object({
  atletaId: z.coerce.number({ message: "Escolha o atleta" }).int().positive("Escolha o atleta"),
  data: z.string().refine(ehDataISO, "Informe a data do atendimento"),
  periodo: z.enum(valores(PERIODOS_DIA), { message: "Escolha o período" }),
  hd: z.enum(valores(HD), { message: "Escolha o HD" }),
  local: z.enum(valores(REGIOES), { message: "Escolha o local da queixa" }),
  objetivo: z.enum(valores(OBJETIVOS), { message: "Escolha o objetivo do trabalho" }),
  status: z.enum(valores(STATUS_ATENDIMENTO), { message: "Escolha o status" }),
  evolucao: z
    .string()
    .trim()
    .max(2000, "A evolução pode ter até 2.000 caracteres")
    .transform((v) => v || null),
});

export type EstadoAtendimento = {
  ok?: boolean;
  erros?: Partial<Record<keyof z.infer<typeof Atendimento> | "geral", string>>;
  /** atendimento que já existe no mesmo atleta, data e período */
  duplicado?: number;
  id?: number;
  envio?: number;
};

export async function salvarAtendimento(_: EstadoAtendimento, form: FormData): Promise<EstadoAtendimento> {
  const sessao = await exigir("editar");
  const envio = Date.now();
  const id = Number(form.get("id")) || null;
  const lido = Atendimento.safeParse({
    atletaId: form.get("atletaId") || undefined,
    data: form.get("data"),
    periodo: form.get("periodo") || undefined,
    hd: form.get("hd") || undefined,
    local: form.get("local") || undefined,
    objetivo: form.get("objetivo") || undefined,
    status: form.get("status") || undefined,
    evolucao: form.get("evolucao") ?? "",
  });
  if (!lido.success) {
    const erros: EstadoAtendimento["erros"] = {};
    for (const e of lido.error.issues) erros[e.path[0] as keyof typeof erros] ??= e.message;
    return { erros, envio };
  }
  const dados = lido.data;
  if (dados.data > hojeISO()) return { erros: { data: "A data não pode ser no futuro" }, envio };

  const db = await banco();
  const [atleta] = await db.select().from(schema.atletas).where(eq(schema.atletas.id, dados.atletaId));
  if (!atleta) return { erros: { atletaId: "Atleta não encontrado" }, envio };

  const [existente] = await db
    .select({ id: schema.atendimentos.id })
    .from(schema.atendimentos)
    .where(
      and(
        eq(schema.atendimentos.atletaId, dados.atletaId),
        eq(schema.atendimentos.data, dados.data),
        eq(schema.atendimentos.periodo, dados.periodo),
        id ? ne(schema.atendimentos.id, id) : undefined,
      ),
    );
  if (existente) {
    return {
      erros: { geral: `${atleta.apelido} já tem atendimento neste dia e período.` },
      duplicado: existente.id,
      envio,
    };
  }

  let salvoId = id;
  if (id) {
    await db.update(schema.atendimentos).set(dados).where(eq(schema.atendimentos.id, id));
  } else {
    const [novo] = await db
      .insert(schema.atendimentos)
      .values({ ...dados, registradoPor: sessao.id })
      .returning({ id: schema.atendimentos.id });
    salvoId = novo.id;
  }
  revalidatePath("/", "layout");
  return { ok: true, id: salvoId ?? undefined, envio };
}

export async function excluirAtendimentos(ids: number[]): Promise<{ excluidos: number }> {
  await exigir("editar");
  const validos = ids.filter((n) => Number.isInteger(n) && n > 0);
  if (validos.length === 0) return { excluidos: 0 };
  const db = await banco();
  const apagados = await db
    .delete(schema.atendimentos)
    .where(inArray(schema.atendimentos.id, validos))
    .returning({ id: schema.atendimentos.id });
  revalidatePath("/", "layout");
  return { excluidos: apagados.length };
}
