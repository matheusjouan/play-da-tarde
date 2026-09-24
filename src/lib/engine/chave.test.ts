import { describe, expect, it } from "vitest";
import { definirSeeds, montarChave, ordemSeeds, proximoJogo, tamanhoChave, FASES_POR_TAMANHO } from "./chave";
import type { LinhaGeral } from "./geral";

const seeds = (n: number) => Array.from({ length: n }, (_, i) => `s${i + 1}`);
const num = (id: string | null) => (id ? Number(id.slice(1)) : null);
const pares = (jogos: ReturnType<typeof montarChave>, fase: string) =>
  jogos.filter((j) => j.fase === fase).map((j) => [num(j.jogador1Id), num(j.jogador2Id)]);

describe("ordemSeeds / soma 17", () => {
  it("chave de 16 na ordem da SPEC", () => {
    expect(pares(montarChave(seeds(16)), "oitavas")).toEqual([
      [1, 16], [8, 9], [5, 12], [4, 13], [3, 14], [6, 11], [7, 10], [2, 15],
    ]);
  });

  it.each([2, 4, 8, 16])("chave de %i: todo jogo da 1ª rodada soma p+1", (p) => {
    const o = ordemSeeds(p);
    for (let i = 0; i < p; i += 2) expect(o[i] + o[i + 1]).toBe(p + 1);
    expect(new Set(o).size).toBe(p);
  });

  it("#1 e #2 em metades opostas; #1–#4 em quadrantes diferentes", () => {
    const o = ordemSeeds(16);
    const quadrante = (s: number) => Math.floor(o.indexOf(s) / 4);
    expect(o.indexOf(1) < 8 && o.indexOf(2) >= 8).toBe(true);
    expect(new Set([1, 2, 3, 4].map(quadrante)).size).toBe(4);
  });
});

describe("tamanhoChave", () => {
  it.each([[2, 2], [3, 4], [8, 8], [12, 16], [15, 16], [16, 16]])("%i jogadores → chave de %i", (n, p) =>
    expect(tamanhoChave(n)).toBe(p));
  it("mais de 16 não é suportado", () => expect(() => tamanhoChave(17)).toThrow());
});

describe("montarChave", () => {
  it("16 jogadores: 8+4+2+1 = 15 jogos, sem bye", () => {
    const jogos = montarChave(seeds(16));
    expect(jogos).toHaveLength(15);
    expect(jogos.some((j) => j.vencedorId)).toBe(false);
  });

  it("15 jogadores (Prata da 2ª Etapa): #1 tem bye e já está nas quartas", () => {
    const jogos = montarChave(seeds(15));
    const primeiro = jogos.find((j) => j.fase === "oitavas" && j.slot === 0)!;
    expect([num(primeiro.jogador1Id), primeiro.jogador2Id, num(primeiro.vencedorId)]).toEqual([1, null, 1]);
    expect(num(jogos.find((j) => j.fase === "quartas" && j.slot === 0)!.jogador1Id)).toBe(1);
    expect(jogos.filter((j) => j.fase === "oitavas" && j.vencedorId)).toHaveLength(1);
  });

  it("12 jogadores: #1 a #4 têm bye", () => {
    const byes = montarChave(seeds(12)).filter((j) => j.fase === "oitavas" && j.vencedorId);
    expect(byes.map((j) => num(j.vencedorId)).sort()).toEqual([1, 2, 3, 4]);
  });

  it("8 jogadores começa nas quartas", () => {
    expect(pares(montarChave(seeds(8)), "quartas")).toEqual([[1, 8], [4, 5], [3, 6], [2, 7]]);
  });

  it("2 jogadores = só a final", () => {
    expect(pares(montarChave(seeds(2)), "final")).toEqual([[1, 2]]);
  });
});

describe("proximoJogo", () => {
  const f = FASES_POR_TAMANHO[16];
  it("oitavas 0 e 1 → quartas 0 (lados 1 e 2); final → fim", () => {
    expect(proximoJogo(f, "oitavas", 0)).toEqual({ fase: "quartas", slot: 0, lado: 1 });
    expect(proximoJogo(f, "oitavas", 1)).toEqual({ fase: "quartas", slot: 0, lado: 2 });
    expect(proximoJogo(f, "semi", 1)).toEqual({ fase: "final", slot: 0, lado: 2 });
    expect(proximoJogo(f, "final", 0)).toBeNull();
  });
});

describe("definirSeeds", () => {
  const linha = (jogadorId: string, vitorias: number, saldoSets: number, saldoGames: number, posicao: number): LinhaGeral => ({
    jogadorId, vitorias, saldoSets, saldoGames, posicao, posicaoGrupo: 1, grupoId: "g", destino: "ouro",
    jogos: 4, derrotas: 4 - vitorias, setsPro: 0, setsContra: 0,
  });

  it("vitórias > saldo de sets > saldo de games (um 2º de grupo pode ser seed #1)", () => {
    const r = definirSeeds([linha("a", 3, 4, 10, 1), linha("b", 4, 6, 12, 9), linha("c", 3, 4, 12, 2)]);
    expect(r.seeds).toEqual(["b", "c", "a"]);
    expect(r.empates).toEqual([]);
  });

  it("empate total mantém a ordem da classificação geral e é sinalizado", () => {
    const r = definirSeeds([linha("a", 3, 4, 10, 1), linha("b", 3, 4, 10, 2), linha("c", 1, 0, 0, 3)]);
    expect(r.seeds).toEqual(["a", "b", "c"]);
    expect(r.empates).toEqual([["a", "b"]]);
  });
});
