"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ImagePlus, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Campo } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { Opcoes } from "@/components/ui/toggle-group";
import { ConfirmarExclusao } from "@/components/ui/alert-dialog";
import { BannerErro } from "@/components/estados";
import { StatusBadge } from "@/components/status";
import { PES, POSICOES, rotulo } from "@/lib/catalogos";
import { alterarAtivo, salvarJogador, type EstadoJogador } from "@/lib/acoes/jogadores";

export type ValoresJogador = {
  id?: number;
  nome: string;
  apelido: string;
  nascimento: string;
  camisa: string;
  posicao: string | null;
  alturaCm: string;
  pesoKg: string;
  pe: string | null;
  alergias: string;
  lesoesAnteriores: string;
  foto: string | null;
  ativo?: boolean;
};

const ETAPAS = [
  { titulo: "Quem é", campos: ["nome", "apelido", "nascimento", "foto"] },
  { titulo: "No time", campos: ["camisa", "posicao", "alturaCm", "pesoKg", "pe"] },
  { titulo: "Saúde", campos: ["alergias", "lesoesAnteriores", "exames"] },
] as const;

function errosDaEtapa(v: ValoresJogador, etapa: number): Record<string, string> {
  const e: Record<string, string> = {};
  if (etapa === 0) {
    if (v.nome.trim().length < 3) e.nome = "Informe o nome completo";
    if (!v.apelido.trim()) e.apelido = "Informe o nome na camisa";
    if (!v.nascimento) e.nascimento = "Informe a data de nascimento";
  }
  if (etapa === 1) {
    const n = Number(v.camisa);
    if (!v.camisa || !Number.isInteger(n) || n < 1 || n > 99) e.camisa = "Use um número de 1 a 99";
    if (!v.posicao) e.posicao = "Escolha a posição";
    if (!v.pe) e.pe = "Escolha o pé dominante";
  }
  return e;
}

export function FormularioJogador({ inicial }: { inicial: ValoresJogador }) {
  const router = useRouter();
  const editando = inicial.id != null;
  const [v, setV] = React.useState(inicial);
  const [etapa, setEtapa] = React.useState(0);
  const [errosLocais, setErrosLocais] = React.useState<Record<string, string>>({});
  const [previa, setPrevia] = React.useState<string | null>(inicial.foto);
  const [exames, setExames] = React.useState<string[]>([]);
  const [confirmarSaida, setConfirmarSaida] = React.useState(false);
  const salvo = React.useRef(false);
  const [estado, acao, pendente] = React.useActionState<EstadoJogador, FormData>(async (anterior, form) => {
    const r = await salvarJogador(anterior, form);
    if (r.ok) {
      salvo.current = true;
      toast.success(editando ? "Cadastro atualizado." : `${r.apelido} foi adicionado. Ele já aparece na lista de jogadores.`);
      router.push(`/jogadores/${r.id}`);
      return r;
    }
    const campos = Object.keys(r.erros ?? {});
    const primeira = ETAPAS.findIndex((e) => e.campos.some((c) => (campos as string[]).includes(c)));
    if (primeira >= 0) setEtapa(primeira);
    return r;
  }, {});
  const alterado = JSON.stringify(v) !== JSON.stringify(inicial) || previa !== inicial.foto || exames.length > 0;

  // Alterações não salvas: confirmar ao sair da página.
  React.useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (alterado && !salvo.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [alterado]);

  const set = <K extends keyof ValoresJogador>(k: K, valor: ValoresJogador[K]) => {
    setV((a) => ({ ...a, [k]: valor }));
    setErrosLocais((e) => Object.fromEntries(Object.entries(e).filter(([c]) => c !== k)));
  };
  const erros: Record<string, string | undefined> = { ...(estado.erros ?? {}), ...errosLocais };

  const continuar = () => {
    const e = errosDaEtapa(v, etapa);
    setErrosLocais(e);
    if (Object.keys(e).length === 0) setEtapa((x) => x + 1);
  };
  const aoEnviar = (e: React.FormEvent) => {
    const todos = { ...errosDaEtapa(v, 0), ...errosDaEtapa(v, 1) };
    if (Object.keys(todos).length > 0) {
      e.preventDefault();
      setErrosLocais(todos);
      setEtapa(errosDaEtapa(v, 0) && Object.keys(errosDaEtapa(v, 0)).length ? 0 : 1);
    }
  };
  const ultimaEtapa = etapa === ETAPAS.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form action={acao} onSubmit={aoEnviar} className="flex flex-col gap-4 lg:col-span-2">
        {v.id && <input type="hidden" name="id" value={v.id} />}
        <ol className="flex gap-2" aria-label="Etapas">
          {ETAPAS.map((e, i) => (
            <li key={e.titulo} className="flex flex-1 flex-col gap-2">
              <span className={cn("h-1 rounded-full", i <= etapa ? "bg-primary" : "bg-hover")} />
              <button
                type="button"
                disabled={!editando && i > etapa}
                onClick={() => setEtapa(i)}
                className={cn("flex items-center gap-1 text-left text-sm", i === etapa ? "font-medium" : "text-muted-foreground")}
                aria-current={i === etapa ? "step" : undefined}
              >
                {i < etapa && <Check className="size-3" />} {i + 1}. {e.titulo}
                {i === 2 && <span className="font-normal text-muted-foreground"> (opcional)</span>}
              </button>
            </li>
          ))}
        </ol>

        {erros.geral && <BannerErro titulo={erros.geral} />}

        <Card className={cn(etapa !== 0 && "hidden")}>
          <CardHeader titulo="Quem é" />
          <CardContent className="flex flex-col gap-4">
            <Campo rotulo="Foto" opcional erro={erros.foto} ajuda="Quadrada, fundo simples. JPG, PNG ou WEBP.">
              <label className="flex w-fit cursor-pointer items-center gap-4">
                <Avatar nome={v.nome || "?"} foto={previa} tamanho={64} />
                <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-surface px-4 font-medium hover:bg-hover">
                  <ImagePlus className="size-4" /> {previa ? "Trocar foto" : "Enviar foto"}
                </span>
                <input
                  type="file"
                  name="foto"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setPrevia(f ? URL.createObjectURL(f) : inicial.foto);
                  }}
                />
              </label>
            </Campo>
            <Campo rotulo="Nome completo" htmlFor="nome" erro={erros.nome}>
              <Input id="nome" name="nome" value={v.nome} onChange={(e) => set("nome", e.target.value)} className="max-w-md" autoComplete="off" aria-invalid={!!erros.nome} />
            </Campo>
            <Campo rotulo="Nome na camisa" htmlFor="apelido" erro={erros.apelido} ajuda="Aparece nos botões e atalhos, ex.: “Registrar atendimento do Rafael”.">
              <Input id="apelido" name="apelido" value={v.apelido} onChange={(e) => set("apelido", e.target.value)} className="max-w-60" maxLength={30} aria-invalid={!!erros.apelido} />
            </Campo>
            <Campo rotulo="Data de nascimento" htmlFor="nascimento" erro={erros.nascimento}>
              <Input id="nascimento" name="nascimento" type="date" value={v.nascimento} onChange={(e) => set("nascimento", e.target.value)} className="w-44" aria-invalid={!!erros.nascimento} />
            </Campo>
          </CardContent>
        </Card>

        <Card className={cn(etapa !== 1 && "hidden")}>
          <CardHeader titulo="No time" />
          <CardContent className="flex flex-col gap-4">
            <Campo rotulo="Número da camisa" htmlFor="camisa" erro={erros.camisa}>
              <Input id="camisa" name="camisa" type="number" inputMode="numeric" min={1} max={99} value={v.camisa} onChange={(e) => set("camisa", e.target.value)} className="w-24 text-right tabular" aria-invalid={!!erros.camisa} />
            </Campo>
            <Campo rotulo="Posição" erro={erros.posicao}>
              <Opcoes nome="posicao" rotuloAcessivel="Posição" opcoes={POSICOES} valor={v.posicao} aoMudar={(x) => set("posicao", x)} invalido={!!erros.posicao} />
            </Campo>
            <div className="flex flex-wrap gap-4">
              <Campo rotulo="Altura (cm)" htmlFor="alturaCm" opcional erro={erros.alturaCm}>
                <Input id="alturaCm" name="alturaCm" inputMode="numeric" value={v.alturaCm} onChange={(e) => set("alturaCm", e.target.value)} placeholder="182" className="w-24 text-right tabular" aria-invalid={!!erros.alturaCm} />
              </Campo>
              <Campo rotulo="Peso (kg)" htmlFor="pesoKg" opcional erro={erros.pesoKg}>
                <Input id="pesoKg" name="pesoKg" inputMode="decimal" value={v.pesoKg} onChange={(e) => set("pesoKg", e.target.value)} placeholder="78,5" className="w-24 text-right tabular" aria-invalid={!!erros.pesoKg} />
              </Campo>
            </div>
            <Campo rotulo="Pé dominante" erro={erros.pe}>
              <Opcoes nome="pe" rotuloAcessivel="Pé dominante" opcoes={PES} valor={v.pe} aoMudar={(x) => set("pe", x)} invalido={!!erros.pe} />
            </Campo>
          </CardContent>
        </Card>

        <Card className={cn(etapa !== 2 && "hidden")}>
          <CardHeader titulo="Saúde" descricao="Opcional. Só a Fisioterapia e o Médico veem estes dados." />
          <CardContent className="flex flex-col gap-4">
            <Campo rotulo="Alergias ou medicamentos de uso contínuo" htmlFor="alergias" opcional erro={erros.alergias}>
              <Textarea id="alergias" name="alergias" value={v.alergias} onChange={(e) => set("alergias", e.target.value)} maxLength={1000} />
            </Campo>
            <Campo rotulo="Lesões anteriores" htmlFor="lesoesAnteriores" opcional erro={erros.lesoesAnteriores} ajuda="Antes de chegar ao clube. As lesões no clube são registradas em Lesões.">
              <Textarea id="lesoesAnteriores" name="lesoesAnteriores" value={v.lesoesAnteriores} onChange={(e) => set("lesoesAnteriores", e.target.value)} maxLength={2000} />
            </Campo>
            <Campo rotulo="Exames admissionais" opcional erro={erros.exames} ajuda="PDF ou imagem. Vão direto para a pasta Avaliações do jogador.">
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-input bg-surface px-4 py-2 font-medium hover:bg-hover">
                <Paperclip className="size-4" /> Anexar exames
                <input type="file" name="exames" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setExames([...(e.target.files ?? [])].map((f) => f.name))} />
              </label>
              {exames.length > 0 && <p className="text-sm text-muted-foreground">{exames.join(", ")}</p>}
            </Campo>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t bg-background px-4 py-3 md:-mx-6 md:px-6">
          {editando && <AtivoNoElenco id={v.id!} nome={v.nome} ativo={v.ativo ?? true} />}
          {alterado && <span className="text-sm text-muted-foreground">Alterações não salvas</span>}
          <div className="ml-auto flex items-center gap-2">
            {etapa === 0 ? (
              <Button key="cancelar" type="button" variant="ghost" onClick={() => (alterado ? setConfirmarSaida(true) : router.push(editando ? `/jogadores/${v.id}` : "/jogadores"))}>Cancelar</Button>
            ) : (
              <Button key="voltar" type="button" variant="secondary" onClick={() => setEtapa((x) => x - 1)}>Voltar</Button>
            )}
            {editando && !ultimaEtapa && <Button type="submit" variant="secondary" disabled={pendente}>Salvar</Button>}
            {/* keys diferentes: sem elas o React reaproveita o botão, que vira "submit" no meio do clique e envia o formulário */}
            {ultimaEtapa ? (
              <Button key="salvar" type="submit" disabled={pendente}>{pendente ? "Salvando…" : editando ? "Salvar alterações" : "Salvar jogador"}</Button>
            ) : (
              <Button key="continuar" type="button" onClick={continuar}>Continuar</Button>
            )}
          </div>
        </div>
      </form>

      <aside>
        <Card>
          <CardHeader titulo="Prévia na lista" descricao="Atualiza enquanto você digita." />
          <CardContent>
            <div className="flex items-center gap-3 rounded-md border px-3 py-2">
              <span className="w-6 text-right text-sm text-muted-foreground tabular">{v.camisa || "–"}</span>
              <Avatar nome={v.nome || "?"} foto={previa} tamanho={32} />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate font-medium">{v.nome || "Nome do jogador"}</span>
                <span className="block truncate text-xs text-muted-foreground">{[v.apelido, v.posicao && rotulo(POSICOES, v.posicao)].filter(Boolean).join(" · ") || "Posição"}</span>
              </span>
              <StatusBadge status="liberado" />
            </div>
          </CardContent>
        </Card>
      </aside>

      <ConfirmarExclusao
        aberto={confirmarSaida}
        aoMudar={setConfirmarSaida}
        titulo="Descartar alterações?"
        descricao="O que você preencheu neste cadastro vai ser perdido."
        rotuloConfirmar="Descartar"
        aoConfirmar={() => {
          salvo.current = true;
          router.push(editando ? `/jogadores/${v.id}` : "/jogadores");
        }}
      />
    </div>
  );
}

function AtivoNoElenco({ id, nome, ativo }: { id: number; nome: string; ativo: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [pendente, iniciar] = React.useTransition();
  const trocar = () =>
    iniciar(async () => {
      const r = await alterarAtivo(id, !ativo);
      setAberto(false);
      if (r.erro) toast.error(r.erro);
      else {
        toast.success(ativo ? `${nome} saiu do elenco. O histórico continua na ficha.` : `${nome} voltou ao elenco.`);
        router.push(`/jogadores/${id}`);
      }
    });
  return (
    <>
      <Button type="button" variant={ativo ? "destructive-ghost" : "secondary"} onClick={() => (ativo ? setAberto(true) : trocar())} disabled={pendente}>
        {ativo ? "Tirar do elenco" : "Voltar ao elenco"}
      </Button>
      <ConfirmarExclusao
        aberto={aberto}
        aoMudar={setAberto}
        pendente={pendente}
        titulo={`Tirar ${nome} do elenco?`}
        descricao="Ele some da lista de jogadores e dos totais do elenco. Atendimentos, lesões e documentos continuam guardados, e você pode trazê-lo de volta depois."
        rotuloConfirmar="Tirar do elenco"
        aoConfirmar={trocar}
      />
    </>
  );
}
