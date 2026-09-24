"use client";

import * as React from "react";
import { ToggleGroup as P } from "radix-ui";
import { cn } from "@/lib/utils";

// Opções da planilha como botões de um toque. Selecionado = acento passo 3, borda passo 8.
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
              "h-9 rounded-md border border-input bg-surface px-3 text-base text-foreground transition-colors duration-150 hover:bg-hover",
              "data-[state=on]:border-selected-border data-[state=on]:bg-selected data-[state=on]:font-medium data-[state=on]:text-acento-11",
              invalido && "border-erro-9",
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
