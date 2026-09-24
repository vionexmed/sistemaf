import * as React from "react";
import { cn } from "@/lib/utils";

// Card = seção de página com um propósito. Nunca card dentro de card; sem sombra.
function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="card" className={cn("rounded-md border bg-surface", className)} {...props} />;
}

function CardHeader({
  className,
  titulo,
  descricao,
  acao,
}: {
  className?: string;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-4 px-4 pt-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </header>
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-4", className)} {...props} />;
}

export { Card, CardHeader, CardContent };
