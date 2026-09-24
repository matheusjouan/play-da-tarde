import { describe, expect, it } from "vitest";
import { ehWO, setNormalValido, superTieBreakValido, validarPlacar } from "./placar";
import { sets } from "./testUtils";

describe("setNormalValido", () => {
  it.each([
    [6, 0], [6, 4], [4, 6], [7, 5], [7, 6], [6, 7],
  ])("%i-%i é válido", (a, b) => expect(setNormalValido(a, b)).toBe(true));

  it.each([
    [6, 5], [7, 4], [8, 6], [5, 3], [6, 6], [0, 0],
  ])("%i-%i é inválido", (a, b) => expect(setNormalValido(a, b)).toBe(false));
});

describe("superTieBreakValido", () => {
  it.each([[10, 0], [10, 8], [7, 10], [12, 10], [15, 13]])("%i-%i é válido", (a, b) =>
    expect(superTieBreakValido(a, b)).toBe(true));
  it.each([[10, 9], [9, 7], [13, 10], [11, 10], [10, 10]])("%i-%i é inválido", (a, b) =>
    expect(superTieBreakValido(a, b)).toBe(false));
});

describe("validarPlacar", () => {
  it("2 sets a 0", () => {
    expect(validarPlacar(sets("6-4", "7-5"))).toMatchObject({ ok: true, vencedor: 1, setsJ1: 2, setsJ2: 0, superTieBreak: false });
    expect(validarPlacar(sets("4-6", "6-7"))).toMatchObject({ ok: true, vencedor: 2, setsJ1: 0, setsJ2: 2 });
  });

  it("1 set a 1 decidido no super tie-break", () => {
    expect(validarPlacar(sets("6-3", "4-6", "stb 10-3"))).toMatchObject({ ok: true, vencedor: 1, setsJ1: 1, setsJ2: 1, superTieBreak: true });
    expect(validarPlacar(sets("6-3", "4-6", "stb 8-10"))).toMatchObject({ ok: true, vencedor: 2 });
  });

  it.each([
    [["6-5", "6-3"], "set inválido"],
    [["6-3"], "pelo menos 2 sets"],
    [["6-3", "4-6"], "informe o super tie-break"],
    [["6-3", "4-6", "6-4"], "é super tie-break"],
    [["6-3", "4-6", "stb 10-9"], "Super tie-break inválido"],
    [["6-3", "6-4", "stb 10-3"], "não tem 3º set"],
    [["stb 10-3", "6-4"], "não pode ser super tie-break"],
  ])("rejeita %j", (s, erro) => {
    const r = validarPlacar(sets(...s));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toContain(erro);
  });
});

describe("ehWO", () => {
  it("6x0 6x0 em qualquer direção", () => {
    expect(ehWO(sets("6-0", "6-0"))).toBe(true);
    expect(ehWO(sets("0-6", "0-6"))).toBe(true);
    expect(ehWO(sets("6-0", "6-1"))).toBe(false);
  });
});
