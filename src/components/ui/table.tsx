import * as React from "react";
import { cn } from "@/lib/utils";

// Tabela: header fixo, linha 44px, fonte 13px, separador 1px, sem zebra. Nunca dentro de card com padding.
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("sticky top-0 z-10 bg-subtle", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("h-11 border-b transition-colors duration-150 data-[selecionada=true]:bg-selected", className)} {...props} />;
}

function TableHead({ className, numero, ...props }: React.ComponentProps<"th"> & { numero?: boolean }) {
  return (
    <th
      className={cn(
        "h-9 border-b px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground",
        numero && "text-right",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, numero, ...props }: React.ComponentProps<"td"> & { numero?: boolean }) {
  return (
    <td
      className={cn("max-w-64 truncate px-3 align-middle whitespace-nowrap", numero && "tabular text-right", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
