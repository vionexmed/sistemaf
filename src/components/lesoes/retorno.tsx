"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Campo } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { registrarRetorno, type EstadoRetorno } from "@/lib/acoes/lesoes";
import { diferencaDias, ehDataISO } from "@/lib/dominio/datas";

export function FormularioRetorno({ id, dia, hoje, atletaId }: { id: number; dia: string; hoje: string; atletaId: number }) {
  const router = useRouter();
  const [retorno, setRetorno] = React.useState(hoje);
  const [estado, acao, pendente] = React.useActionState<EstadoRetorno, FormData>(async (anterior, form) => {
    const r = await registrarRetorno(anterior, form);
    if (r.ok) {
      toast.success("Retorno registrado. O status do jogador foi recalculado.");
      router.push(`/jogadores/${r.atletaId}?aba=lesoes`);
    }
    return r;
  }, {});
  const dias = ehDataISO(retorno) ? diferencaDias(dia, retorno) : null;
  return (
    <Card>
      <CardContent>
        <form action={acao} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <Campo rotulo="Data de retorno" htmlFor="retorno" erro={estado.erro} ajuda={dias != null && dias >= 0 ? `Afastamento: ${dias} ${dias === 1 ? "dia" : "dias"}.` : undefined}>
            <Input id="retorno" name="retorno" type="date" min={dia} value={retorno} onChange={(e) => setRetorno(e.target.value)} className="w-44" />
          </Campo>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" asChild><Link href={`/jogadores/${atletaId}?aba=lesoes`}>Cancelar</Link></Button>
            <Button type="submit" disabled={pendente}>{pendente ? "Salvando…" : "Registrar retorno"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
