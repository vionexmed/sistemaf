import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-base text-foreground transition-colors duration-150 placeholder:text-faint-foreground hover:border-[var(--gray-a8)] focus-visible:border-transparent disabled:opacity-50 aria-invalid:border-erro-9 file:mr-2 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-20 w-full rounded-md border border-input bg-surface px-3 py-2 text-base text-foreground transition-colors duration-150 placeholder:text-faint-foreground hover:border-[var(--gray-a8)] focus-visible:border-transparent aria-invalid:border-erro-9",
        className,
      )}
      {...props}
    />
  );
}

export { Input, Textarea };
