"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, MoreHorizontal, Pencil, Trash2, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmarExclusao } from "@/components/ui/alert-dialog";
import { excluirLesao } from "@/lib/acoes/lesoes";

export type LinhaLesao = {
  id: number;
  atletaId: number;
  nome: string;
  camisa: number;
  foto: string | null;
  posicao: string;
  dia: string;
  lesao: string; // "Contratura · bíceps femoral"
  local: string; // "Joelho direito"
  reincidencia: boolean;
  emAberto: boolean;
  afastamento: string; // "12 dias" | "Em aberto"
  retorno: string; // "05/10" | "—"
  afastadoHoje: boolean;
  campeonato: string;
  periodo: string;
};

export function TabelaLesoes({ linhas, podeEditar, mostrarAtleta = true }: { linhas: LinhaLesao[]; podeEditar: boolean; mostrarAtleta?: boolean }) {
  const router = useRouter();
  const [excluir, setExcluir] = React.useState<LinhaLesao | null>(null);
  const [pendente, iniciar] = React.useTransition();

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="h-9">
            {mostrarAtleta && <TableHead>Atleta</TableHead>}
            {mostrarAtleta && <TableHead>Posição</TableHead>}
            <TableHead>Dia</TableHead>
            <TableHead>Lesão</TableHead>
            <TableHead>Local</TableHead>
            <TableHead>Reincidência</TableHead>
            <TableHead numero>Afastamento</TableHead>
            <TableHead>Retorno</TableHead>
            <TableHead>Campeonato</TableHead>
            <TableHead>Período</TableHead>
            <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l) => (
            <TableRow
              key={l.id}
              className={mostrarAtleta ? "cursor-pointer hover:bg-hover" : undefined}
              onClick={(e) => {
                if (!mostrarAtleta || (e.target as HTMLElement).closest("button,a,[role=menu]")) return;
                router.push(`/jogadores/${l.atletaId}?aba=lesoes`);
              }}
            >
              {mostrarAtleta && (
                <TableCell>
                  <Link href={`/jogadores/${l.atletaId}?aba=lesoes`} className="flex items-center gap-2 font-medium hover:underline">
                    <Avatar nome={l.nome} foto={l.foto} tamanho={24} />
                    <span className="truncate">{l.nome}</span>
                  </Link>
                </TableCell>
              )}
              {mostrarAtleta && <TableCell className="text-muted-foreground">{l.posicao}</TableCell>}
              <TableCell className="tabular">{l.dia}</TableCell>
              <TableCell className="max-w-48" title={l.lesao}>{l.lesao}</TableCell>
              <TableCell>{l.local}</TableCell>
              <TableCell>{l.reincidencia ? <Badge tom="aviso">Sim</Badge> : <span className="text-muted-foreground">Não</span>}</TableCell>
              <TableCell numero>{l.emAberto ? <Badge tom="erro" ponto>Em aberto</Badge> : l.afastamento}</TableCell>
              <TableCell className="tabular" title={l.afastadoHoje && !l.emAberto ? "Retorno previsto" : undefined}>
                {l.retorno}
                {l.afastadoHoje && !l.emAberto && <span className="text-muted-foreground">*</span>}
              </TableCell>
              <TableCell>{l.campeonato}</TableCell>
              <TableCell className="text-muted-foreground">{l.periodo}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Ações da lesão de ${l.nome} em ${l.dia}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {mostrarAtleta && (
                      <DropdownMenuItem asChild>
                        <Link href={`/jogadores/${l.atletaId}?aba=lesoes`}><UserRound /> Abrir ficha</Link>
                      </DropdownMenuItem>
                    )}
                    {podeEditar && (
                      <>
                        {l.emAberto && (
                          <DropdownMenuItem asChild>
                            <Link href={`/lesoes/${l.id}/retorno`}><CalendarCheck /> Registrar retorno</Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/lesoes/${l.id}/editar`}><Pencil /> Editar</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destrutivo onSelect={() => setExcluir(l)}>
                          <Trash2 /> Excluir
                        </DropdownMenuItem>
                      </>
                    )}
                    {!podeEditar && !mostrarAtleta && <DropdownMenuItem disabled>Sem ações para o seu perfil</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmarExclusao
        aberto={excluir != null}
        aoMudar={(v) => !v && setExcluir(null)}
        pendente={pendente}
        titulo="Excluir lesão?"
        descricao={excluir ? `Excluir a lesão de ${excluir.nome} em ${excluir.dia} (${excluir.lesao.toLowerCase()})? Ela sai do índice, do mapa de queixas e o status do jogador é recalculado. Isso não pode ser desfeito.` : ""}
        aoConfirmar={() =>
          excluir &&
          iniciar(async () => {
            await excluirLesao(excluir.id);
            setExcluir(null);
            toast.success("Lesão excluída.");
            router.refresh();
          })
        }
      />
    </>
  );
}
