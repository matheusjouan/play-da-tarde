import type { SetPlacar } from "../types";

// Regras de placar (docs/SPEC.md, 3.3 e 3.4).

export type ResultadoPlacar =
  | { ok: true; vencedor: 1 | 2; setsJ1: number; setsJ2: number; superTieBreak: boolean }
  | { ok: false; erro: string };

/** Set normal válido: 6x0…6x4, 7x5, 7x6 (em qualquer direção). */
export function setNormalValido(a: number, b: number): boolean {
  const [maior, menor] = a > b ? [a, b] : [b, a];
  if (maior === 6) return menor >= 0 && menor <= 4;
  if (maior === 7) return menor === 5 || menor === 6;
  return false;
}

/** Super tie-break válido: mínimo 10 pontos e 2 de diferença (se passar de 10, diferença exata de 2). */
export function superTieBreakValido(a: number, b: number): boolean {
  const [maior, menor] = a > b ? [a, b] : [b, a];
  if (maior < 10 || menor < 0) return false;
  return maior === 10 ? maior - menor >= 2 : maior - menor === 2;
}

const inteiro = (n: number) => Number.isInteger(n) && n >= 0;

export function validarPlacar(sets: SetPlacar[]): ResultadoPlacar {
  if (sets.length < 2) return { ok: false, erro: "Informe pelo menos 2 sets." };
  if (sets.length > 3) return { ok: false, erro: "Máximo de 3 sets (o 3º é super tie-break)." };
  if (sets.some((s) => !inteiro(s.games1) || !inteiro(s.games2))) return { ok: false, erro: "Placar inválido." };

  const [s1, s2, s3] = sets;
  for (const [i, s] of [s1, s2].entries()) {
    if (s.superTieBreak) return { ok: false, erro: `O ${i + 1}º set não pode ser super tie-break.` };
    if (!setNormalValido(s.games1, s.games2)) {
      return { ok: false, erro: `${i + 1}º set inválido (${s.games1}x${s.games2}). Válidos: 6x0 a 6x4, 7x5, 7x6.` };
    }
  }

  const setsJ1 = (s1.games1 > s1.games2 ? 1 : 0) + (s2.games1 > s2.games2 ? 1 : 0);
  const setsJ2 = 2 - setsJ1;

  if (setsJ1 !== 1) {
    if (s3) return { ok: false, erro: "Jogo decidido em 2 sets não tem 3º set." };
    return { ok: true, vencedor: setsJ1 === 2 ? 1 : 2, setsJ1, setsJ2, superTieBreak: false };
  }

  if (!s3) return { ok: false, erro: "1 set a 1: informe o super tie-break." };
  if (!s3.superTieBreak) return { ok: false, erro: "Em 1 set a 1, o 3º set é super tie-break." };
  if (!superTieBreakValido(s3.games1, s3.games2)) {
    return { ok: false, erro: `Super tie-break inválido (${s3.games1}x${s3.games2}). Mínimo 10 pontos e 2 de diferença.` };
  }
  return { ok: true, vencedor: s3.games1 > s3.games2 ? 1 : 2, setsJ1, setsJ2, superTieBreak: true };
}

/** W.O. é lançado como 6x0 6x0 — só usado para exibir a tag; não altera nenhum cálculo. */
export function ehWO(sets: SetPlacar[]): boolean {
  return (
    sets.length === 2 &&
    sets.every((s) => !s.superTieBreak) &&
    ((sets[0].games1 === 6 && sets[0].games2 === 0 && sets[1].games1 === 6 && sets[1].games2 === 0) ||
      (sets[0].games1 === 0 && sets[0].games2 === 6 && sets[1].games1 === 0 && sets[1].games2 === 6))
  );
}
