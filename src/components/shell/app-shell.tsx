"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Shield,
  Sun,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Kbd, Tooltip } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { trocarPerfil, trocarTema } from "@/lib/acoes/sessao";

export type AtletaBusca = { id: number; nome: string; apelido: string; camisa: number | null; posicao: string; foto: string | null };
export type Notificacao = { id: string; titulo: string; detalhe: string; href: string };
export type Contagens = { atendimentosHoje: number; lesoesAbertas: number; afastados: number };
export type AfastadoLateral = { id: number; nome: string; apelido: string; foto: string | null; detalhe: string; urgente: boolean };
export type ResumoHoje = { matutino: number; vespertino: number; atletas: number; dataExtenso: string };

type ItemNav = { href: string; rotulo: string; icone: LucideIcon; tecla: string; contagem?: (c: Contagens) => number | null };

// Poucas palavras, as do dia a dia da fisio. Configurações fica no menu do perfil (canto superior direito).
const NAV: ItemNav[] = [
  { href: "/atendimentos", rotulo: "Atendimentos", icone: ClipboardList, tecla: "A", contagem: (c) => c.atendimentosHoje || null },
  { href: "/jogadores", rotulo: "Jogadores", icone: Users, tecla: "J", contagem: (c) => c.afastados || null },
  { href: "/lesoes", rotulo: "Lesões", icone: HeartPulse, tecla: "L", contagem: (c) => c.lesoesAbertas || null },
  { href: "/painel", rotulo: "Painel", icone: LayoutDashboard, tecla: "P" },
];

const DICA_CONTAGEM: Record<string, string> = {
  "/atendimentos": "atendimentos hoje",
  "/jogadores": "afastados hoje",
  "/lesoes": "lesões em aberto",
};

const NOMES_SEGMENTO: Record<string, string> = {
  atendimentos: "Atendimentos",
  jogadores: "Jogadores",
  lesoes: "Lesões",
  painel: "Painel",
  configuracoes: "Configurações",
  editar: "Editar",
  relatorio: "Relatório",
  retorno: "Registrar retorno",
  listas: "Listas",
  campeonatos: "Campeonatos",
  usuarios: "Usuários",
};

function assinarMenu(aviso: () => void) {
  window.addEventListener("menu-recolhido", aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener("menu-recolhido", aviso);
    window.removeEventListener("storage", aviso);
  };
}

function lerMenuRecolhido() {
  try {
    return localStorage.getItem("menu-recolhido") === "1";
  } catch {
    return false;
  }
}

// Jogadores abertos por último (só neste navegador).
const CHAVE_RECENTES = "jogadores-recentes";
function assinarRecentes(aviso: () => void) {
  window.addEventListener("jogadores-recentes", aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener("jogadores-recentes", aviso);
    window.removeEventListener("storage", aviso);
  };
}
function lerRecentes(): string {
  try {
    return localStorage.getItem(CHAVE_RECENTES) ?? "";
  } catch {
    return "";
  }
}
function lembrarJogador(id: string) {
  try {
    const lista = lerRecentes().split(",").filter((x) => x && x !== id);
    localStorage.setItem(CHAVE_RECENTES, [id, ...lista].slice(0, 5).join(","));
    window.dispatchEvent(new Event("jogadores-recentes"));
  } catch {}
}

function useAtalhos(acoes: Record<string, () => void>, abrirBusca: () => void) {
  const prefixoG = React.useRef<number | null>(null);
  React.useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        abrirBusca();
        return;
      }
      const alvo = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || alvo.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(alvo.tagName)) return;
      if (document.querySelector("[role=dialog],[role=alertdialog],[role=menu]")) return;
      const tecla = e.key.toLowerCase();
      if (prefixoG.current) {
        window.clearTimeout(prefixoG.current);
        prefixoG.current = null;
        const acao = acoes[`g${tecla}`];
        if (acao) {
          e.preventDefault();
          acao();
        }
        return;
      }
      if (tecla === "g") {
        prefixoG.current = window.setTimeout(() => (prefixoG.current = null), 1000);
        return;
      }
      if (tecla === "/") {
        e.preventDefault();
        abrirBusca();
        return;
      }
      const acao = acoes[tecla];
      if (acao) {
        e.preventDefault();
        acao();
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [acoes, abrirBusca]);
}

export function AppShell({
  usuario,
  podeEditar,
  atletas,
  notificacoes,
  contagens,
  afastados,
  resumoHoje,
  tema,
  children,
}: {
  usuario: { nome: string; perfil: string; rotuloPerfil: string };
  podeEditar: boolean;
  atletas: AtletaBusca[];
  notificacoes: Notificacao[];
  contagens: Contagens;
  afastados: AfastadoLateral[];
  resumoHoje: ResumoHoje;
  tema: "claro" | "escuro";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const recolhido = React.useSyncExternalStore(assinarMenu, lerMenuRecolhido, () => false);
  // O menu do celular fecha sozinho ao navegar: ele só fica aberto na rota em que foi aberto.
  const [menuAbertoEm, setMenuAbertoEm] = React.useState<string | null>(null);
  const menuMovel = menuAbertoEm === pathname;
  const [buscaAberta, setBuscaAberta] = React.useState(false);

  const alternarMenu = () => {
    try {
      localStorage.setItem("menu-recolhido", recolhido ? "0" : "1");
      window.dispatchEvent(new Event("menu-recolhido"));
    } catch {}
  };

  // Na ficha, "Registrar atendimento" já abre com o jogador escolhido.
  const atletaDaRota = pathname.match(/^\/jogadores\/(\d+)/)?.[1];
  const atletaAtual = atletaDaRota ? atletas.find((a) => String(a.id) === atletaDaRota) : undefined;
  const nomes = React.useMemo(() => new Map(atletas.map((a) => [String(a.id), a.nome])), [atletas]);
  React.useEffect(() => {
    if (atletaAtual) lembrarJogador(String(atletaAtual.id));
  }, [atletaAtual]);
  const recentesIds = React.useSyncExternalStore(assinarRecentes, lerRecentes, () => "");
  const recentes = React.useMemo(
    () => recentesIds.split(",").map((id) => atletas.find((a) => String(a.id) === id)).filter((a): a is AtletaBusca => !!a).slice(0, 4),
    [recentesIds, atletas],
  );
  const emFormulario = /\/(novo|nova|editar|retorno)$/.test(pathname);

  const hrefAtendimento = `/atendimentos/novo${atletaAtual ? `?atleta=${atletaAtual.id}` : ""}`;
  const registrarAtendimento = React.useCallback(() => router.push(hrefAtendimento), [router, hrefAtendimento]);
  const registrarLesao = React.useCallback(
    () => router.push(`/lesoes/nova${atletaAtual ? `?atleta=${atletaAtual.id}` : ""}`),
    [router, atletaAtual],
  );

  const acoes = React.useMemo(() => {
    const a: Record<string, () => void> = {
      ga: () => router.push("/atendimentos"),
      gj: () => router.push("/jogadores"),
      gl: () => router.push("/lesoes"),
      gp: () => router.push("/painel"),
    };
    if (podeEditar) {
      a.n = registrarAtendimento;
      a.l = registrarLesao;
    }
    return a;
  }, [router, podeEditar, registrarAtendimento, registrarLesao]);
  const abrirBusca = React.useCallback(() => setBuscaAberta(true), []);
  useAtalhos(acoes, abrirBusca);

  const segmentos = pathname.split("/").filter(Boolean);
  const migalhas = segmentos.map((s, i) => {
    const href = "/" + segmentos.slice(0, i + 1).join("/");
    let nome = NOMES_SEGMENTO[s] ?? s;
    if (/^\d+$/.test(s)) nome = segmentos[i - 1] === "jogadores" ? (nomes.get(s) ?? "Jogador") : segmentos[i - 1] === "lesoes" ? "Lesão" : "Atendimento";
    if (s === "novo" && segmentos[i - 1] === "atendimentos") nome = "Registrar atendimento";
    if (s === "novo" && segmentos[i - 1] === "jogadores") nome = "Adicionar jogador";
    if (s === "nova") nome = "Registrar lesão";
    const clicavel = i < segmentos.length - 1 && !(/^\d+$/.test(s) && segmentos[i - 1] !== "jogadores");
    return { href, nome, clicavel };
  });

  const barraLateral = (movel: boolean) => {
    const compacto = recolhido && !movel;
    const totalHoje = resumoHoje.matutino + resumoHoje.vespertino;
    return (
      <div className="flex h-full flex-col px-3 pt-3 pb-3">
        {/* Clube */}
        <div className={cn("flex h-10 items-center gap-2.5", compacto ? "justify-center" : "px-1")}>
          <span
            aria-hidden
            title="Espaço do escudo do clube"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-acento text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.2)]"
          >
            <Shield className="size-4" strokeWidth={2.25} />
          </span>
          {!compacto && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold tracking-tight">EC Santo André</p>
              <p className="truncate text-xs text-muted-foreground">Fisioterapia · 2026</p>
            </div>
          )}
          {!compacto && !movel && (
            <Tooltip conteudo="Recolher menu" lado="right">
              <button type="button" onClick={alternarMenu} className="hidden size-7 items-center justify-center rounded-md text-faint-foreground hover:bg-hover hover:text-foreground md:flex" aria-label="Recolher menu">
                <PanelLeft className="size-4" />
              </button>
            </Tooltip>
          )}
        </div>

        {/* A ação do dia a dia, sempre no mesmo lugar */}
        {podeEditar && (
          <Tooltip conteudo={<>Registrar atendimento{atletaAtual ? ` do ${atletaAtual.apelido}` : ""} <Kbd>N</Kbd></>} lado="right">
            <Link
              href={hrefAtendimento}
              className={cn(
                "mt-4 flex h-9 items-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.2)] transition-colors duration-150 hover:bg-primary-hover",
                compacto ? "justify-center px-0" : "px-3",
              )}
            >
              <Plus className="size-4 shrink-0" strokeWidth={2.25} />
              {!compacto && (
                <>
                  <span className="flex-1 truncate">{atletaAtual ? `Atendimento do ${atletaAtual.apelido}` : "Registrar atendimento"}</span>
                  {!atletaAtual && <kbd className="rounded bg-[color-mix(in_srgb,var(--primary-foreground)_15%,transparent)] px-1.5 font-sans text-xs text-[color-mix(in_srgb,var(--primary-foreground)_75%,transparent)]">N</kbd>}
                </>
              )}
            </Link>
          </Tooltip>
        )}

        <div className="mt-2">
          <ItemLateral compacto={compacto} rotulo="Buscar jogador" icone={Search} onClick={abrirBusca} atalho="Ctrl K" />
        </div>

        <div className="-mx-3 mt-3 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-2">
          <nav className="flex flex-col gap-0.5" aria-label="Principal">
            {NAV.map((item) => {
              const ativo = pathname === item.href || (pathname.startsWith(item.href + "/") && pathname !== "/atendimentos/novo");
              const n = item.contagem?.(contagens) ?? null;
              return (
                <ItemLateral
                  key={item.href}
                  compacto={compacto}
                  href={item.href}
                  rotulo={item.rotulo}
                  icone={item.icone}
                  ativo={ativo}
                  contagem={n}
                  dica={n != null ? `${n} ${DICA_CONTAGEM[item.href]}` : undefined}
                />
              );
            })}
          </nav>

          {!compacto && (
            <SecaoLateral titulo="Afastados agora" contagem={afastados.length} href="/jogadores?visao=afastados">
              {afastados.length === 0 ? (
                <p className="px-2 py-1 text-xs text-faint-foreground">Elenco todo disponível.</p>
              ) : (
                afastados.slice(0, 5).map((a) => (
                  <JogadorLateral key={a.id} atleta={a} detalhe={a.detalhe} urgente={a.urgente} ponto="erro" />
                ))
              )}
              {afastados.length > 5 && (
                <Link href="/jogadores?visao=afastados" className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                  Ver todos os {afastados.length}
                </Link>
              )}
            </SecaoLateral>
          )}

          {!compacto && recentes.length > 0 && (
            <SecaoLateral titulo="Vistos por último">
              {recentes.map((a) => (
                <JogadorLateral key={a.id} atleta={a} detalhe={a.posicao} />
              ))}
            </SecaoLateral>
          )}
        </div>

        {/* Resumo de hoje */}
        {!compacto ? (
          <Link href="/atendimentos" className="mt-2 block rounded-lg bg-surface p-3 shadow-ativo transition-colors duration-150 hover:bg-subtle">
            <p className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-foreground">Hoje</span>
              <span className="text-faint-foreground">{resumoHoje.dataExtenso.split(",")[0]}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="text-lg font-semibold tabular text-foreground">{totalHoje}</span> {totalHoje === 1 ? "atendimento" : "atendimentos"}
              {resumoHoje.atletas > 0 && <span> · {resumoHoje.atletas} {resumoHoje.atletas === 1 ? "atleta" : "atletas"}</span>}
            </p>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-hover" aria-hidden>
              {totalHoje > 0 && (
                <>
                  <span className="h-full bg-chart-1" style={{ width: `${(resumoHoje.matutino / totalHoje) * 100}%` }} />
                  <span className="h-full bg-chart-2" style={{ width: `${(resumoHoje.vespertino / totalHoje) * 100}%` }} />
                </>
              )}
            </div>
            <p className="mt-1.5 flex justify-between text-xs text-faint-foreground">
              <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-chart-1" /> Manhã {resumoHoje.matutino}</span>
              <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-chart-2" /> Tarde {resumoHoje.vespertino}</span>
            </p>
          </Link>
        ) : (
          <button type="button" onClick={alternarMenu} className="mx-auto hidden size-8 items-center justify-center rounded-md text-faint-foreground hover:bg-hover hover:text-foreground md:flex" aria-label="Expandir menu">
            <PanelLeft className="size-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-dvh">
      <aside className={cn("nao-imprimir sticky top-0 hidden h-dvh shrink-0 md:block", recolhido ? "w-16" : "w-60")}>{barraLateral(false)}</aside>

      {menuMovel && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMenuAbertoEm(null)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-background shadow-overlay">{barraLateral(true)}</aside>
        </div>
      )}

      {/* Conteúdo num painel branco sobre o fundo cinza da lateral */}
      <div className="painel-conteudo flex min-w-0 flex-1 flex-col bg-surface md:my-2 md:mr-2 md:rounded-xl md:shadow-painel">
        <header className="nao-imprimir sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-surface/90 px-4 backdrop-blur md:rounded-t-xl md:px-6">
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMenuAbertoEm(pathname)} aria-label="Abrir menu">
            <Menu />
          </Button>
          <nav aria-label="Caminho" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
            {migalhas.map((m, i) => (
              <React.Fragment key={m.href}>
                {i > 0 && <span className="text-faint-foreground">/</span>}
                {m.clicavel ? (
                  <Link href={m.href} className="truncate text-muted-foreground hover:text-foreground">
                    {m.nome}
                  </Link>
                ) : (
                  <span className="truncate font-medium">{m.nome}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
          {!emFormulario && <Notificacoes itens={notificacoes} />}
          <MenuUsuario usuario={usuario} tema={tema} podeEditar={podeEditar} />
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      <BarraDeComando
        aberto={buscaAberta}
        aoMudar={setBuscaAberta}
        atletas={atletas}
        podeEditar={podeEditar}
        registrarAtendimento={registrarAtendimento}
        registrarLesao={registrarLesao}
      />
    </div>
  );
}

function ItemLateral({
  compacto,
  href,
  onClick,
  rotulo,
  icone: Icone,
  ativo,
  contagem,
  dica,
  atalho,
}: {
  compacto: boolean;
  href?: string;
  onClick?: () => void;
  rotulo: string;
  icone: LucideIcon;
  ativo?: boolean;
  contagem?: number | null;
  dica?: string;
  atalho?: string;
}) {
  const classe = cn(
    "group flex h-8 w-full items-center gap-2.5 rounded-md text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-hover hover:text-foreground",
    ativo && "bg-surface text-foreground shadow-ativo hover:bg-surface",
    compacto ? "justify-center px-0" : "px-2",
  );
  const conteudo = (
    <>
      <Icone className={cn("size-4 shrink-0", ativo ? "text-foreground" : "text-faint-foreground group-hover:text-foreground")} strokeWidth={1.75} />
      {!compacto && <span className="flex-1 truncate text-left">{rotulo}</span>}
      {!compacto && contagem != null && (
        <span className="text-xs text-faint-foreground tabular" title={dica}>
          {contagem}
        </span>
      )}
      {!compacto && atalho && <Kbd>{atalho}</Kbd>}
    </>
  );
  const elemento = href ? (
    <Link href={href} aria-current={ativo ? "page" : undefined} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={classe}>
      {conteudo}
    </button>
  );
  return compacto ? (
    <Tooltip conteudo={<>{rotulo}{dica ? ` · ${dica}` : ""}</>} lado="right">
      {elemento}
    </Tooltip>
  ) : (
    elemento
  );
}

function SecaoLateral({ titulo, contagem, href, children }: { titulo: string; contagem?: number; href?: string; children: React.ReactNode }) {
  const [aberta, setAberta] = React.useState(true);
  return (
    <section className="flex flex-col gap-0.5">
      <div className="group flex h-7 items-center gap-1 px-2">
        <button
          type="button"
          onClick={() => setAberta((v) => !v)}
          aria-expanded={aberta}
          className="flex flex-1 items-center gap-1 text-left text-xs font-medium text-faint-foreground hover:text-foreground"
        >
          {titulo}
          <ChevronDown className={cn("size-3 opacity-0 transition-all duration-150 group-hover:opacity-100", !aberta && "-rotate-90 opacity-100")} />
        </button>
        {contagem != null && contagem > 0 && (
          href ? (
            <Link href={href} className="text-xs text-faint-foreground tabular hover:text-foreground">{contagem}</Link>
          ) : (
            <span className="text-xs text-faint-foreground tabular">{contagem}</span>
          )
        )}
      </div>
      {aberta && children}
    </section>
  );
}

function JogadorLateral({
  atleta,
  detalhe,
  urgente,
  ativo,
  ponto,
}: {
  atleta: { id: number; nome: string; apelido: string; foto: string | null };
  detalhe: string;
  urgente?: boolean;
  ativo?: boolean;
  ponto?: "erro";
}) {
  return (
    <Link
      href={`/jogadores/${atleta.id}`}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "group flex h-9 items-center gap-2.5 rounded-md px-2 transition-colors duration-150 hover:bg-hover",
        ativo && "bg-surface shadow-ativo hover:bg-surface",
      )}
      title={atleta.nome}
    >
      <span className="relative shrink-0">
        <Avatar nome={atleta.nome} foto={atleta.foto} tamanho={24} />
        {ponto && <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background bg-erro-9" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground group-hover:text-foreground">{atleta.apelido}</span>
      <span className={cn("shrink-0 text-xs tabular", urgente ? "font-medium text-erro-11" : "text-faint-foreground")}>{detalhe}</span>
    </Link>
  );
}

function Notificacoes({ itens }: { itens: Notificacao[] }) {
  return (
    <Popover>
      <Tooltip conteudo="Avisos">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Avisos (${itens.length})`} className="relative">
            <Bell />
            {itens.length > 0 && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-acento" />}
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="px-4 pt-3 pb-2 text-sm font-semibold">Avisos</p>
        {itens.length === 0 ? (
          <p className="px-4 pt-2 pb-6 text-sm text-muted-foreground">Nada pendente.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto px-1 pb-1">
            {itens.map((n) => (
              <li key={n.id}>
                <Link href={n.href} className="flex flex-col rounded-md px-3 py-2 hover:bg-hover">
                  <span className="text-sm font-medium">{n.titulo}</span>
                  <span className="text-xs text-muted-foreground">{n.detalhe}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Menu do perfil: Configurações, tema e (enquanto não há login) a troca de perfil. */
function MenuUsuario({ usuario, tema, podeEditar }: { usuario: { nome: string; perfil: string; rotuloPerfil: string }; tema: "claro" | "escuro"; podeEditar: boolean }) {
  const [pendente, iniciar] = React.useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex h-8 items-center gap-2 rounded-full pr-1 pl-1 hover:bg-hover sm:pr-3" disabled={pendente} aria-label="Menu do perfil">
          <Avatar nome={usuario.nome} tamanho={24} />
          <span className="hidden text-sm font-medium sm:block">{usuario.nome}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar nome={usuario.nome} tamanho={32} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{usuario.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{usuario.rotuloPerfil}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        {podeEditar && (
          <DropdownMenuItem asChild>
            <Link href="/configuracoes"><Settings /> Configurações</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => iniciar(() => trocarTema(tema === "escuro" ? "claro" : "escuro"))}>
          {tema === "escuro" ? <Sun /> : <Moon />} {tema === "escuro" ? "Tema claro" : "Tema escuro"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Trocar perfil (demonstração)</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={usuario.perfil} onValueChange={(p) => iniciar(() => trocarPerfil(p))}>
          <DropdownMenuRadioItem value="fisioterapia">Fisioterapia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="medico">Médico</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="comissao">Comissão técnica</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled><LogOut /> Sair (quando houver login)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BarraDeComando({
  aberto,
  aoMudar,
  atletas,
  podeEditar,
  registrarAtendimento,
  registrarLesao,
}: {
  aberto: boolean;
  aoMudar: (v: boolean) => void;
  atletas: AtletaBusca[];
  podeEditar: boolean;
  registrarAtendimento: () => void;
  registrarLesao: () => void;
}) {
  const router = useRouter();
  const ir = (fn: () => void) => {
    aoMudar(false);
    fn();
  };
  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent titulo="Buscar">
        <Command filter={(valor, busca) => (valor.toLowerCase().includes(busca.toLowerCase().trim()) ? 1 : 0)}>
          <CommandInput placeholder="Buscar jogador, tela ou ação…" autoFocus />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup heading="Jogadores">
              {atletas.map((a) => (
                <CommandItem key={a.id} value={`${a.nome} ${a.apelido} ${a.camisa ?? ""}`} onSelect={() => ir(() => router.push(`/jogadores/${a.id}`))}>
                  <Avatar nome={a.nome} foto={a.foto} tamanho={24} />
                  <span className="truncate">{a.nome}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{a.posicao}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {podeEditar && (
              <CommandGroup heading="Ações">
                <CommandItem value="registrar atendimento novo" onSelect={() => ir(registrarAtendimento)}>
                  <Plus /> Registrar atendimento <span className="ml-auto"><Kbd>N</Kbd></span>
                </CommandItem>
                <CommandItem value="registrar lesão nova" onSelect={() => ir(registrarLesao)}>
                  <HeartPulse /> Registrar lesão <span className="ml-auto"><Kbd>L</Kbd></span>
                </CommandItem>
                <CommandItem value="adicionar jogador cadastrar" onSelect={() => ir(() => router.push("/jogadores/novo"))}>
                  <UserPlus /> Adicionar jogador
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Ir para">
              {NAV.map((item) => (
                <CommandItem key={item.href} value={`ir ${item.rotulo}`} onSelect={() => ir(() => router.push(item.href))}>
                  <item.icone /> {item.rotulo}
                  <span className="ml-auto"><Kbd>G</Kbd><Kbd>{item.tecla}</Kbd></span>
                </CommandItem>
              ))}
              {podeEditar && (
                <CommandItem value="ir configurações" onSelect={() => ir(() => router.push("/configuracoes"))}>
                  <Settings /> Configurações
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
