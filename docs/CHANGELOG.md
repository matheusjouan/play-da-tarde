# Changelog — Play da Tarde

Histórico de entregas, da mais recente para a mais antiga.
Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/). Decisões referenciadas em [`DECISOES.md`](DECISOES.md).

**Como registrar uma mudança nova:** adicione uma seção no topo (`## [versão] — data`), liste em **Adicionado / Alterado / Corrigido / Removido**, cite as decisões (`DEC-xxx`) e o commit.

---

## [1.1.0] — 25/09/2026 · E13
### Adicionado
- Aba **Recentes** (primeira da barra): cards dos 5 últimos placares lançados ou alterados — grupos e mata-mata, vencedor em verde, `Data: dd/mm/aaaa`, selo W.O. (DEC-027)
- Campo `atualizado_em` nas partidas (hora do servidor), gravado ao salvar placar e removido ao limpar.
- `useCollection`: opções `decrescente` e `limite`.
- `dataCurta` e `rotuloPartida` em `formato.ts`, com `formato.test.ts`.

### Alterado
- O endereço `/` abre em **Recentes** (antes: Grupos).

## [1.0.0] — 24/09/2026 · E11 + E12
Versão completa do plano original.

### Adicionado
- **Finals** (etapa tipo `finals`): mata-mata direto do Top 8 do Rank da temporada, geração/ajuste/regeneração pelo admin, campeão. (DEC-022)
- **Desempate do Rank** pelo admin quando o empate atravessa a 8ª vaga. (DEC-021)
- Card 🏆 **Finals da temporada** na aba Rank.
- Seletor de etapa **agrupado por temporada**; Admin → Etapas separado por temporada.
- Arquivo de teste `docs/dados/teste-finals-2099.csv`.
- `vitest.config.ts` com o atalho `@/`.
- Documentação: `DECISOES.md`, `CHANGELOG.md`, `ARQUITETURA.md`, `docs/README.md`; SPEC v1.2.

### Alterado
- Número de etapa único **por temporada**; "mais recente" = temporada → número. (DEC-020)
- Grupos e Geral ignoram a Finals. (DEC-024)
- Prévia da Finals só para o admin. (DEC-023)
- Alvos de toque de 40px → 44px (abas de fase, ordenação do Rank).

### Corrigido
- Coluna fixa da tabela passava por cima do cabeçalho ao rolar (Geral/Grupos). (DEC-026)

Commits: `0aaa7ae`, `acd77d6`, `c2dfeea` · Testes: 122

## [0.10.0] — 24/09/2026 · E10 — Pontuação e Rank
### Adicionado
- Pontuação por etapa (grupo + fase do mata-mata) e **Finalizar etapa**. (DEC-017)
- **Importação CSV** com casamento de nomes; 2ª Etapa importada (31 jogadores). (DEC-018)
- **Rank da temporada**: Top 8, detalhe por etapa, ordenação, seletor de temporada.
### Alterado
- Não permite excluir jogador com pontos; excluir etapa apaga pontuação/chaves/jogos. (DEC-025)

Commit: `46d69f7` · Testes: 117

## [0.9.0] — 24/09/2026 · E9 — Chaves Ouro e Prata
### Adicionado
- Prévia ao vivo, geração pelo admin, seeds, soma 17, byes, avanço automático, campeão, ajustar seeds, regenerar, trava. (DEC-013 a DEC-016)
- Placar do mata-mata reaproveita o modal dos grupos.

Commit: `4b5c94a` · Testes: 84

## [0.8.0] — 24/09/2026 · E8 — Substituição de jogador
- Botão ⇄ Substituir no admin de grupos. (DEC-012)

Commit: `713ca29` · Testes: 63

## [0.7.0] — 24/09/2026 · E7 — Classificação geral
- Blocos Ouro / Prata / Eliminados, grupo de origem, parcial/final, desempate na linha de corte. (DEC-011)
- Acordeão (um aberto por vez) também na Geral. (DEC-006)
- Tabela com layout fixo, cabe em 375px.

Commits: `1e1eac8`, `b4f6d60` · Testes: 61

## [0.6.0] — 24/09/2026 · E6 — Placar e classificação de grupos
- Acordeão por grupo, tabela no formato da planilha, jogos com placar, modal de placar (STB automático, W.O., validação ao vivo), desempate manual. (DEC-007 a DEC-010)
- Acordeão com um grupo aberto por vez, todos fechados ao entrar (pedido do usuário).

Commits: `35d1e83`, `2c2b36a` · Testes: 53

## [0.5.0] — 24/09/2026 · E4.1 + E5 — Temporada e motor de cálculo
- Campo **Temporada** na etapa; etapa escolhida mantida entre abas. (DEC-019, DEC-024)
- Motor: validação de placar, estatísticas, desempate, empate total; caso real do Grupo H. (DEC-002, DEC-007, DEC-008)

Commit: `f3bfce9` · Testes: 53

## [0.4.0] — 24/09/2026 · E4 — Grupos e confrontos
- Montagem de grupos, confrontos todos-contra-todos automáticos (método do círculo), adicionar/remover jogador. (DEC-005)

Commit: `075866d` · Testes: 10

## [0.3.0] — 24/09/2026 · E3 — Cadastros
- Admin: jogadores (sem duplicidade por nome normalizado), etapas com tabelas de pontos, regulamentos; página pública de regulamentos.

Commit: `c5f231d` · Testes: 2

## [0.2.0] — 24/09/2026 · E2 — Login e segurança
- Login Google, selo Admin, `firestore.rules`. (DEC-004)

Commit: `18df897`

## [0.1.0] — 24/09/2026 · E0 + E1 — Base
- Scaffold Next.js 16 + TS + Tailwind + Firebase + Vitest; layout mobile com bottom bar; deploy na Vercel. (DEC-001, DEC-006)

Commits: `9f762bb`, `b161b32`
