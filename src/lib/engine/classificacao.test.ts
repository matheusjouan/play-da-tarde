import { describe, expect, it } from "vitest";
import { calcularEstatisticas, classificarGrupo } from "./classificacao";
import { gerarConfrontos } from "./confrontos";
import { jogo } from "./testUtils";

const resumo = (c: ReturnType<typeof classificarGrupo>) =>
  c.linhas.map((l) => [l.posicao, l.jogadorId, l.vitorias, l.derrotas, l.saldoSets, l.saldoGames]);

describe("regra do super tie-break (SPEC 3.3)", () => {
  it("Matheus 6x3 4x6 STB 10x3 Thiago → Matheus sets 0 / games +3; Thiago sets 0 / games −1", () => {
    const [matheus, thiago] = calcularEstatisticas(["Matheus", "Thiago"], [jogo("Matheus", "Thiago", "6-3", "4-6", "stb 10-3")]);
    expect(matheus).toMatchObject({ vitorias: 1, derrotas: 0, saldoSets: 0, saldoGames: 3 });
    expect(thiago).toMatchObject({ vitorias: 0, derrotas: 1, saldoSets: 0, saldoGames: -1 });
  });

  it("perdedor do STB não perde os 2 games do bônus", () => {
    const [, b] = calcularEstatisticas(["A", "B"], [jogo("A", "B", "4-6", "6-4", "stb 10-8")]);
    expect(b.saldoGames).toBe(0);
  });
});

describe("W.O. (6x0 6x0) conta como jogo normal", () => {
  it("vencedor +2 sets e +12 games", () => {
    const [a, b] = calcularEstatisticas(["A", "B"], [jogo("A", "B", "6-0", "6-0")]);
    expect(a).toMatchObject({ jogos: 1, vitorias: 1, saldoSets: 2, saldoGames: 12 });
    expect(b).toMatchObject({ jogos: 1, derrotas: 1, saldoSets: -2, saldoGames: -12 });
  });
});

describe("caso real — Grupo H (docs/dados/teste-grupo-h.md)", () => {
  const T = "Rodrigo Tição", R = "Radislei (Japão)", D = "Diego Souza", L = "Luiz Gustavo Lanzoni", F = "Felipe Siqueira";
  const partidas = [
    jogo(T, L, "6-3", "6-2"),
    jogo(T, D, "6-1", "6-0"),
    jogo(T, R), // pendentes (sem placar)
    jogo(T, F),
    jogo(L, D),
    jogo(L, R),
    jogo(L, F),
    jogo(D, R),
    jogo(D, F, "6-3", "6-1"),
    jogo(R, F, "4-6", "6-2", "stb 10-7"),
  ];

  it("reproduz exatamente a planilha da organização", () => {
    expect(resumo(classificarGrupo([T, L, D, R, F], partidas))).toEqual([
      [1, T, 2, 0, 4, 18],
      [2, R, 1, 0, 0, 4],
      [3, D, 1, 1, 0, -3],
      [4, L, 0, 1, -2, -7],
      [5, F, 0, 2, -2, -10],
    ]);
  });
});

describe("desempate", () => {
  it("vitórias > saldo de sets > saldo de games", () => {
    const c = classificarGrupo(
      ["A", "B", "C", "D"],
      [
        jogo("A", "D", "6-4", "6-4"), // A: 1V, +2 sets, +4 games
        jogo("B", "D", "6-4", "4-6", "stb 10-5"), // B: 1V, 0 sets
        jogo("C", "D", "6-0", "6-0"), // C: 1V, +2 sets, +12 games
      ],
    );
    expect(c.linhas.map((l) => l.jogadorId)).toEqual(["C", "A", "B", "D"]);
    expect(c.empates).toEqual([]);
  });

  it("empate total em cadeia (A>B, B>C, C>A com placares iguais) → aviso", () => {
    const partidas = [jogo("A", "B", "6-4", "6-4"), jogo("B", "C", "6-4", "6-4"), jogo("C", "A", "6-4", "6-4")];
    const c = classificarGrupo(["A", "B", "C"], partidas);
    expect(c.linhas.every((l) => l.vitorias === 1 && l.saldoSets === 0 && l.saldoGames === 0)).toBe(true);
    expect(c.empates).toEqual([["A", "B", "C"]]);
  });

  it("empate total resolvido pela ordem manual do admin", () => {
    const partidas = [jogo("A", "B", "6-4", "6-4"), jogo("B", "C", "6-4", "6-4"), jogo("C", "A", "6-4", "6-4")];
    const c = classificarGrupo(["A", "B", "C"], partidas, ["C", "A", "B"]);
    expect(c.linhas.map((l) => l.jogadorId)).toEqual(["C", "A", "B"]);
    expect(c.empates).toEqual([]);
  });

  it("empate parcial resolvido só em parte continua com aviso", () => {
    const partidas = [jogo("A", "B", "6-4", "6-4"), jogo("B", "C", "6-4", "6-4"), jogo("C", "A", "6-4", "6-4")];
    expect(classificarGrupo(["A", "B", "C"], partidas, ["C"]).empates).toEqual([["C", "A", "B"]]);
  });

  it("jogadores sem jogos não geram aviso de empate", () => {
    expect(classificarGrupo(["A", "B", "C"], []).empates).toEqual([]);
  });
});

describe("grupo de 6 completo", () => {
  it("15 jogos, total de vitórias = total de derrotas = 15, saldos somam zero sem STB", () => {
    const ids = ["j1", "j2", "j3", "j4", "j5", "j6"];
    // o jogador de menor número sempre vence 6-2 6-3
    const partidas = gerarConfrontos(ids).map(([a, b]) => (a < b ? jogo(a, b, "6-2", "6-3") : jogo(a, b, "2-6", "3-6")));
    const c = classificarGrupo(ids, partidas);
    expect(c.linhas.map((l) => l.jogadorId)).toEqual(ids);
    expect(c.linhas.map((l) => l.vitorias)).toEqual([5, 4, 3, 2, 1, 0]);
    expect(c.linhas.reduce((s, l) => s + l.vitorias, 0)).toBe(15);
    expect(c.linhas.reduce((s, l) => s + l.derrotas, 0)).toBe(15);
    expect(c.linhas.reduce((s, l) => s + l.saldoGames, 0)).toBe(0);
    expect(c.linhas.every((l) => l.jogos === 5)).toBe(true);
  });

  it("ignora placar inválido (ex.: 6x5) como jogo pendente", () => {
    const [a] = calcularEstatisticas(["A", "B"], [jogo("A", "B", "6-5", "6-3")]);
    expect(a.jogos).toBe(0);
  });
});
