"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListFilter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type Opcao = { readonly valor: string; readonly rotulo: string };
export type DefFiltro = { chave: string; rotulo: string; opcoes: readonly Opcao[] };

/** Monta uma URL a partir da atual, trocando parâmetros. Valor vazio remove o parâmetro. Volta para a página 1. */
export function useUrlComParametros() {
  const pathname = usePathname();
  const params = useSearchParams();
  return React.useCallback(
    (mudancas: Record<string, string | null>) => {
      const p = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(mudancas)) {
        if (v == null || v === "") p.delete(k);
        else p.set(k, v);
      }
      if (!("pagina" in mudancas)) p.delete("pagina");
      const q = p.toString();
      return q ? `${pathname}?${q}` : pathname;
    },
    [pathname, params],
  );
}

/** Abas = visões salvas. */
export function Visoes({ opcoes, chave = "visao", padrao }: { opcoes: readonly Opcao[]; chave?: string; padrao: string }) {
  const params = useSearchParams();
  const url = useUrlComParametros();
  const atual = params.get(chave) ?? padrao;
  return (
    <div role="tablist" className="flex gap-1 border-b">
      {opcoes.map((o) => {
        const ativo = o.valor === atual;
        return (
          <Link
            key={o.valor}
            role="tab"
            aria-selected={ativo}
            href={url({ [chave]: o.valor === padrao ? null : o.valor })}
            scroll={false}
            className={cn(
              "-mb-px flex h-9 items-center border-b-2 border-transparent px-2 text-base text-muted-foreground transition-colors duration-150 hover:text-foreground",
              ativo && "border-primary font-medium text-foreground",
            )}
          >
            {o.rotulo}
          </Link>
        );
      })}
    </div>
  );
}

/** Busca + filtros avançados em popover + chips removíveis. Tudo na URL. */
export function BarraDeFiltros({
  filtros,
  placeholder = "Buscar atleta",
  extra,
}: {
  filtros: DefFiltro[];
  placeholder?: string;
  extra?: React.ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const url = useUrlComParametros();
  const [busca, setBusca] = React.useState(params.get("q") ?? "");

  React.useEffect(() => {
    const atual = params.get("q") ?? "";
    if (busca === atual) return;
    const t = window.setTimeout(() => router.replace(url({ q: busca || null }), { scroll: false }), 250);
    return () => window.clearTimeout(t);
  }, [busca, params, router, url]);

  const selecionados = (chave: string) => (params.get(chave) ?? "").split(",").filter(Boolean);
  const alternar = (chave: string, valor: string) => {
    const atuais = selecionados(chave);
    const novos = atuais.includes(valor) ? atuais.filter((v) => v !== valor) : [...atuais, valor];
    router.replace(url({ [chave]: novos.join(",") || null }), { scroll: false });
  };
  const chips = filtros.flatMap((f) =>
    selecionados(f.chave).map((v) => ({ chave: f.chave, valor: v, rotulo: `${f.rotulo}: ${f.opcoes.find((o) => o.valor === v)?.rotulo ?? v}` })),
  );
  const ativos = chips.length;

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={placeholder}
            placeholder={placeholder}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        {filtros.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">
                <ListFilter /> Filtros
                {ativos > 0 && <span className="rounded-sm bg-selected px-1 text-xs text-acento-11 tabular">{ativos}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-h-96 w-80 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {filtros.map((f) => (
                  <fieldset key={f.chave} className="flex flex-col gap-2">
                    <legend className="mb-2 text-xs font-medium text-muted-foreground">{f.rotulo}</legend>
                    {f.opcoes.map((o) => {
                      const id = `f-${f.chave}-${o.valor}`;
                      return (
                        <label key={o.valor} htmlFor={id} className="flex items-center gap-2 text-base">
                          <Checkbox id={id} checked={selecionados(f.chave).includes(o.valor)} onCheckedChange={() => alternar(f.chave, o.valor)} />
                          {o.rotulo}
                        </label>
                      );
                    })}
                  </fieldset>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        {extra}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={`${c.chave}-${c.valor}`}
              type="button"
              onClick={() => alternar(c.chave, c.valor)}
              className="inline-flex h-7 items-center gap-1 rounded-sm border bg-surface px-2 text-sm hover:bg-hover"
              aria-label={`Remover filtro ${c.rotulo}`}
            >
              {c.rotulo} <X className="size-3" />
            </button>
          ))}
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setBusca("");
              router.replace(url(Object.fromEntries([...filtros.map((f) => [f.chave, null]), ["q", null]])), { scroll: false });
            }}
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}

