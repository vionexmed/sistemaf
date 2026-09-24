// Datas no formato ISO "AAAA-MM-DD". "Hoje" é sempre no horário de Brasília,
// porque o servidor roda em UTC e um atendimento às 22h não pode cair no dia seguinte.

export const FUSO = "America/Sao_Paulo";

const partesSP = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partes(agora: Date) {
  const p = Object.fromEntries(partesSP.formatToParts(agora).map((x) => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, hora: Number(p.hour), minuto: Number(p.minute) };
}

export function hojeISO(agora: Date = new Date()): string {
  return partes(agora).data;
}

export function periodoDoHorario(agora: Date = new Date()): "matutino" | "vespertino" {
  return partes(agora).hora < 12 ? "matutino" : "vespertino";
}

export function horaMinuto(instante: Date): string {
  const { hora, minuto } = partes(instante);
  return `${String(hora).padStart(2, "0")}h${String(minuto).padStart(2, "0")}`;
}

function paraUTC(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

function deUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

const DIA_MS = 86_400_000;

export function somarDias(iso: string, dias: number): string {
  return deUTC(paraUTC(iso) + dias * DIA_MS);
}

/** Dias de `de` até `ate` (ate − de). */
export function diferencaDias(de: string, ate: string): number {
  return Math.round((paraUTC(ate) - paraUTC(de)) / DIA_MS);
}

export function diasEntre(de: string, ate: string): string[] {
  const total = diferencaDias(de, ate);
  return Array.from({ length: Math.max(0, total + 1) }, (_, i) => somarDias(de, i));
}

/** Segunda-feira da semana da data. */
export function inicioSemana(iso: string): string {
  const diaSemana = new Date(paraUTC(iso)).getUTCDay(); // 0 = domingo
  return somarDias(iso, -((diaSemana + 6) % 7));
}

export function inicioMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function idade(nascimento: string, hoje: string): number {
  const [an, mn, dn] = nascimento.split("-").map(Number);
  const [ah, mh, dh] = hoje.split("-").map(Number);
  return ah - an - (mh < mn || (mh === mn && dh < dn) ? 1 : 0);
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const DIAS_SEMANA = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado",
];
const DIAS_CURTOS = ["D", "S", "T", "Q", "Q", "S", "S"];

/** 23/09 */
export function fmtDiaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** 23/09/2026 */
export function fmtData(iso: string): string {
  return `${fmtDiaMes(iso)}/${iso.slice(0, 4)}`;
}

/** Quarta-feira, 23 de setembro */
export function fmtDiaExtenso(iso: string): string {
  const d = new Date(paraUTC(iso));
  return `${DIAS_SEMANA[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES_LONGOS[d.getUTCMonth()]}`;
}

/** 23 set */
export function fmtDiaMesCurto(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1]}`;
}

/** set */
export function fmtMes(iso: string): string {
  return MESES[Number(iso.slice(5, 7)) - 1];
}

/** 24 ago a 23 set de 2026 */
export function fmtIntervalo(de: string, ate: string): string {
  const anoDe = de.slice(0, 4);
  const anoAte = ate.slice(0, 4);
  const inicio = anoDe === anoAte ? fmtDiaMesCurto(de) : `${fmtDiaMesCurto(de)} de ${anoDe}`;
  return `${inicio} a ${fmtDiaMesCurto(ate)} de ${anoAte}`;
}

export function letraDiaSemana(iso: string): string {
  return DIAS_CURTOS[new Date(paraUTC(iso)).getUTCDay()];
}

export function ehDataISO(valor: unknown): valor is string {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(paraUTC(valor));
}
