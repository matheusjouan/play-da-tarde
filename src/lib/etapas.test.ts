import { describe, expect, it } from "vitest";
import { agruparPorTemporada, numeroEmUso, ordenarEtapas, proximoNumero } from "./etapas";

const e = (nome: string, numero: number, temporada?: number) => ({ nome, numero, temporada });

describe("virada de temporada", () => {
  const etapas = [e("2ª 2026", 2), e("3ª 2026", 3, 2026), e("Finals 2026", 4, 2026), e("1ª 2027", 1, 2027)];

  it("mais recente = maior temporada, depois maior número (1ª 2027 vem antes da 3ª 2026)", () => {
    expect(ordenarEtapas(etapas).map((x) => x.nome)).toEqual(["1ª 2027", "Finals 2026", "3ª 2026", "2ª 2026"]);
  });

  it("agrupa por temporada (sem temporada = 2026)", () => {
    expect(agruparPorTemporada(etapas).map(([t, l]) => [t, l.map((x) => x.nome)])).toEqual([
      [2027, ["1ª 2027"]],
      [2026, ["Finals 2026", "3ª 2026", "2ª 2026"]],
    ]);
  });

  it("número único só dentro da temporada", () => {
    expect(numeroEmUso(etapas, 1, 2027)).toBe(true);
    expect(numeroEmUso(etapas, 2, 2027)).toBe(false);
    expect(numeroEmUso(etapas, 2, 2026)).toBe(true);
  });

  it("próximo número recomeça em cada temporada", () => {
    expect(proximoNumero(etapas, 2026)).toBe(5);
    expect(proximoNumero(etapas, 2027)).toBe(2);
    expect(proximoNumero(etapas, 2028)).toBe(1);
  });
});
