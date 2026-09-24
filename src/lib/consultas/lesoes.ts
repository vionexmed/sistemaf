import "server-only";
import type { Atleta, Lesao } from "@/db/schema";
import { CAMPEONATOS, LADOS, PERIODOS_TEMPORADA, POSICOES, REGIOES, TIPOS_LESAO, rotulo } from "@/lib/catalogos";
import { fmtDiaMes } from "@/lib/dominio/datas";
import { diaRetorno, lesaoAfasta, lesaoEmAberto } from "@/lib/dominio/status";
import type { LinhaLesao } from "@/components/lesoes/tabela";

/** "Joelho direito", "Lombar bilateral" */
export function localDaLesao(regiao: string, lado: string): string {
  const r = rotulo(REGIOES, regiao);
  const l = lado === "bilateral" ? "bilateral" : lado === "E" ? "esquerdo" : "direito";
  return regiao === "outro" ? `Outro (${l})` : `${r} ${l}`;
}

export function linhaLesao(l: Lesao, atleta: Atleta, hoje: string, verSaude: boolean): LinhaLesao {
  const retorno = diaRetorno(l);
  const tipo = rotulo(TIPOS_LESAO, l.tipo);
  return {
    id: l.id,
    atletaId: atleta.id,
    nome: atleta.nome,
    camisa: atleta.camisa,
    foto: atleta.foto ? `/api/arquivos/${atleta.foto}` : null,
    posicao: rotulo(POSICOES, atleta.posicao),
    dia: `${fmtDiaMes(l.dia)}/${l.dia.slice(2, 4)}`,
    lesao: verSaude && l.estrutura ? `${tipo} · ${l.estrutura}` : tipo,
    local: localDaLesao(l.regiao, l.lado),
    reincidencia: l.reincidencia,
    emAberto: lesaoEmAberto(l),
    afastamento: l.diasAfastamento == null ? "Em aberto" : `${l.diasAfastamento} ${l.diasAfastamento === 1 ? "dia" : "dias"}`,
    retorno: retorno ? fmtDiaMes(retorno) : "—",
    afastadoHoje: lesaoAfasta(l, hoje),
    campeonato: rotulo(CAMPEONATOS, l.campeonato),
    periodo: rotulo(PERIODOS_TEMPORADA, l.periodo),
  };
}

export { LADOS };
