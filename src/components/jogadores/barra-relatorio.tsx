"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Link2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BarraRelatorio({ atletaId, de, ate, hoje }: { atletaId: number; de: string; ate: string; hoje: string }) {
  const router = useRouter();
  const ir = (novoDe: string, novoAte: string) => novoDe && novoAte && novoDe <= novoAte && router.replace(`/jogadores/${atletaId}/relatorio?de=${novoDe}&ate=${novoAte}`, { scroll: false });
  return (
    <div className="nao-imprimir flex flex-wrap items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href={`/jogadores/${atletaId}`}><ChevronLeft /> Voltar para a ficha</Link>
      </Button>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="de">De</label>
        <Input id="de" type="date" max={ate} defaultValue={de} onChange={(e) => ir(e.target.value, ate)} className="w-40" />
        <label className="text-sm text-muted-foreground" htmlFor="ate">até</label>
        <Input id="ate" type="date" min={de} max={hoje} defaultValue={ate} onChange={(e) => ir(de, e.target.value)} className="w-40" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              toast.success("Link copiado. Quem tiver acesso ao sistema abre este mesmo relatório.");
            } catch {
              toast.error("Não foi possível copiar. Copie o endereço da barra do navegador.");
            }
          }}
        >
          <Link2 /> Copiar link
        </Button>
        <Button onClick={() => window.print()}>
          <Printer /> Imprimir ou salvar PDF
        </Button>
      </div>
    </div>
  );
}
