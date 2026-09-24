import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Armazenamento local (desenvolvimento). Em produção, trocar por um armazenamento de objetos
// mantendo as mesmas duas funções. Ver Pendências no CLAUDE.md.
export const PASTA_UPLOADS = path.join(process.cwd(), ".data", "uploads");

export const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
export const TIPOS_DOCUMENTO_ACEITOS = [...TIPOS_IMAGEM, "application/pdf"];
export const TAMANHO_MAXIMO = 15 * 1024 * 1024;

const EXTENSOES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

/** Grava o arquivo e devolve o caminho relativo ("fotos/…" ou "documentos/…"). */
export async function guardarArquivo(pasta: "fotos" | "documentos", arquivo: File): Promise<string> {
  const ext = EXTENSOES[arquivo.type] ?? "bin";
  const relativo = `${pasta}/${randomUUID()}.${ext}`;
  await mkdir(path.join(PASTA_UPLOADS, pasta), { recursive: true });
  await writeFile(path.join(PASTA_UPLOADS, relativo), Buffer.from(await arquivo.arrayBuffer()));
  return relativo;
}

/** Lê um arquivo guardado. null se o caminho for inválido ou não existir. */
export async function lerArquivo(relativo: string): Promise<Buffer | null> {
  if (!/^(fotos|documentos)\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/.test(relativo)) return null;
  try {
    return await readFile(path.join(PASTA_UPLOADS, relativo));
  } catch {
    return null;
  }
}

export function validarArquivo(arquivo: FormDataEntryValue | null, aceitos: string[]): string | null {
  if (!(arquivo instanceof File) || arquivo.size === 0) return "Escolha um arquivo";
  if (!aceitos.includes(arquivo.type)) return aceitos.includes("application/pdf") ? "Envie PDF, JPG, PNG ou WEBP" : "Envie uma imagem JPG, PNG ou WEBP";
  if (arquivo.size > TAMANHO_MAXIMO) return "O arquivo pode ter até 15 MB";
  return null;
}
