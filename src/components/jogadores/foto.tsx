"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { trocarFoto, type EstadoEnvio } from "@/lib/acoes/arquivos";

/** Foto do jogador. Para a Fisioterapia, clicar troca a foto. */
export function FotoJogador({ atletaId, nome, foto, podeEditar }: { atletaId: number; nome: string; foto: string | null; podeEditar: boolean }) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [, acao, pendente] = React.useActionState<EstadoEnvio, FormData>(async (anterior, form) => {
    const r = await trocarFoto(anterior, form);
    if (r.ok) {
      toast.success("Foto atualizada.");
      router.refresh();
    } else if (r.erro) toast.error(r.erro);
    return r;
  }, {});

  if (!podeEditar) return <Avatar nome={nome} foto={foto} tamanho={48} />;
  return (
    <form ref={formRef} action={acao}>
      <input type="hidden" name="atletaId" value={atletaId} />
      <label className="group relative block cursor-pointer" title="Trocar foto">
        <Avatar nome={nome} foto={foto} tamanho={48} className={pendente ? "opacity-50" : undefined} />
        <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Camera className="size-4" />
        </span>
        <input type="file" name="foto" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Trocar foto" onChange={() => formRef.current?.requestSubmit()} />
      </label>
    </form>
  );
}
