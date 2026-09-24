import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { banco, schema } from "@/db";
import { PERFIS, rotulo, type Perfil } from "./catalogos";

// Enquanto não existe login, o perfil vem de um cookie ("Trocar perfil (demonstração)").
// Quando o login chegar, só esta função muda: o resto do sistema lê usuarioAtual().

export type Sessao = { id: number; nome: string; perfil: Perfil; rotuloPerfil: string };

export const COOKIE_PERFIL = "perfil";
export const COOKIE_TEMA = "tema";

export const usuarioAtual = cache(async (): Promise<Sessao> => {
  const jar = await cookies();
  const pedido = jar.get(COOKIE_PERFIL)?.value;
  const perfil: Perfil = PERFIS.some((p) => p.valor === pedido) ? (pedido as Perfil) : "fisioterapia";
  const db = await banco();
  const [u] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.perfil, perfil)).limit(1);
  if (!u) throw new Error(`Nenhum usuário com o perfil ${perfil}.`);
  return { id: u.id, nome: u.nome, perfil, rotuloPerfil: rotulo(PERFIS, perfil) };
});

export type Permissoes = {
  editar: boolean; // cadastrar, registrar, editar, excluir, configurar
  verSaude: boolean; // evolução, estrutura/observação da lesão, alergias, lesões anteriores
  verDocumentos: boolean;
};

export function permissoes(perfil: Perfil): Permissoes {
  return {
    editar: perfil === "fisioterapia",
    verSaude: perfil !== "comissao",
    verDocumentos: perfil !== "comissao",
  };
}

export class SemPermissao extends Error {
  constructor() {
    super("Seu perfil não pode fazer esta ação.");
  }
}

/** Primeira linha de toda Server Action. */
export async function exigir(permissao: keyof Permissoes): Promise<Sessao> {
  const sessao = await usuarioAtual();
  if (!permissoes(sessao.perfil)[permissao]) throw new SemPermissao();
  return sessao;
}
