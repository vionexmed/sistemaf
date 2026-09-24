"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Manequim, type LadoCorpo } from "@/components/manequim";

export type RegiaoMapa = {
  regiao: string;
  nome: string;
  tipoQueixa: string;
  atual: boolean;
  atendimentos: number;
  lesoes: number;
  lados: LadoCorpo[];
  resumo: string;
};

// Mapa de queixas: manequim de frente e de costas + lista das regiões. Selecionar destaca no corpo.
export function MapaQueixas({ regioes }: { regioes: RegiaoMapa[] }) {
  const [sel, setSel] = React.useState<string | null>(regioes[0]?.regiao ?? null);
  const selecionada = regioes.find((r) => r.regiao === sel) ?? null;
  const destaques = regioes.map((r) => ({ regiao: r.regiao, lados: r.lados, intensidade: r.atual ? ("forte" as const) : ("suave" as const) }));

  if (regioes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex gap-4">
          <Manequim vista="frente" />
          <Manequim vista="costas" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhuma queixa registrada. As regiões aparecem aqui conforme os atendimentos e lesões são registrados.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex shrink-0 justify-center gap-4">
        <Manequim vista="frente" destaques={destaques} selecionada={selecionada} />
        <Manequim vista="costas" destaques={destaques} selecionada={selecionada} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <ul className="flex flex-col" aria-label="Regiões com queixa">
          {regioes.map((r) => (
            <li key={r.regiao}>
              <button
                type="button"
                onClick={() => setSel(r.regiao)}
                aria-pressed={sel === r.regiao}
                className={cn(
                  "flex h-11 w-full items-center gap-3 rounded-md px-2 text-left transition-colors duration-150 hover:bg-hover",
                  sel === r.regiao && "bg-hover",
                )}
              >
                <span className={cn("size-2 shrink-0 rounded-full", r.atual ? "bg-chart-1" : "bg-[var(--blue-7)]")} aria-hidden />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate font-medium">{r.nome}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.tipoQueixa} · {r.atual ? "atual" : "antiga"}
                  </span>
                </span>
                <span className="text-sm tabular text-muted-foreground">{r.atendimentos}</span>
              </button>
            </li>
          ))}
        </ul>
        {selecionada && (
          <p className="border-t pt-4 text-sm">
            <span className="font-medium">{selecionada.nome}:</span> {selecionada.resumo}.
          </p>
        )}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-chart-1" /> Queixa atual</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--blue-7)]" /> Antiga</span>
          <span className="ml-auto">nº de atendimentos</span>
        </div>
      </div>
    </div>
  );
}
