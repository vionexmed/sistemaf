import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegistroCelular } from "@/components/atendimentos/celular";
import { contextoRegistro } from "@/lib/consultas/registro";
import { fmtDiaExtenso, periodoDoHorario } from "@/lib/dominio/datas";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Novo atendimento" };

// Celular: só a tela de registrar atendimento, sem navegação.
export default async function Celular() {
  const usuario = await usuarioAtual();
  if (!permissoes(usuario.perfil).editar) redirect("/painel");
  const { atletas, contexto, frequentes, hoje } = await contextoRegistro();
  return (
    <RegistroCelular
      atletas={atletas}
      contexto={contexto}
      frequentes={frequentes}
      hoje={hoje}
      dataExtenso={fmtDiaExtenso(hoje)}
      periodoPadrao={periodoDoHorario()}
    />
  );
}
