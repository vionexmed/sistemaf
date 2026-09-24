import { HD, OBJETIVOS, PERIODOS_DIA, POSICOES, REGIOES, STATUS_ATENDIMENTO, rotulo } from "@/lib/catalogos";
import { atendimentosEntre, hoje, listarUsuarios, mapaAtletas } from "@/lib/consultas";
import { csv, respostaCsv } from "@/lib/csv";
import { ehDataISO, fmtData, horaMinuto } from "@/lib/dominio/datas";
import { filtrarAtendimentos, janelaDaVisao, VISOES_ATENDIMENTO, type VisaoAtendimento } from "@/lib/dominio/filtros";
import { normalizar } from "@/lib/parametros";
import { permissoes, usuarioAtual } from "@/lib/sessao";

// Mesmos filtros da tela (visão, dia, filtros, busca) ou um intervalo (?visao=intervalo&de=&ate=, usado pelo Painel).
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const usuario = await usuarioAtual();
  const verSaude = permissoes(usuario.perfil).verSaude;
  const h = hoje();
  const visaoParam = p.get("visao") ?? "hoje";
  let janela;
  if (visaoParam === "intervalo" && ehDataISO(p.get("de")) && ehDataISO(p.get("ate"))) {
    janela = { de: p.get("de")!, ate: p.get("ate")! };
  } else {
    const visao = (VISOES_ATENDIMENTO.some((v) => v.valor === visaoParam) ? visaoParam : "hoje") as VisaoAtendimento;
    const data = p.get("data");
    janela = janelaDaVisao(visao, h, visao === "hoje" && ehDataISO(data) && data <= h ? data : h);
  }
  const [todos, atletas, usuarios] = await Promise.all([atendimentosEntre(janela.de, janela.ate), mapaAtletas(), listarUsuarios()]);
  const lista = (k: string) => (p.get(k) ?? "").split(",").filter(Boolean);
  const ids = new Set(lista("ids").map(Number));
  const busca = normalizar(p.get("q") ?? "");
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));

  const filtrados = filtrarAtendimentos(todos, { periodo: lista("periodo"), status: lista("status"), hd: lista("hd"), local: lista("local"), objetivo: lista("objetivo") })
    .filter((a) => ids.size === 0 || ids.has(a.id))
    .filter((a) => {
      const at = atletas.get(a.atletaId);
      return !busca || (at != null && normalizar(`${at.nome} ${at.apelido} ${at.camisa}`).includes(busca));
    })
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.periodo.localeCompare(b.periodo)));

  const cabecalho = ["Data", "Período", "Camisa", "Atleta", "Posição", "HD", "Local da queixa", "Objetivo do trabalho", "Status", ...(verSaude ? ["Evolução"] : []), "Registrado por", "Registrado às"];
  const linhas = filtrados.map((a) => {
    const at = atletas.get(a.atletaId)!;
    return [
      fmtData(a.data), rotulo(PERIODOS_DIA, a.periodo), at.camisa, at.nome, rotulo(POSICOES, at.posicao),
      rotulo(HD, a.hd), rotulo(REGIOES, a.local), rotulo(OBJETIVOS, a.objetivo), rotulo(STATUS_ATENDIMENTO, a.status),
      ...(verSaude ? [a.evolucao ?? ""] : []),
      (a.registradoPor && nomes.get(a.registradoPor)) || "", horaMinuto(a.criadoEm),
    ];
  });
  return respostaCsv(csv(cabecalho, linhas), `atendimentos_${janela.de}_${janela.ate}.csv`);
}
