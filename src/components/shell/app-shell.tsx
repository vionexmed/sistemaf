"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings,
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

export type AtletaBusca = { id: number; nome: string; apelido: string; camisa: number; posicao: string; foto: string | null };
export type Notificacao = { id: string; titulo: string; detalhe: string; href: string };

type ItemNav = { href: string; rotulo: string; icone: LucideIcon; tecla: string };

const SECOES: { titulo: string; itens: ItemNav[]; soEditor?: boolean }[] = [
  {
    titulo: "Trabalho",
    itens: [
      { href: "/atendimentos", rotulo: "Atendimentos", icone: ClipboardList, tecla: "A" },
      { href: "/jogadores", rotulo: "Jogadores", icone: Users, tecla: "J" },
      { href: "/lesoes", rotulo: "Lesões", icone: HeartPulse, tecla: "L" },
    ],
  },
  { titulo: "Análise", itens: [{ href: "/painel", rotulo: "Painel", icone: LayoutDashboard, tecla: "P" }] },
  {
    titulo: "Sistema",
    soEditor: true,
    itens: [{ href: "/configuracoes", rotulo: "Configurações", icone: Settings, tecla: "C" }],
  },
];

const NOMES_SEGMENTO: Record<string, string> = {
  atendimentos: "Atendimentos",
  jogadores: "Jogadores",
  lesoes: "Lesões",
  painel: "Painel",
  configuracoes: "Configurações",
  novo: "Novo",
  nova: "Nova",
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
  tema,
  children,
}: {
  usuario: { nome: string; perfil: string; rotuloPerfil: string };
  podeEditar: boolean;
  atletas: AtletaBusca[];
  notificacoes: Notificacao[];
  tema: "claro" | "escuro";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const recolhido = React.useSyncExternalStore(assinarMenu, lerMenuRecolhido, () => false);
  // O menu do celular fecha sozinho ao navegar: ele só fica aberto na rota em que foi aberto.
  const [menuAbertoEm, setMenuAbertoEm] = React.useState<string | null>(null);
  const menuMovel = menuAbertoEm === pathname;
  const setMenuMovel = (aberto: boolean) => setMenuAbertoEm(aberto ? pathname : null);
  const [buscaAberta, setBuscaAberta] = React.useState(false);

  const alternarMenu = () => {
    try {
      localStorage.setItem("menu-recolhido", recolhido ? "0" : "1");
      window.dispatchEvent(new Event("menu-recolhido"));
    } catch {}
  };

  // Na ficha, "Registrar atendimento" já abre com o jogador escolhido.
  const atletaDaRota = pathname.match(/^\/jogadores\/(\d+)/)?.[1];
  const nomes = React.useMemo(() => new Map(atletas.map((a) => [String(a.id), a.nome])), [atletas]);

  const registrarAtendimento = React.useCallback(
    () => router.push(`/atendimentos/novo${atletaDaRota ? `?atleta=${atletaDaRota}` : ""}`),
    [router, atletaDaRota],
  );
  const registrarLesao = React.useCallback(
    () => router.push(`/lesoes/nova${atletaDaRota ? `?atleta=${atletaDaRota}` : ""}`),
    [router, atletaDaRota],
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
      a.gc = () => router.push("/configuracoes");
    }
    return a;
  }, [router, podeEditar, registrarAtendimento, registrarLesao]);
  const abrirBusca = React.useCallback(() => setBuscaAberta(true), []);
  useAtalhos(acoes, abrirBusca);

  const segmentos = pathname.split("/").filter(Boolean);
  const migalhas = segmentos.map((s, i) => {
    const href = "/" + segmentos.slice(0, i + 1).join("/");
    let nome = NOMES_SEGMENTO[s] ?? s;
    if (/^\d+$/.test(s)) {
      nome = segmentos[i - 1] === "jogadores" ? (nomes.get(s) ?? "Jogador") : segmentos[i - 1] === "lesoes" ? "Lesão" : "Atendimento";
    }
    if (s === "novo" && segmentos[i - 1] === "atendimentos") nome = "Registrar atendimento";
    if (s === "novo" && segmentos[i - 1] === "jogadores") nome = "Adicionar jogador";
    if (s === "nova") nome = "Registrar lesão";
    const clicavel = i < segmentos.length - 1 && !(/^\d+$/.test(s) && segmentos[i - 1] !== "jogadores");
    return { href, nome, clicavel };
  });

  const navegacao = (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-2" aria-label="Principal">
      {SECOES.filter((s) => !s.soEditor || podeEditar).map((secao) => (
        <div key={secao.titulo} className="flex flex-col gap-1">
          {!recolhido && <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">{secao.titulo}</p>}
          {secao.itens.map((item) => {
            const ativo = pathname === item.href || pathname.startsWith(item.href + "/");
            const link = (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md px-2 text-sm text-foreground transition-colors duration-150 hover:bg-hover",
                  ativo && "bg-selected font-medium text-acento-11 hover:bg-selected",
                  recolhido && "justify-center px-0",
                )}
              >
                <item.icone className="size-5 shrink-0" strokeWidth={1.75} />
                {!recolhido && <span className="flex-1 truncate">{item.rotulo}</span>}
              </Link>
            );
            return recolhido ? (
              <Tooltip key={item.href} lado="right" conteudo={<>{item.rotulo}<Kbd>G</Kbd><Kbd>{item.tecla}</Kbd></>}>
                {link}
              </Tooltip>
            ) : (
              link
            );
          })}
        </div>
      ))}
    </nav>
  );

  const barraLateral = (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 items-center gap-2 border-b px-4", recolhido && "justify-center px-0")}>
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground"
          title="Espaço do escudo do clube"
        >
          SA
        </span>
        {!recolhido && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">EC Santo André</p>
            <p className="truncate text-xs text-muted-foreground">Departamento de saúde</p>
          </div>
        )}
      </div>
      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={abrirBusca}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-md border border-input bg-surface px-2 text-sm text-muted-foreground hover:bg-hover",
            recolhido && "justify-center px-0",
          )}
          aria-label="Buscar jogador"
        >
          <Search className="size-4 shrink-0" />
          {!recolhido && (
            <>
              <span className="flex-1 text-left">Buscar jogador</span>
              <Kbd>Ctrl K</Kbd>
            </>
          )}
        </button>
      </div>
      {navegacao}
      <div className="border-t p-2">
        <button
          type="button"
          onClick={alternarMenu}
          className="hidden h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-hover md:flex"
          aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
        >
          {recolhido ? <ChevronsRight className="mx-auto size-4" /> : <><ChevronsLeft className="size-4" /> Recolher</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "nao-imprimir sticky top-0 hidden h-dvh shrink-0 border-r bg-subtle md:block",
          recolhido ? "w-14" : "w-60",
        )}
      >
        {barraLateral}
      </aside>

      {menuMovel && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuMovel(false)} />
          <aside className="absolute inset-y-0 left-0 w-60 border-r bg-subtle shadow-overlay">{barraLateral}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="nao-imprimir sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-4 md:px-6">
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMenuMovel(true)} aria-label="Abrir menu">
            <Menu />
          </Button>
          <nav aria-label="Caminho" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
            {migalhas.map((m, i) => (
              <React.Fragment key={m.href}>
                {i > 0 && <span className="text-muted-foreground">/</span>}
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
          <Notificacoes itens={notificacoes} />
          <MenuUsuario usuario={usuario} tema={tema} />
        </header>
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
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

function Notificacoes({ itens }: { itens: Notificacao[] }) {
  return (
    <Popover>
      <Tooltip conteudo="Notificações">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Notificações (${itens.length})`} className="relative">
            <Bell />
            {itens.length > 0 && (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular">
                {itens.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b px-4 py-2 text-sm font-medium">Notificações</p>
        {itens.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nada pendente.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {itens.map((n) => (
              <li key={n.id}>
                <Link href={n.href} className="flex flex-col px-4 py-2 hover:bg-hover">
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

function MenuUsuario({ usuario, tema }: { usuario: { nome: string; perfil: string; rotuloPerfil: string }; tema: "claro" | "escuro" }) {
  const [pendente, iniciar] = React.useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex h-9 items-center gap-2 rounded-md px-2 hover:bg-hover" disabled={pendente}>
          <Avatar nome={usuario.nome} tamanho={24} />
          <span className="hidden text-left text-sm leading-tight sm:block">
            <span className="block font-medium">{usuario.nome}</span>
            <span className="block text-xs text-muted-foreground">{usuario.rotuloPerfil}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Trocar perfil (demonstração)</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={usuario.perfil} onValueChange={(p) => iniciar(() => trocarPerfil(p))}>
          <DropdownMenuRadioItem value="fisioterapia">Fisioterapia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="medico">Médico</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="comissao">Comissão técnica</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => iniciar(() => trocarTema(tema === "escuro" ? "claro" : "escuro"))}>
          {tema === "escuro" ? <Sun /> : <Moon />} {tema === "escuro" ? "Tema claro" : "Tema escuro"}
        </DropdownMenuItem>
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
      <DialogContent titulo="Barra de comando">
        <Command
          filter={(valor, busca) => (valor.toLowerCase().includes(busca.toLowerCase().trim()) ? 1 : 0)}
        >
          <CommandInput placeholder="Buscar jogador por nome ou número, tela ou ação…" autoFocus />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            {podeEditar && (
              <CommandGroup heading="Ações">
                <CommandItem value="registrar atendimento novo" onSelect={() => ir(registrarAtendimento)}>
                  <Activity /> Registrar atendimento <span className="ml-auto"><Kbd>N</Kbd></span>
                </CommandItem>
                <CommandItem value="registrar lesão nova" onSelect={() => ir(registrarLesao)}>
                  <HeartPulse /> Registrar lesão <span className="ml-auto"><Kbd>L</Kbd></span>
                </CommandItem>
                <CommandItem value="adicionar jogador cadastrar" onSelect={() => ir(() => router.push("/jogadores/novo"))}>
                  <UserPlus /> Adicionar jogador
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Jogadores">
              {atletas.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.camisa} ${a.nome} ${a.apelido}`}
                  onSelect={() => ir(() => router.push(`/jogadores/${a.id}`))}
                >
                  <span className="w-6 text-right text-sm text-muted-foreground tabular">{a.camisa}</span>
                  <Avatar nome={a.nome} foto={a.foto} tamanho={24} />
                  <span className="truncate">{a.nome}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{a.posicao}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Ir para">
              {SECOES.filter((s) => !s.soEditor || podeEditar)
                .flatMap((s) => s.itens)
                .map((item) => (
                  <CommandItem key={item.href} value={`ir ${item.rotulo}`} onSelect={() => ir(() => router.push(item.href))}>
                    <item.icone /> {item.rotulo}
                    <span className="ml-auto"><Kbd>G</Kbd><Kbd>{item.tecla}</Kbd></span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

