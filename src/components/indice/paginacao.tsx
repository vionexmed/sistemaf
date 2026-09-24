"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useUrlComParametros } from "./filtros";

export function Paginacao({ pagina, totalPaginas, total }: { pagina: number; totalPaginas: number; total: number }) {
  const url = useUrlComParametros();
  if (totalPaginas <= 1) return null;
  const link = (p: number) => url({ pagina: p === 1 ? null : String(p) });
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between border-t px-3 py-2 text-sm text-muted-foreground">
      <span className="tabular">{total} registros · 50 por página</span>
      <div className="flex items-center gap-1">
        <Link aria-label="Página anterior" aria-disabled={pagina === 1} href={link(Math.max(1, pagina - 1))} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), pagina === 1 && "pointer-events-none opacity-50")}>
          <ChevronLeft />
        </Link>
        <span className="px-2 tabular">
          {pagina} de {totalPaginas}
        </span>
        <Link aria-label="Próxima página" aria-disabled={pagina === totalPaginas} href={link(Math.min(totalPaginas, pagina + 1))} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), pagina === totalPaginas && "pointer-events-none opacity-50")}>
          <ChevronRight />
        </Link>
      </div>
    </nav>
  );
}
