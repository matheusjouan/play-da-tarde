# PLANO DE IMPLEMENTAÇÃO — Play da Tarde

Regra de ouro: **só avança para a próxima etapa depois que o teste manual da atual passar.**
Regras: [`SPEC.md`](SPEC.md) · Decisões: [`DECISOES.md`](DECISOES.md) · Entregas: [`CHANGELOG.md`](CHANGELOG.md) · Código: [`ARQUITETURA.md`](ARQUITETURA.md)

Para iniciar uma etapa numa sessão nova com a IA:
> "Implementar a etapa <id> do docs/PLANO.md"

---

## Status

| Etapa | Entrega | Status |
|---|---|---|
| E0 | Instalação e scaffold | ✅ Validada |
| E1 | Layout mobile + deploy Vercel | ✅ Validada |
| E2 | Login Google + Firestore Rules | ✅ Validada |
| E3 | Cadastros: jogadores, etapas, regulamentos | ✅ Validada |
| E4 | Grupos + confrontos automáticos | ✅ Validada |
| E4.1 | Temporada + etapa selecionada entre abas | ✅ Validada |
| E5 | Motor de cálculo (testes) | ✅ Validada |
| E6 | Placar + classificação de grupos | ✅ Validada |
| E7 | Classificação geral | ✅ Validada |
| E8 | Substituição de jogador | ✅ Validada |
| E9 | Chaves Ouro e Prata | ✅ Validada |
| E10 | Pontuação, importação, Rank | ✅ Validada |
| E11 | Finals + desempate do Rank | 🟡 Implementada — aguardando validação final |
| E12 | Virada de temporada, acesso à Finals, polimento mobile | 🟡 Implementada — bug de camadas corrigido; aguardando validação final |
| E13 | Aba Recentes (5 últimos placares) | 🟡 Implementada — aguardando validação |
| E14 | Tema escuro | 🟡 Implementada — aguardando validação |
| E15 | Perfil "Placar" (só lança/edita placar) | 🟡 Implementada — publicar regras + variável na Vercel; aguardando validação |

Legenda: ✅ validada pelo usuário · 🟡 implementada, falta o teste manual · ⬜ não iniciada

---

## Etapas concluídas (resumo e teste de aceite)

**E0 — Setup.** `docs/SETUP.md`. Aceite: `npm run dev` abre a página do Next.

**E1 — Layout base.** Bottom bar com 5 abas, `CLAUDE.md`, deploy Vercel. Aceite: navegação no celular pela URL da Vercel.

**E2 — Login e segurança.** Aceite: seu e-mail → "Admin"; outro → "Sem permissão"; Rules Playground: escrita sem login negada, leitura permitida.

**E3 — Cadastros.** Aceite: jogador duplicado (com/sem acento) bloqueado; tabela de pontos editável; deslogado sem botões de edição.

**E4 — Grupos.** Aceite: grupo de 5 → 10 jogos; de 6 → 15; jogador não entra em dois grupos da etapa.

**E4.1 — Temporada.** Aceite: temporada preenchida com o ano; etapa escolhida mantida entre abas.

**E5 — Motor.** Aceite: `npm test` verde; STB (Matheus +3 / Thiago −1); caso real do Grupo H (`docs/dados/teste-grupo-h.md`).

**E6 — Placar.** Aceite: `6x3 4x6 [10x3]` → sets 0 / games +3 e −1; W.O.; `6x5` e STB `10x9` bloqueados; tempo real entre abas; acordeão um aberto por vez.

**E7 — Geral.** Aceite: 8×5 → 1º/2º Ouro, 3º/4º Prata, 5º eliminado; ordem igual ao cálculo manual.

**E8 — Substituição.** Aceite: jogos do antigo somem, novos confrontos criados, demais placares intactos.

**E9 — Chaves.** Aceite: sem geração com jogo de grupo pendente; `1×16, 8×9…`; bye com 15; avanço automático; trava e regenerar com confirmação.

**E10 — Pontuação e Rank.** Aceite: CSV da 2ª Etapa importado (31, Diogo Luiz 1400 … Felipe Siqueira 50); soma entre etapas no Rank.

---

## Etapas em validação

### 🟡 E11 — Finals + desempate do Rank (DEC-021, DEC-022)
**Teste (temporada fictícia 2099):**
1. Admin → Importar etapa: nº 98, "Teste 2099", temporada 2099, `docs/dados/teste-finals-2099.csv` (nenhum jogador "novo").
2. Rank → 2099: Miguel e Bruno empatados em 8º (420) com aviso → "Definir ordem" → Bruno 8º, Miguel 9º.
3. Nova etapa nº 99, temporada 2099, tipo Finals.
4. Chaves (etapa 99): deslogado → "ainda não divulgada" + Top 8; admin → prévia `Diogo (1) × Bruno (8)`, 4×5, 3×6, `Samuel (2) × Charles (7)` → Gerar.
5. Lançar quartas, semi, final → campeão; Rank 2099 não muda; card 🏆 no Rank mostra o campeão.
6. Limpeza: excluir etapas 99 e 98.

### 🟡 E12 — Virada de temporada e polimento (DEC-020, DEC-023, DEC-024, DEC-026)
**Teste:**
1. Nova etapa com temporada 2099 aceita o número 1; Admin → Etapas separado por temporada.
2. Grupos e Geral abrem na última etapa regular e não mostram a Finals.
3. Rolando Grupos e Geral com bloco aberto, a tabela passa **por trás** do cabeçalho.
4. Celular real, logado e deslogado: todas as abas, acordeões, abas de fase, Ouro/Prata, modal de placar.

### 🟡 E13 — Aba Recentes (DEC-027)
**Teste:**
1. Abrir o site (`/`) → cai em **Recentes**, primeira aba; sem placar novo → "Nenhum placar lançado ainda."
2. Admin lança um placar de grupo → card "GRUPO X" no topo, vencedor em verde com ✓, `Data:` de hoje.
3. Alterar esse placar → o card sobe ao topo com o placar novo (não duplica).
4. Lançar 6 placares → só os 5 últimos aparecem. Limpar um placar → o card some.
5. Mata-mata → "OURO · QUARTAS"; Finals → "FINALS · …"; W.O. mostra o selo.
6. Deslogado em outro aparelho: atualiza em tempo real. Em 375px: 6 abas legíveis, sem rolagem lateral.

### 🟡 E14 — Tema escuro (DEC-028)
**Teste:**
1. Primeira visita → tema claro, como antes. Tocar na lua do cabeçalho → tudo escuro; o ícone vira sol.
2. Recarregar a página → continua escuro, **sem piscar** o claro. Fechar e abrir o navegador → continua escuro.
3. Passar por todas as abas no escuro, logado e deslogado: cards, acordeões, tabela (coluna fixa com o mesmo fundo), abas Ouro/Prata e de fase, avisos amarelos/vermelhos, selo Admin, modal de placar, seletor de jogadores, `select` de etapa.
4. Voltar para o claro → igual ao de antes da mudança.

### 🟡 E15 — Perfil "Placar" (DEC-029)
**Antes:** publicar `firestore.rules` no Console do Firebase; `NEXT_PUBLIC_PLACAR_EMAILS` na Vercel + redeploy.
**Teste:**
1. Entrar com `matheusjouan007@gmail.com` → selo **"Placar"** (sem link). Abrir `/admin` pela URL → "Área restrita".
2. Grupos: lápis nos jogos → lançar, editar e limpar placar funcionam; **não** aparece "Definir ordem" em empate.
3. Chaves: lançar placar do mata-mata → vencedor avança; **não** aparecem Gerar / Ajustar seeds / Regenerar. Finals: só lança placar; sem prévia antes de divulgada.
4. Geral e Rank: sem botões de desempate.
5. Rules Playground (Console → Firestore → Regras), autenticado como esse e-mail com `email_verified = true`: `update` em `partidas/...` só com `sets`/`vencedorId` → permitido; `update` em `etapas/...` ou `create` em `jogadores` → **negado**.
6. Admin continua fazendo tudo; conta sem perfil continua "Sem permissão".

---

## Próximos passos (backlog)

| # | Item | Origem | Prioridade |
|---|---|---|---|
| B1 | Confirmar com a organização: jogadores do **mesmo grupo** podem se cruzar nas oitavas? Se não, regra automática de separação na geração de seeds. | DEC-014 | Alta (antes do mata-mata da 3ª Etapa) |
| B2 | Operar a 3ª Etapa real até o fim: placares → gerar chaves → mata-mata → **Finalizar etapa** → conferir Rank. | Uso real | Alta |
| B3 | Importar a 1ª Etapa se os dados aparecerem (mesma tela/CSV). | SPEC §7 | Quando houver dados |
| B4 | Segundo admin (se a organização quiser): e-mail em `firestore.rules` + `NEXT_PUBLIC_ADMIN_EMAILS`. | DEC-004 | Sob demanda |
| B5 | Backup periódico do Firestore (exportação) antes de etapas importantes. | Operação | Média |
| B6 | Ícone/atalho de app no celular (PWA: "Adicionar à tela inicial"). | UX | Baixa |

Para itens novos: registre aqui, decida em `DECISOES.md`, implemente e anote no `CHANGELOG.md`.
