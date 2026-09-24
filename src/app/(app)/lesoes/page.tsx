import type { Metadata } from "next";
import Link from "next/link";
import { Download, HeartPulse, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kbd, Tooltip } from "@/components/ui/tooltip";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio, SemResultados } from "@/components/estados";
import { BarraDeFiltros, Visoes } from "@/components/indice/filtros";
import { Paginacao } from "@/components/indice/paginacao";
import { TabelaLesoes } from "@/components/lesoes/tabela";
import { CAMPEONATOS, PERIODOS_TEMPORADA, REGIOES, TIPOS_LESAO } from "@/lib/catalogos";
import { hoje, listarLesoes, mapaAtletas } from "@/lib/consultas";
import { linhaLesao } from "@/lib/consultas/lesoes";
import { filtrarLesoes, VISOES_LESAO, type VisaoLesao } from "@/lib/dominio/filtros";
import { resumoLesoes } from "@/lib/dominio/metricas";
import { inteiro, lista, normalizar, paginar, texto, umDe, type Params } from "@/lib/parametros";
import { permissoes, usuarioAtual } from "@/lib/sessao";
import { fmtNumero } from "@/lib/utils";

export const metadata: Metadata = { title: "Lesões" };

export default async function PaginaLesoes({ searchParams }: { searchParams: Promise<Params> }) {
  const [p, usuario, lesoes, atletas] = await Promise.all([searchParams, usuarioAtual(), listarLesoes(), mapaAtletas()]);
  const pode = permissoes(usuario.perfil);
  const h = hoje();
  const visao = umDe<VisaoLesao>(p, "visao", VISOES_LESAO.map((v) => v.valor), "todas");
  const busca = normalizar(texto(p, "q") ?? "");
  const filtros = { campeonato: lista(p, "campeonato"), periodo: lista(p, "periodo"), tipo: lista(p, "tipo"), regiao: lista(p, "regiao") };

  const filtradas = filtrarLesoes(lesoes, visao, filtros).filter((l) => {
    if (!busca) return true;
    const a = atletas.get(l.atletaId);
    return a != null && normalizar(`${a.nome} ${a.apelido} ${a.camisa}`).includes(busca);
  });
  const filtroAtivo = busca !== "" || Object.values(filtros).some((f) => f.length > 0);
  const r = resumoLesoes(filtradas, h);
  const { itens, pagina, totalPaginas } = paginar(filtradas, inteiro(p, "pagina", 1));
  const qs = new URLSearchParams(Object.entries(p).flatMap(([k, v]) => (typeof v === "string" && k !== "pagina" ? [[k, v]] : [])));

  const resumo = [
    `${r.emAberto} em aberto`,
    `reincidência ${r.reincidenciaPct}%`,
    `afastamento médio ${r.mediaAfastamento == null ? "—" : `${fmtNumero(r.mediaAfastamento, 0)} dias`}`,
    `${r.diasPerdidos} dias perdidos`,
  ].join(" · ");

  return (
    <div className="mx-auto flex max-w-wide flex-col gap-4">
      <CabecalhoPagina
        titulo="Lesões"
        contagem={filtradas.length}
        descricao={filtradas.length > 0 ? resumo : "Quando o jogador se machuca e fica fora de treinos e jogos."}
        acoes={
          <>
            <Button variant="secondary" asChild>
              <a href={`/api/exportar/lesoes?${qs.toString()}`}><Download /> Exportar</a>
            </Button>
            {pode.editar && (
              <Tooltip conteudo={<>Registrar lesão <Kbd>L</Kbd></>}>
                <Button asChild>
                  <Link href="/lesoes/nova"><Plus /> Registrar lesão</Link>
                </Button>
              </Tooltip>
            )}
          </>
        }
      />
      <Card className="overflow-hidden">
        <div className="px-3">
          <Visoes opcoes={VISOES_LESAO} padrao="todas" />
          <BarraDeFiltros
            filtros={[
              { chave: "campeonato", rotulo: "Campeonato", opcoes: CAMPEONATOS },
              { chave: "periodo", rotulo: "Período", opcoes: PERIODOS_TEMPORADA },
              { chave: "tipo", rotulo: "Tipo", opcoes: TIPOS_LESAO },
              { chave: "regiao", rotulo: "Região", opcoes: REGIOES },
            ]}
          />
        </div>
        <div className="border-t">
          {lesoes.length === 0 ? (
            <EstadoVazio icone={HeartPulse} frase="Nenhuma lesão registrada na temporada." acao={pode.editar ? { rotulo: "Registrar lesão", href: "/lesoes/nova" } : undefined} />
          ) : filtradas.length === 0 ? (
            filtroAtivo ? <SemResultados limparHref={visao === "todas" ? "/lesoes" : `/lesoes?visao=${visao}`} /> : <p className="px-4 py-12 text-center text-muted-foreground">{visao === "abertas" ? "Nenhuma lesão em aberto." : "Nenhuma lesão encerrada."}</p>
          ) : (
            <>
              <TabelaLesoes linhas={itens.map((l) => linhaLesao(l, atletas.get(l.atletaId)!, h, pode.verSaude))} podeEditar={pode.editar} />
              <Paginacao pagina={pagina} totalPaginas={totalPaginas} total={filtradas.length} />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
