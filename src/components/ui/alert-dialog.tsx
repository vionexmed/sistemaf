"use client";

import * as React from "react";
import { AlertDialog as P } from "radix-ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

// Dialog só para confirmar ação destrutiva, nomeando o item e a consequência.
function ConfirmarExclusao({
  aberto,
  aoMudar,
  titulo,
  descricao,
  rotuloConfirmar = "Excluir",
  aoConfirmar,
  pendente,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  titulo: string;
  descricao: string;
  rotuloConfirmar?: string;
  aoConfirmar: () => void;
  pendente?: boolean;
}) {
  return (
    <P.Root open={aberto} onOpenChange={aoMudar}>
      <P.Portal>
        <P.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <P.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-overlay">
          <P.Title className="text-lg font-semibold">{titulo}</P.Title>
          <P.Description className="mt-2 text-base text-muted-foreground">{descricao}</P.Description>
          <div className="mt-6 flex justify-end gap-2">
            <P.Cancel className={buttonVariants({ variant: "ghost" })}>Cancelar</P.Cancel>
            <P.Action
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={pendente}
              onClick={(e) => {
                e.preventDefault();
                aoConfirmar();
              }}
            >
              {rotuloConfirmar}
            </P.Action>
          </div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

export { ConfirmarExclusao };
