import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { FormularioAtendimento } from "@/components/atendimentos/formulario";
import { contextoRegistro } from "@/lib/consultas/registro";
import { periodoDoHorario } from "@/lib/dominio/datas";
import { texto, type Params } from "@/lib/parametros";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Registrar atendimento" };

export default async function NovoAtendimento({ searchParams }: { searchParams: Promise<Params> }) {
  const [p, usuario] = await Promise.all([searchParams, usuarioAtual()]);
  if (!permissoes(usuario.perfil).editar) redirect("/atendimentos");
  const { atletas, contexto, hoje } = await contextoRegistro();
  const pedido = Number(texto(p, "atleta"));
  const atletaId = atletas.some((a) => a.id === pedido) ? pedido : null;
  const atleta = atletas.find((a) => a.id === atletaId);

  return (
    <div className="mx-auto flex max-w-wide flex-col gap-6">
      <CabecalhoPagina
        titulo={atleta ? `Registrar atendimento do ${atleta.apelido}` : "Registrar atendimento"}
        voltar={atleta ? { href: `/jogadores/${atleta.id}`, rotulo: atleta.nome } : { href: "/atendimentos", rotulo: "Atendimentos" }}
      />
      <FormularioAtendimento
        atletas={atletas}
        contexto={contexto}
        hoje={hoje}
        inicial={{ atletaId, data: hoje, periodo: periodoDoHorario(), hd: null, local: null, objetivo: null, status: null, evolucao: "" }}
      />
    </div>
  );
}
