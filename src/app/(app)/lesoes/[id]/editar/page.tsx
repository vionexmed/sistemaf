import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { FormularioLesao } from "@/components/lesoes/formulario";
import { buscarAtleta, buscarLesao } from "@/lib/consultas";
import { contextoLesao } from "@/lib/consultas/form-lesao";
import { fmtData } from "@/lib/dominio/datas";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Editar lesão" };

export default async function EditarLesao({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, usuario] = await Promise.all([params, usuarioAtual()]);
  if (!permissoes(usuario.perfil).editar) redirect("/lesoes");
  const lesao = await buscarLesao(Number(id));
  if (!lesao) notFound();
  const [atleta, { atletas, anteriores, hoje }] = await Promise.all([buscarAtleta(lesao.atletaId), contextoLesao()]);
  return (
    <div className="mx-auto flex max-w-wide flex-col gap-6">
      <CabecalhoPagina titulo={`Editar lesão de ${fmtData(lesao.dia)}`} voltar={{ href: `/jogadores/${lesao.atletaId}?aba=lesoes`, rotulo: atleta?.nome ?? "Jogador" }} />
      <FormularioLesao
        atletas={atletas}
        anteriores={anteriores}
        hoje={hoje}
        verSaude
        inicial={{
          id: lesao.id,
          atletaId: lesao.atletaId,
          dia: lesao.dia,
          tipo: lesao.tipo,
          estrutura: lesao.estrutura ?? "",
          reincidencia: lesao.reincidencia ? "sim" : "nao",
          regiao: lesao.regiao,
          lado: lesao.lado,
          emAberto: lesao.diasAfastamento == null ? "sim" : "nao",
          diasAfastamento: lesao.diasAfastamento == null ? "" : String(lesao.diasAfastamento),
          campeonato: lesao.campeonato,
          periodo: lesao.periodo,
          observacao: lesao.observacao ?? "",
        }}
      />
    </div>
  );
}
