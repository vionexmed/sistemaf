import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/app-shell";
import { POSICOES, rotulo } from "@/lib/catalogos";
import { hoje, listarAtletas, listarLesoes, mapaAtletas } from "@/lib/consultas";
import { diferencaDias, fmtDiaMes, somarDias } from "@/lib/dominio/datas";
import { diaRetorno, lesaoAfasta } from "@/lib/dominio/status";
import { COOKIE_TEMA, permissoes, usuarioAtual } from "@/lib/sessao";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const [usuario, atletas, lesoes, porId, jar] = await Promise.all([
    usuarioAtual(),
    listarAtletas(),
    listarLesoes(),
    mapaAtletas(),
    cookies(),
  ]);
  const h = hoje();
  const amanha = somarDias(h, 1);

  // Notificações: retornos previstos para hoje e amanhã; lesões em aberto há mais de 14 dias.
  const notificacoes = lesoes.flatMap((l) => {
    const atleta = porId.get(l.atletaId);
    if (!atleta?.ativo) return [];
    const retorno = diaRetorno(l);
    if (retorno && (retorno === h || retorno === amanha) && lesaoAfasta(l, h)) {
      return [{ id: `r${l.id}`, titulo: `${atleta.nome} volta ${retorno === h ? "hoje" : "amanhã"}`, detalhe: `Retorno previsto em ${fmtDiaMes(retorno)}`, href: `/jogadores/${atleta.id}?aba=lesoes` }];
    }
    if (retorno == null && diferencaDias(l.dia, h) > 14) {
      return [{ id: `a${l.id}`, titulo: `${atleta.nome}: lesão em aberto há ${diferencaDias(l.dia, h)} dias`, detalhe: "Sem retorno previsto. Registre o retorno ou os dias de afastamento.", href: `/jogadores/${atleta.id}?aba=lesoes` }];
    }
    return [];
  });

  return (
    <AppShell
      usuario={usuario}
      podeEditar={permissoes(usuario.perfil).editar}
      atletas={atletas.map((a) => ({ id: a.id, nome: a.nome, apelido: a.apelido, camisa: a.camisa, posicao: rotulo(POSICOES, a.posicao), foto: a.foto ? `/api/arquivos/${a.foto}` : null }))}
      notificacoes={notificacoes}
      tema={jar.get(COOKIE_TEMA)?.value === "escuro" ? "escuro" : "claro"}
    >
      {children}
    </AppShell>
  );
}
