"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartPulse, MoreHorizontal, Pencil, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status";
import { CabecalhoOrdenavel } from "@/components/indice/ordenar";

export type LinhaJogador = {
  id: number;
  camisa: number;
  nome: string;
  apelido: string;
  foto: string | null;
  posicao: string;
  status: string;
  idade: number;
};

export function TabelaJogadores({ linhas, podeEditar }: { linhas: LinhaJogador[]; podeEditar: boolean }) {
  const router = useRouter();
  return (
    <Table>
      <TableHeader>
        <TableRow className="h-9">
          <TableHead numero className="w-16"><CabecalhoOrdenavel campo="camisa" padrao="camisa" numero>Nº</CabecalhoOrdenavel></TableHead>
          <TableHead><CabecalhoOrdenavel campo="nome" padrao="camisa">Jogador</CabecalhoOrdenavel></TableHead>
          <TableHead><CabecalhoOrdenavel campo="status" padrao="camisa">Status</CabecalhoOrdenavel></TableHead>
          <TableHead>Posição</TableHead>
          <TableHead numero><CabecalhoOrdenavel campo="idade" padrao="camisa" numero>Idade</CabecalhoOrdenavel></TableHead>
          <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((j) => (
          <TableRow
            key={j.id}
            className="cursor-pointer hover:bg-hover"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("button,a,[role=menu]")) return;
              router.push(`/jogadores/${j.id}`);
            }}
          >
            <TableCell numero className="text-muted-foreground">{j.camisa}</TableCell>
            <TableCell>
              <Link href={`/jogadores/${j.id}`} className="flex items-center gap-3">
                <Avatar nome={j.nome} foto={j.foto} tamanho={32} />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-medium hover:underline">{j.nome}</span>
                  <span className="block truncate text-xs text-muted-foreground">{j.apelido}</span>
                </span>
              </Link>
            </TableCell>
            <TableCell><StatusBadge status={j.status} /></TableCell>
            <TableCell className="text-muted-foreground">{j.posicao}</TableCell>
            <TableCell numero>{j.idade}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${j.nome}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/jogadores/${j.id}`}><UserRound /> Abrir ficha</Link>
                  </DropdownMenuItem>
                  {podeEditar && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/jogadores/${j.id}/editar`}><Pencil /> Editar cadastro</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/lesoes/nova?atleta=${j.id}`}><HeartPulse /> Registrar lesão</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
