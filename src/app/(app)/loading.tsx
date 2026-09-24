import { Skeleton } from "@/components/ui/skeleton";

// Carregando: skeleton com a geometria de um índice (cabeçalho, visões, linhas da tabela). Sem spinner.
export default function Carregando() {
  return (
    <div className="mx-auto flex max-w-wide flex-col gap-4" aria-busy="true" aria-label="Carregando">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="overflow-hidden rounded-md border bg-surface">
        <div className="flex gap-4 border-b px-3 py-2">
          {[64, 56, 56, 72].map((w, i) => <Skeleton key={i} className="h-5" style={{ width: w }} />)}
        </div>
        <div className="flex gap-2 px-3 py-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex h-11 items-center gap-4 border-t px-3">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
