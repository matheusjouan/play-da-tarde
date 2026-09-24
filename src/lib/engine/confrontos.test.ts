import { describe, expect, it } from "vitest";
import { chavePar, gerarConfrontos, planejarSubstituicao } from "./confrontos";

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

  it("substituição: remove os 4 jogos do antigo, cria 4 do novo, mantém os outros 6", () => {
    const ids = jogadores(5);
    const plano = planejarSubstituicao(ids, "j3", "novo");
    expect(plano.jogadorIds).toEqual(["j1", "j2", "novo", "j4", "j5"]);
    expect(plano.remover).toHaveLength(4);
    expect(plano.remover.every((p) => p.includes("j3"))).toBe(true);
    expect(plano.criar).toHaveLength(4);
    expect(plano.criar.every((p) => p.includes("novo") && !p.includes("j3"))).toBe(true);

    // Resultado final = todos contra todos do grupo novo.
    const antes = new Set(gerarConfrontos(ids).map(([a, b]) => chavePar(a, b)));
    plano.remover.forEach(([a, b]) => antes.delete(chavePar(a, b)));
    plano.criar.forEach(([a, b]) => antes.add(chavePar(a, b)));
    expect([...antes].sort()).toEqual(gerarConfrontos(plano.jogadorIds).map(([a, b]) => chavePar(a, b)).sort());
  });

  it("substituição inválida", () => {
    expect(() => planejarSubstituicao(["a", "b"], "x", "c")).toThrow();
    expect(() => planejarSubstituicao(["a", "b"], "a", "b")).toThrow();
  });

  it("chavePar independe da ordem", () => {
    expect(chavePar("b", "a")).toBe(chavePar("a", "b"));
  });
});
