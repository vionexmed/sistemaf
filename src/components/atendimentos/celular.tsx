"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Opcoes } from "@/components/ui/toggle-group";
import { BannerErro } from "@/components/estados";
import { SeletorAtleta, type OpcaoAtleta } from "@/components/seletor-atleta";
import { HD, OBJETIVOS, PERIODOS_DIA, REGIOES, STATUS_ATENDIMENTO } from "@/lib/catalogos";
import { salvarAtendimento, type EstadoAtendimento } from "@/lib/acoes/atendimentos";
import type { ContextoAtleta } from "@/lib/consultas/registro";

type Valores = { atletaId: number | null; periodo: string; hd: string | null; local: string | null; objetivo: string | null; status: string | null; evolucao: string };

// Celular, na sala: escolher quem está (1 toque), "Repetir e ajustar" (2), Salvar (3).
export function RegistroCelular({
  atletas,
  contexto,
  frequentes,
  hoje,
  dataExtenso,
  periodoPadrao,
}: {
  atletas: OpcaoAtleta[];
  contexto: Record<number, ContextoAtleta>;
  frequentes: number[];
  hoje: string;
  dataExtenso: string;
  periodoPadrao: string;
}) {
  const router = useRouter();
  const vazio: Valores = { atletaId: null, periodo: periodoPadrao, hd: null, local: null, objetivo: null, status: null, evolucao: "" };
  const [v, setV] = React.useState<Valores>(vazio);
  const [salvoNome, setSalvoNome] = React.useState<string | null>(null);
  const [estado, acao, pendente] = React.useActionState<EstadoAtendimento, FormData>(async (anterior, form) => {
    const r = await salvarAtendimento(anterior, form);
    if (r.ok) {
      setSalvoNome(atletas.find((a) => a.id === Number(form.get("atletaId")))?.apelido ?? "Atleta");
      window.scrollTo({ top: 0 });
      router.refresh();
    }
    return r;
  }, {});
  const set = <K extends keyof Valores>(k: K, x: Valores[K]) => setV((a) => ({ ...a, [k]: x }));

  const atleta = atletas.find((a) => a.id === v.atletaId);
  const ctx = v.atletaId ? contexto[v.atletaId] : undefined;

  const escolher = (id: number) => {
    const u = contexto[id]?.ultimo;
    const periodo = u && u.data === hoje && u.periodo === periodoPadrao ? (periodoPadrao === "matutino" ? "vespertino" : "matutino") : periodoPadrao;
    setV({ ...vazio, atletaId: id, periodo });
  };
  const repetir = () => {
    const u = ctx?.ultimo;
    if (u) setV((a) => ({ ...a, hd: u.hd, local: u.local, objetivo: u.objetivo, status: u.status }));
  };

  if (salvoNome) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Cabecalho dataExtenso={dataExtenso} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <CheckCircle2 className="size-10 text-ok-9" strokeWidth={1.75} />
          <p className="text-lg font-semibold">Atendimento do {salvoNome} salvo.</p>
          <p className="text-muted-foreground">Já aparece na ficha e em Atendimentos de hoje.</p>
          <Button className="w-full max-w-xs" onClick={() => { setSalvoNome(null); setV(vazio); }}>
            Registrar o próximo
          </Button>
        </div>
      </div>
    );
  }

  const erros = estado.erros ?? {};
  const frequentesAtletas = frequentes.map((id) => atletas.find((a) => a.id === id)).filter((a): a is OpcaoAtleta => !!a);

  return (
    <form action={acao} className="flex min-h-dvh flex-col bg-background pb-24">
      <input type="hidden" name="atletaId" value={v.atletaId ?? ""} />
      <input type="hidden" name="data" value={hoje} />
      <Cabecalho dataExtenso={dataExtenso} />

      <div className="flex flex-col gap-4 p-4">
        {(erros.geral || Object.keys(erros).length > 0) && (
          <BannerErro titulo={erros.geral ?? "Falta preencher"}>
            {!erros.geral && <p className="text-sm">{Object.values(erros).join(" · ")}</p>}
          </BannerErro>
        )}

        <Bloco titulo="Quem está na sala?">
          <div className="grid grid-cols-4 gap-2">
            {frequentesAtletas.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => escolher(a.id)}
                aria-pressed={v.atletaId === a.id}
                className={cn("flex flex-col items-center gap-1 rounded-lg p-2 text-center", v.atletaId === a.id ? "bg-primary text-primary-foreground" : "bg-surface shadow-ativo")}
              >
                <Avatar nome={a.nome} foto={a.foto} tamanho={40} />
                <span className="w-full truncate text-xs font-medium">{a.apelido}</span>
              </button>
            ))}
          </div>
          <SeletorAtleta atletas={atletas} valor={v.atletaId} aoMudar={escolher} invalido={!!erros.atletaId} />
        </Bloco>

        {ctx && (
          <Bloco titulo={ctx.ultimo ? "Mesmo de ontem?" : "Primeiro atendimento"}>
            {ctx.ultimo ? (
              <>
                <p className="text-sm text-muted-foreground">Último atendimento: {ctx.ultimo.quando}</p>
                <p>{ctx.ultimo.resumo}</p>
                <Button type="button" variant="secondary" onClick={repetir}>
                  <Copy /> Repetir e ajustar
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{atleta?.apelido} ainda não tem atendimento registrado.</p>
            )}
          </Bloco>
        )}

        <Bloco titulo="Período">
          <Opcoes nome="periodo" rotuloAcessivel="Período" opcoes={PERIODOS_DIA} valor={v.periodo} aoMudar={(x) => set("periodo", x)} />
        </Bloco>
        <Bloco titulo="HD">
          <Opcoes nome="hd" rotuloAcessivel="HD" opcoes={HD} valor={v.hd} aoMudar={(x) => set("hd", x)} invalido={!!erros.hd} />
        </Bloco>
        <Bloco titulo="Local da queixa">
          <Opcoes nome="local" rotuloAcessivel="Local da queixa" opcoes={REGIOES} valor={v.local} aoMudar={(x) => set("local", x)} invalido={!!erros.local} />
        </Bloco>
        <Bloco titulo="Objetivo do trabalho">
          <Opcoes nome="objetivo" rotuloAcessivel="Objetivo do trabalho" opcoes={OBJETIVOS} valor={v.objetivo} aoMudar={(x) => set("objetivo", x)} invalido={!!erros.objetivo} />
        </Bloco>
        <Bloco titulo="Status">
          <Opcoes nome="status" rotuloAcessivel="Status" opcoes={STATUS_ATENDIMENTO} valor={v.status} aoMudar={(x) => set("status", x)} invalido={!!erros.status} />
        </Bloco>
        <Bloco titulo="Evolução do dia (opcional)">
          <Campo rotulo="Evolução do dia" className="[&>label]:sr-only">
            <Textarea name="evolucao" value={v.evolucao} onChange={(e) => set("evolucao", e.target.value)} maxLength={2000} />
          </Campo>
        </Bloco>

        <Link href="/atendimentos" className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Monitor className="size-4" /> Abrir a versão completa
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4">
        <Button type="submit" className="w-full" disabled={pendente}>
          {pendente ? "Salvando…" : atleta ? `Salvar atendimento do ${atleta.apelido}` : "Salvar atendimento"}
        </Button>
      </div>
    </form>
  );
}

function Cabecalho({ dataExtenso }: { dataExtenso: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-surface px-4">
      <span aria-hidden className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">SA</span>
      <div className="leading-tight">
        <h1 className="font-semibold">Novo atendimento</h1>
        <p className="text-xs text-muted-foreground">{dataExtenso}</p>
      </div>
    </header>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-md border bg-surface p-4">
      <h2 className="font-medium">{titulo}</h2>
      {children}
    </section>
  );
}
