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
import { Manequim, type LadoCorpo } from "@/components/manequim";
import { SeletorAtleta, type OpcaoAtleta } from "@/components/seletor-atleta";
import { CAMPEONATOS, LADOS, PERIODOS_TEMPORADA, REGIOES, REGIOES_LESAO, TIPOS_LESAO, rotulo } from "@/lib/catalogos";
import { campeonatoDaData, periodoTemporadaDaData } from "@/lib/dominio/metricas";
import { salvarLesao, type EstadoLesao } from "@/lib/acoes/lesoes";

export type LesaoAnterior = { id: number; dia: string; tipo: string; local: string; regiao: string; lado: string; afastamento: string };

export type ValoresLesao = {
  id?: number;
  atletaId: number | null;
  dia: string;
  tipo: string | null;
  estrutura: string;
  reincidencia: "sim" | "nao" | null;
  regiao: string | null;
  lado: string | null;
  emAberto: "sim" | "nao";
  diasAfastamento: string;
  campeonato: string | null;
  periodo: string | null;
  observacao: string;
};

const SIM_NAO = [{ valor: "nao", rotulo: "Não" }, { valor: "sim", rotulo: "Sim" }] as const;
const AFASTAMENTO = [{ valor: "nao", rotulo: "Dias definidos" }, { valor: "sim", rotulo: "Em aberto" }] as const;
const OPCOES_REGIAO = REGIOES_LESAO.map((v) => ({ valor: v, rotulo: rotulo(REGIOES, v) }));

const ROTULOS: Record<string, string> = {
  atletaId: "Atleta", dia: "Dia da lesão", tipo: "Tipo de lesão", estrutura: "Estrutura", regiao: "Região", lado: "Lado",
  reincidencia: "Reincidência", diasAfastamento: "Afastamento", campeonato: "Campeonato", periodo: "Período", observacao: "Observação",
};

function nomeLado(lado: string | null) {
  return lado === "bilateral" ? "bilateral" : lado === "E" ? "esquerdo" : lado === "D" ? "direito" : "";
}

export function FormularioLesao({
  atletas,
  anteriores,
  inicial,
  hoje,
  verSaude,
}: {
  atletas: OpcaoAtleta[];
  anteriores: Record<number, LesaoAnterior[]>;
  inicial: ValoresLesao;
  hoje: string;
  verSaude: boolean;
}) {
  const router = useRouter();
  const editando = inicial.id != null;
  const [v, setV] = React.useState(inicial);
  const [estado, acao, pendente] = React.useActionState<EstadoLesao, FormData>(async (anterior, form) => {
    const r = await salvarLesao(anterior, form);
    if (r.ok) {
      toast.success(editando ? "Lesão atualizada." : r.afastado ? "Lesão registrada. O status do jogador mudou para afastado." : "Lesão registrada.");
      router.push(`/jogadores/${r.atletaId}?aba=lesoes`);
    }
    return r;
  }, {});
  const set = <K extends keyof ValoresLesao>(k: K, valor: ValoresLesao[K]) => setV((a) => ({ ...a, [k]: valor }));

  // Reincidência sugerida: lesão anterior na mesma região e lado.
  const lista = v.atletaId ? (anteriores[v.atletaId] ?? []).filter((l) => l.id !== v.id) : [];
  const sugerirReincidencia = (regiao: string | null, lado: string | null, atletaId = v.atletaId) =>
    regiao && lado && atletaId && (anteriores[atletaId] ?? []).some((l) => l.id !== v.id && l.regiao === regiao && (l.lado === lado || l.lado === "bilateral" || lado === "bilateral")) ? "sim" : "nao";

  const escolherNoCorpo = (regiao: string, lado: LadoCorpo) =>
    setV((a) => ({ ...a, regiao, lado, reincidencia: editando ? a.reincidencia : sugerirReincidencia(regiao, lado) }));
  const mudarDia = (dia: string) =>
    setV((a) => ({ ...a, dia, periodo: a.periodo ?? periodoTemporadaDaData(dia), campeonato: a.campeonato ?? campeonatoDaData(dia) }));

  const lados: LadoCorpo[] = v.lado === "bilateral" ? ["D", "E"] : v.lado === "E" ? ["E"] : v.lado === "D" ? ["D"] : [];
  const destaques = v.regiao && lados.length ? [{ regiao: v.regiao, lados, intensidade: "forte" as const }] : [];
  const erros = estado.erros ?? {};
  const listaErros = Object.entries(erros).filter(([k]) => k !== "geral");

  return (
    <form action={acao} className="grid gap-6 lg:grid-cols-3">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <input type="hidden" name="atletaId" value={v.atletaId ?? ""} />

      <div className="flex flex-col gap-4 lg:col-span-2">
        {listaErros.length > 0 && (
          <BannerErro titulo="Confira os campos antes de salvar">
            <ul className="mt-1 list-disc pl-4 text-sm">
              {listaErros.map(([k, m]) => <li key={k}>{ROTULOS[k]}: {m}</li>)}
            </ul>
          </BannerErro>
        )}

        <Card>
          <CardHeader titulo="1. A lesão" />
          <CardContent className="flex flex-col gap-4">
            <Campo rotulo="Atleta" htmlFor="atleta" erro={erros.atletaId}>
              <SeletorAtleta id="atleta" atletas={atletas} valor={v.atletaId} aoMudar={(id) => setV((a) => ({ ...a, atletaId: id, reincidencia: sugerirReincidencia(a.regiao, a.lado, id) }))} invalido={!!erros.atletaId} autoAbrir={!editando && !inicial.atletaId} />
            </Campo>
            <Campo rotulo="Dia da lesão" htmlFor="dia" erro={erros.dia}>
              <Input id="dia" name="dia" type="date" max={hoje} value={v.dia} onChange={(e) => mudarDia(e.target.value)} className="w-44" aria-invalid={!!erros.dia} />
            </Campo>
            <Campo rotulo="Tipo de lesão" erro={erros.tipo}>
              <Opcoes nome="tipo" rotuloAcessivel="Tipo de lesão" opcoes={TIPOS_LESAO} valor={v.tipo} aoMudar={(x) => set("tipo", x)} invalido={!!erros.tipo} />
            </Campo>
            {verSaude && (
              <Campo rotulo="Estrutura" htmlFor="estrutura" opcional erro={erros.estrutura}>
                <Input id="estrutura" name="estrutura" value={v.estrutura} onChange={(e) => set("estrutura", e.target.value)} placeholder="Ex.: bíceps femoral" className="max-w-sm" maxLength={120} />
              </Campo>
            )}
            <Campo rotulo="Reincidência" erro={erros.reincidencia} ajuda={v.reincidencia === "sim" && !editando ? "Sugerido: já houve lesão nesta região e lado." : undefined}>
              <Opcoes nome="reincidencia" rotuloAcessivel="Reincidência" opcoes={SIM_NAO} valor={v.reincidencia} aoMudar={(x) => set("reincidencia", x as "sim" | "nao")} invalido={!!erros.reincidencia} />
            </Campo>
          </CardContent>
        </Card>

        <Card>
          <CardHeader titulo="2. Onde foi" descricao="Toque no corpo ou escolha na lista. Tocar no corpo já define o lado." />
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="flex shrink-0 justify-center gap-4">
                <Manequim vista="frente" largura={112} destaques={destaques} selecionada={v.regiao && lados.length ? { regiao: v.regiao, lados } : null} aoEscolher={escolherNoCorpo} />
                <Manequim vista="costas" largura={112} destaques={destaques} selecionada={v.regiao && lados.length ? { regiao: v.regiao, lados } : null} aoEscolher={escolherNoCorpo} />
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <Campo rotulo="Região" erro={erros.regiao}>
                  <Opcoes nome="regiao" rotuloAcessivel="Região" opcoes={OPCOES_REGIAO} valor={v.regiao} aoMudar={(x) => setV((a) => ({ ...a, regiao: x, reincidencia: editando ? a.reincidencia : sugerirReincidencia(x, a.lado) }))} invalido={!!erros.regiao} />
                </Campo>
                <Campo rotulo="Lado" erro={erros.lado}>
                  <Opcoes nome="lado" rotuloAcessivel="Lado" opcoes={LADOS} valor={v.lado} aoMudar={(x) => setV((a) => ({ ...a, lado: x, reincidencia: editando ? a.reincidencia : sugerirReincidencia(a.regiao, x) }))} invalido={!!erros.lado} />
                </Campo>
              </div>
            </div>
            {v.regiao && v.lado && (
              <p className="rounded-md bg-selected px-3 py-2 text-sm text-acento-11">
                {v.tipo ? `${rotulo(TIPOS_LESAO, v.tipo)} · ` : ""}
                {rotulo(REGIOES, v.regiao).toLowerCase()} {nomeLado(v.lado)} · aparece no mapa de queixas da ficha
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader titulo="3. Afastamento" />
          <CardContent className="flex flex-col gap-4">
            <Campo rotulo="Tempo de afastamento" erro={erros.diasAfastamento}>
              <div className="flex flex-wrap items-center gap-4">
                <Opcoes nome="emAberto" rotuloAcessivel="Tempo de afastamento" opcoes={AFASTAMENTO} valor={v.emAberto} aoMudar={(x) => set("emAberto", x as "sim" | "nao")} />
                {v.emAberto === "nao" && (
                  <span className="flex items-center gap-2">
                    <Input name="diasAfastamento" type="number" inputMode="numeric" min={0} max={730} value={v.diasAfastamento} onChange={(e) => set("diasAfastamento", e.target.value)} className="w-24 text-right tabular" aria-label="Dias de afastamento" aria-invalid={!!erros.diasAfastamento} />
                    <span className="text-muted-foreground">dias</span>
                  </span>
                )}
              </div>
            </Campo>
            <Campo rotulo="Campeonato" erro={erros.campeonato}>
              <Opcoes nome="campeonato" rotuloAcessivel="Campeonato" opcoes={CAMPEONATOS} valor={v.campeonato} aoMudar={(x) => set("campeonato", x)} invalido={!!erros.campeonato} />
            </Campo>
            <Campo rotulo="Período" erro={erros.periodo} ajuda="Sugerido pela data da lesão.">
              <Opcoes nome="periodo" rotuloAcessivel="Período" opcoes={PERIODOS_TEMPORADA} valor={v.periodo} aoMudar={(x) => set("periodo", x)} invalido={!!erros.periodo} />
            </Campo>
            {verSaude && (
              <Campo rotulo="Observação" htmlFor="observacao" opcional erro={erros.observacao}>
                <Textarea id="observacao" name="observacao" value={v.observacao} onChange={(e) => set("observacao", e.target.value)} maxLength={2000} />
              </Campo>
            )}
          </CardContent>
        </Card>

        <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t bg-background px-4 py-3 md:-mx-6 md:px-6">
          <Button variant="ghost" asChild>
            <Link href={v.atletaId ? `/jogadores/${v.atletaId}?aba=lesoes` : "/lesoes"}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={pendente}>{pendente ? "Salvando…" : editando ? "Salvar alterações" : "Registrar lesão"}</Button>
        </div>
      </div>

      <aside>
        <Card>
          <CardHeader titulo="Lesões anteriores" />
          <CardContent>
            {!v.atletaId ? (
              <p className="text-sm text-muted-foreground">Escolha o atleta.</p>
            ) : lista.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma lesão anterior.</p>
            ) : (
              <ul className="flex flex-col">
                {lista.map((l) => (
                  <li key={l.id} className="flex flex-col gap-1 border-b py-2 first:pt-0 last:border-0 last:pb-0">
                    <span className="flex justify-between text-sm">
                      <span className="font-medium">{l.tipo}</span>
                      <span className="text-muted-foreground tabular">{l.dia}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">{l.local} · {l.afastamento}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
