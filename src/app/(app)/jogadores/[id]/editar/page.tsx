import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { FormularioJogador } from "@/components/jogadores/formulario";
import { buscarAtleta } from "@/lib/consultas";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Editar cadastro" };

export default async function EditarJogador({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, usuario] = await Promise.all([params, usuarioAtual()]);
  if (!permissoes(usuario.perfil).editar) redirect(`/jogadores/${id}`);
  const a = await buscarAtleta(Number(id));
  if (!a) notFound();
  return (
    <div className="mx-auto flex max-w-page flex-col gap-6">
      <CabecalhoPagina titulo={`Editar cadastro de ${a.apelido}`} voltar={{ href: `/jogadores/${a.id}`, rotulo: a.nome }} />
      <FormularioJogador
        inicial={{
          id: a.id,
          nome: a.nome,
          apelido: a.apelido,
          nascimento: a.nascimento,
          camisa: String(a.camisa),
          posicao: a.posicao,
          alturaCm: a.alturaCm ? String(a.alturaCm) : "",
          pesoKg: a.pesoKg ? String(Number(a.pesoKg)).replace(".", ",") : "",
          pe: a.pe,
          alergias: a.alergias ?? "",
          lesoesAnteriores: a.lesoesAnteriores ?? "",
          foto: a.foto ? `/api/arquivos/${a.foto}` : null,
          ativo: a.ativo,
        }}
      />
    </div>
  );
}
