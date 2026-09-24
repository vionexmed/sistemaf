import { count } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { hojeISO, somarDias, diasEntre } from "../lib/dominio/datas";
import { periodoTemporadaDaData } from "../lib/dominio/metricas";

// Banco de demonstração: elenco fictício e ~10 semanas de atendimentos, com datas relativas a hoje,
// para as telas terem conteúdo real. Só roda quando o banco está vazio.

type Banco = PgDatabase<PgQueryResultHKT, typeof schema>;

// Camisa é opcional: alguns jogadores da base ainda não têm número.
const ELENCO: [nome: string, apelido: string, camisa: number | null, posicao: string, pe: string][] = [
  ["Diego Carvalho Lima", "Diego", 1, "goleiro", "destro"],
  ["Marcos Vinícius Teles", "Marcão", 12, "goleiro", "destro"],
  ["Pedro Henrique Sales", "Pedro Sales", null, "goleiro", "canhoto"],
  ["Lucas Ferreira Prado", "Lucas Prado", 3, "zagueiro", "destro"],
  ["Anderson Rocha", "Anderson", 4, "zagueiro", "destro"],
  ["Gabriel Nunes Barros", "Gabriel", 14, "zagueiro", "canhoto"],
  ["Thiago Moreira", "Thiago", 15, "zagueiro", "destro"],
  ["Felipe Andrade Costa", "Felipe", 2, "lateral", "destro"],
  ["Rodrigo Alves", "Rodrigo", 6, "lateral", "canhoto"],
  ["Caio Mendes Rios", "Caio", 13, "lateral", "destro"],
  ["Wesley Santana", "Wesley", 16, "lateral", "canhoto"],
  ["Bruno Tavares", "Bruno", 5, "volante", "destro"],
  ["Matheus Coelho", "Matheus", 8, "volante", "destro"],
  ["Renan Duarte", "Renan", 17, "volante", "ambidestro"],
  ["Leandro Pires", "Leandro", 25, "volante", "destro"],
  ["Vitor Hugo Lemos", "Vitor Hugo", 10, "meia", "canhoto"],
  ["João Pedro Araújo", "João Pedro", 18, "meia", "destro"],
  ["Samuel Batista", "Samuel", 20, "meia", "destro"],
  ["Otávio Ramos", "Otávio", 22, "meia", "destro"],
  ["Kauã Ribeiro", "Kauã", 7, "extremo", "canhoto"],
  ["Emerson Freitas", "Emerson", 11, "extremo", "destro"],
  ["Igor Monteiro", "Igor", 19, "extremo", "destro"],
  ["Daniel Brito", "Daniel", 27, "extremo", "canhoto"],
  ["Rafael Moura", "Rafael", 9, "atacante", "destro"],
  ["Henrique Cardoso", "Henrique", 21, "atacante", "destro"],
  ["Alan Siqueira", "Alan", 26, "atacante", "canhoto"],
  ["Nicolas Farias", "Nicolas", null, "atacante", "destro"],
  ["Everton Luz", "Everton", null, "atacante", "destro"],
];

const EVOLUCOES = [
  "Sem dor no agachamento. Progredindo carga.",
  "Dor 3/10 no fim do exercício. Mantida a carga.",
  "Boa resposta à mobilidade. Liberado para o campo com restrição de sprint.",
  "Relata rigidez pela manhã, melhora após aquecimento.",
  "Evoluiu bem, sem edema. Aumentar volume amanhã.",
  "Dor 2/10. Trabalho excêntrico bem tolerado.",
  "Sem queixas hoje. Manutenção.",
];

// Gerador pseudoaleatório com semente fixa: a demonstração sai igual toda vez.
function aleatorio(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

type Episodio = {
  atleta: number; // índice no ELENCO
  inicio: string;
  fim: string;
  hd: string;
  local: string;
  objetivos: string[];
  status: "em_tratamento" | "queixa_pos_treino";
  frequencia: number; // chance de ser atendido em cada dia de treino
};

function ehDiaDeTreino(iso: string) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay() !== 0; // folga no domingo
}

export async function semearDemonstracao(db: Banco, agora: Date = new Date()) {
  const [{ total }] = await db.select({ total: count() }).from(schema.usuarios);
  if (total > 0) return;

  const hoje = hojeISO(agora);
  const r = aleatorio(20260923);
  const escolher = <T,>(lista: readonly T[]) => lista[Math.floor(r() * lista.length)];

  const [thales] = await db
    .insert(schema.usuarios)
    .values([
      { nome: "Thales", perfil: "fisioterapia" },
      { nome: "Dr. Paulo", perfil: "medico" },
      { nome: "Comissão técnica", perfil: "comissao" },
    ])
    .returning();

  const atletas = await db
    .insert(schema.atletas)
    .values(
      ELENCO.map(([nome, apelido, camisa, posicao, pe], i) => ({
        nome,
        apelido,
        camisa,
        posicao,
        pe,
        nascimento: `${1994 + (i % 12)}-${String(1 + ((i * 5) % 12)).padStart(2, "0")}-${String(3 + ((i * 7) % 25)).padStart(2, "0")}`,
        alturaCm: posicao === "goleiro" ? 188 + (i % 5) : 170 + ((i * 3) % 19),
        pesoKg: String(posicao === "goleiro" ? 84 + (i % 4) : 66 + ((i * 7) % 18)),
        alergias: i % 9 === 0 ? "Dipirona" : null,
      })),
    )
    .returning();
  const id = (apelido: string) => atletas.find((a) => a.apelido === apelido)!.id;

  // Episódios de queixa: casos fixos (para a demonstração contar uma história) + casos aleatórios.
  const episodios: Episodio[] = [
    { atleta: 23, inicio: somarDias(hoje, -3), fim: hoje, hd: "tendinopatia", local: "joelho", objetivos: ["forca_muscular", "estabilidade"], status: "em_tratamento", frequencia: 1 },
    { atleta: 23, inicio: somarDias(hoje, -70), fim: somarDias(hoje, -52), hd: "contratura", local: "posterior_coxa", objetivos: ["relaxamento", "forca_muscular", "potencia"], status: "em_tratamento", frequencia: 0.6 },
    { atleta: 23, inicio: somarDias(hoje, -30), fim: somarDias(hoje, -24), hd: "dmt", local: "panturrilha", objetivos: ["recovery", "relaxamento"], status: "queixa_pos_treino", frequencia: 0.7 },
    { atleta: 14, inicio: somarDias(hoje, -20), fim: hoje, hd: "lesao_muscular", local: "posterior_coxa", objetivos: ["forca_muscular", "potencia", "cardio_volume"], status: "em_tratamento", frequencia: 0.9 },
    { atleta: 20, inicio: somarDias(hoje, -9), fim: hoje, hd: "entorse", local: "tornozelo", objetivos: ["estabilidade", "forca_muscular"], status: "em_tratamento", frequencia: 0.9 },
    { atleta: 13, inicio: somarDias(hoje, -5), fim: hoje, hd: "contratura", local: "adutor", objetivos: ["relaxamento", "hiit_core"], status: "em_tratamento", frequencia: 0.9 },
    { atleta: 19, inicio: hoje, fim: hoje, hd: "dmt", local: "panturrilha", objetivos: ["recovery"], status: "queixa_pos_treino", frequencia: 1 },
    { atleta: 8, inicio: somarDias(hoje, -1), fim: hoje, hd: "dmt", local: "lombar", objetivos: ["recovery", "relaxamento"], status: "queixa_pos_treino", frequencia: 1 },
  ];
  for (let k = 0; k < 34; k++) {
    const inicio = somarDias(hoje, -75 + Math.floor(r() * 72));
    const queixa = r() < 0.4;
    const duracao = queixa ? 1 + Math.floor(r() * 3) : 4 + Math.floor(r() * 14);
    episodios.push({
      atleta: Math.floor(r() * ELENCO.length),
      inicio,
      fim: [somarDias(inicio, duracao), somarDias(hoje, -1)].sort()[0],
      hd: escolher(queixa ? ["dmt", "dmt", "contratura", "outro"] : ["tendinopatia", "contratura", "entorse", "lesao_muscular", "dmt"]),
      local: escolher(["joelho", "posterior_coxa", "anterior_coxa", "panturrilha", "adutor", "lombar", "tornozelo", "quadril", "ombro", "pe"]),
      objetivos: queixa ? ["recovery", "relaxamento"] : [escolher(["forca_muscular", "estabilidade"]), escolher(["potencia", "hiit_core", "cardio_volume"])],
      status: queixa ? "queixa_pos_treino" : "em_tratamento",
      frequencia: 0.55 + r() * 0.35,
    });
  }

  const linhas: (typeof schema.atendimentos.$inferInsert)[] = [];
  const usados = new Set<string>();
  for (const dia of diasEntre(somarDias(hoje, -76), hoje)) {
    if (!ehDiaDeTreino(dia)) continue;
    for (const e of episodios) {
      if (dia < e.inicio || dia > e.fim || r() > e.frequencia) continue;
      const periodos = r() < 0.18 && dia !== hoje ? ["matutino", "vespertino"] : [dia === hoje || r() < 0.72 ? "matutino" : "vespertino"];
      for (const periodo of periodos) {
        const chave = `${e.atleta}|${dia}|${periodo}`;
        if (usados.has(chave)) continue;
        usados.add(chave);
        const hora = periodo === "matutino" ? 8 + Math.floor(r() * 3) : 14 + Math.floor(r() * 3);
        linhas.push({
          atletaId: atletas[e.atleta].id,
          data: dia,
          periodo,
          hd: e.hd,
          local: e.local,
          objetivo: escolher(e.objetivos),
          status: e.status,
          evolucao: r() < 0.6 ? escolher(EVOLUCOES) : null,
          registradoPor: thales.id,
          criadoEm: new Date(`${dia}T${String(hora + 3).padStart(2, "0")}:${String(Math.floor(r() * 60)).padStart(2, "0")}:00Z`),
        });
      }
    }
  }
  for (let i = 0; i < linhas.length; i += 200) {
    await db.insert(schema.atendimentos).values(linhas.slice(i, i + 200));
  }

  const lesao = (
    apelido: string,
    diasAtras: number,
    dados: Omit<typeof schema.lesoes.$inferInsert, "atletaId" | "dia" | "periodo" | "registradoPor">,
  ): typeof schema.lesoes.$inferInsert => {
    const dia = somarDias(hoje, -diasAtras);
    return { ...dados, atletaId: id(apelido), dia, periodo: periodoTemporadaDaData(dia), registradoPor: thales.id };
  };
  await db.insert(schema.lesoes).values([
    // três afastados hoje: dois em aberto e um com retorno previsto
    lesao("Leandro", 20, { tipo: "lesao_muscular", estrutura: "Bíceps femoral", regiao: "posterior_coxa", lado: "D", reincidencia: true, diasAfastamento: null, campeonato: "copa_paulista", observacao: "Grau II no ultrassom. Reavaliar em 21 dias." }),
    lesao("Emerson", 9, { tipo: "entorse", estrutura: "Ligamento talofibular anterior", regiao: "tornozelo", lado: "E", reincidencia: false, diasAfastamento: null, campeonato: "copa_paulista", observacao: null }),
    lesao("Renan", 5, { tipo: "contratura", estrutura: null, regiao: "adutor", lado: "D", reincidencia: false, diasAfastamento: 7, campeonato: "copa_paulista", observacao: "Retorno previsto após 7 dias." }),
    // histórico encerrado
    lesao("Rafael", 68, { tipo: "contratura", estrutura: "Semitendíneo", regiao: "posterior_coxa", lado: "D", reincidencia: false, diasAfastamento: 12, campeonato: "serie_d", observacao: null }),
    lesao("Rafael", 200, { tipo: "entorse", estrutura: null, regiao: "joelho", lado: "D", reincidencia: false, diasAfastamento: 9, campeonato: "paulistao", observacao: null }),
    lesao("Leandro", 150, { tipo: "lesao_muscular", estrutura: "Bíceps femoral", regiao: "posterior_coxa", lado: "D", reincidencia: false, diasAfastamento: 24, campeonato: "paulistao", observacao: null }),
    lesao("Kauã", 45, { tipo: "tendinopatia", estrutura: "Tendão patelar", regiao: "joelho", lado: "E", reincidencia: false, diasAfastamento: 6, campeonato: "serie_d", observacao: null }),
    lesao("Anderson", 110, { tipo: "lesao_ligamentar", estrutura: "LCM", regiao: "joelho", lado: "D", reincidencia: false, diasAfastamento: 28, campeonato: "serie_d", observacao: null }),
    lesao("Igor", 30, { tipo: "contratura", estrutura: null, regiao: "panturrilha", lado: "E", reincidencia: false, diasAfastamento: 4, campeonato: "amistoso", observacao: null }),
    lesao("Matheus", 262, { tipo: "contratura", estrutura: null, regiao: "lombar", lado: "bilateral", reincidencia: false, diasAfastamento: 3, campeonato: "paulistao", observacao: null }),
    lesao("Felipe", 185, { tipo: "lesao_muscular", estrutura: "Reto femoral", regiao: "anterior_coxa", lado: "D", reincidencia: false, diasAfastamento: 15, campeonato: "paulistao", observacao: null }),
    lesao("Caio", 80, { tipo: "entorse", estrutura: null, regiao: "tornozelo", lado: "D", reincidencia: true, diasAfastamento: 8, campeonato: "serie_d", observacao: null }),
  ]);
}
