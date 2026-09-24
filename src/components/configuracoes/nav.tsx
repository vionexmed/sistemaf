"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/configuracoes/listas", rotulo: "Listas" },
  { href: "/configuracoes/campeonatos", rotulo: "Campeonatos" },
  { href: "/configuracoes/usuarios", rotulo: "Usuários" },
];

export function NavConfiguracoes() {
  const pathname = usePathname();
  return (
    <nav aria-label="Configurações" className="flex shrink-0 gap-1 md:w-48 md:flex-col">
      {ITENS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={pathname === i.href ? "page" : undefined}
          className={cn("flex h-8 items-center rounded-md px-2 text-sm hover:bg-hover", pathname === i.href && "bg-hover font-medium text-foreground hover:bg-selected")}
        >
          {i.rotulo}
        </Link>
      ))}
    </nav>
  );
}

/** Settings: descrição do grupo à esquerda (1/3), conteúdo em card à direita (2/3). */
export function GrupoConfiguracao({ titulo, descricao, children }: { titulo: string; descricao: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b pb-6 last:border-0 lg:grid-cols-3">
      <div>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </div>
      <div className="rounded-md border bg-surface p-4 lg:col-span-2">{children}</div>
    </section>
  );
}
