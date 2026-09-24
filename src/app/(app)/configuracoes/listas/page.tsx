import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { GrupoConfiguracao } from "@/components/configuracoes/nav";
import { HD, OBJETIVOS, REGIOES, STATUS_ATENDIMENTO, TIPOS_LESAO } from "@/lib/catalogos";

export const metadata: Metadata = { title: "Listas · Configurações" };

const GRUPOS = [
  { titulo: "HD", descricao: "Hipótese diagnóstica do atendimento.", itens: HD },
  { titulo: "Locais e regiões", descricao: "Uma lista só para o local da queixa e a região da lesão, para as duas somarem no mapa de queixas.", itens: REGIOES },
  { titulo: "Objetivos do trabalho", descricao: "O que foi trabalhado no atendimento.", itens: OBJETIVOS },
  { titulo: "Status do atendimento", descricao: "Define o status do atleta junto com as lesões.", itens: STATUS_ATENDIMENTO },
  { titulo: "Tipos de lesão", descricao: "Usados no Índice de lesões.", itens: TIPOS_LESAO },
];

export default function Listas() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        As listas vêm da planilha. Por enquanto só leitura: para incluir uma opção, peça a mudança (arquivo <code>src/lib/catalogos.ts</code>). Opções nunca são apagadas, para não perder o histórico.
      </p>
      {GRUPOS.map((g) => (
        <GrupoConfiguracao key={g.titulo} titulo={g.titulo} descricao={g.descricao}>
          <div className="flex flex-wrap gap-2">
            {g.itens.map((i) => <Badge key={i.valor}>{i.rotulo}</Badge>)}
          </div>
        </GrupoConfiguracao>
      ))}
    </div>
  );
}
