"use client";

import * as React from "react";
import { Dialog as P } from "radix-ui";
import { cn } from "@/lib/utils";

const Dialog = P.Root;

function DialogContent({
  className,
  children,
  titulo,
  ...props
}: React.ComponentProps<typeof P.Content> & { titulo: string }) {
  return (
    <P.Portal>
      <P.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <P.Content
        className={cn(
          "fixed top-24 left-1/2 z-50 w-[calc(100%-32px)] max-w-xl -translate-x-1/2 overflow-hidden rounded-md border bg-surface shadow-overlay",
          className,
        )}
        {...props}
      >
        <P.Title className="sr-only">{titulo}</P.Title>
        <P.Description className="sr-only">{titulo}</P.Description>
        {children}
      </P.Content>
    </P.Portal>
  );
}

export { Dialog, DialogContent };
