import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Badge pequena: fundo passo 3, texto passo 11, ponto passo 9.
const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tom: {
        neutro: "bg-hover text-muted-foreground",
        acento: "bg-acento-3 text-acento-11",
        info: "bg-info-3 text-info-11",
        ok: "bg-ok-3 text-ok-11",
        aviso: "bg-aviso-3 text-aviso-11",
        erro: "bg-erro-3 text-erro-11",
      },
    },
    defaultVariants: { tom: "neutro" },
  },
);

const pontoTom = {
  neutro: "bg-muted-foreground",
  acento: "bg-acento-9",
  info: "bg-info-9",
  ok: "bg-ok-9",
  aviso: "bg-aviso-9",
  erro: "bg-erro-9",
} as const;

function Badge({
  className,
  tom,
  ponto,
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { ponto?: boolean }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tom }), className)} {...props}>
      {ponto && <span aria-hidden className={cn("size-1.5 rounded-full", pontoTom[tom ?? "neutro"])} />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
