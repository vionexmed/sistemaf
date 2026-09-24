import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { FormularioJogador } from "@/components/jogadores/formulario";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Adicionar jogador" };

export default async function NovoJogador() {
  const usuario = await usuarioAtual();
  if (!permissoes(usuario.perfil).editar) redirect("/jogadores");
  return (
    <div className="mx-auto flex max-w-page flex-col gap-6">
      <CabecalhoPagina titulo="Adicionar jogador" descricao="Cadastro em 3 etapas." voltar={{ href: "/jogadores", rotulo: "Jogadores" }} />
      <FormularioJogador
        inicial={{ nome: "", apelido: "", nascimento: "", camisa: "", posicao: null, alturaCm: "", pesoKg: "", pe: null, alergias: "", lesoesAnteriores: "", foto: null }}
      />
    </div>
  );
}
