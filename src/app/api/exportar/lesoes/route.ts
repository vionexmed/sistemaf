import { CAMPEONATOS, PERIODOS_TEMPORADA, POSICOES, TIPOS_LESAO, rotulo } from "@/lib/catalogos";
import { hoje, listarLesoes, mapaAtletas } from "@/lib/consultas";
import { localDaLesao } from "@/lib/consultas/lesoes";
import { csv, respostaCsv } from "@/lib/csv";
import { fmtData } from "@/lib/dominio/datas";
import { filtrarLesoes, VISOES_LESAO, type VisaoLesao } from "@/lib/dominio/filtros";
import { diasPerdidosDaLesao } from "@/lib/dominio/metricas";
import { diaRetorno } from "@/lib/dominio/status";
import { normalizar } from "@/lib/parametros";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const usuario = await usuarioAtual();
  const verSaude = permissoes(usuario.perfil).verSaude;
  const h = hoje();
  const [lesoes, atletas] = await Promise.all([listarLesoes(), mapaAtletas()]);
  const lista = (k: string) => (p.get(k) ?? "").split(",").filter(Boolean);
  const visao = (VISOES_LESAO.some((v) => v.valor === p.get("visao")) ? p.get("visao") : "todas") as VisaoLesao;
  const busca = normalizar(p.get("q") ?? "");
  const filtradas = filtrarLesoes(lesoes, visao, { campeonato: lista("campeonato"), periodo: lista("periodo"), tipo: lista("tipo"), regiao: lista("regiao") }).filter((l) => {
    const a = atletas.get(l.atletaId);
    return !busca || (a != null && normalizar(`${a.nome} ${a.apelido} ${a.camisa ?? ""}`).includes(busca));
  });
  const cabecalho = ["Dia", "Camisa", "Atleta", "Posição", "Lesão", ...(verSaude ? ["Estrutura"] : []), "Local", "Reincidência", "Afastamento (dias)", "Retorno", "Dias perdidos até hoje", "Campeonato", "Período", ...(verSaude ? ["Observação"] : [])];
  const linhas = filtradas.map((l) => {
    const a = atletas.get(l.atletaId)!;
    const retorno = diaRetorno(l);
    return [
      fmtData(l.dia), a.camisa, a.nome, rotulo(POSICOES, a.posicao), rotulo(TIPOS_LESAO, l.tipo), ...(verSaude ? [l.estrutura ?? ""] : []),
      localDaLesao(l.regiao, l.lado), l.reincidencia ? "Sim" : "Não", l.diasAfastamento ?? "Em aberto", retorno ? fmtData(retorno) : "",
      diasPerdidosDaLesao(l, h), rotulo(CAMPEONATOS, l.campeonato), rotulo(PERIODOS_TEMPORADA, l.periodo), ...(verSaude ? [l.observacao ?? ""] : []),
    ];
  });
  return respostaCsv(csv(cabecalho, linhas), `lesoes_${h}.csv`);
}
