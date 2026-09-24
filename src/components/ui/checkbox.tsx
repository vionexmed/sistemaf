"use client";

import * as React from "react";
import { Checkbox as P } from "radix-ui";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof P.Root>) {
  return (
    <P.Root
      className={cn(
        "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-surface data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <P.Indicator>
        {props.checked === "indeterminate" ? <Minus className="size-3" /> : <Check className="size-3" />}
      </P.Indicator>
    </P.Root>
  );
}

export { Checkbox };
