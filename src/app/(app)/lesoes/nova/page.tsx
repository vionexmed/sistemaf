import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { FormularioLesao } from "@/components/lesoes/formulario";
import { contextoLesao } from "@/lib/consultas/form-lesao";
import { campeonatoDaData, periodoTemporadaDaData } from "@/lib/dominio/metricas";
import { texto, type Params } from "@/lib/parametros";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Registrar lesão" };

export default async function NovaLesao({ searchParams }: { searchParams: Promise<Params> }) {
  const [p, usuario] = await Promise.all([searchParams, usuarioAtual()]);
  if (!permissoes(usuario.perfil).editar) redirect("/lesoes");
  const { atletas, anteriores, hoje } = await contextoLesao();
  const pedido = Number(texto(p, "atleta"));
  const atleta = atletas.find((a) => a.id === pedido);
  return (
    <div className="mx-auto flex max-w-wide flex-col gap-6">
      <CabecalhoPagina
        titulo={atleta ? `Registrar lesão do ${atleta.apelido}` : "Registrar lesão"}
        descricao="Para quando o jogador se machuca e fica fora de treinos e jogos."
        voltar={atleta ? { href: `/jogadores/${atleta.id}?aba=lesoes`, rotulo: atleta.nome } : { href: "/lesoes", rotulo: "Lesões" }}
      />
      <FormularioLesao
        atletas={atletas}
        anteriores={anteriores}
        hoje={hoje}
        verSaude
        inicial={{
          atletaId: atleta?.id ?? null,
          dia: hoje,
          tipo: null,
          estrutura: "",
          reincidencia: "nao",
          regiao: null,
          lado: null,
          emAberto: "sim",
          diasAfastamento: "",
          campeonato: campeonatoDaData(hoje),
          periodo: periodoTemporadaDaData(hoje),
          observacao: "",
        }}
      />
    </div>
  );
}
