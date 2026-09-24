import { redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { NavConfiguracoes } from "@/components/configuracoes/nav";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export default async function LayoutConfiguracoes({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  if (!permissoes(usuario.perfil).editar) redirect("/painel");
  return (
    <div className="mx-auto flex max-w-page flex-col gap-6">
      <CabecalhoPagina titulo="Configurações" />
      <div className="flex flex-col gap-6 md:flex-row">
        <NavConfiguracoes />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
