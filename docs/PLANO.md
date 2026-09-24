# PLANO DE IMPLEMENTAÇÃO — Play da Tarde

Regra de ouro: **só avança para a próxima etapa depois que o teste manual da atual passar.**
Marque `[x]` quando validar. Regras de negócio: `docs/SPEC.md`.

Para iniciar uma etapa numa sessão nova com a IA:
> "Implementar a etapa E<n> do docs/PLANO.md"

---

## [X] E0 — Instalação e scaffold (você)
Seguir `docs/SETUP.md`.
**Teste:** `npm run dev` → http://localhost:3000 mostra a página padrão do Next.

## [X] E1 — Layout base mobile + deploy
- Bottom bar: Grupos · Geral · Chaves · Rank · Regulamentos (páginas vazias).
- `CLAUDE.md` com convenções do projeto.
- Você: push no GitHub + import na Vercel (com as variáveis de ambiente).

**Teste:** abrir a URL da Vercel **no celular**; navegar pelas 5 abas; botões fáceis de tocar.

## [X] E2 — Firebase + login Google + Security Rules
- `src/lib/firebase.ts`, botão "Entrar como admin", hook `useIsAdmin`, arquivo `firestore.rules`.
- Você: colar/publicar as regras no Console; adicionar o domínio da Vercel em Authentication → Settings → Authorized domains.

**Teste:**
1. Logar com seu e-mail → selo "Admin".
2. Logar com outro e-mail → "sem permissão".
3. Console → Firestore → Regras → Playground: escrita sem login → **negada**; leitura sem login → **permitida**.

## [X] E3 — Cadastros: jogadores, etapas, regulamentos
- Admin: CRUD de jogadores (bloqueia nome duplicado), criar etapa (tipo, vagas, tabelas de pontos pré-preenchidas e editáveis), links de regulamento.
- Página pública Regulamentos.

**Teste:**
1. Criar 3 jogadores e 1 etapa; conferir no Console (aba Dados).
2. Tentar criar jogador com nome repetido (com/sem acento) → bloqueado.
3. Mudar 1º lugar para 450 → salvou.
4. Deslogado: vê regulamentos, sem botões de edição.

## [X] E4 — Montagem de grupos + confrontos automáticos
**Teste:** grupo de 5 → **10** partidas; grupo de 6 → **15**. Mesmo jogador não entra em dois grupos da mesma etapa.

## [X] E4.1 — Temporada + etapa selecionada entre abas
- Campo **Temporada** (ano) na etapa: preenchido com o ano atual ao criar, editável. Etapas sem o campo são tratadas como 2026.
- A etapa escolhida no seletor (Grupos/Geral/Chaves) é mantida ao trocar de aba.
- Base para a E10/E11: Rank e Top 8 da Finals filtram por temporada.

**Teste:**
1. Abrir a 3ª Etapa no admin → campo Temporada = 2026 → salvar.
2. Criar etapa nova → Temporada já vem com o ano atual.
3. Com 2 etapas, escolher a mais antiga em Grupos, trocar para Geral e voltar → a escolha continua.

## [X] E5 — Motor de cálculo (lógica pura + testes)
- `src/lib/engine/`: validação de placar, estatísticas, ordenação com desempate e detecção de empate total.
- Testes Vitest: exemplo do STB (Matheus +3 / Thiago −1), W.O., empates em cadeia, grupo de 6, e o **caso real do Grupo H** (`docs/dados/teste-grupo-h.md`, jogos parciais).

**Teste:** `npm test` → tudo verde. (Opcional: me passe um grupo real com placares para virar teste.)

## [ ] E6 — Dashboard de grupos + edição de placar
- Accordion por grupo, tabela de classificação no formato da planilha (Pos · Jogador · Vitórias · Derrotas · Saldo Sets · Saldo Games, scroll horizontal no celular), jogos com placar, modal de placar (admin), tag W.O., aviso de empate total + tela de desempate manual.

**Teste:**
1. `6x3, 4x6, STB 10x3` → vencedor: saldo sets 0, games +3; perdedor: sets 0, games −1.
2. `6x0, 6x0` → tag W.O.
3. `6x5` ou STB `10x9` → bloqueado.
4. Comparar com cálculo manual.
5. Duas abas abertas: editar numa, a outra atualiza sozinha.

## [X] E7 — Classificação geral da etapa
**Teste:** ordem bate com cálculo manual; destino correto (8×5: 1º/2º Ouro, 3º/4º Prata, 5º eliminado).

## [X] E8 — Substituição de jogador
**Teste:** substituir jogador com 2 jogos → jogos dele somem, novos confrontos criados, tabelas recalculadas.

## [X] E9 — Chaves Ouro e Prata
- Geração quando todos os jogos de grupo terminarem; seeds, quadrantes, byes; placar do mata-mata avança o vencedor; tabs no celular; trava + "Regenerar chave".

**Teste:**
1. Com 1 jogo de grupo pendente → chave não é gerada.
2. Completar os grupos → chave gerada; conferir #1×#16, #8×#9… e #1/#2 em metades opostas.
3. Chave com 15 jogadores → #1 recebe bye.
4. Lançar jogo de oitavas → chave trava; "Regenerar" pede confirmação.

## [X] E10 — Pontuação + importação da 2ª Etapa + Rank da temporada
- Botão "Finalizar etapa" (grava `ranking_por_etapa`), importação CSV com revisão de nomes (2ª Etapa = temporada 2026), tela do Rank com seletor de temporada, Top 8 destacado e detalhamento por jogador (pontos de grupo + mata-mata em cada etapa).

**Teste:**
1. Importar `docs/dados/etapa2-ranking.csv` → 31 jogadores, totais iguais ao PDF (Diogo Luiz 1400 … Felipe Siqueira 50).
2. Finalizar uma etapa fictícia → soma acumulada correta no Rank.

## [ ] E11 — Finals (depende das pendências P1 e P2 da SPEC)
- Etapa tipo `finals` com os 8 melhores do Rank **da mesma temporada**; não gera pontos.
- P1: empate em pontos no Rank → admin define a ordem (aba Rank, "Definir ordem").
- P2: mata-mata direto 1×8, 4×5, 3×6, 2×7 → Semi → Final (aba Chaves da etapa Finals).
- Teste de empate na 8ª vaga: `docs/dados/teste-finals-2099.csv` (temporada fictícia 2099, só nomes já cadastrados).

**Teste:** criar Finals → 8 jogadores corretos, confrontos conforme formato definido; Rank da temporada não muda.

## [ ] E12 — Virada de temporada, acesso à Finals e polimento mobile
- Número de etapa único **por temporada** (2027 pode ter "1ª Etapa" de novo).
- "Etapa mais recente" = maior temporada, depois maior número.
- Seletor de etapa agrupado por temporada; Grupos e Geral ignoram a Finals.
- Card 🏆 Finals da temporada na aba Rank (segue o seletor de temporada; link direto para a chave; campeão).
- Prévia da chave da Finals só para admin; público vê "em breve" + Top 8 atual. (Prévia de Ouro/Prata continua pública.)
- Revisão mobile: sem rolagem lateral, alvos de toque ≥ 44px.

**Teste:** ver roteiro na entrega + roteiro completo em celular real, logado e deslogado.
