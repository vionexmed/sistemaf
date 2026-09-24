import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/sessao";

// Tela inicial por perfil: a fisio abre na lista de trabalho do dia; quem só consulta, no Painel.
export default async function Inicio() {
  const [usuario, h] = await Promise.all([usuarioAtual(), headers()]);
  const celular = /Mobi|Android|iPhone/i.test(h.get("user-agent") ?? "");
  if (usuario.perfil === "fisioterapia") redirect(celular ? "/celular" : "/atendimentos");
  redirect("/painel");
}
