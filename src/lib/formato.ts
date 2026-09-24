import type { SetPlacar } from "@/lib/types";

/** "6-3 4-6 [10-7]" — do ponto de vista do jogador 1. */
export function placarTexto(sets: SetPlacar[]): string {
  return sets.map((s) => (s.superTieBreak ? `[${s.games1}-${s.games2}]` : `${s.games1}-${s.games2}`)).join("  ");
}

/** +4, 0, −3 */
export function saldo(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}
