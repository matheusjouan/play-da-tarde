# Arquitetura — Play da Tarde

Guia para **manter e evoluir** o sistema: onde fica cada coisa e como os dados fluem.
Regras: [`SPEC.md`](SPEC.md) · Porquês: [`DECISOES.md`](DECISOES.md).

---

## 1. Visão geral

```
Navegador (celular)
  │  Next.js 16 (páginas "use client")
  │    ├── lê em tempo real ──► Firestore (onSnapshot)      useCollection / useEtapaDados / useRank
  │    ├── calcula ───────────► src/lib/engine/*  (funções puras, testadas)
  │    └── grava (só admin) ──► src/lib/repo.ts ──► Firestore (writeBatch)
  │                                                   ▲
  │                                     firestore.rules: escrita só admin
  └── login Google ──► Firebase Auth
Hospedagem: Vercel (deploy a cada push na main)
```

- **Não há servidor próprio nem cálculo salvo** durante a etapa: classificação, chaves e pontos são recalculados no navegador a partir das partidas. O único "snapshot" é a pontuação gravada ao **Finalizar etapa** (DEC-017).

---

## 2. Pastas e arquivos

### `src/app/` — páginas (rotas)
| Rota | Arquivo | Conteúdo |
|---|---|---|
| `/` | `page.tsx` | Redireciona para `/recentes` |
| `/recentes` | `recentes/page.tsx` | 5 últimos placares (`atualizado_em` desc) |
| `/grupos` | `grupos/page.tsx` | Acordeão de grupos, placar, desempate |
| `/geral` | `geral/page.tsx` | Classificação geral e destino |
| `/chaves` | `chaves/page.tsx` | Ouro/Prata (ou `FinalsChave` se a etapa for Finals) |
| `/rank` | `rank/page.tsx` | Rank da temporada, card da Finals, desempate |
| `/regulamentos` | `regulamentos/page.tsx` | Links por etapa |
| `/admin/**` | `admin/layout.tsx` | Tudo em `/admin` passa pelo `AdminGuard` |
| `/admin/jogadores` | | Cadastro de jogadores |
| `/admin/etapas`, `/nova`, `/[id]` | | Lista (por temporada), criar, editar |
| `/admin/etapas/[id]/grupos` | | Montar grupos, adicionar, remover, **substituir** |
| `/admin/etapas/[id]/pontuacao` | | Prévia de pontos e **Finalizar etapa** |
| `/admin/regulamentos` | | Links de regulamento |
| `/admin/importar` | | Importação CSV de etapa passada |
| (layout) | `layout.tsx` | Script do tema no `<head>`, header, `AuthProvider`, `EtapaSelecionadaProvider`, `BottomNav` |
| (estilos) | `globals.css` | Cores semânticas (`superficie`, `marca`) e a paleta do tema escuro (`[data-theme="escuro"]`) |

### `src/components/` — interface
| Arquivo | Papel |
|---|---|
| `ui.tsx` | Classes e peças básicas (botões 44px, `Card`, `Field`, `Alerta`, `Vazio`, `Carregando`) |
| `Acordeao.tsx` | Acordeão controlado (um aberto por vez) + `alternar()` |
| `Modal.tsx` | Bottom sheet (celular) / janela (desktop) |
| `AuthProvider.tsx`, `AuthButton.tsx`, `AdminGuard.tsx` | Login, selo Admin, bloqueio de telas de admin |
| `EtapaSelect.tsx` | Etapa selecionada compartilhada entre abas + seletor por temporada |
| `EtapaForm.tsx` | Formulário de etapa (temporada, tipo, vagas, tabelas de pontos) |
| `JogadorPicker.tsx` | Escolha de jogadores em tela cheia (múltipla ou única) |
| `grupos/*` | `GrupoCard`, `TabelaClassificacao`, `ListaJogos`, `PlacarModal`, `DesempateModal` (reusado para seeds e Rank) |
| `chaves/*` | `ChaveView` (abas de fase), `JogoCard`, `FinalsChave`, `FinalsCard` |
| `recentes/RecenteCard.tsx` | Card de placar recente (título, vencedor em verde, data) |
| `BottomNav.tsx`, `PageHeader.tsx`, `Voltar.tsx` | Navegação |
| `TemaButton.tsx` | Alterna tema claro/escuro no cabeçalho (lógica em `lib/tema.ts`) |

### `src/lib/` — dados e regras
| Arquivo | Papel |
|---|---|
| `firebase.ts` | Conexão; `isAdminEmail` (só UI) |
| `types.ts` | Tipos do schema + `temporadaDe()` |
| `useCollection.ts` | Leitura em tempo real com filtro/ordem (asc/desc) e limite |
| `useEtapaDados.ts` | Jogadores + grupos + partidas de uma etapa, com a classificação de cada grupo já calculada |
| `useRank.ts` | Rank de uma temporada (+ Finals da temporada, empate no corte) |
| `repo.ts` | **Todas as escritas** (lotes, IDs determinísticos) |
| `defaults.ts` | Tabelas de pontos padrão, nomes das fases |
| `etapas.ts` | Ordenação/agrupamento por temporada, número único por temporada |
| `tema.ts` | Tema salvo no `localStorage`, aplicar/salvar, script anti-"piscar" |
| `nomes.ts`, `formato.ts` | Normalização de nomes; `+4`/`−3`, placar em texto, data `dd/mm/aaaa`, rótulo do jogo ("Grupo H", "Ouro · Quartas") |

### `src/lib/engine/` — motor de regras (puro, sem Firebase/React)
| Arquivo | Regra (SPEC) |
|---|---|
| `placar.ts` | Sets válidos, super tie-break, W.O. (3.3, 3.4) |
| `classificacao.ts` | Estatísticas, +2 do STB, desempate de grupo, empate total (3.3, 3.5) |
| `confrontos.ts` | Todos contra todos (método do círculo), plano de substituição (3.6) |
| `geral.ts` | Classificação geral, destino Ouro/Prata/eliminado, empate no corte (3.2) |
| `chave.ts` | Seeds, soma 17, byes, próximo jogo (3.7) |
| `pontos.ts` | Fase alcançada, pontos por etapa (3.8) |
| `rank.ts` | Soma da temporada, posição compartilhada, desempate manual, empate no corte (3.8) |
| `importacao.ts` | Leitura de CSV, casamento de nomes (3.8) |
| `*.test.ts`, `testUtils.ts` | Testes (inclui casos reais) |

### Outros
| Caminho | Conteúdo |
|---|---|
| `firestore.rules` | Regras de segurança (fonte da verdade; publicar no Console) |
| `docs/dados/` | CSV da 2ª Etapa, casos de teste reais |
| `vitest.config.ts` | Atalho `@/` nos testes |
| `CLAUDE.md` / `AGENTS.md` | Instruções para a IA (convenções) |

---

## 3. Fluxos principais

**Placar de grupo:** `ListaJogos` → `PlacarModal` (valida com `validarPlacar`) → `salvarPlacar` → Firestore → `onSnapshot` atualiza todos → `useEtapaDados` recalcula `classificarGrupo` → `GrupoCard`/Geral/Chaves (prévia) mudam juntos.

**Recentes:** `salvarPlacar`/`salvarPlacarMataMata` gravam `atualizado_em` (servidor); limpar remove o campo → `recentes/page.tsx` lê `partidas` ordenado por `atualizado_em` desc, limite 5.

**Gerar chave:** Chaves → `classificarGeral` → `definirSeeds` → admin toca "Gerar" → `gerarChave` (grava seeds + todos os jogos, byes resolvidos, etapa → `mata_mata`).

**Placar do mata-mata:** `PlacarModal` com `salvarPlacarMataMata` → grava o jogo **e** coloca o vencedor no jogo seguinte (`proximoJogo`).

**Finalizar etapa:** Pontuação → `calcularPontosEtapa` (geral + fase alcançada) → `finalizarEtapa` grava `ranking_por_etapa/{etapa}_{jogador}` → Rank soma.

**Finals:** Rank da temporada (`useRank`) → Top 8 → `gerarChave(etapaFinals, "ouro", seeds)`.

---

## 4. Como fazer uma mudança (checklist)

1. **Regra nova ou alterada?** Atualize `SPEC.md` e registre em `DECISOES.md` (nova DEC; se substituir, marque a antiga como 🔁).
2. **Cálculo?** Escreva/ajuste o teste em `src/lib/engine/*.test.ts` **antes**, depois a função.
3. **Escrita no banco?** Só em `repo.ts`, com `writeBatch` quando mexer em mais de um documento. Campo novo → atualize `types.ts` e o schema na SPEC.
4. **Tela?** Mobile-first (≥ 44px, sem rolagem lateral em 375px), acordeão para listas, `PageHeader`, textos em pt-BR. Cores só da paleta: `bg-superficie` (não `bg-white`), `bg-marca`; confira no tema escuro (DEC-028).
5. **Verificação:** `npx tsc --noEmit` · `npm run lint` · `npm test` · `npm run build`.
6. **Registro:** entrada no topo de `CHANGELOG.md`; atualize `PLANO.md` se for etapa nova.
7. `git add . ; git commit -m "..." ; git push` → a Vercel publica.

---

## 5. Operação

| Tarefa | Como |
|---|---|
| Rodar local | `npm run dev` → http://localhost:3000 |
| Testes | `npm test` |
| Publicar | `git push` (Vercel faz o deploy) |
| Novo admin | e-mail em `firestore.rules` + `NEXT_PUBLIC_ADMIN_EMAILS` (`.env.local` e Vercel) → publicar regras → redeploy |
| Nova temporada | Criar etapas com a Temporada do ano (número recomeça em 1) |
| Etapa passada | Admin → Importar etapa (CSV) |
| Windows | Se `npm` não for reconhecido no PowerShell, use `npm.cmd` / `npx.cmd` |
