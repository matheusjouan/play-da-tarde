import type { Partida } from "../types";
import { validarPlacar } from "./placar";

// Classificação de grupo e geral (docs/SPEC.md, 3.3 e 3.5).

export type LinhaClassificacao = {
  jogadorId: string;
  posicao: number;
  jogos: number;
  vitorias: number;
  derrotas: number;
  setsPro: number;
  setsContra: number;
  saldoSets: number;
  /** Games dos 2 primeiros sets (pró − contra) + 2 por super tie-break vencido. */
  saldoGames: number;
};

export type Classificacao = {
  linhas: LinhaClassificacao[];
  /** Grupos de jogadores em empate total (V, saldo sets e saldo games iguais) sem ordem manual definida. */
  empates: string[][];
};

/** Bônus de games para o vencedor do super tie-break (o perdedor não perde nada). */
export const BONUS_SUPER_TIE_BREAK = 2;

/** Estatísticas de cada jogador. Partidas sem placar válido (pendentes) são ignoradas. */
export function calcularEstatisticas(jogadorIds: string[], partidas: Partida[]): Omit<LinhaClassificacao, "posicao">[] {
  const linhas = new Map(
    jogadorIds.map((id) => [
      id,
      { jogadorId: id, jogos: 0, vitorias: 0, derrotas: 0, setsPro: 0, setsContra: 0, saldoSets: 0, saldoGames: 0 },
    ]),
  );

  for (const p of partidas) {
    const l1 = p.jogador1Id ? linhas.get(p.jogador1Id) : undefined;
    const l2 = p.jogador2Id ? linhas.get(p.jogador2Id) : undefined;
    if (!l1 || !l2) continue;
    const r = validarPlacar(p.sets);
    if (!r.ok) continue;

    // Só os 2 sets normais contam games; o super tie-break não conta como set nem como games.
    const [s1, s2] = p.sets;
    const games1 = s1.games1 + s2.games1;
    const games2 = s1.games2 + s2.games2;
    const [venc, perd] = r.vencedor === 1 ? [l1, l2] : [l2, l1];

    for (const [l, setsPro, setsContra, gamesSaldo] of [
      [l1, r.setsJ1, r.setsJ2, games1 - games2],
      [l2, r.setsJ2, r.setsJ1, games2 - games1],
    ] as const) {
      l.jogos++;
      l.setsPro += setsPro;
      l.setsContra += setsContra;
      l.saldoSets += setsPro - setsContra;
      l.saldoGames += gamesSaldo;
    }
    venc.vitorias++;
    perd.derrotas++;
    if (r.superTieBreak) venc.saldoGames += BONUS_SUPER_TIE_BREAK;
  }
  return [...linhas.values()];
}

const empatados = (a: Omit<LinhaClassificacao, "posicao">, b: Omit<LinhaClassificacao, "posicao">) =>
  a.vitorias === b.vitorias && a.saldoSets === b.saldoSets && a.saldoGames === b.saldoGames;

/**
 * Ordena: vitórias → saldo de sets → saldo de games → ordem manual do admin.
 * Empate total sem ordem manual completa é devolvido em `empates` (a UI avisa o admin).
 * Jogadores sem nenhum jogo não geram aviso de empate.
 */
export function ordenarClassificacao(
  estatisticas: Omit<LinhaClassificacao, "posicao">[],
  desempateManual: string[] = [],
): Classificacao {
  const ordemManual = (id: string) => {
    const i = desempateManual.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  const ordemOriginal = new Map(estatisticas.map((l, i) => [l.jogadorId, i]));

  const ordenadas = [...estatisticas].sort(
    (a, b) =>
      b.vitorias - a.vitorias ||
      b.saldoSets - a.saldoSets ||
      b.saldoGames - a.saldoGames ||
      ordemManual(a.jogadorId) - ordemManual(b.jogadorId) ||
      ordemOriginal.get(a.jogadorId)! - ordemOriginal.get(b.jogadorId)!,
  );

  // Blocos consecutivos de empate total.
  const empates: string[][] = [];
  for (let i = 0; i < ordenadas.length; ) {
    let j = i + 1;
    while (j < ordenadas.length && empatados(ordenadas[i], ordenadas[j])) j++;
    const bloco = ordenadas.slice(i, j);
    const resolvido = bloco.every((l) => desempateManual.includes(l.jogadorId));
    if (bloco.length > 1 && !resolvido && bloco.some((l) => l.jogos > 0)) empates.push(bloco.map((l) => l.jogadorId));
    i = j;
  }

  return { linhas: ordenadas.map((l, i) => ({ ...l, posicao: i + 1 })), empates };
}

/** Atalho: estatísticas + ordenação de um grupo. */
export function classificarGrupo(jogadorIds: string[], partidas: Partida[], desempateManual?: string[]): Classificacao {
  return ordenarClassificacao(calcularEstatisticas(jogadorIds, partidas), desempateManual);
}
