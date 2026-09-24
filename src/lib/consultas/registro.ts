import "server-only";
import { HD, OBJETIVOS, PERIODOS_DIA, POSICOES, REGIOES, STATUS_ATENDIMENTO, TEMPORADA, rotulo } from "@/lib/catalogos";
import { fmtDiaMes, somarDias } from "@/lib/dominio/datas";
import { maisFrequentes } from "@/lib/dominio/ficha";
import { velasPorDia } from "@/lib/dominio/metricas";
import type { Vela } from "@/components/graficos/velas";
import type { OpcaoAtleta } from "@/components/seletor-atleta";
import { atendimentosEntre, hoje, listarAtletas } from "./index";

export type UltimoAtendimento = {
  id: number;
  data: string;
  dataFmt: string;
  periodo: string;
  hd: string;
  local: string;
  objetivo: string;
  status: string;
  resumo: string; // "Tendinopatia · joelho · Força muscular · Em tratamento"
  quando: string; // "ontem", "hoje", "20/09"
};

export type ContextoAtleta = { ultimo: UltimoAtendimento | null; velas: Vela[] };

/** Tudo o que o formulário precisa para vir preenchido com o último atendimento de cada atleta. */
export async function contextoRegistro(): Promise<{
  atletas: OpcaoAtleta[];
  contexto: Record<number, ContextoAtleta>;
  frequentes: number[];
  hoje: string;
}> {
  const h = hoje();
  const [atletas, atendimentos] = await Promise.all([listarAtletas(), atendimentosEntre(TEMPORADA.inicio, h)]);
  const janela14 = { de: somarDias(h, -13), ate: h };
  const contexto: Record<number, ContextoAtleta> = {};
  for (const a of atletas) {
    const doAtleta = atendimentos.filter((x) => x.atletaId === a.id);
    const u = doAtleta[0]; // já vem do mais recente para o mais antigo
    contexto[a.id] = {
      velas: velasPorDia(doAtleta.filter((x) => x.data >= janela14.de), janela14),
      ultimo: u
        ? {
            id: u.id,
            data: u.data,
            dataFmt: fmtDiaMes(u.data),
            periodo: u.periodo,
            hd: u.hd,
            local: u.local,
            objetivo: u.objetivo,
            status: u.status,
            resumo: [rotulo(HD, u.hd), rotulo(REGIOES, u.local).toLowerCase(), rotulo(OBJETIVOS, u.objetivo), rotulo(STATUS_ATENDIMENTO, u.status)].join(" · "),
            quando: u.data === h ? `hoje, ${rotulo(PERIODOS_DIA, u.periodo).toLowerCase()}` : u.data === somarDias(h, -1) ? "ontem" : fmtDiaMes(u.data),
          }
        : null,
    };
  }
  return {
    atletas: atletas.map((a) => ({ id: a.id, nome: a.nome, apelido: a.apelido, camisa: a.camisa, posicao: rotulo(POSICOES, a.posicao), foto: a.foto ? `/api/arquivos/${a.foto}` : null })),
    contexto,
    frequentes: maisFrequentes(atendimentos.filter((x) => x.data >= janela14.de), 8),
    hoje: h,
  };
}
