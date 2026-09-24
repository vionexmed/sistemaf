"use client";

import { Button } from "@/components/ui/button";
import { BannerErro } from "@/components/estados";

// Erro de carregamento: banner crítico com a causa e "Tentar de novo". Nunca tela em branco.
export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const semPermissao = error.message.includes("perfil não pode");
  return (
    <div className="mx-auto max-w-page">
      <BannerErro titulo={semPermissao ? "Seu perfil não tem acesso a esta ação." : "Não foi possível carregar esta tela."}>
        <p className="mt-1 text-sm">
          {semPermissao ? "Peça à Fisioterapia se precisar desta informação." : "Pode ser uma falha momentânea de conexão com o banco de dados."}
          {error.digest && <span className="block text-xs opacity-80">Código do erro: {error.digest}</span>}
        </p>
        {!semPermissao && (
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => retry()}>
            Tentar de novo
          </Button>
        )}
      </BannerErro>
    </div>
  );
}
