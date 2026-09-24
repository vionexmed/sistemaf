"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export type OpcaoAtleta = { id: number; nome: string; apelido: string; camisa: number | null; posicao: string; foto: string | null };

/** Escolha do atleta com busca por nome ou apelido (a camisa também acha, quando existe). */
export function SeletorAtleta({
  id,
  atletas,
  valor,
  aoMudar,
  invalido,
  autoAbrir,
}: {
  id?: string;
  atletas: OpcaoAtleta[];
  valor: number | null;
  aoMudar: (id: number) => void;
  invalido?: boolean;
  autoAbrir?: boolean;
}) {
  const [aberto, setAberto] = React.useState(!!autoAbrir);
  const atual = atletas.find((a) => a.id === valor);
  const idLista = React.useId();
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-invalid={invalido || undefined}
          className={cn(
            "flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-input bg-surface px-3 text-left text-base hover:bg-hover",
            invalido && "border-erro-9",
          )}
        >
          {atual ? (
            <>
              <Avatar nome={atual.nome} foto={atual.foto} tamanho={24} />
              <span className="truncate font-medium">{atual.nome}</span>
              {atual.camisa != null && <span className="text-sm text-muted-foreground tabular">#{atual.camisa}</span>}
            </>
          ) : (
            <span className="text-muted-foreground">Escolha o atleta</span>
          )}
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent id={idLista} className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0">
        <Command filter={(v, busca) => (v.toLowerCase().includes(busca.toLowerCase().trim()) ? 1 : 0)}>
          <CommandInput placeholder="Buscar atleta" />
          <CommandList>
            <CommandEmpty>Nenhum atleta encontrado.</CommandEmpty>
            <CommandGroup>
              {atletas.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.nome} ${a.apelido} ${a.camisa ?? ""}`}
                  onSelect={() => {
                    aoMudar(a.id);
                    setAberto(false);
                  }}
                >
                  <Avatar nome={a.nome} foto={a.foto} tamanho={24} />
                  <span className="truncate">{a.nome}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{a.posicao}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
