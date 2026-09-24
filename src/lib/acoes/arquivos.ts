"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { banco, schema } from "@/db";
import { TIPOS_DOCUMENTO } from "@/lib/catalogos";
import { guardarArquivo, TIPOS_DOCUMENTO_ACEITOS, TIPOS_IMAGEM, validarArquivo } from "@/lib/arquivos";
import { exigir } from "@/lib/sessao";

export type EstadoEnvio = { ok?: boolean; erro?: string; envio?: number };

export async function trocarFoto(_: EstadoEnvio, form: FormData): Promise<EstadoEnvio> {
  await exigir("editar");
  const envio = Date.now();
  const atletaId = Number(form.get("atletaId"));
  const arquivo = form.get("foto");
  const erro = validarArquivo(arquivo, TIPOS_IMAGEM);
  if (erro) return { erro, envio };
  const caminho = await guardarArquivo("fotos", arquivo as File);
  const db = await banco();
  await db.update(schema.atletas).set({ foto: caminho }).where(eq(schema.atletas.id, atletaId));
  revalidatePath("/", "layout");
  return { ok: true, envio };
}

export async function enviarDocumento(_: EstadoEnvio, form: FormData): Promise<EstadoEnvio> {
  const sessao = await exigir("editar");
  const envio = Date.now();
  const atletaId = Number(form.get("atletaId"));
  const tipo = String(form.get("tipo") ?? "");
  if (!TIPOS_DOCUMENTO.some((t) => t.valor === tipo)) return { erro: "Escolha a pasta do documento", envio };
  const arquivos = form.getAll("arquivo").filter((a): a is File => a instanceof File && a.size > 0);
  if (arquivos.length === 0) return { erro: "Escolha um arquivo", envio };
  for (const a of arquivos) {
    const erro = validarArquivo(a, TIPOS_DOCUMENTO_ACEITOS);
    if (erro) return { erro: `${a.name}: ${erro}`, envio };
  }
  const db = await banco();
  for (const a of arquivos) {
    const caminho = await guardarArquivo("documentos", a);
    await db.insert(schema.documentos).values({ atletaId, tipo, nomeArquivo: a.name, caminho, mime: a.type, tamanho: a.size, enviadoPor: sessao.id });
  }
  revalidatePath(`/jogadores/${atletaId}`);
  return { ok: true, envio };
}

export async function excluirDocumento(id: number): Promise<void> {
  await exigir("editar");
  const db = await banco();
  const [doc] = await db.delete(schema.documentos).where(eq(schema.documentos.id, id)).returning();
  if (doc) revalidatePath(`/jogadores/${doc.atletaId}`);
}
