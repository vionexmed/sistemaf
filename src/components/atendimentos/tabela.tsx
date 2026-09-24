"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, MoreHorizontal, Pencil, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  camisa: number;
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
  exportarHref,
}: {
  linhas: LinhaAtendimento[];
  podeEditar: boolean;
  mostrarData: boolean;
  exportarHref: string;
}) {
  const router = useRouter();
  const [selecionadas, setSelecionadas] = React.useState<Set<number>>(new Set());
  const [excluir, setExcluir] = React.useState<LinhaAtendimento[] | null>(null);
  const [pendente, iniciar] = React.useTransition();

  React.useEffect(() => {
    const ids = new Set(linhas.map((l) => l.id));
    setSelecionadas((s) => new Set([...s].filter((id) => ids.has(id))));
  }, [linhas]);

  const todas = linhas.length > 0 && selecionadas.size === linhas.length;
  const algumas = selecionadas.size > 0 && !todas;
  const alternar = (id: number) =>
    setSelecionadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const confirmarExclusao = () => {
    if (!excluir) return;
    iniciar(async () => {
      const { excluidos } = await excluirAtendimentos(excluir.map((l) => l.id));
      setExcluir(null);
      setSelecionadas(new Set());
      toast.success(excluidos === 1 ? "Atendimento excluído." : `${excluidos} atendimentos excluídos.`);
      router.refresh();
    });
  };

  return (
    <>
      {selecionadas.size > 0 && (
        <div className="flex h-11 items-center gap-2 border-b bg-selected px-3 text-sm">
          <span className="font-medium tabular">{selecionadas.size} selecionados</span>
          <Button variant="secondary" size="sm" asChild>
            <a href={`${exportarHref}${exportarHref.includes("?") ? "&" : "?"}ids=${[...selecionadas].join(",")}`}>
              <Download /> Exportar selecionados
            </a>
          </Button>
          {podeEditar && (
            <Button variant="destructive-ghost" size="sm" onClick={() => setExcluir(linhas.filter((l) => selecionadas.has(l.id)))}>
              <Trash2 /> Excluir
            </Button>
          )}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelecionadas(new Set())}>
            Cancelar seleção
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="h-9">
            <TableHead className="w-10">
              <Checkbox
                aria-label="Selecionar todos"
                checked={todas ? true : algumas ? "indeterminate" : false}
                onCheckedChange={() => setSelecionadas(todas ? new Set() : new Set(linhas.map((l) => l.id)))}
              />
            </TableHead>
            <TableHead numero className="w-12">Nº</TableHead>
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
              data-selecionada={selecionadas.has(l.id)}
              className="cursor-pointer hover:bg-hover"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button,a,[role=checkbox],[role=menu]")) return;
                router.push(`/jogadores/${l.atletaId}`);
              }}
            >
              <TableCell>
                <Checkbox aria-label={`Selecionar ${l.nome}`} checked={selecionadas.has(l.id)} onCheckedChange={() => alternar(l.id)} />
              </TableCell>
              <TableCell numero className="text-muted-foreground">{l.camisa}</TableCell>
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
                        <DropdownMenuItem destrutivo onSelect={() => setExcluir([l])}>
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
        titulo={excluir?.length === 1 ? "Excluir atendimento?" : `Excluir ${excluir?.length} atendimentos?`}
        descricao={
          excluir?.length === 1
            ? `Excluir o atendimento de ${excluir[0].nome} em ${excluir[0].data} (${excluir[0].periodo.toLowerCase()})? Isso não pode ser desfeito.`
            : `Os ${excluir?.length} atendimentos selecionados serão excluídos e saem da ficha e do Painel. Isso não pode ser desfeito.`
        }
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
