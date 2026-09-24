import type { Partida, SetPlacar } from "../types";

/** "6-3" → set normal; "stb 10-7" → super tie-break. */
export function sets(...s: string[]): SetPlacar[] {
  return s.map((txt) => {
    const stb = txt.startsWith("stb ");
    const [g1, g2] = txt.replace("stb ", "").split("-").map(Number);
    return stb ? { games1: g1, games2: g2, superTieBreak: true } : { games1: g1, games2: g2 };
  });
}

let seq = 0;

/** Partida de grupo para testes; sem placar = pendente. */
export function jogo(j1: string, j2: string, ...placar: string[]): Partida {
  return { id: `p${seq++}`, etapaId: "e", grupoId: "g", fase: "grupo", jogador1Id: j1, jogador2Id: j2, sets: sets(...placar), vencedorId: null };
}
