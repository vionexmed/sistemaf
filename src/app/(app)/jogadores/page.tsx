import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio, SemResultados } from "@/components/estados";
import { BarraDeFiltros, Visoes } from "@/components/indice/filtros";
import { TabelaJogadores } from "@/components/jogadores/tabela";
import { GRUPO_DA_POSICAO, GRUPOS_POSICAO, POSICOES, rotulo, type Posicao } from "@/lib/catalogos";
import { elencoComStatus, hoje, listarAtletas, statusHoje } from "@/lib/consultas";
import { idade } from "@/lib/dominio/datas";
import { normalizar, texto, umDe, type Params } from "@/lib/parametros";
import { permissoes, usuarioAtual } from "@/lib/sessao";

export const metadata: Metadata = { title: "Jogadores" };

const VISOES = [{ valor: "todos", rotulo: "Todos" }, ...GRUPOS_POSICAO, { valor: "afastados", rotulo: "Afastados" }, { valor: "inativos", rotulo: "Fora do elenco" }] as const;
const ORDEM_STATUS = { afastado: 0, em_tratamento: 1, queixa_pos_treino: 2, liberado: 3 } as const;

export default async function PaginaJogadores({ searchParams }: { searchParams: Promise<Params> }) {
  const [p, usuario, elenco] = await Promise.all([searchParams, usuarioAtual(), elencoComStatus()]);
  const pode = permissoes(usuario.perfil);
  const h = hoje();
  const visao = umDe(p, "visao", VISOES.map((v) => v.valor), "todos");
  const busca = normalizar(texto(p, "q") ?? "");
  const ordem = texto(p, "ordem") ?? "camisa";

  const base =
    visao === "inativos"
      ? await Promise.all([listarAtletas(true), statusHoje()]).then(([todos, st]) => todos.filter((a) => !a.ativo).map((a) => ({ ...a, status: st.get(a.id) ?? "liberado" })))
      : elenco;
  const linhas = base
    .filter((a) => (visao === "todos" || visao === "inativos" ? true : visao === "afastados" ? a.status === "afastado" : GRUPO_DA_POSICAO[a.posicao as Posicao] === visao))
    .filter((a) => !busca || normalizar(`${a.nome} ${a.apelido} ${a.camisa}`).includes(busca))
    .map((a) => ({
      id: a.id,
      camisa: a.camisa,
      nome: a.nome,
      apelido: a.apelido,
      foto: a.foto ? `/api/arquivos/${a.foto}` : null,
      posicao: rotulo(POSICOES, a.posicao),
      status: a.status,
      idade: idade(a.nascimento, h),
    }));

  const campo = ordem.replace(/^-/, "");
  const sinal = ordem.startsWith("-") ? -1 : 1;
  linhas.sort((a, b) => {
    const d =
      campo === "nome" ? a.nome.localeCompare(b.nome, "pt-BR")
      : campo === "idade" ? a.idade - b.idade
      : campo === "status" ? ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status]
      : a.camisa - b.camisa;
    return d * sinal || a.camisa - b.camisa;
  });

  return (
    <div className="mx-auto flex max-w-page flex-col gap-4">
      <CabecalhoPagina
        titulo="Jogadores"
        contagem={elenco.length}
        descricao="Escolha um jogador para abrir a ficha."
        acoes={
          pode.editar && (
            <Button asChild>
              <Link href="/jogadores/novo"><Plus /> Adicionar jogador</Link>
            </Button>
          )
        }
      />
      <Card className="overflow-hidden">
        <div className="px-3">
          <Visoes opcoes={VISOES} padrao="todos" />
          <BarraDeFiltros filtros={[]} placeholder="Buscar por nome ou número" />
        </div>
        <div className="border-t">
          {elenco.length === 0 ? (
            <EstadoVazio icone={Users} frase="Nenhum jogador cadastrado ainda." acao={pode.editar ? { rotulo: "Adicionar o primeiro jogador", href: "/jogadores/novo" } : undefined} />
          ) : linhas.length === 0 ? (
            <SemResultados frase={busca ? "Nenhum jogador encontrado." : visao === "afastados" ? "Nenhum jogador afastado hoje." : visao === "inativos" ? "Nenhum jogador fora do elenco." : "Nenhum jogador nesta posição."} limparHref="/jogadores" />
          ) : (
            <TabelaJogadores linhas={linhas} podeEditar={pode.editar} />
          )}
        </div>
      </Card>
    </div>
  );
}
