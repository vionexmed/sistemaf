import { cn } from "@/lib/utils";
import { fmtDiaMes, letraDiaSemana } from "@/lib/dominio/datas";

export type Vela = { data: string; total: number; status: "em_tratamento" | "queixa_pos_treino" | null };

// Frequência por dia: uma coluna fina por dia, altura = atendimentos, cor categórica pelo status.
// Dia sem atendimento = tracinho. "hoje" no fim do eixo.
export function Velas({ velas, hoje, className }: { velas: Vela[]; hoje: string; className?: string }) {
  const max = Math.max(2, ...velas.map((v) => v.total));
  const total = velas.reduce((s, v) => s + v.total, 0);
  const altura = 64;
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <figcaption className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Últimos {velas.length} dias</span>
        <span className="font-semibold tabular">{total} {total === 1 ? "atendimento" : "atendimentos"}</span>
      </figcaption>
      <div className="flex items-end gap-1" style={{ height: altura }} role="img" aria-label={`${total} atendimentos nos últimos ${velas.length} dias`}>
        {velas.map((v) => (
          <div key={v.data} className="flex h-full flex-1 flex-col items-center justify-end" title={`${fmtDiaMes(v.data)} · ${v.total} ${v.total === 1 ? "atendimento" : "atendimentos"}`}>
            {v.total === 0 ? (
              <span className="h-0.5 w-2 rounded-full bg-chart-muted" />
            ) : (
              <span
                className={cn("w-2 rounded-sm", v.status === "em_tratamento" ? "bg-chart-1" : "bg-chart-2")}
                style={{ height: Math.max(8, (v.total / max) * altura) }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1 text-xs text-muted-foreground">
        {velas.map((v) => (
          <span key={v.data} className={cn("flex-1 text-center", v.data === hoje && "font-medium text-foreground")}>
            {v.data === hoje ? "hoje" : letraDiaSemana(v.data)}
          </span>
        ))}
      </div>
      <Legenda />
    </figure>
  );
}

export function Legenda({ itens = [
  { cor: "bg-chart-1", rotulo: "Em tratamento" },
  { cor: "bg-chart-2", rotulo: "Queixa pós-treino" },
] }: { itens?: { cor: string; rotulo: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {itens.map((i) => (
        <span key={i.rotulo} className="inline-flex items-center gap-1">
          <span className={cn("size-2 rounded-sm", i.cor)} /> {i.rotulo}
        </span>
      ))}
    </div>
  );
}
