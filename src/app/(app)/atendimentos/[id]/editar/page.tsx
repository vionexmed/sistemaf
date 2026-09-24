import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { FormularioAtendimento } from "@/components/atendimentos/formulario";
import { buscarAtendimento, buscarAtleta } from "@/lib/consultas";
import { contextoRegistro } from "@/lib/consultas/registro";
import { fmtDiaMes } from "@/lib/dominio/datas";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Editar atendimento" };

export default async function EditarAtendimento({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, usuario] = await Promise.all([params, usuarioAtual()]);
  if (!permissoes(usuario.perfil).editar) redirect("/atendimentos");
  const atendimento = await buscarAtendimento(Number(id));
  if (!atendimento) notFound();
  const [atleta, { atletas, contexto, hoje }] = await Promise.all([buscarAtleta(atendimento.atletaId), contextoRegistro()]);

  return (
    <div className="mx-auto flex max-w-wide flex-col gap-6">
      <CabecalhoPagina
        titulo={`Editar atendimento de ${fmtDiaMes(atendimento.data)}`}
        voltar={{ href: `/jogadores/${atendimento.atletaId}?aba=atendimentos`, rotulo: atleta?.nome ?? "Jogador" }}
      />
      <FormularioAtendimento
        atletas={atletas}
        contexto={contexto}
        hoje={hoje}
        inicial={{
          id: atendimento.id,
          atletaId: atendimento.atletaId,
          data: atendimento.data,
          periodo: atendimento.periodo,
          hd: atendimento.hd,
          local: atendimento.local,
          objetivo: atendimento.objetivo,
          status: atendimento.status,
          evolucao: atendimento.evolucao ?? "",
        }}
      />
    </div>
  );
}
