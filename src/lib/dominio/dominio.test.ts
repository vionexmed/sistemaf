import { describe, expect, it } from "vitest";
import {
  diferencaDias,
  fmtDiaExtenso,
  fmtIntervalo,
  hojeISO,
  idade,
  inicioSemana,
  periodoDoHorario,
  somarDias,
} from "./datas";
import { lesaoAfasta, statusDoAtleta, statusDoElenco, ultimoDiaDeTreino } from "./status";
import {
  colunasPorTempo,
  diasAfastadoNaJanela,
  diasEmTratamento,
  janelaAnterior,
  janelaDoPeriodo,
  recortarPorCampeonato,
  resumoAtendimentos,
  resumoLesoes,
  variacao,
  velasPorDia,
} from "./metricas";
import { mapaDeQueixas, periodosDeTratamento, resumoDaRegiao } from "./ficha";

const HOJE = "2026-09-23"; // quarta-feira

function at(data: string, status = "em_tratamento", extra: Partial<Record<string, string | number>> = {}) {
  return {
    atletaId: 1,
    data,
    periodo: "matutino",
    hd: "tendinopatia",
    local: "joelho",
    objetivo: "forca_muscular",
    status,
    ...extra,
  } as {
    atletaId: number; data: string; periodo: string; hd: string; local: string; objetivo: string; status: string;
  };
}

function lesao(dia: string, diasAfastamento: number | null, extra: Record<string, unknown> = {}) {
  return {
    atletaId: 1,
    dia,
    tipo: "contratura",
    regiao: "posterior_coxa",
    lado: "D",
    reincidencia: false,
    diasAfastamento,
    ...extra,
  };
}

describe("datas", () => {
  it("usa o horário de Brasília para hoje e para o período", () => {
    // 01h30 UTC do dia 24 = 22h30 do dia 23 em Brasília
    const noite = new Date("2026-09-24T01:30:00Z");
    expect(hojeISO(noite)).toBe("2026-09-23");
    expect(periodoDoHorario(noite)).toBe("vespertino");
    expect(periodoDoHorario(new Date("2026-09-23T13:59:00Z"))).toBe("matutino"); // 10h59
    expect(periodoDoHorario(new Date("2026-09-23T15:00:00Z"))).toBe("vespertino"); // 12h00
  });

  it("soma e subtrai dias atravessando mês e ano", () => {
    expect(somarDias("2026-12-30", 3)).toBe("2027-01-02");
    expect(somarDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(diferencaDias("2026-09-20", HOJE)).toBe(3);
  });

  it("semana começa na segunda", () => {
    expect(inicioSemana(HOJE)).toBe("2026-09-21");
    expect(inicioSemana("2026-09-27")).toBe("2026-09-21"); // domingo
  });

  it("formata como nas telas", () => {
    expect(fmtDiaExtenso(HOJE)).toBe("Quarta-feira, 23 de setembro");
    expect(fmtIntervalo("2026-08-24", HOJE)).toBe("24 ago a 23 set de 2026");
    expect(idade("2000-09-24", HOJE)).toBe(25);
    expect(idade("2000-09-23", HOJE)).toBe(26);
  });
});

describe("status do atleta", () => {
  const ontem = "2026-09-22";

  it("afastado vence tudo: lesão em aberto", () => {
    expect(statusDoAtleta([at(HOJE)], [lesao("2026-09-10", null)], HOJE, ontem)).toBe("afastado");
  });

  it("afastado enquanto a data da lesão + os dias não chegou", () => {
    expect(lesaoAfasta(lesao("2026-09-20", 5), HOJE)).toBe(true); // volta dia 25
    expect(lesaoAfasta(lesao("2026-09-20", 3), HOJE)).toBe(false); // voltou hoje
    expect(lesaoAfasta(lesao("2026-09-30", null), HOJE)).toBe(false); // lesão no futuro não conta
  });

  it("em tratamento hoje ou no último dia de treino", () => {
    expect(statusDoAtleta([at(HOJE)], [], HOJE, ontem)).toBe("em_tratamento");
    expect(statusDoAtleta([at(ontem)], [], HOJE, ontem)).toBe("em_tratamento");
    expect(statusDoAtleta([at("2026-09-21")], [], HOJE, ontem)).toBe("liberado");
  });

  it("em tratamento vence queixa pós-treino", () => {
    expect(statusDoAtleta([at(ontem), at(HOJE, "queixa_pos_treino")], [], HOJE, ontem)).toBe("em_tratamento");
  });

  it("queixa pós-treino só vale hoje", () => {
    expect(statusDoAtleta([at(HOJE, "queixa_pos_treino")], [], HOJE, ontem)).toBe("queixa_pos_treino");
    expect(statusDoAtleta([at(ontem, "queixa_pos_treino")], [], HOJE, ontem)).toBe("liberado");
  });

  it("último dia de treino pula folgas e ignora hoje", () => {
    expect(ultimoDiaDeTreino(["2026-09-18", "2026-09-21", HOJE], HOJE)).toBe("2026-09-21");
    expect(ultimoDiaDeTreino([HOJE], HOJE)).toBeNull();
  });

  it("calcula o elenco todo com o mesmo último dia de treino", () => {
    const atendimentos = [
      { atletaId: 1, data: "2026-09-21", status: "em_tratamento" },
      { atletaId: 2, data: HOJE, status: "queixa_pos_treino" },
    ];
    const status = statusDoElenco([1, 2, 3, 4], atendimentos, [{ atletaId: 4, dia: HOJE, diasAfastamento: null }], HOJE);
    expect(Object.fromEntries(status)).toEqual({
      1: "em_tratamento",
      2: "queixa_pos_treino",
      3: "liberado",
      4: "afastado",
    });
  });
});

describe("números do painel", () => {
  it("janelas e período anterior de mesmo tamanho", () => {
    const j = janelaDoPeriodo("7d", HOJE);
    expect(j).toEqual({ de: "2026-09-17", ate: HOJE });
    expect(janelaAnterior("7d", j)).toEqual({ de: "2026-09-10", ate: "2026-09-16" });
    expect(janelaAnterior("temporada", janelaDoPeriodo("temporada", HOJE))).toBeNull();
  });

  it("recorta a janela pelas datas do campeonato", () => {
    expect(recortarPorCampeonato({ de: "2026-01-01", ate: HOJE }, "paulistao")).toEqual({
      de: "2026-01-10",
      ate: "2026-04-12",
    });
    expect(recortarPorCampeonato({ de: "2026-09-17", ate: HOJE }, "paulistao")).toBeNull();
    expect(recortarPorCampeonato({ de: "2026-09-17", ate: HOJE }, "amistoso")).toBeNull();
  });

  it("dois períodos no mesmo dia contam 2 e a média ignora folgas", () => {
    const r = resumoAtendimentos([
      at(HOJE),
      at(HOJE, "em_tratamento", { periodo: "vespertino" }),
      at("2026-09-21", "queixa_pos_treino", { atletaId: 2 }),
    ]);
    expect(r.total).toBe(3);
    expect(r.atletasAtendidos).toBe(2);
    expect(r.mediaPorDiaDeTreino).toBe(1.5);
    expect(r.emTratamento).toBe(2);
    expect(r.vespertino).toBe(1);
  });

  it("variação contra o período anterior", () => {
    expect(variacao(120, 100)).toBe(20);
    expect(variacao(80, 100)).toBe(-20);
    expect(variacao(10, 0)).toBeNull();
    expect(variacao(10, null)).toBeNull();
  });

  it("colunas cobrem a janela inteira, inclusive semanas vazias", () => {
    const colunas = colunasPorTempo(
      [at(HOJE), at(HOJE, "queixa_pos_treino"), at("2026-09-02")],
      { de: "2026-08-25", ate: HOJE },
      "semana",
    );
    expect(colunas.map((c) => c.inicio)).toEqual(["2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21"]);
    expect(colunas.at(-1)).toEqual({ inicio: "2026-09-21", emTratamento: 1, queixa: 1, total: 2 });
  });

  it("velas: dia vazio sem status", () => {
    const velas = velasPorDia([at(HOJE, "queixa_pos_treino")], { de: "2026-09-22", ate: HOJE });
    expect(velas).toEqual([
      { data: "2026-09-22", total: 0, status: null },
      { data: HOJE, total: 1, status: "queixa_pos_treino" },
    ]);
  });
});

describe("índice de lesões", () => {
  const lesoes = [
    lesao("2026-09-01", 10, { reincidencia: true }),
    lesao("2026-09-05", 20),
    lesao("2026-09-13", null, { regiao: "joelho" }),
    lesao("2026-09-20", 6, { tipo: "entorse", regiao: "tornozelo" }),
  ];

  it("reincidência, média só das encerradas e dias perdidos com as em aberto", () => {
    const r = resumoLesoes(lesoes, HOJE);
    expect(r.total).toBe(4);
    expect(r.emAberto).toBe(1);
    expect(r.reincidenciaPct).toBe(25);
    expect(r.mediaAfastamento).toBe(12);
    expect(r.diasPerdidos).toBe(10 + 20 + 10 + 6);
    expect(r.porRegiao[0]).toEqual({ valor: "posterior_coxa", total: 2 });
  });

  it("sem lesões não divide por zero", () => {
    const r = resumoLesoes([], HOJE);
    expect(r.reincidenciaPct).toBe(0);
    expect(r.mediaAfastamento).toBeNull();
  });
});

describe("relatório", () => {
  it("dias afastado contam só os dias da janela até hoje, sem repetir", () => {
    const janela = { de: "2026-09-10", ate: "2026-09-30" };
    expect(diasAfastadoNaJanela([lesao("2026-09-05", 10)], janela, HOJE)).toBe(5); // 10 a 14
    expect(diasAfastadoNaJanela([lesao("2026-09-20", null)], janela, HOJE)).toBe(4); // 20 a 23
    expect(diasAfastadoNaJanela([lesao("2026-09-20", null), lesao("2026-09-21", 2)], janela, HOJE)).toBe(4);
  });

  it("dias em tratamento são dias diferentes", () => {
    expect(diasEmTratamento([at(HOJE), at(HOJE, "em_tratamento", { periodo: "vespertino" }), at("2026-09-22", "queixa_pos_treino")])).toBe(1);
  });
});

describe("ficha", () => {
  it("mapa de queixas soma atendimentos e lesões e marca a região atual", () => {
    const mapa = mapaDeQueixas(
      [at("2026-08-01", "em_tratamento", { local: "posterior_coxa", hd: "contratura" }), at(HOJE), at("2026-09-20")],
      [lesao("2026-07-30", 12), lesao("2026-09-15", null, { regiao: "joelho", lado: "E" })],
    );
    expect(mapa.map((r) => [r.regiao, r.atendimentos, r.lesoes, r.atual, r.lados.join("")])).toEqual([
      ["joelho", 2, 1, true, "E"],
      ["posterior_coxa", 1, 1, false, "D"],
    ]);
    expect(resumoDaRegiao(mapa[0])).toBe("2 atendimentos em 1 semana, 1 lesão registrada aqui");
  });

  it("sem lesão na região o brilho vai nos dois lados", () => {
    expect(mapaDeQueixas([at(HOJE, "em_tratamento", { local: "lombar" })], [])[0].lados).toEqual(["D", "E"]);
  });

  it("períodos de tratamento quebram com intervalo maior que 7 dias ou com outro HD/local", () => {
    const periodos = periodosDeTratamento([
      at("2026-08-01", "em_tratamento", { hd: "contratura", local: "posterior_coxa" }),
      at("2026-08-05", "queixa_pos_treino", { hd: "contratura", local: "posterior_coxa" }),
      at("2026-09-01"),
      at("2026-09-20"),
      at(HOJE),
    ]);
    expect(periodos.map((p) => [p.de, p.ate, p.atendimentos, p.status])).toEqual([
      ["2026-09-20", HOJE, 2, "em_tratamento"],
      ["2026-09-01", "2026-09-01", 1, "em_tratamento"],
      ["2026-08-01", "2026-08-05", 2, "queixa_pos_treino"],
    ]);
  });
});
