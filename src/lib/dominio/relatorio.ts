import { ROTULO_STATUS, type StatusAtleta } from "./status";

/** Resumo em texto corrido, em linguagem simples, montado a partir dos números do relatório. */
export function resumoRelatorio(d: {
  apelido: string;
  intervalo: string;
  atendimentos: number;
  diasComAtendimento: number;
  diasEmTratamento: number;
  diasAfastado: number;
  principalQueixa: { hd: string; naRegiao: string } | null;
  principalObjetivo: string | null;
  lesoesNoPeriodo: number;
  status: StatusAtleta;
}): string {
  const frases: string[] = [];
  if (d.atendimentos === 0) {
    frases.push(`${d.apelido} não passou pela fisioterapia no período de ${d.intervalo}.`);
  } else {
    frases.push(
      `No período de ${d.intervalo}, ${d.apelido} foi atendido ${d.atendimentos === 1 ? "uma vez" : `${d.atendimentos} vezes`}` +
        (d.diasComAtendimento !== d.atendimentos ? `, em ${d.diasComAtendimento} dias diferentes` : "") +
        ".",
    );
    if (d.principalQueixa) {
      frases.push(
        `A principal queixa foi ${minuscula(d.principalQueixa.hd)} ${d.principalQueixa.naRegiao}` +
          (d.principalObjetivo ? `, e o trabalho teve foco em ${minuscula(d.principalObjetivo)}.` : "."),
      );
    }
    if (d.diasEmTratamento > 0) frases.push(`Esteve em tratamento em ${d.diasEmTratamento} ${d.diasEmTratamento === 1 ? "dia" : "dias"}.`);
  }
  if (d.lesoesNoPeriodo > 0 || d.diasAfastado > 0) {
    frases.push(
      (d.lesoesNoPeriodo > 0 ? `Teve ${d.lesoesNoPeriodo === 1 ? "uma lesão" : `${d.lesoesNoPeriodo} lesões`} no período` : "Seguiu afastado por lesão anterior") +
        ` e ficou ${d.diasAfastado} ${d.diasAfastado === 1 ? "dia" : "dias"} fora de treinos e jogos.`,
    );
  } else {
    frases.push("Não teve lesão nem dias afastado no período.");
  }
  frases.push(`Hoje o status é: ${ROTULO_STATUS[d.status].toLowerCase()}.`);
  return frases.join(" ");
}

/** Minúscula, preservando siglas (DMT, HIIT + CORE). */
function minuscula(s: string): string {
  return s.split(" ").map((p) => (p.length > 1 && p === p.toUpperCase() ? p : p.toLowerCase())).join(" ");
}
