"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { OpcaoAtleta } from "@/components/seletor-atleta";

/** Pula de ficha sem voltar à lista, mantendo a aba. */
export function TrocarJogador({ atletas, atual, aba }: { atletas: OpcaoAtleta[]; atual: number; aba: string }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button variant="secondary"><ArrowLeftRight /> Trocar jogador</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <Command filter={(v, b) => (v.toLowerCase().includes(b.toLowerCase().trim()) ? 1 : 0)}>
          <CommandInput placeholder="Nome ou número" autoFocus />
          <CommandList>
            <CommandEmpty>Nenhum jogador.</CommandEmpty>
            <CommandGroup>
              {atletas.filter((a) => a.id !== atual).map((a) => (
                <CommandItem key={a.id} value={`${a.camisa} ${a.nome} ${a.apelido}`} onSelect={() => { setAberto(false); router.push(`/jogadores/${a.id}${aba !== "geral" ? `?aba=${aba}` : ""}`); }}>
                  <span className="w-6 text-right text-sm text-muted-foreground tabular">{a.camisa}</span>
                  <Avatar nome={a.nome} foto={a.foto} tamanho={24} />
                  <span className="truncate">{a.nome}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
