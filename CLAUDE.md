@AGENTS.md

# Play da Tarde — guia do projeto

## Documentação (ler antes de mudar algo)
Índice: `docs/README.md`.
- `docs/SPEC.md` — regras de negócio e schema (**fonte da verdade**).
- `docs/DECISOES.md` — por que cada regra/escolha foi feita (ADR, DEC-xxx). Não contrarie uma decisão vigente sem registrar uma nova.
- `docs/ARQUITETURA.md` — mapa do código, fluxos e checklist de mudança.
- `docs/PLANO.md` — status das etapas e backlog. Implemente só o que foi pedido.
- `docs/CHANGELOG.md` — histórico de entregas.

**Toda mudança termina com:** SPEC atualizada (se regra mudou) · nova DEC em `DECISOES.md` (se houve decisão) · entrada no topo do `CHANGELOG.md` · status no `PLANO.md`.

## Geral
- Idioma: UI e comunicação com o usuário em **português (pt-BR)**, passo a passo; código segue os nomes do schema da SPEC.
- Stack: Next.js 16 (App Router, `src/`), TypeScript, Tailwind v4, lucide-react, Firebase client SDK, Vitest.
- Windows: rodar `npm.cmd`/`npx.cmd` no PowerShell se `npm` não for reconhecido. Não editar arquivos com `Get-Content`/`Set-Content` do PowerShell 5.1 (corrompe acentos UTF-8).

## Convenções
- Mobile-first: alvos de toque ≥ 44px (`min-h-11`), sem rolagem lateral em 375px, conteúdo em `max-w-3xl`, bottom bar fixa.
- Listas longas: `Acordeao` (um aberto por vez, todos fechados ao entrar).
- Camadas: coluna fixa de tabela `z-[1]` < header/bottom bar `z-30` < `JogadorPicker` `z-40` < `Modal` `z-50`.
- Cor principal: `emerald-700`; fundo `slate-50`. Páginas usam `PageHeader`.
- Tema escuro (DEC-028) troca a paleta em `globals.css`: use só cores da paleta — `bg-superficie` para cards/listas/modais (nunca `bg-white`), `bg-marca`/`hover:bg-marca-escura` para fundo verde com texto branco; nada de hex nem `dark:`. Tom novo de cor → mapear em `[data-theme="escuro"]`.
- Regras de cálculo ficam em `src/lib/engine/` como funções puras com testes Vitest — nunca dentro de componentes.
- Leituras via listeners em tempo real (`useCollection`, `useEtapaDados`, `useRank`). Escritas **só** em `src/lib/repo.ts`, com `writeBatch` e IDs determinísticos.
- Escrita só para admin; a proteção real está em `firestore.rules`.

## Verificação antes de entregar
`npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.
