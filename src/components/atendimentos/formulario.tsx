"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Campo } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Opcoes } from "@/components/ui/toggle-group";
import { BannerErro } from "@/components/estados";
import { StatusBadge } from "@/components/status";
import { Velas } from "@/components/graficos/velas";
import { SeletorAtleta, type OpcaoAtleta } from "@/components/seletor-atleta";
import { HD, OBJETIVOS, PERIODOS_DIA, REGIOES, STATUS_ATENDIMENTO } from "@/lib/catalogos";
import { salvarAtendimento, type EstadoAtendimento } from "@/lib/acoes/atendimentos";
import type { ContextoAtleta } from "@/lib/consultas/registro";

export type ValoresAtendimento = {
  id?: number;
  atletaId: number | null;
  data: string;
  periodo: string;
  hd: string | null;
  local: string | null;
  objetivo: string | null;
  status: string | null;
  evolucao: string;
};

const ROTULOS_ERRO: Record<string, string> = {
  atletaId: "Atleta",
  data: "Data",
  periodo: "Período",
  hd: "HD",
  local: "Local da queixa",
  objetivo: "Objetivo do trabalho",
  status: "Status",
  evolucao: "Evolução",
};

/** Preenche com o último atendimento do atleta (regra de ouro). Data e período continuam os de hoje. */
export function comUltimo(v: ValoresAtendimento, ctx: ContextoAtleta | undefined): ValoresAtendimento {
  const u = ctx?.ultimo;
  // Se o atleta já foi atendido neste dia e período, sugere o outro período.
  const periodo = u && u.data === v.data && u.periodo === v.periodo ? (v.periodo === "matutino" ? "vespertino" : "matutino") : v.periodo;
  return { ...v, periodo, hd: u?.hd ?? null, local: u?.local ?? null, objetivo: u?.objetivo ?? null, status: u?.status ?? null, evolucao: "" };
}

export function FormularioAtendimento({
  atletas,
  contexto,
  inicial,
  hoje,
}: {
  atletas: OpcaoAtleta[];
  contexto: Record<number, ContextoAtleta>;
  inicial: ValoresAtendimento;
  hoje: string;
}) {
  const router = useRouter();
  const editando = inicial.id != null;
  const [v, setV] = React.useState<ValoresAtendimento>(() =>
    !editando && inicial.atletaId ? comUltimo(inicial, contexto[inicial.atletaId]) : inicial,
  );
  const depois = React.useRef<"lista" | "outro">("lista");
  const [estado, acao, pendente] = React.useActionState<EstadoAtendimento, FormData>(async (anterior, form) => {
    const r = await salvarAtendimento(anterior, form);
    if (!r.ok) return r;
    if (editando) {
      toast.success("Atendimento atualizado.");
      router.push(`/jogadores/${form.get("atletaId")}?aba=atendimentos`);
    } else {
      toast.success("Atendimento salvo. Já aparece na ficha e em Atendimentos de hoje.");
      if (depois.current === "outro") {
        setV((atual) => ({ ...atual, atletaId: null, hd: null, local: null, objetivo: null, status: null, evolucao: "" }));
        router.refresh();
      } else router.push("/atendimentos");
    }
    return r;
  }, {});

  const set = <K extends keyof ValoresAtendimento>(k: K, valor: ValoresAtendimento[K]) => setV((atual) => ({ ...atual, [k]: valor }));
  const escolherAtleta = (id: number) => setV((atual) => (editando ? { ...atual, atletaId: id } : comUltimo({ ...atual, atletaId: id }, contexto[id])));

  const erros = estado.erros ?? {};
  const listaErros = Object.entries(erros).filter(([k]) => k !== "geral");
  const atleta = atletas.find((a) => a.id === v.atletaId);
  const ctx = v.atletaId ? contexto[v.atletaId] : undefined;

  return (
    <form action={acao} className="grid gap-6 lg:grid-cols-3">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <input type="hidden" name="atletaId" value={v.atletaId ?? ""} />

      <div className="flex flex-col gap-4 lg:col-span-2">
        {(erros.geral || listaErros.length > 0) && (
          <BannerErro titulo={erros.geral ?? "Confira os campos antes de salvar"}>
            {estado.duplicado ? (
              <Link href={`/atendimentos/${estado.duplicado}/editar`} className="mt-1 inline-block font-medium underline">
                Editar o atendimento existente
              </Link>
            ) : (
              <ul className="mt-1 list-disc pl-4 text-sm">
                {listaErros.map(([k, msg]) => (
                  <li key={k}>
                    {ROTULOS_ERRO[k]}: {msg}
                  </li>
                ))}
              </ul>
            )}
          </BannerErro>
        )}

        <Card>
          <CardHeader titulo="1. Atleta" />
          <CardContent className="flex flex-col gap-4">
            <Campo rotulo="Atleta" htmlFor="atleta" erro={erros.atletaId}>
              <SeletorAtleta id="atleta" atletas={atletas} valor={v.atletaId} aoMudar={escolherAtleta} invalido={!!erros.atletaId} autoAbrir={!editando && !inicial.atletaId} />
              {atleta && <p className="text-sm text-muted-foreground">{atleta.posicao}</p>}
            </Campo>
            <div className="flex flex-wrap gap-4">
              <Campo rotulo="Data do atendimento" htmlFor="data" erro={erros.data}>
                <Input id="data" name="data" type="date" max={hoje} value={v.data} onChange={(e) => set("data", e.target.value)} className="w-44" aria-invalid={!!erros.data} />
              </Campo>
              <Campo rotulo="Período" erro={erros.periodo}>
                <Opcoes nome="periodo" rotuloAcessivel="Período" opcoes={PERIODOS_DIA} valor={v.periodo} aoMudar={(x) => set("periodo", x)} invalido={!!erros.periodo} />
              </Campo>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader titulo="2. Queixa" descricao={ctx?.ultimo && !editando ? "Preenchido com o último atendimento. Mude só o que for diferente." : undefined} />
          <CardContent className="flex flex-col gap-4">
            <Campo rotulo="HD" erro={erros.hd}>
              <Opcoes nome="hd" rotuloAcessivel="HD" opcoes={HD} valor={v.hd} aoMudar={(x) => set("hd", x)} invalido={!!erros.hd} />
            </Campo>
            <Campo rotulo="Local da queixa" erro={erros.local}>
              <Opcoes nome="local" rotuloAcessivel="Local da queixa" opcoes={REGIOES} valor={v.local} aoMudar={(x) => set("local", x)} invalido={!!erros.local} />
            </Campo>
          </CardContent>
        </Card>

        <Card>
          <CardHeader titulo="3. Trabalho de hoje" />
          <CardContent className="flex flex-col gap-4">
            <Campo rotulo="Objetivo do trabalho" erro={erros.objetivo}>
              <Opcoes nome="objetivo" rotuloAcessivel="Objetivo do trabalho" opcoes={OBJETIVOS} valor={v.objetivo} aoMudar={(x) => set("objetivo", x)} invalido={!!erros.objetivo} />
            </Campo>
            <Campo rotulo="Status" erro={erros.status}>
              <Opcoes nome="status" rotuloAcessivel="Status" opcoes={STATUS_ATENDIMENTO} valor={v.status} aoMudar={(x) => set("status", x)} invalido={!!erros.status} />
            </Campo>
            <Campo rotulo="Evolução do dia" htmlFor="evolucao" opcional erro={erros.evolucao}>
              <Textarea id="evolucao" name="evolucao" value={v.evolucao} onChange={(e) => set("evolucao", e.target.value)} placeholder="Ex.: Sem dor no agachamento. Progredindo carga." maxLength={2000} />
            </Campo>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t bg-surface px-4 py-3 md:-mx-8 md:px-8">
          <Button variant="ghost" asChild>
            <Link href={editando ? `/jogadores/${v.atletaId}?aba=atendimentos` : "/atendimentos"}>Cancelar</Link>
          </Button>
          {!editando && (
            <Button type="submit" variant="secondary" disabled={pendente} onClick={() => (depois.current = "outro")}>
              Salvar e registrar outro
            </Button>
          )}
          <Button type="submit" disabled={pendente} onClick={() => (depois.current = "lista")}>
            {pendente ? "Salvando…" : editando ? "Salvar alterações" : "Salvar atendimento"}
          </Button>
        </div>
      </div>

      <aside>
        <Card className="lg:sticky lg:top-16">
          <CardHeader titulo={atleta ? `Histórico do ${atleta.apelido}` : "Histórico"} />
          <CardContent className="flex flex-col gap-6">
            {!ctx ? (
              <p className="text-sm text-muted-foreground">Escolha o atleta para ver os últimos 14 dias e o último atendimento.</p>
            ) : (
              <>
                <Velas velas={ctx.velas} hoje={hoje} />
                <div className="flex flex-col gap-2 border-t pt-4">
                  <p className="text-xs font-medium text-faint-foreground">Último atendimento</p>
                  {ctx.ultimo ? (
                    <>
                      <p className="text-base">{ctx.ultimo.resumo.split(" · ").slice(0, 3).join(" · ")}</p>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <StatusBadge status={ctx.ultimo.status} /> {ctx.ultimo.quando}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Primeiro atendimento deste atleta.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
