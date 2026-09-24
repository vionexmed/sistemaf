"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUrlComParametros } from "./filtros";

/** Cabeçalho ordenável: ?ordem=campo (crescente) ou ?ordem=-campo (decrescente). */
export function CabecalhoOrdenavel({
  campo,
  padrao,
  children,
  numero,
}: {
  campo: string;
  padrao: string;
  children: React.ReactNode;
  numero?: boolean;
}) {
  const params = useSearchParams();
  const url = useUrlComParametros();
  const atual = params.get("ordem") ?? padrao;
  const ativo = atual.replace(/^-/, "") === campo;
  const desc = ativo && atual.startsWith("-");
  const proximo = ativo && !desc ? `-${campo}` : campo;
  return (
    <Link
      href={url({ ordem: proximo === padrao ? null : proximo })}
      scroll={false}
      className={cn("inline-flex items-center gap-1 hover:text-foreground", ativo && "text-foreground", numero && "flex-row-reverse")}
      aria-label={`Ordenar por ${typeof children === "string" ? children : campo}`}
    >
      {children}
      {ativo && (desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
    </Link>
  );
}
