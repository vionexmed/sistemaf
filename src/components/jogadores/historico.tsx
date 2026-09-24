"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmarExclusao } from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/status";
import { excluirAtendimentos } from "@/lib/acoes/atendimentos";

export type LinhaHistorico = { id: number; data: string; periodo: string; hd: string; local: string; objetivo: string; status: string; evolucao: string | null };

export function HistoricoAtendimentos({ linhas, podeEditar, nome, mostrarEvolucao }: { linhas: LinhaHistorico[]; podeEditar: boolean; nome: string; mostrarEvolucao: boolean }) {
  const router = useRouter();
  const [excluir, setExcluir] = React.useState<LinhaHistorico | null>(null);
  const [pendente, iniciar] = React.useTransition();
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="h-9">
            <TableHead>Data</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>HD</TableHead>
            <TableHead>Local</TableHead>
            <TableHead>Objetivo</TableHead>
            {mostrarEvolucao && <TableHead>Evolução</TableHead>}
            {podeEditar && <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="tabular">{l.data}</TableCell>
              <TableCell>{l.periodo}</TableCell>
              <TableCell><StatusBadge status={l.status} /></TableCell>
              <TableCell>{l.hd}</TableCell>
              <TableCell>{l.local}</TableCell>
              <TableCell>{l.objetivo}</TableCell>
              {mostrarEvolucao && <TableCell className="max-w-80 text-muted-foreground" title={l.evolucao ?? ""}>{l.evolucao ?? "—"}</TableCell>}
              {podeEditar && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Ações do atendimento de ${l.data}`}><MoreHorizontal /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link href={`/atendimentos/${l.id}/editar`}><Pencil /> Editar</Link></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destrutivo onSelect={() => setExcluir(l)}><Trash2 /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmarExclusao
        aberto={excluir != null}
        aoMudar={(v) => !v && setExcluir(null)}
        pendente={pendente}
        titulo="Excluir atendimento?"
        descricao={excluir ? `Excluir o atendimento de ${nome} em ${excluir.data} (${excluir.periodo.toLowerCase()})? Isso não pode ser desfeito.` : ""}
        aoConfirmar={() =>
          excluir &&
          iniciar(async () => {
            await excluirAtendimentos([excluir.id]);
            setExcluir(null);
            toast.success("Atendimento excluído.");
            router.refresh();
          })
        }
      />
    </>
  );
}
