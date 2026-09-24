import { describe, expect, it } from "vitest";
import { limparNome, normalizarNome } from "./nomes";

describe("nomes", () => {
  it("limpa espaços extras", () => {
    expect(limparNome("  Felipe   Siqueira ")).toBe("Felipe Siqueira");
  });

  it("normaliza acentos, caixa e espaços", () => {
    expect(normalizarNome("José  Inocêncio")).toBe("jose inocencio");
    expect(normalizarNome("JOSE INOCENCIO")).toBe(normalizarNome("José Inocêncio"));
    expect(normalizarNome("Radislei Mariano (Japão)")).toBe("radislei mariano (japao)");
  });
});
