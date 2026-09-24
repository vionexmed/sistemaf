import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto flex max-w-page flex-col items-center gap-3 py-16 text-center">
      <SearchX className="size-6 text-muted-foreground" strokeWidth={1.75} />
      <p className="text-muted-foreground">Não encontramos o que você procurou. O registro pode ter sido excluído.</p>
      <Button variant="secondary" asChild><Link href="/jogadores">Ir para Jogadores</Link></Button>
    </div>
  );
}
