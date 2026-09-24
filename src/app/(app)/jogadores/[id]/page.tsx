import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, FileBarChart, FlaskConical, HeartPulse, MoreHorizontal, Pencil } from "lucide-react";
import { cn, fmtNumero } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/tooltip";
import { EstadoVazio } from "@/components/estados";
import { StatusBadge } from "@/components/status";
import { BarrasHorizontais } from "@/components/graficos/barras";
import { Velas } from "@/components/graficos/velas";
import { MapaQueixas } from "@/components/jogadores/mapa-queixas";
import { HistoricoAtendimentos } from "@/components/jogadores/historico";
import { Documentos } from "@/components/jogadores/documentos";
import { FotoJogador } from "@/components/jogadores/foto";
import { TabelaLesoes } from "@/components/lesoes/tabela";
import { HD, OBJETIVOS, PERIODOS_DIA, PES, POSICOES, REGIOES, STATUS_ATENDIMENTO, TIPOS_LESAO, TIPOS_TESTE, rotulo } from "@/lib/catalogos";
import {
  atendimentosDoAtleta,
  buscarAtleta,
  documentosDoAtleta,
  hoje,
  listarLesoes,
  listarUsuarios,
  statusHoje,
} from "@/lib/consultas";
import { linhaLesao } from "@/lib/consultas/lesoes";
import { fmtDiaMes, haQuanto, horaMinuto, idade, somarDias } from "@/lib/dominio/datas";
import { mapaDeQueixas, periodosDeTratamento, resumoDaRegiao } from "@/lib/dominio/ficha";
import { contarPor, velasPorDia } from "@/lib/dominio/metricas";
import { umDe, type Params } from "@/lib/parametros";
import { permissoes, usuarioAtual } from "@/lib/sessao";

const ABAS = [
  { valor: "geral", rotulo: "Visão geral" },
  { valor: "atendimentos", rotulo: "Atendimentos" },
  { valor: "lesoes", rotulo: "Lesões" },
  { valor: "testes", rotulo: "Testes" },
  { valor: "documentos", rotulo: "Documentos" },
] as const;
type Aba = (typeof ABAS)[number]["valor"];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const atleta = await buscarAtleta(Number((await params).id));
  return { title: atleta?.nome ?? "Jogador" };
}

export default async function FichaJogador({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Params> }) {
  const [{ id }, p, usuario] = await Promise.all([params, searchParams, usuarioAtual()]);
  const atleta = await buscarAtleta(Number(id));
  if (!atleta) notFound();
  const pode = permissoes(usuario.perfil);
  const abas = ABAS.filter((a) => a.valor !== "documentos" || pode.verDocumentos);
  const aba = umDe<Aba>(p, "aba", abas.map((a) => a.valor), "geral");
  const h = hoje();

  const [atendimentos, todasLesoes, status] = await Promise.all([atendimentosDoAtleta(atleta.id), listarLesoes(), statusHoje()]);
  const lesoes = todasLesoes.filter((l) => l.atletaId === atleta.id);
  const statusAtleta = status.get(atleta.id) ?? "liberado";

  const detalhes = [
    rotulo(POSICOES, atleta.posicao),
    `${idade(atleta.nascimento, h)} anos`,
    atleta.alturaCm ? `${fmtNumero(atleta.alturaCm / 100, 2)} m` : null,
    atleta.pesoKg ? `${fmtNumero(Number(atleta.pesoKg), 1)} kg` : null,
    atleta.pe ? rotulo(PES, atleta.pe) : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto flex max-w-wide flex-col gap-4">
      <div className="flex flex-col gap-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <FotoJogador atletaId={atleta.id} nome={atleta.nome} foto={atleta.foto ? `/api/arquivos/${atleta.foto}` : null} podeEditar={pode.editar} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-titulo">{atleta.nome}</h1>
                {atleta.camisa != null && <span className="text-2xl text-faint-foreground tabular">#{atleta.camisa}</span>}
                <StatusBadge status={statusAtleta} />
                {!atleta.ativo && <Badge>Fora do elenco</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{detalhes.join(" · ")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" asChild>
              <Link href={`/jogadores/${atleta.id}/relatorio`}><FileBarChart /> Relatório</Link>
            </Button>
            {pode.editar && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" aria-label="Mais ações"><MoreHorizontal /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><Link href={`/lesoes/nova?atleta=${atleta.id}`}><HeartPulse /> Registrar lesão <Kbd>L</Kbd></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href={`/jogadores/${atleta.id}/editar`}><Pencil /> Editar cadastro</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>

      <nav role="tablist" aria-label="Seções da ficha" className="flex gap-1 overflow-x-auto border-b">
        {abas.map((a) => (
          <Link
            key={a.valor}
            role="tab"
            aria-selected={a.valor === aba}
            href={`/jogadores/${atleta.id}${a.valor === "geral" ? "" : `?aba=${a.valor}`}`}
            scroll={false}
            className={cn(
              "-mb-px flex h-9 items-center border-b-2 border-transparent px-2 whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground",
              a.valor === aba && "border-foreground font-medium text-foreground",
            )}
          >
            {a.rotulo}
            {a.valor === "lesoes" && lesoes.length > 0 && <span className="ml-1 text-xs tabular">{lesoes.length}</span>}
          </Link>
        ))}
      </nav>

      {aba === "geral" && <VisaoGeral atleta={atleta} atendimentos={atendimentos} lesoes={lesoes} hoje={h} verSaude={pode.verSaude} />}
      {aba === "atendimentos" && <AbaAtendimentos atendimentos={atendimentos} hoje={h} nome={atleta.nome} podeEditar={pode.editar} verSaude={pode.verSaude} atletaId={atleta.id} />}
      {aba === "lesoes" && (
        <Card className="overflow-hidden">
          <CardHeader
            titulo="Lesões"
            descricao="Índice de lesões deste jogador."
            acao={pode.editar && <Button variant="secondary" asChild><Link href={`/lesoes/nova?atleta=${atleta.id}`}><HeartPulse /> Registrar lesão</Link></Button>}
            className="pb-4"
          />
          <div className="border-t">
            {lesoes.length === 0 ? (
              <EstadoVazio icone={HeartPulse} frase="Nenhuma lesão registrada." />
            ) : (
              <TabelaLesoes linhas={lesoes.map((l) => linhaLesao(l, atleta, h, pode.verSaude))} podeEditar={pode.editar} mostrarAtleta={false} />
            )}
          </div>
        </Card>
      )}
      {aba === "testes" && (
        <div className="grid gap-4 md:grid-cols-2">
          {TIPOS_TESTE.map((t) => (
            <Card key={t.valor}>
              <CardHeader titulo={t.rotulo} descricao="Última avaliação: —" />
              <CardContent>
                <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-8 text-center">
                  <FlaskConical className="size-6 text-muted-foreground" strokeWidth={1.75} />
                  <p className="text-sm text-muted-foreground">Aguardando o modelo da planilha.</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {aba === "documentos" && pode.verDocumentos && <AbaDocumentos atletaId={atleta.id} podeEditar={pode.editar} />}
    </div>
  );
}

type AtendimentoLista = Awaited<ReturnType<typeof atendimentosDoAtleta>>;
type LesaoLista = Awaited<ReturnType<typeof listarLesoes>>;

function VisaoGeral({
  atleta,
  atendimentos,
  lesoes,
  hoje: h,
  verSaude,
}: {
  atleta: NonNullable<Awaited<ReturnType<typeof buscarAtleta>>>;
  atendimentos: AtendimentoLista;
  lesoes: LesaoLista;
  hoje: string;
  verSaude: boolean;
}) {
  const regioes = mapaDeQueixas(atendimentos, lesoes).map((r) => ({
    regiao: r.regiao,
    nome: rotulo(REGIOES, r.regiao),
    tipoQueixa: rotulo(HD, r.tipoQueixa) || rotulo(TIPOS_LESAO, r.tipoQueixa),
    atual: r.atual,
    atendimentos: r.atendimentos,
    lesoes: r.lesoes,
    lados: r.lados,
    resumo: resumoDaRegiao(r),
  }));
  const velas = velasPorDia(atendimentos.filter((a) => a.data >= somarDias(h, -13)), { de: somarDias(h, -13), ate: h });
  const hojeLista = atendimentos.filter((a) => a.data === h);
  const objetivos30 = contarPor(atendimentos.filter((a) => a.data >= somarDias(h, -29)), (a) => a.objetivo);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card>
          <CardHeader titulo="Mapa de queixas" />
          <CardContent>
            <MapaQueixas regioes={regioes} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader titulo="Frequência · 14 dias" />
          <CardContent>
            <Velas velas={velas} hoje={h} />
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader titulo="Hoje" />
          <CardContent className="flex flex-col gap-4">
            {hojeLista.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem atendimento hoje{atendimentos[0] ? ` · último em ${fmtDiaMes(atendimentos[0].data)}` : ""}.
              </p>
            ) : (
              hojeLista.map((a) => (
                <div key={a.id} className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    {rotulo(PERIODOS_DIA, a.periodo)} · {horaMinuto(a.criadoEm)}
                  </p>
                  <Badge tom="acento">{rotulo(OBJETIVOS, a.objetivo)}</Badge>
                  {verSaude && <p>{a.evolucao ?? <span className="text-muted-foreground">Sem evolução registrada.</span>}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader titulo="Objetivo do trabalho · 30 dias" />
          <CardContent>
            <BarrasHorizontais itens={objetivos30.map((o) => ({ rotulo: rotulo(OBJETIVOS, o.valor), total: o.total }))} vazio="Sem atendimentos nos últimos 30 dias." />
          </CardContent>
        </Card>
        {verSaude && (atleta.alergias || atleta.lesoesAnteriores) && (
          <Card>
            <CardHeader titulo="Saúde" />
            <CardContent className="flex flex-col gap-2 text-sm">
              {atleta.alergias && <p><span className="text-muted-foreground">Alergias e medicamentos:</span> {atleta.alergias}</p>}
              {atleta.lesoesAnteriores && <p><span className="text-muted-foreground">Lesões anteriores:</span> {atleta.lesoesAnteriores}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AbaAtendimentos({
  atendimentos,
  hoje: h,
  nome,
  podeEditar,
  verSaude,
  atletaId,
}: {
  atendimentos: AtendimentoLista;
  hoje: string;
  nome: string;
  podeEditar: boolean;
  verSaude: boolean;
  atletaId: number;
}) {
  if (atendimentos.length === 0) {
    return (
      <Card>
        <EstadoVazio icone={Activity} frase="Nenhum atendimento registrado." acao={podeEditar ? { rotulo: "Registrar o primeiro atendimento", href: `/atendimentos/novo?atleta=${atletaId}` } : undefined} />
      </Card>
    );
  }
  const periodos = periodosDeTratamento(atendimentos);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="overflow-hidden lg:col-span-2">
        <CardHeader titulo="Histórico" descricao={`${atendimentos.length} atendimentos na temporada`} className="pb-4" />
        <div className="border-t">
          <HistoricoAtendimentos
            nome={nome}
            podeEditar={podeEditar}
            mostrarEvolucao={verSaude}
            linhas={atendimentos.map((a) => ({
              id: a.id,
              data: fmtDiaMes(a.data),
              periodo: rotulo(PERIODOS_DIA, a.periodo),
              hd: rotulo(HD, a.hd),
              local: rotulo(REGIOES, a.local),
              objetivo: rotulo(OBJETIVOS, a.objetivo),
              status: a.status,
              evolucao: a.evolucao,
            }))}
          />
        </div>
      </Card>
      <Card>
        <CardHeader titulo="Períodos de tratamento" descricao="Mesmo HD e local, sem intervalo maior que 7 dias." />
        <CardContent>
          <ol className="flex flex-col">
            {periodos.map((pr) => (
              <li key={`${pr.de}-${pr.hd}-${pr.local}`} className="flex flex-col gap-1 border-b py-3 first:pt-0 last:border-0 last:pb-0">
                <span className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium tabular">
                    {fmtDiaMes(pr.de)}
                    {pr.ate !== pr.de && ` – ${pr.ate === h ? "hoje" : fmtDiaMes(pr.ate)}`}
                    {pr.ate === pr.de && pr.de === h && " (hoje)"}
                  </span>
                  <span className="text-xs text-muted-foreground tabular">{pr.atendimentos === 1 ? "1 atendimento" : `${pr.atendimentos} atendimentos`}</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {rotulo(STATUS_ATENDIMENTO, pr.status)} · {rotulo(HD, pr.hd)} · {rotulo(REGIOES, pr.local).toLowerCase()}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

async function AbaDocumentos({ atletaId, podeEditar }: { atletaId: number; podeEditar: boolean }) {
  const [docs, usuarios] = await Promise.all([documentosDoAtleta(atletaId), listarUsuarios()]);
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));
  const agora = new Date();
  return (
    <Documentos
      atletaId={atletaId}
      podeEditar={podeEditar}
      documentos={docs.map((d) => ({
        id: d.id,
        nome: d.nomeArquivo,
        tipo: d.tipo,
        href: `/api/arquivos/${d.caminho}`,
        enviadoPor: (d.enviadoPor && nomes.get(d.enviadoPor)) || "—",
        quando: `${haQuanto(d.criadoEm, agora)}`,
        tamanho: d.tamanho > 1024 * 1024 ? `${fmtNumero(d.tamanho / 1024 / 1024, 1)} MB` : `${Math.max(1, Math.round(d.tamanho / 1024))} KB`,
      }))}
    />
  );
}

