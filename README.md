# Fisioterapia · EC Santo André

Sistema do departamento de saúde para registrar e acompanhar a fisioterapia de cada jogador. Substitui as planilhas de atendimentos diários e de lesões e o Power BI.

```bash
npm install
npm run dev   # http://localhost:3000
```

Na primeira execução o sistema cria um banco local (`.data/`) com jogadores e atendimentos fictícios. `npm run db:reset` apaga e recomeça. Para testar os perfis, use "Trocar perfil (demonstração)" no menu do usuário.

- Especificação, arquitetura, regras e decisões: [`CLAUDE.md`](CLAUDE.md)
- Design: [`docs/design.md`](docs/design.md)
