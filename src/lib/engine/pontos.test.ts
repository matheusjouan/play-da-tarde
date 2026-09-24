import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PONTOS_GRUPO_PADRAO, PONTOS_MATA_MATA_PADRAO } from "../defaults";
import { montarChave } from "./chave";
import type { LinhaGeral } from "./geral";
import { casarJogador, lerCsv } from "./importacao";
import { calcularPontosEtapa, faseAlcancada } from "./pontos";
import { empateNoCorte, montarRank } from "./rank";

const tabelas = { tabela_pontos_grupo: PONTOS_GRUPO_PADRAO, tabela_pontos_mata_mata: PONTOS_MATA_MATA_PADRAO };

/** Chave montada e jogada: o melhor seed sempre vence. */
function chaveJogada(seeds: string[], chave: "ouro" | "prata") {
  const jogos = montarChave(seeds).map((j) => ({ ...j, chave }));
  for (const j of jogos) {
    if (j.jogador1Id && j.jogador2Id) j.vencedorId = seeds.indexOf(j.jogador1Id) < seeds.indexOf(j.jogador2Id) ? j.jogador1Id : j.jogador2Id;
    const prox = jogos.find(
      (x) => x.fase === { oitavas: "quartas", quartas: "semi", semi: "final", final: "" }[j.fase] && x.slot === Math.floor(j.slot / 2),
    );
    if (prox && j.vencedorId) prox[j.slot % 2 === 0 ? "jogador1Id" : "jogador2Id"] = j.vencedorId;
  }
  return jogos;
}

const s = (n: number, p = "s") => Array.from({ length: n }, (_, i) => `${p}${i + 1}`);

describe("faseAlcancada", () => {
  const jogos = chaveJogada(s(16), "ouro");
  it.each([
    ["s1", "campeao"],
    ["s2", "vice"],
    ["s3", "semi"],
    ["s4", "semi"],
    ["s5", "quartas"],
    ["s8", "quartas"],
    ["s9", "oitavas"],
    ["s16", "oitavas"],
  ])("%s → %s", (id, fase) => expect(faseAlcancada(jogos, id)).toBe(fase));

  it("bye não conta: #1 da Prata de 15 que perde nas quartas → quartas", () => {
    const j = montarChave(s(15)).map((x) => ({ ...x, chave: "prata" as const }));
    const quartas0 = j.find((x) => x.fase === "quartas" && x.slot === 0)!;
    // #8 × #9 nas oitavas: #9 vence e depois vence o #1 nas quartas
    const oit1 = j.find((x) => x.fase === "oitavas" && x.slot === 1)!;
    oit1.vencedorId = "s9";
    quartas0.jogador2Id = "s9";
    quartas0.vencedorId = "s9";
    expect(faseAlcancada(j, "s1")).toBe("quartas");
  });

  it("jogo sem resultado → null (pendente)", () => {
    expect(faseAlcancada(montarChave(s(16)).map((x) => ({ ...x, chave: "ouro" as const })), "s1")).toBeNull();
  });
});

describe("calcularPontosEtapa (tabela padrão = 2ª Etapa)", () => {
  const linha = (jogadorId: string, posicaoGrupo: number, destino: LinhaGeral["destino"]): LinhaGeral => ({
    jogadorId, posicaoGrupo, destino, grupoId: "g", posicao: 0, jogos: 4, vitorias: 0, derrotas: 0, setsPro: 0, setsContra: 0, saldoSets: 0, saldoGames: 0,
  });
  const ouro = chaveJogada(s(16, "o"), "ouro");
  const prata = chaveJogada(s(16, "p"), "prata");

  it("1º do grupo campeão da Ouro = 400 + 1000 = 1400 (Diogo Luiz)", () => {
    const { registros } = calcularPontosEtapa(tabelas, [linha("o1", 1, "ouro")], [...ouro, ...prata]);
    expect(registros[0]).toMatchObject({ pontos_grupo: 400, pontos_mata_mata: 1000, pontos_total: 1400, fase_mata_mata: "campeao", chave: "ouro" });
  });

  it("3º do grupo campeão da Prata = 260 + 250 = 510 (Bruno Salazar)", () => {
    const { registros } = calcularPontosEtapa(tabelas, [linha("p1", 3, "prata")], prata);
    expect(registros[0].pontos_total).toBe(510);
  });

  it("6º do grupo nas oitavas da Prata = 25 + 25 = 50 (Felipe Siqueira)", () => {
    const { registros } = calcularPontosEtapa(tabelas, [linha("p16", 6, "prata")], prata);
    expect(registros[0]).toMatchObject({ pontos_grupo: 25, pontos_mata_mata: 25, pontos_total: 50 });
  });

  it("eliminado só leva os pontos do grupo (5º = 40)", () => {
    const { registros, pendentes } = calcularPontosEtapa(tabelas, [linha("x", 5, "eliminado")], []);
    expect(registros[0]).toMatchObject({ chave: null, fase_mata_mata: null, pontos_total: 40 });
    expect(pendentes).toEqual([]);
  });

  it("mata-mata incompleto → pendente", () => {
    const { pendentes } = calcularPontosEtapa(tabelas, [linha("o1", 1, "ouro")], montarChave(s(16, "o")).map((j) => ({ ...j, chave: "ouro" as const })));
    expect(pendentes).toEqual(["o1"]);
  });
});

describe("importação — CSV real da 2ª Etapa", () => {
  const csv = readFileSync(join(process.cwd(), "docs/dados/etapa2-ranking.csv"), "utf8");
  const { linhas, erro } = lerCsv(csv);

  it("31 jogadores, sem erros, totais conferidos", () => {
    expect(erro).toBeNull();
    expect(linhas).toHaveLength(31);
    expect(linhas.filter((l) => l.erro)).toEqual([]);
    expect(linhas[0]).toMatchObject({ nome: "Diogo Luiz", pontos_grupo: 400, pontos_mata_mata: 1000, pontos_total: 1400, posicao_final: 1 });
    expect(linhas[30]).toMatchObject({ nome: "Felipe Siqueira", pontos_total: 50 });
  });

  it("aceita ; (Excel pt-BR) e acusa total errado", () => {
    const r = lerCsv("﻿nome;pontos_grupo;pontos_mata_mata;pontos_total\nA;400;100;500\nB;400;100;400");
    expect(r.linhas.map((l) => l.erro)).toEqual([null, "Total 400 ≠ grupo 400 + mata-mata 100."]);
  });

  it("acusa coluna obrigatória ausente", () => {
    expect(lerCsv("nome,total\nA,1").erro).toContain("pontos_grupo");
  });
});

describe("casarJogador — nomes reais (2ª Etapa × cadastro atual)", () => {
  const cadastrados = [
    "Rodrigo Tição", "Rodrigo Vasconcelos", "Miguel Bevilacqua", "Diego Souza", "Radislei (Japão)", "Fábio Nunes (Backass)",
    "Fábio Silva (da Nath)", "Gustavo Siqueira (Cafu)", "Gustavo Barcelos", "José Inocencio", "Thiago Villela", "Thiago Dias",
    "Felipe Siqueira", "Fabiano Siqueira", "Luiz Gustavo Lanzoni", "Diogo Luiz",
  ].map((nome) => ({ nome }));
  const casar = (n: string) => {
    const c = casarJogador(n, cadastrados);
    return c.tipo === "novo" ? "novo" : `${c.tipo}:${c.jogador.nome}`;
  };

  it.each([
    ["José Inocêncio", "exato:José Inocencio"],
    ["Rodrigo Ticão", "exato:Rodrigo Tição"],
    ["Diogo Luiz", "exato:Diogo Luiz"],
    ["Rodrigo Vasconcellos", "sugestao:Rodrigo Vasconcelos"],
    ["Miguel Bevilaqua", "sugestao:Miguel Bevilacqua"],
    ["Diego Sousa", "sugestao:Diego Souza"],
    ["Radislei Mariano (Japão)", "sugestao:Radislei (Japão)"],
    ["Fábio Silva (Nathalia)", "sugestao:Fábio Silva (da Nath)"],
    ["Gustavo Cafu", "sugestao:Gustavo Siqueira (Cafu)"],
    ["Fábio Nunes (Bad ass)", "sugestao:Fábio Nunes (Backass)"],
    ["Fábio Moraes", "novo"],
    ["Felipe Dias", "novo"],
    ["Bruno Salazar", "novo"],
  ])("%s → %s", (nome, esperado) => expect(casar(nome)).toBe(esperado));
});

describe("montarRank", () => {
  const reg = (jogadorId: string, etapaId: string, total: number) => ({ jogadorId, etapaId, pontos_grupo: 0, pontos_mata_mata: total, pontos_total: total });

  it("soma as etapas da temporada, ignora as outras, posição compartilhada no empate", () => {
    const r = montarRank(
      [reg("a", "e2", 1400), reg("a", "e3", 100), reg("b", "e2", 600), reg("c", "e2", 600), reg("d", "e2", 520), reg("a", "e2025", 9999)],
      ["e2", "e3"],
    );
    expect(r.map((l) => [l.jogadorId, l.posicao, l.total])).toEqual([["a", 1, 1500], ["b", 2, 600], ["c", 2, 600], ["d", 4, 520]]);
    expect(r[0].porEtapa.map((p) => p.etapaId)).toEqual(["e2", "e3"]);
  });

  it("empate na 8ª vaga (caso real: Charles e Miguel com 520)", () => {
    const totais = [1400, 1050, 800, 720, 600, 600, 520, 520, 510];
    const r = montarRank(totais.map((t, i) => reg(`j${i + 1}`, "e2", t)), ["e2"]);
    expect(empateNoCorte(r, 8)).toEqual([]); // 7º e 8º empatados, mas os dois entram
    const r2 = montarRank([...totais.slice(0, 7), 520].map((t, i) => reg(`j${i + 1}`, "e2", t)), ["e2"]);
    expect(empateNoCorte(montarRank([...r2.map((l) => reg(l.jogadorId, "e2", l.total)), reg("x", "e2", 520)], ["e2"]), 8)).toEqual(["j7", "j8", "x"]);
  });
});
