import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Vazio (primeiro uso): ícone 24px, uma frase, um botão primário. */
export function EstadoVazio({
  icone: Icone,
  frase,
  acao,
}: {
  icone: LucideIcon;
  frase: string;
  acao?: { rotulo: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <Icone className="size-6 text-muted-foreground" strokeWidth={1.75} />
      <p className="text-base text-muted-foreground">{frase}</p>
      {acao && (
        <Button asChild>
          <Link href={acao.href}>{acao.rotulo}</Link>
        </Button>
      )}
    </div>
  );
}

/** Sem resultados com filtro ativo: frase + Limpar filtros. Diferente do vazio. */
export function SemResultados({ frase = "Nenhum resultado com esses filtros.", limparHref }: { frase?: string; limparHref: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <p className="text-base text-muted-foreground">{frase}</p>
      <Button variant="secondary" asChild>
        <Link href={limparHref}>Limpar filtros</Link>
      </Button>
    </div>
  );
}

/** Banner crítico. */
export function BannerErro({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-md border border-erro-6 bg-erro-3 p-4 text-erro-11">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{titulo}</p>
        {children}
      </div>
    </div>
  );
}
