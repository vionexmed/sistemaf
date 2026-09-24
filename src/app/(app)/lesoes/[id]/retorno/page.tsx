import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { FormularioRetorno } from "@/components/lesoes/retorno";
import { buscarAtleta, buscarLesao, hoje } from "@/lib/consultas";
import { localDaLesao } from "@/lib/consultas/lesoes";
import { TIPOS_LESAO, rotulo } from "@/lib/catalogos";
import { fmtData } from "@/lib/dominio/datas";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Registrar retorno" };

export default async function RetornoLesao({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, usuario] = await Promise.all([params, usuarioAtual()]);
  if (!permissoes(usuario.perfil).editar) redirect("/lesoes");
  const lesao = await buscarLesao(Number(id));
  if (!lesao) notFound();
  const atleta = await buscarAtleta(lesao.atletaId);
  if (lesao.diasAfastamento != null) redirect(`/jogadores/${lesao.atletaId}?aba=lesoes`);
  return (
    <div className="mx-auto flex max-w-form flex-col gap-6">
      <CabecalhoPagina
        titulo={`Registrar retorno de ${atleta?.apelido ?? "jogador"}`}
        descricao={`${rotulo(TIPOS_LESAO, lesao.tipo)} · ${localDaLesao(lesao.regiao, lesao.lado).toLowerCase()} · desde ${fmtData(lesao.dia)}`}
        voltar={{ href: `/jogadores/${lesao.atletaId}?aba=lesoes`, rotulo: atleta?.nome ?? "Jogador" }}
      />
      <FormularioRetorno id={lesao.id} dia={lesao.dia} hoje={hoje()} atletaId={lesao.atletaId} />
    </div>
  );
}
