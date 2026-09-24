"use client";

import * as React from "react";
import { ToggleGroup as P } from "radix-ui";
import { cn } from "@/lib/utils";

// Opções da planilha como botões de um toque (pílulas). Selecionado = tinta cheia, fácil de ver de longe.
type Opcao = { readonly valor: string; readonly rotulo: string };

function Opcoes({
  nome,
  opcoes,
  valor,
  aoMudar,
  rotuloAcessivel,
  invalido,
  className,
}: {
  nome?: string;
  opcoes: readonly Opcao[];
  valor: string | null;
  aoMudar: (valor: string) => void;
  rotuloAcessivel: string;
  invalido?: boolean;
  className?: string;
}) {
  return (
    <>
      <P.Root
        type="single"
        value={valor ?? ""}
        onValueChange={(v) => v && aoMudar(v)}
        aria-label={rotuloAcessivel}
        aria-invalid={invalido || undefined}
        className={cn("flex flex-wrap gap-2", className)}
      >
        {opcoes.map((o) => (
          <P.Item
            key={o.valor}
            value={o.valor}
            className={cn(
              "h-9 rounded-full bg-surface px-4 text-base text-foreground shadow-ativo transition-colors duration-150 hover:bg-subtle",
              "data-[state=on]:bg-primary data-[state=on]:font-medium data-[state=on]:text-primary-foreground data-[state=on]:shadow-none",
              invalido && "shadow-[0_0_0_1px_var(--red-8)]",
            )}
          >
            {o.rotulo}
          </P.Item>
        ))}
      </P.Root>
      {nome && <input type="hidden" name={nome} value={valor ?? ""} />}
    </>
  );
}

export { Opcoes };
