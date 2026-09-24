"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PERFIS } from "@/lib/catalogos";
import { COOKIE_PERFIL, COOKIE_TEMA } from "@/lib/sessao";

const UM_ANO = 60 * 60 * 24 * 365;

/** Demonstração: troca o perfil sem login. Some quando o login existir. */
export async function trocarPerfil(perfil: string) {
  if (!PERFIS.some((p) => p.valor === perfil)) return;
  (await cookies()).set(COOKIE_PERFIL, perfil, { path: "/", maxAge: UM_ANO, sameSite: "lax", httpOnly: true });
  revalidatePath("/", "layout");
}

export async function trocarTema(tema: "claro" | "escuro") {
  (await cookies()).set(COOKIE_TEMA, tema === "escuro" ? "escuro" : "claro", { path: "/", maxAge: UM_ANO, sameSite: "lax" });
  revalidatePath("/", "layout");
}
