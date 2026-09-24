"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { banco, schema } from "@/db";
import { PES, POSICOES } from "@/lib/catalogos";
import { guardarArquivo, TIPOS_DOCUMENTO_ACEITOS, TIPOS_IMAGEM, validarArquivo } from "@/lib/arquivos";
import { ehDataISO, hojeISO, idade } from "@/lib/dominio/datas";
import { exigir } from "@/lib/sessao";

const valores = (l: readonly { valor: string }[]) => l.map((o) => o.valor) as [string, ...string[]];
const opcional = (max: number) => z.string().trim().max(max, `Pode ter até ${max} caracteres`).transform((v) => v || null);

const Jogador = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo").max(120, "Nome muito longo"),
  apelido: z.string().trim().min(1, "Informe o apelido").max(30, "Use até 30 caracteres"),
  nascimento: z
    .string()
    .refine(ehDataISO, "Informe a data de nascimento")
    .refine((d) => !ehDataISO(d) || (idade(d, hojeISO()) >= 14 && idade(d, hojeISO()) <= 50), "Confira a data: a idade fica fora de 14 a 50 anos"),
  camisa: z.union([z.literal("").transform(() => null), z.coerce.number().int("Use um número inteiro").min(1, "Use de 1 a 99").max(99, "Use de 1 a 99")]),
  posicao: z.enum(valores(POSICOES), { message: "Escolha a posição" }),
  alturaCm: z.union([z.literal("").transform(() => null), z.coerce.number().int("Use centímetros, ex.: 182").min(140, "Altura em centímetros, ex.: 182").max(220, "Altura em centímetros, ex.: 182")]),
  pesoKg: z.union([z.literal("").transform(() => null), z.coerce.number().min(40, "Peso em kg, ex.: 78,5").max(150, "Peso em kg, ex.: 78,5").transform((n) => n.toFixed(1))]),
  pe: z.enum(valores(PES), { message: "Escolha o pé dominante" }),
  alergias: opcional(1000),
  lesoesAnteriores: opcional(2000),
});

type Campos = keyof z.infer<typeof Jogador> | "foto" | "exames" | "geral";
export type EstadoJogador = { ok?: boolean; erros?: Partial<Record<Campos, string>>; id?: number; apelido?: string; envio?: number };

export async function salvarJogador(_: EstadoJogador, form: FormData): Promise<EstadoJogador> {
  const sessao = await exigir("editar");
  const envio = Date.now();
  const id = Number(form.get("id")) || null;
  const texto = (k: string) => String(form.get(k) ?? "");
  const lido = Jogador.safeParse({
    nome: texto("nome"),
    apelido: texto("apelido"),
    nascimento: texto("nascimento"),
    camisa: texto("camisa").trim(),
    posicao: texto("posicao") || undefined,
    alturaCm: texto("alturaCm").trim(),
    pesoKg: texto("pesoKg").trim().replace(",", "."),
    pe: texto("pe") || undefined,
    alergias: texto("alergias"),
    lesoesAnteriores: texto("lesoesAnteriores"),
  });
  const erros: EstadoJogador["erros"] = {};
  if (!lido.success) for (const e of lido.error.issues) erros[e.path[0] as Campos] ??= e.message;

  const foto = form.get("foto");
  const temFoto = foto instanceof File && foto.size > 0;
  if (temFoto) {
    const e = validarArquivo(foto, TIPOS_IMAGEM);
    if (e) erros.foto = e;
  }
  const exames = form.getAll("exames").filter((a): a is File => a instanceof File && a.size > 0);
  for (const a of exames) {
    const e = validarArquivo(a, TIPOS_DOCUMENTO_ACEITOS);
    if (e) erros.exames = `${a.name}: ${e}`;
  }

  const db = await banco();
  if (lido.success && lido.data.camisa != null) {
    const [repetido] = await db
      .select({ nome: schema.atletas.nome })
      .from(schema.atletas)
      .where(and(eq(schema.atletas.camisa, lido.data.camisa), eq(schema.atletas.ativo, true), id ? ne(schema.atletas.id, id) : undefined));
    if (repetido) erros.camisa = `A camisa ${lido.data.camisa} já é de ${repetido.nome}`;
  }
  if (!lido.success || Object.keys(erros).length > 0) return { erros, envio };

  const dados = { ...lido.data, ...(temFoto ? { foto: await guardarArquivo("fotos", foto as File) } : {}) };
  let salvoId = id;
  if (id) {
    await db.update(schema.atletas).set(dados).where(eq(schema.atletas.id, id));
  } else {
    const [novo] = await db.insert(schema.atletas).values(dados).returning({ id: schema.atletas.id });
    salvoId = novo.id;
  }
  for (const a of exames) {
    const caminho = await guardarArquivo("documentos", a);
    await db.insert(schema.documentos).values({ atletaId: salvoId!, tipo: "avaliacao", nomeArquivo: a.name, caminho, mime: a.type, tamanho: a.size, enviadoPor: sessao.id });
  }
  revalidatePath("/", "layout");
  return { ok: true, id: salvoId!, apelido: dados.apelido, envio };
}

/** Jogador que sai do elenco fica inativo: some da lista e dos totais, mas o histórico continua. */
export async function alterarAtivo(id: number, ativo: boolean): Promise<{ erro?: string }> {
  await exigir("editar");
  const db = await banco();
  if (ativo) {
    const [a] = await db.select().from(schema.atletas).where(eq(schema.atletas.id, id));
    if (a?.camisa != null) {
      const [repetido] = await db
        .select({ nome: schema.atletas.nome })
        .from(schema.atletas)
        .where(and(eq(schema.atletas.camisa, a.camisa), eq(schema.atletas.ativo, true), ne(schema.atletas.id, id)));
      if (repetido) return { erro: `A camisa ${a.camisa} já é de ${repetido.nome}. Troque ou apague o número antes de voltar ao elenco.` };
    }
  }
  await db.update(schema.atletas).set({ ativo }).where(eq(schema.atletas.id, id));
  revalidatePath("/", "layout");
  return {};
}
