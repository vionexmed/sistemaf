import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio, SemResultados } from "@/components/estados";
import { BarraDeFiltros, Visoes } from "@/components/indice/filtros";
import { Paginacao } from "@/components/indice/paginacao";
import { AtualizarSozinho, TabelaAtendimentos } from "@/components/atendimentos/tabela";
import { HD, OBJETIVOS, PERIODOS_DIA, POSICOES, REGIOES, STATUS_ATENDIMENTO, rotulo } from "@/lib/catalogos";
import { atendimentosEntre, hoje, mapaAtletas } from "@/lib/consultas";
import { ehDataISO, fmtDiaExtenso, fmtDiaMes, fmtInstante, haQuanto, somarDias } from "@/lib/dominio/datas";
import { filtrarAtendimentos, janelaDaVisao, VISOES_ATENDIMENTO, type VisaoAtendimento } from "@/lib/dominio/filtros";
import { inteiro, lista, normalizar, paginar, texto, umDe, type Params } from "@/lib/parametros";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Atendimentos" };

export default async function PaginaAtendimentos({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const h = hoje();
  const visao = umDe<VisaoAtendimento>(p, "visao", VISOES_ATENDIMENTO.map((v) => v.valor), "hoje");
  const dataParam = texto(p, "data");
  const dia = visao === "hoje" && ehDataISO(dataParam) && dataParam <= h ? dataParam : h;
  const janela = janelaDaVisao(visao, h, dia);

  const [usuario, todos, atletas] = await Promise.all([usuarioAtual(), atendimentosEntre(janela.de, janela.ate), mapaAtletas()]);
  const pode = permissoes(usuario.perfil);

  const filtros = {
    periodo: lista(p, "periodo"),
    status: lista(p, "status"),
    hd: lista(p, "hd"),
    local: lista(p, "local"),
    objetivo: lista(p, "objetivo"),
  };
  const busca = normalizar(texto(p, "q") ?? "");
  const filtrados = filtrarAtendimentos(todos, filtros).filter((a) => {
    if (!busca) return true;
    const atleta = atletas.get(a.atletaId);
    return atleta != null && normalizar(`${atleta.nome} ${atleta.apelido} ${atleta.camisa ?? ""}`).includes(busca);
  });
  const filtroAtivo = busca !== "" || Object.values(filtros).some((f) => f.length > 0);
  const { itens, pagina, totalPaginas } = paginar(filtrados, inteiro(p, "pagina", 1));

  const agora = new Date();
  const linhas = itens.map((a) => {
    const atleta = atletas.get(a.atletaId)!;
    return {
      id: a.id,
      atletaId: a.atletaId,
      camisa: atleta.camisa,
      nome: atleta.nome,
      foto: atleta.foto ? `/api/arquivos/${atleta.foto}` : null,
      posicao: rotulo(POSICOES, atleta.posicao),
      data: fmtDiaMes(a.data),
      dataISO: a.data,
      periodo: rotulo(PERIODOS_DIA, a.periodo),
      hd: rotulo(HD, a.hd),
      local: rotulo(REGIOES, a.local),
      objetivo: rotulo(OBJETIVOS, a.objetivo),
      status: a.status,
      registradoHa: haQuanto(a.criadoEm, agora),
      registradoEm: fmtInstante(a.criadoEm),
    };
  });

  const emTratamento = filtrados.filter((a) => a.status === "em_tratamento").length;
  const queixa = filtrados.length - emTratamento;
  const qs = new URLSearchParams(Object.entries(p).flatMap(([k, v]) => (typeof v === "string" && k !== "pagina" ? [[k, v]] : [])));
  const exportarHref = `/api/exportar/atendimentos?${qs.toString()}`;

  const tituloVisao = visao === "hoje" ? (dia === h ? "Hoje" : fmtDiaMes(dia)) : VISOES_ATENDIMENTO.find((v) => v.valor === visao)!.rotulo;
  const diaAnterior = `/atendimentos?data=${somarDias(dia, -1)}`;
  const diaSeguinte = somarDias(dia, 1) === h ? "/atendimentos" : `/atendimentos?data=${somarDias(dia, 1)}`;

  return (
    <div className="mx-auto flex max-w-wide flex-col gap-6">
      {visao === "hoje" && dia === h && <AtualizarSozinho />}
      <CabecalhoPagina
        titulo={visao === "hoje" && dia === h ? "Atendimentos de hoje" : "Atendimentos"}
        contagem={filtrados.length}
        descricao={
          <>
            {visao === "hoje" || visao === "ontem" ? fmtDiaExtenso(janela.de) : tituloVisao}
            {filtrados.length > 0 && (
              <>
                {" · "}
                {emTratamento} em tratamento · {queixa} queixa pós-treino
              </>
            )}
          </>
        }
        acoes={
          <Button variant="secondary" asChild>
            <a href={exportarHref}>
              <Download /> Exportar
            </a>
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Visoes opcoes={VISOES_ATENDIMENTO} padrao="hoje" />
          {visao === "hoje" && (
            <div className="flex items-center gap-1 rounded-full bg-hover p-0.5">
              <Button variant="ghost" size="icon-sm" className="rounded-full" asChild>
                <Link href={diaAnterior} aria-label="Dia anterior"><ChevronLeft /></Link>
              </Button>
              <span className="min-w-12 text-center text-sm font-medium tabular">{tituloVisao}</span>
              <Button variant="ghost" size="icon-sm" asChild aria-disabled={dia === h} className={dia === h ? "pointer-events-none rounded-full opacity-40" : "rounded-full"}>
                <Link href={diaSeguinte} aria-label="Dia seguinte"><ChevronRight /></Link>
              </Button>
            </div>
          )}
        </div>
        <BarraDeFiltros
          filtros={[
            { chave: "periodo", rotulo: "Período", opcoes: PERIODOS_DIA },
            { chave: "status", rotulo: "Status", opcoes: STATUS_ATENDIMENTO },
            { chave: "hd", rotulo: "HD", opcoes: HD },
            { chave: "local", rotulo: "Local da queixa", opcoes: REGIOES },
            { chave: "objetivo", rotulo: "Objetivo", opcoes: OBJETIVOS },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        {todos.length === 0 ? (
          <EstadoVazio
            icone={ClipboardList}
            frase={visao === "hoje" ? "Nenhum atendimento registrado neste dia." : "Nenhum atendimento neste período."}
            acao={pode.editar ? { rotulo: "Registrar atendimento", href: "/atendimentos/novo" } : undefined}
          />
        ) : filtrados.length === 0 && filtroAtivo ? (
          <SemResultados limparHref={visao === "hoje" ? (dia === h ? "/atendimentos" : `/atendimentos?data=${dia}`) : `/atendimentos?visao=${visao}`} />
        ) : (
          <>
            <TabelaAtendimentos linhas={linhas} podeEditar={pode.editar} mostrarData={visao !== "hoje" && visao !== "ontem"} />
            <Paginacao pagina={pagina} totalPaginas={totalPaginas} total={filtrados.length} />
          </>
        )}
      </Card>
    </div>
  );
}
