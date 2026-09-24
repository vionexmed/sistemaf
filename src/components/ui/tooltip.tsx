"use client";

import * as React from "react";
import { Tooltip as P } from "radix-ui";
import { cn } from "@/lib/utils";

function TooltipProvider(props: React.ComponentProps<typeof P.Provider>) {
  return <P.Provider delayDuration={300} {...props} />;
}

function Tooltip({
  conteudo,
  children,
  lado = "top",
}: {
  conteudo: React.ReactNode;
  children: React.ReactNode;
  lado?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <P.Root>
      <P.Trigger asChild>{children}</P.Trigger>
      <P.Portal>
        <P.Content
          side={lado}
          sideOffset={4}
          className={cn("z-50 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground")}
        >
          {conteudo}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

/** Tecla de atalho mostrada em tooltips e menus. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-sm border border-current/30 px-1 font-sans text-xs opacity-80">
      {children}
    </kbd>
  );
}

export { TooltipProvider, Tooltip, Kbd };
