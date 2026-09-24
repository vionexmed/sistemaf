import { Legenda } from "./velas";

export type ColunaGrafico = { rotulo: string; titulo: string; emTratamento: number; queixa: number };

// Volume por tempo: barras empilhadas (em tratamento embaixo, queixa em cima) com o total acima.
export function ColunasEmpilhadas({ colunas, altura = 200 }: { colunas: ColunaGrafico[]; altura?: number }) {
  const max = Math.max(1, ...colunas.map((c) => c.emTratamento + c.queixa));
  return (
    <figure className="flex flex-col gap-4">
      <div className="flex items-end gap-2 border-b" style={{ height: altura + 20 }}>
        {colunas.map((c) => {
          const total = c.emTratamento + c.queixa;
          return (
            <div key={c.titulo} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${c.titulo}: ${total} (${c.emTratamento} em tratamento, ${c.queixa} queixa pós-treino)`}>
              <span className="text-xs font-medium tabular">{total > 0 ? total : ""}</span>
              <div className="flex w-full max-w-12 flex-col-reverse overflow-hidden rounded-t-sm" style={{ height: (total / max) * altura }}>
                <span className="w-full bg-chart-1" style={{ height: `${total ? (c.emTratamento / total) * 100 : 0}%` }} />
                <span className="w-full bg-chart-2" style={{ height: `${total ? (c.queixa / total) * 100 : 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="-mt-2 flex gap-2">
        {colunas.map((c) => (
          <span key={c.titulo} className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground">
            {c.rotulo}
          </span>
        ))}
      </div>
      <Legenda />
    </figure>
  );
}
