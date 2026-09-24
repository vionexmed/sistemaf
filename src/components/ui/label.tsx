import * as React from "react";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="label" className={cn("text-base font-medium text-foreground", className)} {...props} />;
}

/** Campo de formulário: label acima, ajuda e erro abaixo. */
function Campo({
  rotulo,
  htmlFor,
  opcional,
  ajuda,
  erro,
  className,
  children,
}: {
  rotulo: string;
  htmlFor?: string;
  opcional?: boolean;
  ajuda?: React.ReactNode;
  erro?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>
        {rotulo}
        {opcional && <span className="font-normal text-muted-foreground"> (opcional)</span>}
      </Label>
      {children}
      {erro ? (
        <p className="text-xs text-erro-11" role="alert">
          {erro}
        </p>
      ) : ajuda ? (
        <p className="text-xs text-muted-foreground">{ajuda}</p>
      ) : null}
    </div>
  );
}

export { Label, Campo };
