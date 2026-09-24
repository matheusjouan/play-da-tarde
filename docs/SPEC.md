# ESPECIFICAÇÃO — Sistema de Gestão de Torneio de Tênis "Play da Tarde"
**Versão:** 1.1 (v1.0 + decisões validadas em 24/09/2026 — ver seção 10)
**Abordagem:** Specification-Driven Development (SDD), por etapas incrementais — ver `docs/PLANO.md`

---

## 1. STACK TÉCNICA

- **Frontend:** Next.js (App Router) + **TypeScript** + Tailwind CSS + Lucide Icons
- **Backend/DB/Auth:** Firebase (Firestore + Firebase Auth, Google Provider) — SDK client, sem servidor próprio
- **Testes:** Vitest (motor de cálculo)
- **Hospedagem:** Vercel (free tier)

> TypeScript é obrigatório: a lógica de classificação e chaveamento é o núcleo crítico do sistema.

---

## 2. DIRETRIZ DE DESIGN (MOBILE-FIRST)

- Touch targets mínimo 44px.
- Tabelas com scroll horizontal suave ou cards expansíveis.
- Navegação por bottom bar.
- Árvore mata-mata em telas pequenas: tabs "Oitavas/Quartas/Semi/Final".
- Dados sempre em tempo real (listeners `onSnapshot` do Firestore) desde a primeira tela.

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Estrutura
- Padrão atual: 40 jogadores, 8 grupos de 5 (todos contra todos dentro do grupo). Etapas futuras seguem esse formato.
- O sistema continua **genérico** (nº de grupos e tamanho de grupo livres), pois a 2ª Etapa teve 6 grupos (5×5 + 1×6).
- Tipos de etapa:
  - `regular` — pontua para o Rank da temporada.
  - `finals` — **não pontua**; reúne os 8 melhores do Rank da temporada para decidir o campeão do ano (formato: ver pendência P2).

### 3.2 Classificação para Ouro / Prata (regra genérica)
Cada etapa configura `vagas_ouro` (padrão 16) e `vagas_prata` (padrão 16).
1. Ordena todos os jogadores da etapa por: **posição no grupo** (asc) → vitórias → saldo de sets → saldo de games → desempate manual.
2. Os primeiros `vagas_ouro` vão para a **Ouro**; os próximos `vagas_prata` para a **Prata**; o restante é eliminado.

Exemplos:
- 8 grupos de 5: 1º/2º → Ouro (16), 3º/4º → Prata (16), 5º → eliminado.
- 2ª Etapa (6 grupos, 31 jogadores): 1º/2º (12) + 4 melhores 3º → Ouro; os 15 restantes → Prata (1 bye).

### 3.3 Formato de partida
- Melhor de 3 sets, vantagem tradicional. Sets válidos: 6x0…6x4, 7x5, 7x6.
- Em 1 set a 1, o 3º set é um **Super Tie-Break** de 10 pontos (mínimo 10, diferença mínima de 2).
- **O Super Tie-Break NÃO conta como set** e seus pontos não entram como games.
  - Vencedor do STB: **+2** no saldo de games. Perdedor: nada.
  - Exemplo: Matheus 6x3, 4x6, STB 10x3 →
    Matheus: 1 vitória, saldo de sets **0**, saldo de games (10−9) + 2 = **+3**.
    Thiago: 1 derrota, saldo de sets **0**, saldo de games (9−10) = **−1**.

### 3.4 W.O.
- Lançado como placar normal 6x0 / 6x0. Sem campo especial, sem regra de acúmulo.
- Tag visual "W.O." exibida quando o placar é 6x0/6x0 (só visual).

### 3.5 Critérios de desempate (grupo e geral)
1. Vitórias (desc.) 2. Saldo de Sets (desc.) 3. Saldo de Games (desc., com a regra do STB)
4. **Empate total:** o sistema **avisa** e o **admin define a ordem manualmente** (ordem salva; nada aleatório).

### 3.6 Substituição de jogador
- Admin troca participante: as partidas do jogador antigo no grupo são **apagadas**, os confrontos do novo são criados, tabela do grupo e geral recalculadas.
- O jogador que saiu **não pontua** na etapa.

### 3.7 Chaveamento mata-mata (Ouro e Prata)
- A chave só é gerada quando **todos os jogos da fase de grupos estiverem finalizados**.
- Seeds #1…#N pelo ranking geral dos classificados daquela chave (Vitórias > Saldo Sets > Saldo Games > desempate manual).
- Tamanho da chave = próxima potência de 2 ≥ N. Seeds ausentes viram **bye** (beneficia os seeds mais altos).
- Ordem das posições na chave de 16 (soma 17 + quadrantes padrão):
  - Metade de cima: `1×16, 8×9, 5×12, 4×13`
  - Metade de baixo: `3×14, 6×11, 7×10, 2×15`
  - #1 e #2 só podem se encontrar na final.
- A chave **trava** assim que o 1º jogo do mata-mata tiver placar. Admin tem botão "Regenerar chave" (com confirmação; apaga resultados do mata-mata).
- Mesmo formato de partida da seção 3.3.

### 3.8 Pontuação / Rank da temporada
- Cada etapa `regular` tem sua própria tabela de pontos, editável. Valores **padrão** sugeridos (extraídos da 2ª Etapa):
  - Grupo: 1º=400, 2º=320, 3º=260, 4º=200, 5º=40, 6º=25
  - Ouro: campeão=1000, vice=650, semi=400, quartas=200, oitavas=100
  - Prata: campeão=250, vice=165, semi=100, quartas=50, oitavas=25
- Pontos do jogador na etapa = pontos da posição no grupo + pontos da fase alcançada no mata-mata.
- Etapas `finals` não geram pontos.
- **Rank da temporada = soma** de `ranking_por_etapa` de todas as etapas `regular` (desempate: ver pendência P1).
- Etapas importadas (`origem: "importado"`) guardam só os pontos. Etapas do sistema calculam a partir das partidas e gravam `ranking_por_etapa` ao **Finalizar etapa**.
- Deve ser possível cadastrar etapas retroativas (ex.: 1ª Etapa) via importação, sem mudar código.

---

## 4. SCHEMA FIRESTORE

```
etapas/{etapaId}
  nome, numero, data_inicio, data_fim (texto livre)
  tipo: "regular" | "finals"
  origem: "sistema" | "importado"
  status: "grupos" | "mata_mata" | "finalizada"
  vagas_ouro: number, vagas_prata: number
  tabela_pontos_grupo: [{ posicao, pontos }]
  tabela_pontos_mata_mata: [{ fase: "campeao"|"vice"|"semi"|"quartas"|"oitavas", chave: "ouro"|"prata", pontos }]
  desempate_geral?: jogadorId[]        // ordem manual p/ empates totais na classificação geral

grupos/{grupoId}
  etapaId, nome ("Grupo A"), jogadorIds: string[]
  desempate_manual?: jogadorId[]       // ordem manual p/ empates totais no grupo

jogadores/{jogadorId}
  nome, nome_normalizado (minúsculo, sem acento — evita duplicidade)

partidas/{partidaId}
  etapaId, grupoId?                    // grupoId só na fase de grupos
  fase: "grupo" | "oitavas" | "quartas" | "semi" | "final"
  chave?: "ouro" | "prata"
  slot?: number                        // posição na chave (mata-mata)
  jogador1Id, jogador2Id (null = bye/aguardando)
  sets: [{ games1, games2, superTieBreak?: boolean }]
  vencedorId: string | null

chaves/{etapaId}_{ouro|prata}
  etapaId, chave, seeds: jogadorId[], travada: boolean

ranking_por_etapa/{etapaId}_{jogadorId}
  jogadorId, etapaId, origem
  posicao_grupo?, fase_mata_mata?, chave?
  pontos_grupo, pontos_mata_mata, pontos_total

regulamentos/{regulamentoId}
  etapaId, titulo, link (Google Drive)
```

---

## 5. TELAS

1. **Regulamentos** — links por etapa.
2. **Grupos** — accordion por grupo, classificação, confrontos, "Editar Placar" (admin).
3. **Classificação Geral da etapa** — todos os jogadores, grupo de origem, métricas, destino (Ouro/Prata/eliminado).
4. **Chaves Ouro / Prata** — árvore responsiva em tempo real.
5. **Rank da temporada** — soma de todas as etapas regulares, ordenável, destaque do Top 8 (vaga na Finals).
6. **Admin** — etapas (tipo, vagas, tabelas de pontos), jogadores, grupos, substituição, regulamentos, importação CSV, regenerar chave, finalizar etapa, desempates manuais.

---

## 6. AUTENTICAÇÃO E PERMISSÕES

- **Público (sem login):** leitura de tudo.
- **Admin (Google Auth):** única escrita.
- Regra imposta nas **Firestore Security Rules** (não só na UI):
  `read: if true;` e `write: if request.auth != null && request.auth.token.email_verified == true && request.auth.token.email in [lista de admins]`.

---

## 7. DADOS HISTÓRICOS

- 2ª Etapa: `docs/dados/etapa2-ranking.csv` (31 jogadores; importação pela tela Admin).
- 1ª Etapa: indisponível; caminho aberto via importação futura.

---

## 8. PENDÊNCIAS EM ABERTO

- **P1 — Desempate do Rank da temporada** (decide a vaga no Top 8 da Finals). Ex.: 2ª Etapa tem 7º/8º empatados em 520.
- **P2 — Formato da Finals** (8 jogadores): mata-mata direto `1×8, 4×5, 3×6, 2×7`? Grupos? Mesmo formato de partida?

---

## 9. PLANO DE DESENVOLVIMENTO

Ver `docs/PLANO.md`.

---

## 10. HISTÓRICO DE DECISÕES (24/09/2026)

| Tema | Decisão |
|---|---|
| Quadrantes | Padrão profissional (seção 3.7) |
| Grupos menores | Vagas por etapa; completa com melhores da posição seguinte (3.2) |
| Empate total | Admin define manualmente; sistema avisa (3.5) |
| Início do mata-mata | Só após todos os jogos de grupo finalizados (3.7) |
| Dados 2ª Etapa | `origem: "importado"`; base p/ Top 8 da Finals |
| Finals | Tipo de etapa sem pontos (3.1) |
| Tamanho de grupos | 8×5 daqui em diante; sistema segue genérico |
| Super Tie-Break | **Não conta como set**; +2 games ao vencedor (3.3) |
| Substituição | Jogador que saiu não pontua (3.6) |
