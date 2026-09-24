import { eq } from "drizzle-orm";
import { banco, schema } from "@/db";
import { lerArquivo } from "@/lib/arquivos";
import { permissoes, usuarioAtual } from "@/lib/sessao";

// Fotos: todos os perfis. Documentos (exames, laudos): só quem pode ver documentos.
export async function GET(_: Request, { params }: { params: Promise<{ caminho: string[] }> }) {
  const relativo = (await params).caminho.join("/");
  const usuario = await usuarioAtual();
  let mime = relativo.endsWith(".pdf") ? "application/pdf" : relativo.endsWith(".png") ? "image/png" : relativo.endsWith(".webp") ? "image/webp" : "image/jpeg";
  let nome: string | null = null;
  if (relativo.startsWith("documentos/")) {
    if (!permissoes(usuario.perfil).verDocumentos) return new Response("Sem permissão", { status: 403 });
    const db = await banco();
    const [doc] = await db.select().from(schema.documentos).where(eq(schema.documentos.caminho, relativo));
    if (!doc) return new Response("Não encontrado", { status: 404 });
    mime = doc.mime;
    nome = doc.nomeArquivo;
  }
  const conteudo = await lerArquivo(relativo);
  if (!conteudo) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(conteudo), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      ...(nome ? { "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(nome)}` } : {}),
    },
  });
}
