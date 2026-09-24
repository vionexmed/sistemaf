import type { Metadata } from "next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GrupoConfiguracao } from "@/components/configuracoes/nav";
import { CAMPEONATOS, TEMPORADA } from "@/lib/catalogos";
import { fmtData } from "@/lib/dominio/datas";

export const metadata: Metadata = { title: "Campeonatos · Configurações" };

export default function Campeonatos() {
  return (
    <div className="flex flex-col gap-6">
      <GrupoConfiguracao titulo="Temporada" descricao="A pré-temporada vai do início até a véspera do primeiro jogo oficial. Sugere o período da lesão.">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-muted-foreground">Início da temporada {TEMPORADA.ano}</dt><dd className="font-medium tabular">{fmtData(TEMPORADA.inicio)}</dd></div>
          <div><dt className="text-muted-foreground">Fim da pré-temporada</dt><dd className="font-medium tabular">{fmtData(TEMPORADA.fimPreTemporada)}</dd></div>
        </dl>
      </GrupoConfiguracao>
      <GrupoConfiguracao titulo="Campeonatos" descricao="As datas alimentam o filtro de campeonato do Painel, já que atendimento não tem campeonato. [confirmar datas de 2026 com o Thales]">
        <div className="-m-4 overflow-hidden rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="h-9"><TableHead>Campeonato</TableHead><TableHead>Início</TableHead><TableHead>Fim</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {CAMPEONATOS.map((c) => (
                <TableRow key={c.valor}>
                  <TableCell className="font-medium">{c.rotulo}</TableCell>
                  <TableCell className="tabular">{c.inicio ? fmtData(c.inicio) : "Sem datas (jogos avulsos)"}</TableCell>
                  <TableCell className="tabular">{c.fim ? fmtData(c.fim) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GrupoConfiguracao>
    </div>
  );
}
