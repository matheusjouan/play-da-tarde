@AGENTS.md

# Play da Tarde — guia do projeto

- Regras de negócio: `docs/SPEC.md` (fonte da verdade). Plano e status das etapas: `docs/PLANO.md`. Implemente só a etapa pedida.
- Idioma: UI e comunicação com o usuário em **português (pt-BR)**; código (nomes de variáveis/funções) pode seguir os nomes do schema da SPEC.
- Stack: Next.js 16 (App Router, `src/`), TypeScript, Tailwind v4, lucide-react, Firebase client SDK, Vitest.
- Windows: rodar `npm.cmd`/`npx.cmd` no PowerShell se `npm` não for reconhecido.

## Convenções
- Mobile-first: alvos de toque ≥ 44px (`min-h-11`), conteúdo em `max-w-3xl`, bottom bar fixa (`src/components/BottomNav.tsx`).
- Cor principal: `emerald-700`; fundo `slate-50`.
- Páginas usam `PageHeader` (`src/components/PageHeader.tsx`).
- Lógica de cálculo (classificação, desempate, chave, pontos) fica em `src/lib/engine/` como funções puras com testes Vitest — nunca dentro de componentes.
- Dados do Firestore via listeners em tempo real (`onSnapshot`).
- Escrita só para admin; a proteção real está em `firestore.rules`.

## Verificação antes de entregar uma etapa
`npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.
