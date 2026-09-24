import type { Metadata } from "next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GrupoConfiguracao } from "@/components/configuracoes/nav";
import { PERFIS, rotulo } from "@/lib/catalogos";
import { listarUsuarios } from "@/lib/consultas";

export const metadata: Metadata = { title: "Usuários · Configurações" };

const O_QUE_FAZ: Record<string, string> = {
  fisioterapia: "Tudo: cadastra, registra, edita e configura",
  medico: "Vê tudo, inclusive laudos e exames. Não edita",
  comissao: "Vê status, painel, fichas e relatórios. Sem documentos nem dados de saúde",
};

export default async function Usuarios() {
  const usuarios = await listarUsuarios();
  return (
    <GrupoConfiguracao titulo="Usuários e perfis" descricao="Login e convite de usuários ainda não existem [a definir]. Enquanto isso, o menu do usuário tem “Trocar perfil (demonstração)”.">
      <div className="-m-4 overflow-hidden rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="h-9"><TableHead>Usuário</TableHead><TableHead>Perfil</TableHead><TableHead>O que pode fazer</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell>{rotulo(PERFIS, u.perfil)}</TableCell>
                <TableCell className="max-w-96 text-muted-foreground" title={O_QUE_FAZ[u.perfil]}>{O_QUE_FAZ[u.perfil]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GrupoConfiguracao>
  );
}
