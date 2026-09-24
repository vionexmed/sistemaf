import "server-only";
import { POSICOES, TIPOS_LESAO, rotulo } from "@/lib/catalogos";
import { fmtDiaMes } from "@/lib/dominio/datas";
import type { LesaoAnterior } from "@/components/lesoes/formulario";
import type { OpcaoAtleta } from "@/components/seletor-atleta";
import { hoje, listarAtletas, listarLesoes } from "./index";
import { localDaLesao } from "./lesoes";

export async function contextoLesao(): Promise<{ atletas: OpcaoAtleta[]; anteriores: Record<number, LesaoAnterior[]>; hoje: string }> {
  const [atletas, lesoes] = await Promise.all([listarAtletas(), listarLesoes()]);
  const anteriores: Record<number, LesaoAnterior[]> = {};
  for (const l of lesoes) {
    (anteriores[l.atletaId] ??= []).push({
      id: l.id,
      dia: fmtDiaMes(l.dia) + "/" + l.dia.slice(2, 4),
      tipo: rotulo(TIPOS_LESAO, l.tipo),
      local: localDaLesao(l.regiao, l.lado),
      regiao: l.regiao,
      lado: l.lado,
      afastamento: l.diasAfastamento == null ? "em aberto" : `${l.diasAfastamento} dias`,
    });
  }
  return {
    atletas: atletas.map((a) => ({ id: a.id, nome: a.nome, apelido: a.apelido, camisa: a.camisa, posicao: rotulo(POSICOES, a.posicao), foto: a.foto ? `/api/arquivos/${a.foto}` : null })),
    anteriores,
    hoje: hoje(),
  };
}
