import { describe, expect, it } from "vitest";
import type { LinhaClassificacao } from "./classificacao";
import { classificarGeral } from "./geral";

/** Linha de grupo: [id, vitórias, saldo sets, saldo games]; a posição é a ordem no array. */
function grupo(grupoId: string, ...linhas: [string, number, number, number][]) {
  return {
    grupoId,
    linhas: linhas.map(
      ([jogadorId, vitorias, saldoSets, saldoGames], i): LinhaClassificacao => ({
        jogadorId,
        posicao: i + 1,
        jogos: 4,
        vitorias,
        derrotas: 4 - vitorias,
        setsPro: 0,
        setsContra: 0,
        saldoSets,
        saldoGames,
      }),
    ),
  };
}

/** Grupo "padrão" de 5: 4, 3, 2, 1, 0 vitórias; `extra` altera o saldo de games de todos. */
const grupo5 = (g: string, extra = 0) =>
  grupo(g, [`${g}1`, 4, 8, 20 + extra], [`${g}2`, 3, 4, 10 + extra], [`${g}3`, 2, 0, 0 + extra], [`${g}4`, 1, -4, -10 + extra], [`${g}5`, 0, -8, -20 + extra]);

const destinos = (r: ReturnType<typeof classificarGeral>) =>
  Object.fromEntries(r.linhas.map((l) => [l.jogadorId, l.destino]));

describe("8 grupos de 5 (formato atual)", () => {
  const grupos = "ABCDEFGH".split("").map((g, i) => grupo5(g, i));
  const r = classificarGeral(grupos, 16, 16);

  it("1º/2º → Ouro, 3º/4º → Prata, 5º → eliminado", () => {
    const d = destinos(r);
    for (const g of "ABCDEFGH") {
      expect([d[`${g}1`], d[`${g}2`], d[`${g}3`], d[`${g}4`], d[`${g}5`]]).toEqual(["ouro", "ouro", "prata", "prata", "eliminado"]);
    }
    expect(r.linhas.filter((l) => l.destino === "ouro")).toHaveLength(16);
    expect(r.linhas.filter((l) => l.destino === "prata")).toHaveLength(16);
    expect(r.linhas.filter((l) => l.destino === "eliminado")).toHaveLength(8);
  });

  it("todos os 1º antes dos 2º; entre os 1º, melhor saldo primeiro", () => {
    expect(r.linhas.slice(0, 8).every((l) => l.posicaoGrupo === 1)).toBe(true);
    expect(r.linhas[0].jogadorId).toBe("H1"); // maior saldo de games entre os 1º
    expect(r.linhas.map((l) => l.posicao)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
  });

  it("sem empate relevante", () => expect(r.empates).toEqual([]));
});

describe("formato da 2ª Etapa: 6 grupos (5×5 + 1×6), 31 jogadores", () => {
  const grupos = [
    grupo5("A"),
    grupo5("B", -1), // B3 fica 1 game atrás de A3 na disputa da 16ª vaga
    grupo("C", ["C1", 4, 8, 20], ["C2", 3, 4, 10], ["C3", 2, 2, 5], ["C4", 1, -4, -10], ["C5", 0, -8, -20]),
    grupo("D", ["D1", 4, 8, 20], ["D2", 3, 4, 10], ["D3", 2, 0, 3], ["D4", 1, -4, -10], ["D5", 0, -8, -20]),
    grupo("E", ["E1", 4, 8, 20], ["E2", 3, 4, 10], ["E3", 2, 0, -5], ["E4", 1, -4, -10], ["E5", 0, -8, -20]),
    grupo("F", ["F1", 5, 10, 25], ["F2", 4, 6, 15], ["F3", 3, 2, 5], ["F4", 2, -2, -5], ["F5", 1, -6, -15], ["F6", 0, -10, -25]),
  ];
  const r = classificarGeral(grupos, 16, 16);
  const d = destinos(r);

  it("Ouro = 12 (1º/2º) + 4 melhores 3º", () => {
    const ouro = r.linhas.filter((l) => l.destino === "ouro");
    expect(ouro).toHaveLength(16);
    expect(ouro.filter((l) => l.posicaoGrupo === 3).map((l) => l.jogadorId)).toEqual(["F3", "C3", "D3", "A3"]);
  });

  it("os demais 15 vão para a Prata (incluindo 5º e 6º) e ninguém é eliminado", () => {
    expect(r.linhas.filter((l) => l.destino === "prata")).toHaveLength(15);
    expect([d.E3, d.A5, d.F6]).toEqual(["prata", "prata", "prata"]);
    expect(r.linhas.some((l) => l.destino === "eliminado")).toBe(false);
    expect(r.empates).toEqual([]);
  });
});

describe("empate total na linha de corte", () => {
  // Dois 3º colocados idênticos disputando a última vaga da Ouro (vagas = 3).
  const grupos = [
    grupo("A", ["A1", 4, 8, 20], ["A2", 2, 0, 0]),
    grupo("B", ["B1", 4, 8, 15], ["B2", 2, 0, 0]),
  ];

  it("é sinalizado quando decide a vaga", () => {
    expect(classificarGeral(grupos, 3, 1).empates).toEqual([["A2", "B2"]]);
  });

  it("não é sinalizado quando os dois ficam na mesma chave", () => {
    expect(classificarGeral(grupos, 4, 0).empates).toEqual([]);
  });

  it("ordem manual resolve e define quem entra", () => {
    const r = classificarGeral(grupos, 3, 1, ["B2", "A2"]);
    expect(r.empates).toEqual([]);
    expect(destinos(r)).toMatchObject({ B2: "ouro", A2: "prata" });
  });
});
