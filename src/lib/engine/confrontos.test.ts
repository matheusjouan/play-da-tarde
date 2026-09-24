import { describe, expect, it } from "vitest";
import { chavePar, gerarConfrontos } from "./confrontos";

const jogadores = (n: number) => Array.from({ length: n }, (_, i) => `j${i + 1}`);

describe("gerarConfrontos", () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 1],
    [5, 10],
    [6, 15],
  ])("%i jogadores → %i confrontos", (n, esperado) => {
    expect(gerarConfrontos(jogadores(n))).toHaveLength(esperado);
  });

  it.each([5, 6])("grupo de %i: todos enfrentam todos exatamente uma vez", (n) => {
    const ids = jogadores(n);
    const pares = gerarConfrontos(ids);
    expect(new Set(pares.map(([a, b]) => chavePar(a, b))).size).toBe(pares.length);
    for (const id of ids) {
      expect(pares.filter((p) => p.includes(id))).toHaveLength(n - 1);
    }
    expect(pares.some(([a, b]) => a === b)).toBe(false);
  });

  it("chavePar independe da ordem", () => {
    expect(chavePar("b", "a")).toBe(chavePar("a", "b"));
  });
});
