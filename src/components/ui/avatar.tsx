import { cn, iniciais } from "@/lib/utils";

// Foto quadrada com raio 8px; sem foto, iniciais em slate 11 sobre slate 3.
function Avatar({
  nome,
  foto,
  tamanho = 32,
  className,
}: {
  nome: string;
  foto?: string | null;
  tamanho?: 24 | 32 | 40 | 48 | 64 | 96;
  className?: string;
}) {
  const tamanhos = { 24: "size-6 text-xs", 32: "size-8 text-xs", 40: "size-10 text-sm", 48: "size-12 text-base", 64: "size-16 text-lg", 96: "size-24 text-xl" };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-hover font-medium text-muted-foreground",
        tamanhos[tamanho],
        className,
      )}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" className="size-full object-cover" />
      ) : (
        iniciais(nome)
      )}
    </span>
  );
}

export { Avatar };
