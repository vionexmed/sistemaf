import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fmtNumero } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status";
import { BarrasHorizontais } from "@/components/graficos/barras";
import { ColunasEmpilhadas } from "@/components/graficos/colunas";
import { BarraRelatorio } from "@/components/jogadores/barra-relatorio";
import { ASSINATURA, HD, OBJETIVOS, PERIODOS_DIA, PES, POSICOES, REGIOES, STATUS_ATENDIMENTO, TIPOS_LESAO, naRegiao, rotulo } from "@/lib/catalogos";
import { atendimentosDoAtleta, buscarAtleta, hoje, listarLesoes, statusHoje } from "@/lib/consultas";
import { localDaLesao } from "@/lib/consultas/lesoes";
import { ehDataISO, fmtData, fmtDiaMes, fmtDiaMesCurto, fmtIntervalo, idade, somarDias } from "@/lib/dominio/datas";
import { colunasPorTempo, contarPor, dentro, diasAfastadoNaJanela, diasEmTratamento } from "@/lib/dominio/metricas";
import { resumoRelatorio } from "@/lib/dominio/relatorio";
import { texto, type Params } from "@/lib/parametros";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Relatório do jogador" };

export default async function Relatorio({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Params> }) {
  const [{ id }, p, usuario] = await Promise.all([params, searchParams, usuarioAtual()]);
  const atleta = await buscarAtleta(Number(id));
  if (!atleta) notFound();
  const h = hoje();
  const ateParam = texto(p, "ate");
  const deParam = texto(p, "de");
  const ate = ehDataISO(ateParam) && ateParam <= h ? ateParam : h;
  const de = ehDataISO(deParam) && deParam <= ate ? deParam : somarDias(ate, -29);
  const janela = { de, ate };
  const verSaude = permissoes(usuario.perfil).verSaude;

  const [todos, lesoesTodas, status] = await Promise.all([atendimentosDoAtleta(atleta.id), listarLesoes(), statusHoje()]);
  const atendimentos = todos.filter((a) => dentro(a.data, janela));
  const lesoes = lesoesTodas.filter((l) => l.atletaId === atleta.id);
  const lesoesNoPeriodo = lesoes.filter((l) => dentro(l.dia, janela));
  const diasAfastado = diasAfastadoNaJanela(lesoes, janela, h);
  const diasTrat = diasEmTratamento(atendimentos);
  const porLocal = contarPor(atendimentos, (a) => a.local);
  const porObjetivo = contarPor(atendimentos, (a) => a.objetivo);
  const principal = contarPor(atendimentos, (a) => `${a.hd}|${a.local}`)[0]?.valor.split("|");
  const statusAtleta = status.get(atleta.id) ?? "liberado";
  const intervalo = fmtIntervalo(de, ate);
  const colunas = colunasPorTempo(atendimentos, janela, "semana").map((c) => ({ rotulo: fmtDiaMesCurto(c.inicio), titulo: `Semana de ${fmtDiaMes(c.inicio)}`, emTratamento: c.emTratamento, queixa: c.queixa }));

  const resumo = resumoRelatorio({
    apelido: atleta.apelido,
    intervalo,
    atendimentos: atendimentos.length,
    diasComAtendimento: new Set(atendimentos.map((a) => a.data)).size,
    diasEmTratamento: diasTrat,
    diasAfastado,
    principalQueixa: principal ? { hd: rotulo(HD, principal[0]), naRegiao: naRegiao(principal[1]) } : null,
    principalObjetivo: porObjetivo[0] ? rotulo(OBJETIVOS, porObjetivo[0].valor) : null,
    lesoesNoPeriodo: lesoesNoPeriodo.length,
    status: statusAtleta,
  });

  const detalhes = [
    rotulo(POSICOES, atleta.posicao),
    `${idade(atleta.nascimento, h)} anos`,
    atleta.alturaCm ? `${fmtNumero(atleta.alturaCm / 100, 2)} m` : null,
    atleta.pesoKg ? `${fmtNumero(Number(atleta.pesoKg), 1)} kg` : null,
    atleta.pe ? rotulo(PES, atleta.pe) : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto flex max-w-[210mm] flex-col gap-4">
      <BarraRelatorio atletaId={atleta.id} de={de} ate={ate} hoje={h} />

      <article className="flex flex-col gap-6 rounded-md border bg-surface p-8 print:border-0 print:p-0">
        <header className="flex items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex size-10 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground" title="Espaço do escudo do clube">SA</span>
            <div className="leading-tight">
              <p className="font-semibold">Departamento de saúde · EC Santo André</p>
              <p className="text-sm text-muted-foreground">Relatório da fisioterapia · {intervalo}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Para: comissão técnica</p>
        </header>

        <section className="flex items-center gap-4">
          <Avatar nome={atleta.nome} foto={atleta.foto ? `/api/arquivos/${atleta.foto}` : null} tamanho={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{atleta.nome}</h1>
              {atleta.camisa != null && <span className="text-xl text-muted-foreground tabular">#{atleta.camisa}</span>}
              <StatusBadge status={statusAtleta} />
            </div>
            <p className="text-sm text-muted-foreground">{detalhes.join(" · ")}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Resumo</h2>
          <p className="max-w-prose">{resumo}</p>
        </section>

        <section className="grid grid-cols-3 gap-4">
          {[
            ["Atendimentos", atendimentos.length],
            ["Dias em tratamento", diasTrat],
            ["Dias afastado", diasAfastado],
          ].map(([r, v]) => (
            <div key={r} className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">{r}</p>
              <p className="text-xl font-semibold tabular">{v}</p>
            </div>
          ))}
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-4 text-lg font-semibold">Atendimentos por semana</h2>
          <ColunasEmpilhadas colunas={colunas} altura={120} />
        </section>

        <section className="grid gap-6 sm:grid-cols-2 print:grid-cols-2 break-inside-avoid">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Local da queixa</h2>
            <BarrasHorizontais itens={porLocal.map((c) => ({ rotulo: rotulo(REGIOES, c.valor), total: c.total }))} />
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold">Objetivo do trabalho</h2>
            <BarrasHorizontais itens={porObjetivo.map((c) => ({ rotulo: rotulo(OBJETIVOS, c.valor), total: c.total }))} />
          </div>
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-2 text-lg font-semibold">Últimos atendimentos</h2>
          {atendimentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem atendimentos no período.</p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="h-9">
                    <TableHead>Data</TableHead><TableHead>Período</TableHead><TableHead>HD</TableHead><TableHead>Local</TableHead><TableHead>Objetivo</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atendimentos.slice(0, 8).map((a) => (
                    <TableRow key={a.id} className="h-9">
                      <TableCell className="tabular">{fmtDiaMes(a.data)}</TableCell>
                      <TableCell>{rotulo(PERIODOS_DIA, a.periodo)}</TableCell>
                      <TableCell>{rotulo(HD, a.hd)}</TableCell>
                      <TableCell>{rotulo(REGIOES, a.local)}</TableCell>
                      <TableCell>{rotulo(OBJETIVOS, a.objetivo)}</TableCell>
                      <TableCell>{rotulo(STATUS_ATENDIMENTO, a.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-2 text-lg font-semibold">Lesões</h2>
          {lesoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma lesão registrada.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {lesoes.map((l) => (
                <li key={l.id} className="flex flex-wrap justify-between gap-2 border-b py-2 last:border-0">
                  <span>
                    <span className="font-medium">{rotulo(TIPOS_LESAO, l.tipo)}{verSaude && l.estrutura ? ` · ${l.estrutura}` : ""}</span>
                    <span className="text-muted-foreground"> · {localDaLesao(l.regiao, l.lado).toLowerCase()}</span>
                  </span>
                  <span className="text-muted-foreground tabular">
                    {fmtData(l.dia)} · {l.diasAfastamento == null ? "em aberto" : `${l.diasAfastamento} dias`}{l.reincidencia ? " · reincidência" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-8 flex items-end justify-between gap-4 border-t pt-8 text-sm">
          <div>
            <div className="mb-2 h-px w-64 bg-foreground" />
            <p>{ASSINATURA.nome} · CREFITO {ASSINATURA.crefito}</p>
          </div>
          <p className="text-muted-foreground">Gerado em {fmtData(h)}</p>
        </footer>
      </article>
    </div>
  );
}
