import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Download } from "lucide-react";
import { cn, fmtNumero } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { StatusBadge } from "@/components/status";
import { BarrasHorizontais, Proporcao } from "@/components/graficos/barras";
import { ColunasEmpilhadas } from "@/components/graficos/colunas";
import { FiltroSegmentado } from "@/components/indice/segmentado";
import { CAMPEONATOS, HD, OBJETIVOS, POSICOES, REGIOES, TIPOS_LESAO, rotulo, type Campeonato } from "@/lib/catalogos";
import { atendimentosEntre, elencoComStatus, hoje, listarLesoes, mapaAtletas } from "@/lib/consultas";
import { localDaLesao } from "@/lib/consultas/lesoes";
import { diferencaDias, fmtDiaMes, fmtDiaMesCurto, fmtIntervalo, fmtMes, somarDias } from "@/lib/dominio/datas";
import {
  colunasPorTempo,
  contarPor,
  dentro,
  granularidadeDoPeriodo,
  janelaAnterior,
  janelaDoPeriodo,
  recortarPorCampeonato,
  resumoAtendimentos,
  variacao,
  type PeriodoPainel,
} from "@/lib/dominio/metricas";
import { diaRetorno, lesaoAfasta } from "@/lib/dominio/status";
import { umDe, type Params } from "@/lib/parametros";

export const metadata: Metadata = { title: "Painel" };

const PERIODOS = [
  { valor: "7d", rotulo: "7 dias" },
  { valor: "30d", rotulo: "30 dias" },
  { valor: "temporada", rotulo: "Temporada" },
] as const;
const CAMPEONATOS_FILTRO = [{ valor: "todos", rotulo: "Todos" }, ...CAMPEONATOS.filter((c) => c.inicio).map((c) => ({ valor: c.valor, rotulo: c.rotulo }))];

export default async function Painel({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const h = hoje();
  const periodo = umDe<PeriodoPainel>(p, "periodo", ["7d", "30d", "temporada"], "30d");
  const campeonato = umDe(p, "campeonato", CAMPEONATOS_FILTRO.map((c) => c.valor), "todos");
  const camp = campeonato === "todos" ? null : (campeonato as Campeonato);

  const janelaBase = janelaDoPeriodo(periodo, h);
  const janela = recortarPorCampeonato(janelaBase, camp);
  const anteriorBase = janelaAnterior(periodo, janelaBase);
  const anterior = anteriorBase && recortarPorCampeonato(anteriorBase, camp);

  const [todos, lesoes, elenco, atletas] = await Promise.all([
    atendimentosEntre(anteriorBase?.de ?? janelaBase.de, h),
    listarLesoes(),
    elencoComStatus(),
    mapaAtletas(),
  ]);
  const doPeriodo = todos.filter((a) => dentro(a.data, janela));
  const doAnterior = anterior ? todos.filter((a) => dentro(a.data, anterior)).length : null;
  const r = resumoAtendimentos(doPeriodo);
  const delta = camp ? null : variacao(r.total, doAnterior);
  const lesoesPeriodo = lesoes.filter((l) => dentro(l.dia, janela) && (!camp || l.campeonato === camp));
  const afastados = elenco.filter((a) => a.status === "afastado");

  const granularidade = granularidadeDoPeriodo(periodo);
  const colunas = janela
    ? colunasPorTempo(doPeriodo, janela, granularidade).map((c) => ({
        rotulo: granularidade === "dia" ? fmtDiaMes(c.inicio) : granularidade === "semana" ? fmtDiaMesCurto(c.inicio) : fmtMes(c.inicio),
        titulo: granularidade === "semana" ? `Semana de ${fmtDiaMes(c.inicio)}` : granularidade === "mes" ? fmtMes(c.inicio) : fmtDiaMes(c.inicio),
        emTratamento: c.emTratamento,
        queixa: c.queixa,
      }))
    : [];

  const q = (extra: Record<string, string>) => new URLSearchParams(extra).toString();
  const visaoAtendimentos = periodo === "7d" ? "7d" : "todos";

  // Precisa de atenção: afastados (com lesão, desde quando, retorno), retornos hoje/amanhã, abertas há mais de 14 dias.
  const atencao = lesoes
    .filter((l) => lesaoAfasta(l, h) && atletas.get(l.atletaId)?.ativo)
    .map((l) => {
      const a = atletas.get(l.atletaId)!;
      const retorno = diaRetorno(l);
      const diasFora = diferencaDias(l.dia, h);
      const motivo = retorno == null ? (diasFora > 14 ? `Em aberto há ${diasFora} dias, sem previsão` : "Em aberto") : retorno === h ? "Volta hoje" : retorno === somarDias(h, 1) ? "Volta amanhã" : `Retorno previsto em ${fmtDiaMes(retorno)}`;
      return { l, a, retorno, diasFora, motivo, urgente: retorno == null ? diasFora > 14 : diferencaDias(h, retorno) <= 1 };
    })
    .sort((x, y) => Number(y.urgente) - Number(x.urgente) || y.diasFora - x.diasFora);

  const resumoLesoes = { porRegiao: contarPor(lesoesPeriodo, (l) => l.regiao), porTipo: contarPor(lesoesPeriodo, (l) => l.tipo) };
  const porPosicao = contarPor(doPeriodo, (a) => atletas.get(a.atletaId)?.posicao ?? "");
  const descricaoJanela = janela ? fmtIntervalo(janela.de, janela.ate) : "O campeonato não tem jogos neste período";

  return (
    <div className="mx-auto flex max-w-wide flex-col gap-6">
      <CabecalhoPagina
        titulo="Painel"
        descricao={descricaoJanela}
        acoes={
          <Button variant="secondary" asChild>
            <a href={`/api/exportar/atendimentos?${q({ de: janela?.de ?? h, ate: janela?.ate ?? h, visao: "intervalo" })}`}><Download /> Exportar</a>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-4">
        <FiltroSegmentado chave="periodo" rotulo="Período" opcoes={PERIODOS} padrao="30d" />
        <FiltroSegmentado chave="campeonato" rotulo="Campeonato" opcoes={CAMPEONATOS_FILTRO} padrao="todos" />
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Números do período">
        <Kpi rotulo="Atendimentos" valor={r.total} href={`/atendimentos?visao=${visaoAtendimentos}`}
          detalhe={delta == null ? (periodo === "temporada" ? "Temporada inteira" : "Sem período anterior para comparar") : undefined}
          variacao={delta} />
        <Kpi rotulo="Atletas atendidos" valor={r.atletasAtendidos} detalhe={`de ${elenco.length} no elenco`} href="/jogadores" />
        <Kpi rotulo="Lesões" valor={lesoesPeriodo.length} detalhe={`${lesoesPeriodo.filter((l) => l.diasAfastamento == null).length} em aberto`} href={`/lesoes${camp ? `?campeonato=${camp}` : ""}`} />
        <Kpi rotulo="Disponíveis hoje" valor={`${elenco.length - afastados.length}/${elenco.length}`} detalhe={`${afastados.length} ${afastados.length === 1 ? "afastado" : "afastados"}`} href="/jogadores?visao=afastados" />
      </section>

      <Card>
        <CardHeader
          titulo={`Atendimentos por ${granularidade === "dia" ? "dia" : granularidade === "semana" ? "semana" : "mês"}`}
          descricao="Em tratamento e queixa pós-treino, com o total de cada coluna."
        />
        <CardContent>
          {janela ? <ColunasEmpilhadas colunas={colunas} /> : <p className="py-8 text-center text-muted-foreground">{descricaoJanela}.</p>}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader titulo="Precisa de atenção" descricao="Afastados hoje, retornos previstos e lesões em aberto." className="pb-4" />
        <div className="border-t">
          {atencao.length === 0 ? (
            <p className="px-4 py-8 text-center text-muted-foreground">Ninguém afastado hoje.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead numero className="w-12">Nº</TableHead>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lesão</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead numero>Dias fora</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atencao.map(({ l, a, diasFora, motivo, urgente }) => (
                  <TableRow key={l.id}>
                    <TableCell numero className="text-muted-foreground">{a.camisa}</TableCell>
                    <TableCell>
                      <Link href={`/jogadores/${a.id}?aba=lesoes`} className="flex items-center gap-2 font-medium hover:underline">
                        <Avatar nome={a.nome} foto={a.foto ? `/api/arquivos/${a.foto}` : null} tamanho={24} /> {a.nome}
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status="afastado" /></TableCell>
                    <TableCell>{rotulo(TIPOS_LESAO, l.tipo)} · {localDaLesao(l.regiao, l.lado).toLowerCase()}</TableCell>
                    <TableCell className="tabular">{fmtDiaMes(l.dia)}</TableCell>
                    <TableCell numero>{diasFora}</TableCell>
                    <TableCell className={cn(urgente && "font-medium")}>{motivo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <section className="flex flex-col gap-4" aria-labelledby="distribuicao">
        <h2 id="distribuicao" className="text-lg font-semibold">Distribuição</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader titulo="Status e período" />
            <CardContent className="flex flex-col gap-6">
              <Proporcao a={{ rotulo: "Em tratamento", total: r.emTratamento }} b={{ rotulo: "Queixa pós-treino", total: r.queixaPosTreino }} />
              <Proporcao a={{ rotulo: "Matutino", total: r.matutino }} b={{ rotulo: "Vespertino", total: r.vespertino }} />
              <p className="flex items-baseline justify-between border-t pt-4 text-sm">
                <span className="text-muted-foreground">Média por dia de treino</span>
                <span className="text-lg font-semibold tabular">{fmtNumero(r.mediaPorDiaDeTreino, 1)}</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader titulo="Local da queixa" />
            <CardContent>
              <BarrasHorizontais itens={r.porLocal.map((c) => ({ rotulo: rotulo(REGIOES, c.valor), total: c.total, href: `/atendimentos?visao=${visaoAtendimentos}&local=${c.valor}` }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader titulo="HD" />
            <CardContent>
              <BarrasHorizontais itens={r.porHd.map((c) => ({ rotulo: rotulo(HD, c.valor), total: c.total, href: `/atendimentos?visao=${visaoAtendimentos}&hd=${c.valor}` }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader titulo="Objetivo do trabalho" />
            <CardContent>
              <BarrasHorizontais itens={r.porObjetivo.map((c) => ({ rotulo: rotulo(OBJETIVOS, c.valor), total: c.total, href: `/atendimentos?visao=${visaoAtendimentos}&objetivo=${c.valor}` }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader titulo="Atletas com mais atendimentos" />
            <CardContent>
              <BarrasHorizontais
                limite={8}
                itens={r.porAtleta.map((c) => {
                  const a = atletas.get(c.valor)!;
                  return { rotulo: a.nome, total: c.total, href: `/jogadores/${a.id}`, prefixo: <span className="w-5 text-right text-xs text-muted-foreground tabular">{a.camisa}</span> };
                })}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader titulo="Por posição" />
            <CardContent>
              <BarrasHorizontais itens={porPosicao.map((c) => ({ rotulo: rotulo(POSICOES, c.valor), total: c.total }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader titulo="Lesões por região" />
            <CardContent>
              <BarrasHorizontais vazio="Sem lesões no período." itens={resumoLesoes.porRegiao.map((c) => ({ rotulo: rotulo(REGIOES, c.valor), total: c.total, href: `/lesoes?regiao=${c.valor}` }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader titulo="Lesões por tipo" />
            <CardContent>
              <BarrasHorizontais vazio="Sem lesões no período." itens={resumoLesoes.porTipo.map((c) => ({ rotulo: rotulo(TIPOS_LESAO, c.valor), total: c.total, href: `/lesoes?tipo=${c.valor}` }))} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Kpi({ rotulo, valor, detalhe, href, variacao: v }: { rotulo: string; valor: number | string; detalhe?: string; href: string; variacao?: number | null }) {
  return (
    <Link href={href} className="flex flex-col gap-1 rounded-md border bg-surface p-4 transition-colors duration-150 hover:bg-hover">
      <span className="text-sm text-muted-foreground">{rotulo}</span>
      <span className="text-xl font-semibold tabular">{valor}</span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {v != null && (
          <span className={cn("inline-flex items-center font-medium tabular", v > 0 ? "text-foreground" : "text-foreground")}>
            {v > 0 ? <ArrowUpRight className="size-3" /> : v < 0 ? <ArrowDownRight className="size-3" /> : null}
            {v > 0 ? "+" : ""}
            {v}%
          </span>
        )}
        {v != null ? "vs. período anterior" : detalhe}
      </span>
    </Link>
  );
}
