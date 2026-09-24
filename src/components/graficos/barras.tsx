import Link from "next/link";
import { cn } from "@/lib/utils";

export type ItemBarra = { rotulo: string; total: number; href?: string; prefixo?: React.ReactNode };

// Barras horizontais para categorias: uma cor, número à direita, do maior para o menor.
export function BarrasHorizontais({
  itens,
  vazio = "Sem registros no período.",
  limite,
  className,
}: {
  itens: ItemBarra[];
  vazio?: string;
  limite?: number;
  className?: string;
}) {
  const lista = [...itens].sort((a, b) => b.total - a.total).slice(0, limite);
  const max = Math.max(1, ...lista.map((i) => i.total));
  if (lista.length === 0) return <p className="py-4 text-sm text-muted-foreground">{vazio}</p>;
  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {lista.map((i) => {
        const conteudo = (
          <>
            <span className="flex w-36 shrink-0 items-center gap-2 truncate text-sm" title={i.rotulo}>
              {i.prefixo}
              <span className="truncate">{i.rotulo}</span>
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-sm bg-hover">
              <span className="block h-full rounded-sm bg-chart-1" style={{ width: `${(i.total / max) * 100}%` }} />
            </span>
            <span className="w-8 shrink-0 text-right text-sm font-medium tabular">{i.total}</span>
          </>
        );
        return (
          <li key={i.rotulo}>
            {i.href ? (
              <Link href={i.href} className="-mx-2 flex h-8 items-center gap-3 rounded-sm px-2 hover:bg-hover">
                {conteudo}
              </Link>
            ) : (
              <div className="flex h-8 items-center gap-3">{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Duas partes de um todo. */
export function Proporcao({ a, b }: { a: { rotulo: string; total: number }; b: { rotulo: string; total: number } }) {
  const soma = a.total + b.total;
  const pa = soma === 0 ? 0 : Math.round((a.total / soma) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span>
          {a.rotulo} <span className="font-medium tabular">{a.total}</span> <span className="text-muted-foreground tabular">({pa}%)</span>
        </span>
        <span>
          {b.rotulo} <span className="font-medium tabular">{b.total}</span> <span className="text-muted-foreground tabular">({soma === 0 ? 0 : 100 - pa}%)</span>
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-sm bg-hover" role="img" aria-label={`${a.rotulo} ${pa}%, ${b.rotulo} ${100 - pa}%`}>
        {soma > 0 && (
          <>
            <span className="h-full bg-chart-1" style={{ width: `${pa}%` }} />
            <span className="h-full bg-chart-2" style={{ width: `${100 - pa}%` }} />
          </>
        )}
      </div>
    </div>
  );
}
