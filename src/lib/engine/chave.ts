import type { FasePartida } from "../types";
import type { LinhaGeral } from "./geral";

// Chaveamento mata-mata (docs/SPEC.md, 3.7).

export type FaseMM = Exclude<FasePartida, "grupo">;

export const FASES_POR_TAMANHO: Record<number, FaseMM[]> = {
  2: ["final"],
  4: ["semi", "final"],
  8: ["quartas", "semi", "final"],
  16: ["oitavas", "quartas", "semi", "final"],
};

export const NOME_FASE: Record<FaseMM, string> = { oitavas: "Oitavas", quartas: "Quartas", semi: "Semi", final: "Final" };

/** Próxima potência de 2 ≥ n (máx. 16). */
export function tamanhoChave(n: number): number {
  if (n < 2) throw new Error("A chave precisa de pelo menos 2 jogadores.");
  let p = 2;
  while (p < n) p *= 2;
  if (p > 16) throw new Error("Chave com mais de 16 jogadores não é suportada.");
  return p;
}

/**
 * Ordem dos seeds nas posições da chave (de cima para baixo). Cada par de posições é um jogo
 * e os seeds de cada jogo somam p+1 (soma 17 na chave de 16). #1 no topo e #2 embaixo:
 * só se encontram na final. Para 16: 1×16, 8×9, 5×12, 4×13 | 3×14, 6×11, 7×10, 2×15.
 */
export function ordemSeeds(p: number): number[] {
  let ordem = [1, 2];
  for (let n = 4; n <= p; n *= 2) {
    ordem = ordem.flatMap((s, i) => (i % 2 === 0 ? [s, n + 1 - s] : [n + 1 - s, s]));
  }
  return ordem;
}

export type JogoChave = {
  fase: FaseMM;
  slot: number;
  jogador1Id: string | null;
  jogador2Id: string | null;
  vencedorId: string | null;
};

/** Onde o vencedor de um jogo joga a seguir (slot par → lado 1, ímpar → lado 2). */
export function proximoJogo(fases: FaseMM[], fase: FaseMM, slot: number): { fase: FaseMM; slot: number; lado: 1 | 2 } | null {
  const i = fases.indexOf(fase);
  if (i === -1 || i === fases.length - 1) return null;
  return { fase: fases[i + 1], slot: Math.floor(slot / 2), lado: slot % 2 === 0 ? 1 : 2 };
}

/**
 * Monta todos os jogos da chave a partir dos seeds (seeds[0] = #1).
 * Seeds ausentes viram bye: o adversário já avança para a rodada seguinte.
 */
export function montarChave(seeds: string[]): JogoChave[] {
  const p = tamanhoChave(seeds.length);
  const fases = FASES_POR_TAMANHO[p];
  const ordem = ordemSeeds(p);
  const jogos: JogoChave[] = [];

  for (let slot = 0; slot < p / 2; slot++) {
    const [sa, sb] = [ordem[2 * slot], ordem[2 * slot + 1]].sort((a, b) => a - b); // melhor seed como jogador 1
    const a = seeds[sa - 1] ?? null;
    const b = seeds[sb - 1] ?? null;
    jogos.push({ fase: fases[0], slot, jogador1Id: a, jogador2Id: b, vencedorId: a && b ? null : (a ?? b) });
  }
  for (let r = 1; r < fases.length; r++) {
    for (let slot = 0; slot < p / 2 ** (r + 1); slot++) {
      jogos.push({ fase: fases[r], slot, jogador1Id: null, jogador2Id: null, vencedorId: null });
    }
  }

  // Byes: o vencedor automático já ocupa sua vaga na rodada seguinte.
  for (const j of jogos.filter((j) => j.fase === fases[0] && j.vencedorId)) {
    const prox = proximoJogo(fases, j.fase, j.slot);
    const alvo = prox && jogos.find((x) => x.fase === prox.fase && x.slot === prox.slot);
    if (alvo) alvo[prox.lado === 1 ? "jogador1Id" : "jogador2Id"] = j.vencedorId;
  }
  return jogos;
}

/**
 * Seeds dos classificados de uma chave: vitórias → saldo de sets → saldo de games.
 * Em empate total vale a ordem da classificação geral (entrada) e o bloco é devolvido em `empates`
 * para o admin conferir/ajustar.
 */
export function definirSeeds(linhas: LinhaGeral[]): { seeds: string[]; empates: string[][] } {
  const ordenadas = [...linhas].sort((a, b) => b.vitorias - a.vitorias || b.saldoSets - a.saldoSets || b.saldoGames - a.saldoGames);
  const empates: string[][] = [];
  for (let i = 0; i < ordenadas.length; ) {
    let j = i + 1;
    while (
      j < ordenadas.length &&
      ordenadas[j].vitorias === ordenadas[i].vitorias &&
      ordenadas[j].saldoSets === ordenadas[i].saldoSets &&
      ordenadas[j].saldoGames === ordenadas[i].saldoGames
    )
      j++;
    if (j - i > 1) empates.push(ordenadas.slice(i, j).map((l) => l.jogadorId));
    i = j;
  }
  return { seeds: ordenadas.map((l) => l.jogadorId), empates };
}
