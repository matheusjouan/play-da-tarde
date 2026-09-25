import { describe, expect, it } from "vitest";
import { dataCurta, placarTexto, rotuloPartida, saldo } from "./formato";

describe("formato", () => {
  it("placar em texto com super tie-break", () => {
    expect(placarTexto([{ games1: 6, games2: 3 }, { games1: 4, games2: 6 }, { games1: 10, games2: 7, superTieBreak: true }])).toBe(
      "6-3  4-6  [10-7]",
    );
  });

  it("saldo com sinal", () => {
    expect(saldo(4)).toBe("+4");
    expect(saldo(0)).toBe("0");
    expect(saldo(-3)).toBe("−3");
  });

  it("data curta com zeros à esquerda", () => {
    expect(dataCurta(new Date(2026, 8, 25, 14, 32))).toBe("25/09/2026");
    expect(dataCurta(new Date(2026, 0, 5))).toBe("05/01/2026");
  });

  it("rótulo do jogo: grupo, chave e Finals", () => {
    expect(rotuloPartida({ fase: "grupo" }, "Grupo H")).toBe("Grupo H");
    expect(rotuloPartida({ fase: "quartas", chave: "ouro" })).toBe("Ouro · Quartas");
    expect(rotuloPartida({ fase: "final", chave: "prata" })).toBe("Prata · Final");
    expect(rotuloPartida({ fase: "semi", chave: "ouro" }, undefined, true)).toBe("Finals · Semi");
  });
});
