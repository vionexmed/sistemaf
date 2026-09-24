"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmarExclusao } from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/status";
import { excluirAtendimentos } from "@/lib/acoes/atendimentos";

export type LinhaAtendimento = {
  id: number;
  atletaId: number;
  camisa: number | null;
  nome: string;
  foto: string | null;
  posicao: string;
  data: string; // 23/09
  dataISO: string;
  periodo: string;
  hd: string;
  local: string;
  objetivo: string;
  status: string;
  registradoHa: string;
  registradoEm: string;
};

export function TabelaAtendimentos({
  linhas,
  podeEditar,
  mostrarData,
}: {
  linhas: LinhaAtendimento[];
  podeEditar: boolean;
  mostrarData: boolean;
}) {
  const router = useRouter();
  const [excluir, setExcluir] = React.useState<LinhaAtendimento | null>(null);
  const [pendente, iniciar] = React.useTransition();

  const confirmarExclusao = () => {
    if (!excluir) return;
    iniciar(async () => {
      await excluirAtendimentos([excluir.id]);
      setExcluir(null);
      toast.success("Atendimento excluído.");
      router.refresh();
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="h-9">
            <TableHead>Atleta</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Posição</TableHead>
            {mostrarData && <TableHead>Data</TableHead>}
            <TableHead>Período</TableHead>
            <TableHead>HD</TableHead>
            <TableHead>Local da queixa</TableHead>
            <TableHead>Objetivo do trabalho</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l) => (
            <TableRow
              key={l.id}
              className="cursor-pointer hover:bg-hover"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button,a,[role=menu]")) return;
                router.push(`/jogadores/${l.atletaId}`);
              }}
            >
              <TableCell>
                <Link href={`/jogadores/${l.atletaId}`} className="flex items-center gap-2 font-medium hover:underline">
                  <Avatar nome={l.nome} foto={l.foto} tamanho={24} />
                  <span className="truncate" title={l.nome}>{l.nome}</span>
                </Link>
              </TableCell>
              <TableCell><StatusBadge status={l.status} /></TableCell>
              <TableCell className="text-muted-foreground">{l.posicao}</TableCell>
              {mostrarData && <TableCell className="tabular">{l.data}</TableCell>}
              <TableCell>{l.periodo}</TableCell>
              <TableCell title={l.hd}>{l.hd}</TableCell>
              <TableCell title={l.local}>{l.local}</TableCell>
              <TableCell title={l.objetivo}>{l.objetivo}</TableCell>
              <TableCell className="text-muted-foreground" title={l.registradoEm}>{l.registradoHa}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Ações do atendimento de ${l.nome}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/jogadores/${l.atletaId}`}><UserRound /> Abrir ficha</Link>
                    </DropdownMenuItem>
                    {podeEditar && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/atendimentos/${l.id}/editar`}><Pencil /> Editar</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destrutivo onSelect={() => setExcluir(l)}>
                          <Trash2 /> Excluir
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
      <ConfirmarExclusao
        aberto={excluir != null}
        aoMudar={(v) => !v && setExcluir(null)}
        pendente={pendente}
        titulo="Excluir atendimento?"
        descricao={excluir ? `Excluir o atendimento de ${excluir.nome} em ${excluir.data} (${excluir.periodo.toLowerCase()})? Isso não pode ser desfeito.` : ""}
        aoConfirmar={confirmarExclusao}
      />
    </>
  );
}

/** Atualiza a lista a cada 20 s e ao voltar para a aba (visão Hoje). */
export function AtualizarSozinho({ segundos = 20 }: { segundos?: number }) {
  const router = useRouter();
  React.useEffect(() => {
    const t = window.setInterval(() => document.visibilityState === "visible" && router.refresh(), segundos * 1000);
    const aoVoltar = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [router, segundos]);
  return null;
}
