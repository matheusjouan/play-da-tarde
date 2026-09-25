import { NOME_FASE } from "@/lib/engine/chave";
import type { Partida, SetPlacar } from "@/lib/types";

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

/** "25/09/2026" (hora local do aparelho). */
export function dataCurta(d: Date): string {
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Título do jogo nos cards de Recentes: "Grupo H", "Ouro · Quartas", "Finals · Final". */
export function rotuloPartida(p: Pick<Partida, "fase" | "chave">, nomeGrupo?: string, ehFinals = false): string {
  if (p.fase === "grupo") return nomeGrupo ?? "Grupo";
  const chave = ehFinals ? "Finals" : p.chave === "prata" ? "Prata" : "Ouro";
  return `${chave} · ${NOME_FASE[p.fase]}`;
}
