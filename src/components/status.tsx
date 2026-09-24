import { Badge } from "@/components/ui/badge";
import { ROTULO_STATUS, type StatusAtleta } from "@/lib/dominio/status";

// Status sempre igual em todo o sistema: badge com ponto, mesmas 4 cores.
const TOM: Record<StatusAtleta, "erro" | "info" | "aviso" | "neutro"> = {
  afastado: "erro",
  em_tratamento: "info",
  queixa_pos_treino: "aviso",
  liberado: "neutro",
};

export function StatusBadge({ status }: { status: string }) {
  const s = (status in TOM ? status : "liberado") as StatusAtleta;
  return (
    <Badge tom={TOM[s]} ponto>
      {ROTULO_STATUS[s]}
    </Badge>
  );
}
