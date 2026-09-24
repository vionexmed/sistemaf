"use client";

import * as React from "react";
import { Popover as P } from "radix-ui";
import { cn } from "@/lib/utils";

const Popover = P.Root;
const PopoverTrigger = P.Trigger;
const PopoverAnchor = P.Anchor;

function PopoverContent({ className, align = "start", sideOffset = 4, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("z-50 w-72 rounded-lg bg-surface p-4 text-foreground shadow-overlay outline-none", className)}
        {...props}
      />
    </P.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
