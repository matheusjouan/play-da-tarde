# Registro de Decisões — Play da Tarde

Formato ADR simplificado (*Architecture Decision Record*): cada decisão tem **contexto**, **decisão**, **consequências** e **onde** está no código.
Decisões não são apagadas: se mudar, cria-se uma nova que **substitui** a anterior (e a antiga recebe o status "Substituída por DEC-xxx").

**Status:** ✅ Vigente · 🔁 Substituída · ⏳ Pendente

| # | Decisão | Área | Status |
|---|---|---|---|
| [DEC-001](#dec-001) | Next.js + Firebase (client SDK) + Vercel, sem servidor próprio | Arquitetura | ✅ |
| [DEC-002](#dec-002) | Regras de cálculo em funções puras com testes | Arquitetura | ✅ |
| [DEC-003](#dec-003) | Tempo real (`onSnapshot`) desde a primeira tela | Arquitetura | ✅ |
| [DEC-004](#dec-004) | Segurança nas Firestore Rules (lista de e-mails + verificado) | Segurança | ✅ |
| [DEC-005](#dec-005) | IDs determinísticos e gravações em lote | Dados | ✅ |
| [DEC-006](#dec-006) | Mobile-first: bottom bar, 44px, acordeão um-por-vez | UX | ✅ |
| [DEC-007](#dec-007) | Super tie-break não conta como set; +2 games ao vencedor | Regra | ✅ |
| [DEC-008](#dec-008) | Validação de placar | Regra | ✅ |
| [DEC-009](#dec-009) | W.O. = 6x0 6x0, sem campo especial | Regra | ✅ |
| [DEC-010](#dec-010) | Empate total: admin define a ordem; aviso só com grupo encerrado | Regra | ✅ |
| [DEC-011](#dec-011) | Classificação geral: posição no grupo primeiro; vagas por etapa | Regra | ✅ |
| [DEC-012](#dec-012) | Substituição: mesma posição, apaga jogos, não pontua | Regra | ✅ |
| [DEC-013](#dec-013) | Chaves só após grupos completos; geração explícita pelo admin | Regra | ✅ |
| [DEC-014](#dec-014) | Seeds por V > saldo sets > saldo games | Regra | ✅ / ⏳ |
| [DEC-015](#dec-015) | Soma 17, quadrantes, byes, máximo 16 | Regra | ✅ |
| [DEC-016](#dec-016) | Trava da chave e proteção do avanço | Regra | ✅ |
| [DEC-017](#dec-017) | Pontuação configurável; "Finalizar etapa" grava o snapshot | Regra/Dados | ✅ |
| [DEC-018](#dec-018) | Importação por CSV na tela, com casamento de nomes | Dados | ✅ |
| [DEC-019](#dec-019) | Temporada (ano) na etapa; Rank por temporada | Regra | ✅ |
| [DEC-020](#dec-020) | Número único por temporada; ordem temporada → número | Regra | ✅ |
| [DEC-021](#dec-021) | Desempate do Rank (P1): admin define | Regra | ✅ |
| [DEC-022](#dec-022) | Finals (P2): mata-mata do Top 8, sem pontos | Regra | ✅ |
| [DEC-023](#dec-023) | Visibilidade das prévias | UX | ✅ |
| [DEC-024](#dec-024) | Etapa selecionada compartilhada; Grupos/Geral ignoram Finals | UX | ✅ |
| [DEC-025](#dec-025) | Exclusões protegidas e em cascata | Dados | ✅ |
| [DEC-026](#dec-026) | Camadas de tela (z-index) | UX | ✅ |
| [DEC-027](#dec-027) | Aba Recentes (5 últimos placares) e `atualizado_em` nas partidas | UX/Dados | ✅ |

---

## Arquitetura

### DEC-001
**Next.js + Firebase (client SDK) + Vercel, sem servidor próprio** — 24/09/2026 · ✅
- **Contexto:** app pequeno, 1 organização, orçamento zero, precisa de login Google e tempo real.
- **Decisão:** Next.js 16 (App Router) + TypeScript + Tailwind; Firestore/Auth acessados direto do navegador; hospedagem Vercel (deploy a cada push).
- **Consequências:** sem custo de servidor; toda a regra de negócio roda no cliente — por isso a proteção de escrita fica nas Rules (DEC-004) e os cálculos são determinísticos (DEC-002).
- **Onde:** `src/lib/firebase.ts`, `.env.local` / variáveis na Vercel.

### DEC-002
**Regras de cálculo em funções puras com testes** — 24/09/2026 · ✅
- **Contexto:** classificação, desempate, chaveamento e pontos são o núcleo crítico; erro silencioso = injustiça no torneio.
- **Decisão:** toda regra fica em `src/lib/engine/` (sem Firebase, sem React), coberta por Vitest, incluindo **casos reais** (Grupo H, CSV da 2ª Etapa, nomes reais).
- **Consequências:** telas só exibem o que o motor calcula; qualquer mudança de regra começa por um teste. `npm test` = 122 testes na E12.
- **Onde:** `src/lib/engine/*.ts` + `*.test.ts`, `src/lib/etapas.ts`.

### DEC-003
**Tempo real (`onSnapshot`) desde a primeira tela** — 24/09/2026 · ✅
- **Contexto:** o plano original deixava tempo real para a última etapa; fazer depois exigiria refazer telas.
- **Decisão:** todas as leituras usam listeners (`useCollection`).
- **Consequências:** placar lançado aparece em todos os celulares sem recarregar. Não combinar `where` + `orderBy` em campos diferentes (exigiria índice composto) — ordenar no cliente.
- **Onde:** `src/lib/useCollection.ts`, `src/lib/useEtapaDados.ts`, `src/lib/useRank.ts`.

## Segurança e dados

### DEC-004
**Segurança nas Firestore Rules** — 24/09/2026 · ✅
- **Decisão:** leitura pública; escrita só com login Google, `email_verified == true` e e-mail na lista de admins. A UI esconde botões, mas **a proteção real é a regra**.
- **Consequências:** novo admin = incluir e-mail em `firestore.rules` **e** em `NEXT_PUBLIC_ADMIN_EMAILS` (local e Vercel), e republicar as regras no Console. O arquivo do projeto é a fonte da verdade; o Console recebe cópia.
- **Onde:** `firestore.rules`, `src/components/AuthProvider.tsx`, `src/components/AdminGuard.tsx`.

### DEC-005
**IDs determinísticos e gravações em lote** — 24/09/2026 · ✅
- **Decisão:** IDs previsíveis — partida de grupo `{grupoId}__{A}__{B}`, mata-mata `{etapaId}__{chave}__{fase}__{slot}`, chave `{etapaId}_{chave}`, pontuação `{etapaId}_{jogadorId}`, temporada `{ano}`. Operações com vários documentos usam `writeBatch` (tudo ou nada).
- **Consequências:** impossível duplicar confronto (duplo clique, duas abas); dá para apagar/recriar sem consulta.
- **Onde:** `src/lib/repo.ts`.

### DEC-025
**Exclusões protegidas e em cascata** — 24/09/2026 · ✅
- **Decisão:** não exclui jogador que está em grupo ou tem pontos no Rank; não exclui etapa com grupos; excluir etapa apaga junto pontuação, chaves e jogos dela.
- **Onde:** `excluirJogador`, `excluirEtapa` em `src/lib/repo.ts`.

## UX

### DEC-006
**Mobile-first** — 24/09/2026 · ✅
- **Decisão:** bottom bar com 5 abas; alvos ≥ 44px; tabelas cabem em 375px (layout fixo, nome com "…"); listas em **acordeão com um item aberto por vez, todos fechados ao entrar**, o aberto rola até o topo (pedido do usuário na E6/E7).
- **Onde:** `src/components/BottomNav.tsx`, `Acordeao.tsx`, `grupos/TabelaClassificacao.tsx`.

### DEC-023
**Visibilidade das prévias** — 24/09/2026 · ✅
- **Decisão:** prévia de **Ouro/Prata é pública** (acompanha a fase de grupos ao vivo). Prévia da **Finals só para o admin**; o público vê "chave em breve" + Top 8 atual (opção 2 escolhida).
- **Onde:** `src/app/chaves/page.tsx`, `src/components/chaves/FinalsChave.tsx`.

### DEC-024
**Etapa selecionada compartilhada entre abas** — 24/09/2026 · ✅
- **Decisão:** a etapa escolhida vale para Grupos/Geral/Chaves (contexto no layout raiz); padrão = mais recente (DEC-020). **Grupos e Geral ignoram a Finals**; seletor agrupado por temporada quando há mais de uma.
- **Onde:** `src/components/EtapaSelect.tsx`.

### DEC-026
**Camadas de tela** — 24/09/2026 · ✅
- **Contexto:** a coluna fixa da tabela passava por cima do cabeçalho ao rolar (bug da E12).
- **Decisão:** coluna fixa `z-[1]` < header/bottom bar `z-30` < seletor de jogadores `z-40` < modais `z-50`.
- **Onde:** comentário em `src/app/layout.tsx`.

### DEC-027
**Aba Recentes e `atualizado_em` nas partidas** — 25/09/2026 · ✅
- **Contexto:** o usuário quis uma aba para ver os últimos resultados sem abrir grupo por grupo; as partidas não guardavam quando o placar foi lançado.
- **Decisão:** nova aba **Recentes**, a **primeira** da barra (o `/` abre nela): cards dos **5 últimos** placares lançados ou alterados, de **todas as etapas**, grupos e mata-mata (título "Grupo H", "Ouro · Quartas", "Finals · Semi"), vencedor em **verde** e **só a data** (`Data: 25/09/2026`). A partida ganha `atualizado_em` (hora do **servidor**), gravado ao salvar o placar e **removido ao limpar** (o jogo sai da lista). Levar o vencedor ao jogo seguinte do mata-mata não altera o campo.
- **Consequências:** placares lançados antes desta versão não têm data e **não aparecem** em Recentes. Consulta `orderBy(atualizado_em desc) + limit(5)` usa o índice automático de campo único.
- **Onde:** `salvarPlacar`/`limparPlacar`/`salvarPlacarMataMata`/`limparPlacarMataMata` em `repo.ts`; `src/app/recentes/page.tsx`; `RecenteCard`; `rotuloPartida`, `dataCurta` em `formato.ts`.

## Regras do torneio

### DEC-007
**Super tie-break não conta como set; +2 games ao vencedor** — 24/09/2026 · ✅
- **Contexto:** a v1.0 dizia só "+2 games"; a primeira proposta contava o STB como set — **corrigida pelo usuário** com o exemplo Matheus 6x3 4x6 10x3 (Matheus sets 0 / games +3; Thiago sets 0 / games −1). Validado contra a planilha real do Grupo H.
- **Onde:** `calcularEstatisticas` em `src/lib/engine/classificacao.ts` (`BONUS_SUPER_TIE_BREAK`).

### DEC-008
**Validação de placar** — 24/09/2026 · ✅
- **Decisão:** sets 6x0–6x4, 7x5, 7x6; 3º set obrigatório e só como STB em 1×1; STB ≥ 10 com 2 de diferença (acima de 10, diferença exata de 2); 2×0 não tem 3º set. Jogo com placar inválido é tratado como pendente.
- **Onde:** `src/lib/engine/placar.ts`.

### DEC-009
**W.O. = 6x0 6x0** — 24/09/2026 · ✅
- **Decisão:** sem campo especial nem regra de acúmulo; conta como jogo normal; tag "W.O." só visual; atalho no modal de placar.
- **Onde:** `ehWO` em `placar.ts`, `grupos/PlacarModal.tsx`.

### DEC-010
**Empate total: admin define a ordem** — 24/09/2026 · ✅
- **Decisão:** nada aleatório no sistema — o sorteio é feito fora e o admin ordena com setas. Aviso de empate no grupo **só com o grupo encerrado** (no meio do grupo empates são normais).
- **Onde:** `ordenarClassificacao` em `classificacao.ts`, `grupos/DesempateModal.tsx`, `grupos.desempate_manual`.

### DEC-011
**Classificação geral e vagas** — 24/09/2026 · ✅
- **Contexto:** o PDF da 2ª Etapa mostrou 6 grupos com 1º/2º + 4 melhores 3º na Ouro e todos os demais na Prata.
- **Decisão:** ordem por **posição no grupo** → V → saldo sets → saldo games → manual; vagas Ouro/Prata configuráveis por etapa. Empate só sinalizado se **atravessa a linha de corte**.
- **Onde:** `src/lib/engine/geral.ts`, `etapas.desempate_geral`.

### DEC-012
**Substituição de jogador** — 24/09/2026 · ✅
- **Decisão:** novo jogador na mesma posição; jogos do antigo apagados (com ou sem placar); confrontos do novo criados; demais intactos; quem saiu **não pontua**.
- **Onde:** `planejarSubstituicao` em `engine/confrontos.ts`, `substituirJogadorGrupo` em `repo.ts`.

### DEC-013
**Chaves só com grupos completos; geração explícita** — 24/09/2026 · ✅
- **Contexto:** a organização definiu que o mata-mata só começa com todos os jogos de grupo encerrados.
- **Decisão:** antes disso, prévia calculada ao vivo; depois, o admin toca em **"Gerar chaves"** (a chave oficial é gravada). Mudança posterior na classificação gera aviso, não regeneração automática.
- **Onde:** `src/app/chaves/page.tsx`, `gerarChave` em `repo.ts`.

### DEC-014
**Seeds por V > saldo sets > saldo games** — 24/09/2026 · ✅ / ⏳
- **Decisão:** seeds entre os classificados da chave pelas métricas, sem olhar a posição no grupo (conforme spec original). Empate total mantém a ordem da geral e é sinalizado.
- **Consequências:** jogadores do **mesmo grupo** podem se cruzar já nas oitavas. **⏳ Pendente** confirmar com a organização; hoje contornado com "Ajustar seeds".
- **Onde:** `definirSeeds` em `engine/chave.ts`.

### DEC-015
**Soma 17, quadrantes, byes** — 24/09/2026 · ✅
- **Decisão:** ordem `1×16, 8×9, 5×12, 4×13 | 3×14, 6×11, 7×10, 2×15`; chave de 2/4/8/16; seeds ausentes viram bye para os melhores seeds; máximo 16 por chave.
- **Onde:** `ordemSeeds`, `montarChave` em `engine/chave.ts`.

### DEC-016
**Trava da chave e proteção do avanço** — 24/09/2026 · ✅
- **Decisão:** "Ajustar seeds" só antes do 1º resultado; depois, só "Regenerar" com confirmação dupla (apaga placares). Não se muda vencedor de jogo cujo seguinte já tem placar.
- **Onde:** `salvarPlacarMataMata`, `limparPlacarMataMata` em `repo.ts`.

### DEC-017
**Pontuação configurável e snapshot ao finalizar** — 24/09/2026 · ✅
- **Contexto:** a v1.0 dizia "ranking nunca salvo" e ao mesmo tempo tinha a coleção `ranking_por_etapa`; a 2ª Etapa só tem pontos.
- **Decisão:** tabela de pontos por etapa (padrão = 2ª Etapa); a etapa do sistema calcula ao vivo e grava `ranking_por_etapa` ao **Finalizar etapa** (reatualizável); o Rank sempre soma esses registros.
- **Onde:** `engine/pontos.ts`, `app/admin/etapas/[id]/pontuacao/page.tsx`, `finalizarEtapa` em `repo.ts`.

### DEC-018
**Importação por CSV na tela, com casamento de nomes** — 24/09/2026 · ✅
- **Contexto:** nomes da planilha diferem do cadastro ("Bevilaqua"/"Bevilacqua", "Gustavo Cafu"/"Gustavo Siqueira (Cafu)").
- **Decisão:** importação pela tela admin (sem Service Account); cada linha classificada como **igual / confira / novo**, com troca manual; bloqueia erros de total e dois nomes no mesmo jogador.
- **Onde:** `engine/importacao.ts`, `app/admin/importar/page.tsx`, `importarEtapa` em `repo.ts`.

### DEC-019
**Temporada** — 24/09/2026 · ✅
- **Contexto:** sem ano, o Rank de 2027 somaria 2026 e o Top 8 da Finals sairia errado.
- **Decisão:** campo `temporada` na etapa (ausente = 2026); Rank, desempate do Rank e Finals por temporada.
- **Onde:** `temporadaDe` em `src/lib/types.ts`, `src/lib/useRank.ts`.

### DEC-020
**Número único por temporada; ordem temporada → número** — 24/09/2026 · ✅
- **Contexto:** bugs que apareceriam em 2027 (número 1 bloqueado; "mais recente" pelo maior número).
- **Onde:** `src/lib/etapas.ts` (+ testes).

### DEC-021
**Desempate do Rank (P1)** — 24/09/2026 · ✅
- **Decisão:** empate em pontos → o sistema avisa quando atravessa a 8ª vaga e o **admin define a ordem**; salvo em `temporadas/{ano}.desempate_rank`. Sem ordem, a posição é compartilhada.
- **Onde:** `montarRank`, `empateNoCorte` em `engine/rank.ts`; aba Rank.

### DEC-022
**Finals (P2)** — 24/09/2026 · ✅
- **Decisão:** mata-mata direto do Top 8 do Rank da temporada (`1×8, 4×5, 3×6, 2×7`), mesmo formato de partida, **sem pontos**. Gravada como a chave `"ouro"` da etapa `finals` (reaproveita todo o mata-mata). Não gera com empate na 8ª vaga; avisa se há etapa não finalizada. Card 🏆 na aba Rank.
- **Onde:** `src/components/chaves/FinalsChave.tsx`, `FinalsCard.tsx`.
