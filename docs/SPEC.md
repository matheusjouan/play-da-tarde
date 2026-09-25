# ESPECIFICAÇÃO — Sistema de Gestão de Torneio de Tênis "Play da Tarde"
**Versão:** 1.4 — 25/09/2026 (v1.0 original + decisões validadas durante a implementação; 1.3: aba Recentes; 1.4: tema escuro)
**Abordagem:** Specification-Driven Development (SDD), por etapas incrementais

> Este documento descreve **o que o sistema faz** (regras). O **porquê** de cada regra está em [`DECISOES.md`](DECISOES.md);
> **onde** está no código, em [`ARQUITETURA.md`](ARQUITETURA.md). Índice geral: [`README.md`](README.md).

---

## 1. STACK TÉCNICA

- **Frontend:** Next.js 16 (App Router) + **TypeScript** + Tailwind CSS v4 + Lucide Icons
- **Backend/DB/Auth:** Firebase (Firestore + Firebase Auth, Google Provider) — SDK client, sem servidor próprio
- **Testes:** Vitest (motor de cálculo em `src/lib/engine/`)
- **Hospedagem:** Vercel (free tier), deploy automático a cada `git push` na `main`

---

## 2. DIRETRIZ DE DESIGN (MOBILE-FIRST)

- Alvos de toque ≥ 44px; nenhuma página com rolagem lateral em 375px.
- Navegação por bottom bar: **Recentes · Grupos · Geral · Chaves · Rank · Regras** (o site abre em Recentes).
- Listas longas em **acordeão**: todos começam fechados, **um aberto por vez**, o aberto rola até o topo.
- Tabelas com a coluna do nome fixa; nomes longos cortados com "…".
- Mata-mata no celular: abas **Oitavas / Quartas / Semi / Final**.
- Dados sempre em **tempo real** (listeners `onSnapshot`).
- **Tema claro/escuro** por botão no cabeçalho; a escolha fica salva no aparelho (padrão: claro).

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Estrutura e temporada
- Padrão: 40 jogadores, 8 grupos de 5 (todos contra todos). O sistema é **genérico** (nº e tamanho de grupos livres) — a 2ª Etapa teve 6 grupos (5×5 + 1×6).
- Cada etapa pertence a uma **temporada** (ano). Etapas sem o campo = **2026**.
- **Número da etapa é único dentro da temporada** (2027 pode ter "1ª Etapa" de novo).
- **Etapa mais recente** = maior temporada, depois maior número.
- Tipos de etapa:
  - `regular` — pontua para o Rank da temporada.
  - `finals` — **não pontua**; Top 8 do Rank da temporada disputa o título do ano (3.9).
- Origem: `sistema` (jogada no app) ou `importado` (só pontos, via CSV).

### 3.2 Classificação para Ouro / Prata
Cada etapa configura `vagas_ouro` e `vagas_prata` (padrão 16/16, máx. 16 por chave).
1. Ordena todos por: **posição no grupo** → vitórias → saldo de sets → saldo de games → ordem manual.
2. Primeiros `vagas_ouro` → **Ouro**; próximos `vagas_prata` → **Prata**; restante → eliminado.
- 8×5: 1º/2º Ouro, 3º/4º Prata, 5º eliminado. 2ª Etapa: 1º/2º + 4 melhores 3º na Ouro; os 15 restantes na Prata.
- Empate total **só é sinalizado quando decide a vaga** (atravessa a linha de corte) e com todos os grupos encerrados.

### 3.3 Formato de partida
- Melhor de 3 sets. Sets válidos: **6x0…6x4, 7x5, 7x6**.
- Em 1 set a 1, o 3º set é **Super Tie-Break**: mínimo 10 pontos e 2 de diferença (acima de 10, diferença exata de 2: 12x10 vale, 13x10 não).
- **O Super Tie-Break NÃO conta como set** e seus pontos não entram como games.
  - Vencedor do STB: **+2** no saldo de games. Perdedor: nada.
  - Ex.: Matheus 6x3, 4x6, STB 10x3 → Matheus: sets **0**, games (10−9)+2 = **+3**. Thiago: sets **0**, games **−1**.
- Placar inválido não é aceito na tela; jogos sem placar válido são ignorados no cálculo (tabela funciona com grupo incompleto).

### 3.4 W.O.
- Lançado como **6x0 6x0** (atalho "W.O. p/ Fulano"). Conta como jogo normal. Tag "W.O." só visual.

### 3.5 Desempate na fase de grupos
1. Vitórias 2. Saldo de sets 3. Saldo de games (com a regra do STB)
4. **Empate total:** o sistema avisa (só com o grupo encerrado) e o **admin define a ordem** (sorteio feito fora do sistema). Ordem salva por grupo.

### 3.6 Substituição de jogador
- O novo jogador entra **na mesma posição** do antigo; os jogos do antigo no grupo são **apagados** (inclusive com placar); são criados os confrontos do novo; os demais jogos ficam intactos.
- O jogador que saiu **não pontua** na etapa.

### 3.7 Chaves Ouro e Prata
- A chave oficial só pode ser **gerada pelo admin** quando **todos os jogos de grupo** estiverem encerrados. Antes disso, **prévia pública** calculada ao vivo.
- **Seeds:** entre os classificados da chave, por vitórias → saldo de sets → saldo de games; empate total mantém a ordem da classificação geral e é sinalizado ao admin. (Um 2º de grupo pode ser seed #1.)
- **Posições (soma 17 + quadrantes):** `1×16, 8×9, 5×12, 4×13 | 3×14, 6×11, 7×10, 2×15`. #1 e #2 só se cruzam na final.
- **Tamanho** = próxima potência de 2 (2, 4, 8 ou 16). Seeds ausentes = **bye** para os melhores seeds (avançam direto).
- Vencedor **avança automaticamente**. Não se pode mudar o vencedor de um jogo cujo jogo seguinte já tem placar.
- **Ajustar seeds** (reordenar manualmente) só antes do 1º resultado. Com resultado, a chave **trava**; **Regenerar** exige confirmação dupla e apaga os placares do mata-mata.
- Aviso ao admin se a classificação dos grupos mudar depois da geração.
- ⚠️ Em aberto com a organização: jogadores do **mesmo grupo** podem se cruzar nas oitavas (hoje resolvido caso a caso com "Ajustar seeds").

### 3.8 Pontuação e Rank da temporada
- Cada etapa `regular` tem tabela de pontos própria e editável. **Padrão** (da 2ª Etapa):
  - Grupo: 1º=400, 2º=320, 3º=260, 4º=200, 5º=40, 6º=25
  - Ouro: campeão=1000, vice=650, semi=400, quartas=200, oitavas=100
  - Prata: campeão=250, vice=165, semi=100, quartas=50, oitavas=25
- Pontos na etapa = pontos da **posição no grupo** + pontos da **fase alcançada** na chave (bye não conta como jogo; eliminado só leva os do grupo).
- **Finalizar etapa** (admin): exige grupos e mata-matas completos; grava `ranking_por_etapa` e marca a etapa como finalizada. Se resultados mudarem depois, o admin **atualiza a pontuação**.
- Etapas **importadas** guardam só os pontos (CSV: `nome, pontos_grupo, pontos_mata_mata[, pontos_total, posicao_final]`).
- **Rank da temporada** = soma das etapas regulares **finalizadas ou importadas** da temporada. Empates dividem a posição.
- **Empate em pontos** que atravessa a 8ª vaga: o sistema avisa e o **admin define a ordem** (salva por temporada).
- Top 8 destacado (vagas na Finals). Detalhamento por jogador em cada etapa.

### 3.9 Finals
- Etapa `finals` da temporada: **mata-mata direto** com o **Top 8 do Rank**, seeds pela posição: `1×8, 4×5, 3×6, 2×7` → Semi → Final. Mesmo formato de partida (3.3). **Não gera pontos.**
- Não pode ser gerada com empate não resolvido na 8ª vaga; avisa se ainda houver etapa da temporada não finalizada.
- **Prévia da chave só para o admin**; o público vê "chave em breve" + Top 8 atual.
- Card 🏆 da Finals na aba Rank: vagas → chave divulgada → campeão.

### 3.10 Navegação por etapa
- Grupos, Geral e Chaves são **por etapa**, com seletor (padrão = mais recente; escolha mantida entre abas; agrupado por temporada).
- **Grupos e Geral ignoram a Finals.** Rank é **por temporada**.

### 3.11 Recentes
- Cards dos **5 últimos placares lançados ou alterados**, de todas as etapas (grupos e mata-mata, inclusive Finals), do mais recente para o mais antigo.
- Card: título em negrito (`GRUPO H`, `OURO · QUARTAS`, `FINALS · SEMI`) + nome da etapa; os dois jogadores com o placar por set; **vencedor em verde**; `Data: dd/mm/aaaa` do último lançamento/alteração; selo W.O.
- Alterar um placar leva o jogo de volta ao topo; **limpar o placar tira o jogo da lista**.
- Placares lançados antes da v1.1 (sem `atualizado_em`) não aparecem.

---

## 4. SCHEMA FIRESTORE

```
etapas/{auto}
  nome, numero, temporada?, data_inicio, data_fim (texto livre)
  tipo: "regular" | "finals"          origem: "sistema" | "importado"
  status: "grupos" | "mata_mata" | "finalizada"
  vagas_ouro, vagas_prata
  tabela_pontos_grupo: [{ posicao, pontos }]
  tabela_pontos_mata_mata: [{ fase: "campeao"|"vice"|"semi"|"quartas"|"oitavas", chave: "ouro"|"prata", pontos }]
  desempate_geral?: jogadorId[]

grupos/{auto}
  etapaId, nome ("Grupo A"), jogadorIds[], desempate_manual?: jogadorId[]

jogadores/{auto}
  nome, nome_normalizado (minúsculo, sem acento — evita duplicidade)

partidas/{grupoId}__{jogadorA}__{jogadorB}          ← fase de grupos (A < B)
partidas/{etapaId}__{chave}__{fase}__{slot}         ← mata-mata
  etapaId, grupoId?, fase: "grupo"|"oitavas"|"quartas"|"semi"|"final"
  chave?: "ouro"|"prata", slot?: number
  jogador1Id, jogador2Id (null = bye / a definir)
  sets: [{ games1, games2, superTieBreak? }], vencedorId
  atualizado_em?: Timestamp do servidor (placar salvo; removido ao limpar) — aba Recentes

chaves/{etapaId}_{ouro|prata}                        ← Finals usa "ouro"
  etapaId, chave, seeds: jogadorId[] (#1 primeiro), ajusteManual?
  (travada = derivado: algum jogo do mata-mata com placar)

ranking_por_etapa/{etapaId}_{jogadorId}
  jogadorId, etapaId, origem
  posicao_grupo?, posicao_final?, chave?, fase_mata_mata?
  pontos_grupo, pontos_mata_mata, pontos_total

temporadas/{ano}
  desempate_rank?: jogadorId[]

regulamentos/{auto}
  etapaId, titulo, link (https)
```

---

## 5. TELAS

| Aba / tela | Conteúdo |
|---|---|
| **Recentes** | Cards dos 5 últimos placares lançados/alterados (3.11) |
| **Grupos** | Acordeão por grupo: classificação, jogos, placar (admin), desempate manual |
| **Geral** | Blocos Ouro / Prata / Eliminados com grupo de origem; parcial ou final |
| **Chaves** | Ouro/Prata ou Finals: abas por fase, seeds, byes, campeão; ferramentas do admin |
| **Rank** | Card da Finals, Top 8, detalhe por etapa, por pontos/nome, seletor de temporada |
| **Regras** | Links de regulamento por etapa |
| **Admin** | Jogadores · Etapas (grupos, pontuação) · Regulamentos · Importar etapa (CSV) |

---

## 6. AUTENTICAÇÃO E PERMISSÕES

- **Público:** leitura de tudo. **Admin (Google):** única escrita.
- Imposto em `firestore.rules`: `write` só com `request.auth.token.email_verified == true` e e-mail na lista de admins. A UI (`NEXT_PUBLIC_ADMIN_EMAILS`) só espelha.
- Para adicionar admin: incluir o e-mail **nos dois lugares** e republicar as regras.

---

## 7. DADOS HISTÓRICOS

- 2ª Etapa (2026): `docs/dados/etapa2-ranking.csv` — importada.
- 1ª Etapa: indisponível; pode ser importada no futuro pela mesma tela.
- Casos de teste reais: `docs/dados/teste-grupo-h.md`, `docs/dados/teste-finals-2099.csv`.

---

## 8. PENDÊNCIAS

- Organização: aceitar ou não jogadores do **mesmo grupo** se cruzarem nas oitavas (3.7).
- Todas as demais pendências (P1, P2) foram resolvidas — ver `DECISOES.md`.
