import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cabeçalho de página: voltar, título (+ contagem), meta e ações (primária à direita). */
export function CabecalhoPagina({
  titulo,
  contagem,
  descricao,
  voltar,
  meta,
  acoes,
  className,
}: {
  titulo: React.ReactNode;
  contagem?: number;
  descricao?: React.ReactNode;
  voltar?: { href: string; rotulo: string };
  meta?: React.ReactNode;
  acoes?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {voltar && (
          <Link
            href={voltar.href}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> {voltar.rotulo}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-titulo">
            {titulo}
            {contagem != null && <span className="ml-2 font-normal text-faint-foreground tabular">{contagem}</span>}
          </h1>
          {meta}
        </div>
        {descricao && <p className="mt-1 text-base text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}
