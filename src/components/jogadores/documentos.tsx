"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, FileText, Folder, MoreHorizontal, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Opcoes } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmarExclusao } from "@/components/ui/alert-dialog";
import { TIPOS_DOCUMENTO } from "@/lib/catalogos";
import { enviarDocumento, excluirDocumento, type EstadoEnvio } from "@/lib/acoes/arquivos";

export type LinhaDocumento = { id: number; nome: string; tipo: string; href: string; enviadoPor: string; quando: string; tamanho: string };

export function Documentos({ atletaId, documentos, podeEditar }: { atletaId: number; documentos: LinhaDocumento[]; podeEditar: boolean }) {
  const router = useRouter();
  const [pasta, setPasta] = React.useState<string | null>(null);
  const [tipoEnvio, setTipoEnvio] = React.useState<string>("exame_imagem");
  const [arrastando, setArrastando] = React.useState(false);
  const [excluir, setExcluir] = React.useState<LinhaDocumento | null>(null);
  const [pendenteExcluir, iniciar] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [, acao, enviando] = React.useActionState<EstadoEnvio, FormData>(async (anterior, form) => {
    const r = await enviarDocumento(anterior, form);
    if (r.ok) {
      toast.success("Arquivo enviado para a pasta do jogador.");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } else if (r.erro) toast.error(r.erro);
    return r;
  }, {});

  const lista = pasta ? documentos.filter((d) => d.tipo === pasta) : documentos;
  const rotuloTipo = (t: string) => TIPOS_DOCUMENTO.find((x) => x.valor === t)?.rotulo ?? t;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {TIPOS_DOCUMENTO.map((t) => {
          const n = documentos.filter((d) => d.tipo === t.valor).length;
          const ativo = pasta === t.valor;
          return (
            <button
              key={t.valor}
              type="button"
              onClick={() => setPasta(ativo ? null : t.valor)}
              aria-pressed={ativo}
              className={cn("flex items-center gap-3 rounded-lg bg-surface p-4 text-left shadow-card hover:bg-subtle", ativo && "shadow-[0_0_0_1.5px_var(--gray-12)]")}
            >
              <Folder className="size-5 text-muted-foreground" strokeWidth={1.75} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{t.rotulo}</span>
                <span className="block text-xs text-muted-foreground tabular">{n === 1 ? "1 arquivo" : `${n} arquivos`}</span>
              </span>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <CardHeader titulo={pasta ? rotuloTipo(pasta) : "Todos os arquivos"} descricao={pasta ? "Clique na pasta de novo para ver todos." : undefined} className="pb-4" />
        {lista.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t px-4 py-12 text-center">
            <FileText className="size-6 text-muted-foreground" strokeWidth={1.75} />
            <p className="text-muted-foreground">{pasta ? "Nenhum arquivo nesta pasta." : "Nenhum documento enviado ainda."}</p>
          </div>
        ) : (
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Pasta</TableHead>
                  <TableHead>Enviado por</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead numero>Tamanho</TableHead>
                  <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <a href={d.href} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-medium hover:underline">
                        <FileText className="size-4 text-muted-foreground" /> <span className="truncate">{d.nome}</span>
                      </a>
                    </TableCell>
                    <TableCell>{rotuloTipo(d.tipo)}</TableCell>
                    <TableCell className="text-muted-foreground">{d.enviadoPor}</TableCell>
                    <TableCell className="text-muted-foreground">{d.quando}</TableCell>
                    <TableCell numero className="text-muted-foreground">{d.tamanho}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${d.nome}`}><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><a href={d.href} target="_blank" rel="noreferrer"><ExternalLink /> Abrir</a></DropdownMenuItem>
                          {podeEditar && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem destrutivo onSelect={() => setExcluir(d)}><Trash2 /> Excluir</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {podeEditar && (
        <Card>
          <CardHeader titulo="Enviar arquivo" descricao="PDF ou imagem, até 15 MB. Vai para a pasta escolhida." />
          <CardContent>
            <form ref={formRef} action={acao} className="flex flex-col gap-4">
              <input type="hidden" name="atletaId" value={atletaId} />
              <Opcoes nome="tipo" rotuloAcessivel="Pasta" opcoes={TIPOS_DOCUMENTO} valor={tipoEnvio} aoMudar={setTipoEnvio} />
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastando(true);
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastando(false);
                  if (inputRef.current && e.dataTransfer.files.length) {
                    inputRef.current.files = e.dataTransfer.files;
                    formRef.current?.requestSubmit();
                  }
                }}
                className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input px-4 py-8 text-center hover:bg-hover", arrastando && "border-[var(--blue-8)] bg-info-3")}
              >
                <Upload className="size-6 text-muted-foreground" strokeWidth={1.75} />
                <span className="font-medium">{enviando ? "Enviando…" : "Arraste o arquivo aqui ou clique para escolher"}</span>
                <span className="text-xs text-muted-foreground">Pasta: {rotuloTipo(tipoEnvio)}</span>
                <input ref={inputRef} type="file" name="arquivo" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={() => formRef.current?.requestSubmit()} />
              </label>
            </form>
          </CardContent>
        </Card>
      )}

      <ConfirmarExclusao
        aberto={excluir != null}
        aoMudar={(v) => !v && setExcluir(null)}
        pendente={pendenteExcluir}
        titulo="Excluir documento?"
        descricao={excluir ? `Excluir “${excluir.nome}” da pasta ${rotuloTipo(excluir.tipo)}? Isso não pode ser desfeito.` : ""}
        aoConfirmar={() =>
          excluir &&
          iniciar(async () => {
            await excluirDocumento(excluir.id);
            setExcluir(null);
            toast.success("Documento excluído.");
            router.refresh();
          })
        }
      />
    </div>
  );
}
