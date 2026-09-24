"use client";

import * as React from "react";
import { REGIOES, rotulo } from "@/lib/catalogos";

// Manequim liso, de frente e de costas. As regiões aparecem como um brilho dentro do corpo
// (mascarado pela silhueta, nunca vaza pro fundo). Coordenadas num viewBox 100 × 220.
// Lado "D" = direito do atleta: na vista de frente fica à esquerda de quem olha; de costas, à direita.

export type Vista = "frente" | "costas";
export type LadoCorpo = "D" | "E";
export type Destaque = { regiao: string; lados: LadoCorpo[]; intensidade: "forte" | "suave" };

type Ancora = { x: number; y: number; r: number };

// Âncora do lado direito do atleta, em coordenadas da vista de frente.
const ANCORAS: Record<string, Partial<Record<Vista, Ancora>>> = {
  ombro: { frente: { x: 31, y: 41, r: 8 }, costas: { x: 31, y: 41, r: 8 } },
  quadril: { frente: { x: 37, y: 104, r: 8 }, costas: { x: 40, y: 110, r: 9 } },
  adutor: { frente: { x: 45.5, y: 126, r: 5.5 } },
  anterior_coxa: { frente: { x: 40, y: 134, r: 8 } },
  posterior_coxa: { costas: { x: 40, y: 136, r: 8 } },
  joelho: { frente: { x: 40, y: 158, r: 7 } },
  panturrilha: { costas: { x: 40, y: 177, r: 7 } },
  tornozelo: { frente: { x: 40, y: 199, r: 5 }, costas: { x: 40, y: 199, r: 5 } },
  pe: { frente: { x: 38, y: 208, r: 5 } },
  lombar: { costas: { x: 45, y: 96, r: 7 } },
};

export const REGIOES_DESENHADAS = Object.keys(ANCORAS);

function posicao(regiao: string, lado: LadoCorpo, vista: Vista): Ancora | null {
  const a = ANCORAS[regiao]?.[vista];
  if (!a) return null;
  const espelhar = (lado === "E") !== (vista === "costas");
  return { ...a, x: espelhar ? 100 - a.x : a.x };
}

/** Partes do corpo. `modo` decide se desenha contorno (mais grosso), preenchimento ou máscara. */
function Corpo({ modo }: { modo: "contorno" | "pele" | "mascara" }) {
  const cor = modo === "contorno" ? "var(--slate-8)" : modo === "pele" ? "var(--slate-4)" : "#fff";
  const extra = modo === "contorno" ? 1.6 : 0;
  const forma = { fill: cor, stroke: modo === "contorno" ? cor : "none", strokeWidth: extra, strokeLinejoin: "round" as const };
  const membro = (largura: number) => ({ stroke: cor, strokeWidth: largura + extra, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" });
  return (
    <g>
      <ellipse cx={50} cy={16} rx={10} ry={12} {...forma} />
      <rect x={45} y={24} width={10} height={12} {...forma} />
      <path d="M30 36 Q50 31 70 36 Q73 44 71 54 Q69 74 66 90 Q70 100 69 113 L31 113 Q30 100 34 90 Q31 74 29 54 Q27 44 30 36 Z" {...forma} />
      <polyline points="31,40 23,75 19,105" {...membro(9)} />
      <polyline points="69,40 77,75 81,105" {...membro(9)} />
      <circle cx={18} cy={112} r={4.5} {...forma} />
      <circle cx={82} cy={112} r={4.5} {...forma} />
      <polyline points="41,108 40,158" {...membro(16)} />
      <polyline points="59,108 60,158" {...membro(16)} />
      <polyline points="40,158 40,199" {...membro(11)} />
      <polyline points="60,158 60,199" {...membro(11)} />
      <ellipse cx={39} cy={207} rx={6} ry={4} {...forma} />
      <ellipse cx={61} cy={207} rx={6} ry={4} {...forma} />
    </g>
  );
}

export function Manequim({
  vista,
  destaques = [],
  selecionada,
  largura = 120,
  aoEscolher,
}: {
  vista: Vista;
  destaques?: Destaque[];
  selecionada?: { regiao: string; lados: LadoCorpo[] } | null;
  largura?: number;
  aoEscolher?: (regiao: string, lado: LadoCorpo) => void;
}) {
  const id = React.useId().replace(/:/g, "");
  const brilhos = destaques.flatMap((d) =>
    d.lados.flatMap((lado) => {
      const p = posicao(d.regiao, lado, vista);
      return p ? [{ ...p, chave: `${d.regiao}-${lado}`, intensidade: d.intensidade }] : [];
    }),
  );
  const contornos = selecionada
    ? selecionada.lados.flatMap((lado) => {
        const p = posicao(selecionada.regiao, lado, vista);
        return p ? [{ ...p, chave: `${selecionada.regiao}-${lado}` }] : [];
      })
    : [];

  return (
    <figure className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 220" width={largura} height={(largura * 220) / 100} role="img" aria-label={`Corpo visto de ${vista}`}>
        <defs>
          <mask id={`m${id}`}>
            <Corpo modo="mascara" />
          </mask>
          <radialGradient id={`gf${id}`}>
            <stop offset="0%" style={{ stopColor: "var(--indigo-9)", stopOpacity: 0.95 }} />
            <stop offset="55%" style={{ stopColor: "var(--indigo-9)", stopOpacity: 0.55 }} />
            <stop offset="100%" style={{ stopColor: "var(--indigo-9)", stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={`gs${id}`}>
            <stop offset="0%" style={{ stopColor: "var(--indigo-7)", stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: "var(--indigo-7)", stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id={`pele${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--slate-3)" }} />
            <stop offset="100%" style={{ stopColor: "var(--slate-5)" }} />
          </linearGradient>
        </defs>
        <Corpo modo="contorno" />
        <Corpo modo="pele" />
        <rect x={0} y={0} width={100} height={220} fill={`url(#pele${id})`} mask={`url(#m${id})`} />
        {vista === "frente" ? (
          <path d="M44 33 Q50 38 56 33" fill="none" stroke="var(--slate-8)" strokeWidth={0.8} />
        ) : (
          <line x1={50} y1={34} x2={50} y2={108} stroke="var(--slate-8)" strokeWidth={0.8} strokeDasharray="1.5 2.5" />
        )}
        <g mask={`url(#m${id})`}>
          {brilhos.map((b) => (
            <circle key={b.chave} cx={b.x} cy={b.y} r={b.r * 1.5} fill={`url(#${b.intensidade === "forte" ? "gf" : "gs"}${id})`} />
          ))}
        </g>
        {contornos.map((c) => (
          <circle key={c.chave} cx={c.x} cy={c.y} r={c.r + 2} fill="none" stroke="var(--indigo-11)" strokeWidth={0.9} strokeDasharray="2 1.5" />
        ))}
        {aoEscolher &&
          Object.keys(ANCORAS).flatMap((regiao) =>
            (["D", "E"] as const).map((lado) => {
              const p = posicao(regiao, lado, vista);
              if (!p) return null;
              const nome = `${rotulo(REGIOES, regiao)} ${lado === "D" ? "direito" : "esquerdo"}`;
              return (
                <circle
                  key={`${regiao}-${lado}`}
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill="transparent"
                  className="cursor-pointer outline-none hover:fill-[var(--indigo-a4)] focus-visible:stroke-[var(--indigo-9)]"
                  strokeWidth={0.8}
                  role="button"
                  tabIndex={0}
                  aria-label={nome}
                  onClick={() => aoEscolher(regiao, lado)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      aoEscolher(regiao, lado);
                    }
                  }}
                >
                  <title>{nome}</title>
                </circle>
              );
            }),
          )}
      </svg>
      <figcaption className="text-xs text-muted-foreground">{vista === "frente" ? "Frente" : "Costas"}</figcaption>
    </figure>
  );
}
