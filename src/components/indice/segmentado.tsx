"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUrlComParametros, type Opcao } from "./filtros";

/** Filtro segmentado ligado à URL. */
export function FiltroSegmentado({ chave, rotulo, opcoes, padrao }: { chave: string; rotulo: string; opcoes: readonly Opcao[]; padrao: string }) {
  const params = useSearchParams();
  const url = useUrlComParametros();
  const atual = params.get(chave) ?? padrao;
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{rotulo}</span>
      <div role="radiogroup" aria-label={rotulo} className="inline-flex h-9 items-center rounded-md border bg-subtle p-0.5">
        {opcoes.map((o) => (
          <Link
            key={o.valor}
            role="radio"
            aria-checked={o.valor === atual}
            href={url({ [chave]: o.valor === padrao ? null : o.valor })}
            scroll={false}
            className={cn(
              "flex h-full items-center rounded-sm px-3 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground",
              o.valor === atual && "bg-surface font-medium text-foreground shadow-[0_0_0_1px_var(--border)]",
            )}
          >
            {o.rotulo}
          </Link>
        ))}
      </div>
    </div>
  );
}
