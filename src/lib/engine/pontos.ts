import type { Chave, FaseMataMata, FasePartida, PontosGrupo, PontosMataMata } from "../types";
import type { LinhaGeral } from "./geral";

// Pontuação por etapa (docs/SPEC.md, 3.8).

type JogoMM = {
  fase: FasePartida;
  chave?: Chave;
  jogador1Id: string | null;
  jogador2Id: string | null;
  vencedorId: string | null;
};

const ORDEM: FasePartida[] = ["oitavas", "quartas", "semi", "final"];

/**
 * Até onde o jogador chegou na chave: campeão, vice, ou a fase em que perdeu.
 * Bye não conta como jogo (quem teve bye e perdeu nas quartas → "quartas").
 * `null` = ainda não definido (há jogo dele sem resultado).
 */
export function faseAlcancada(jogos: JogoMM[], jogadorId: string): FaseMataMata | null {
  const disputados = jogos
    .filter((j) => (j.jogador1Id === jogadorId || j.jogador2Id === jogadorId) && j.jogador1Id && j.jogador2Id)
    .sort((a, b) => ORDEM.indexOf(a.fase) - ORDEM.indexOf(b.fase));
  const ultimo = disputados[disputados.length - 1];
  if (!ultimo || !ultimo.vencedorId) return null;
  if (ultimo.vencedorId === jogadorId) return ultimo.fase === "final" ? "campeao" : null;
  if (ultimo.fase === "final") return "vice";
  return ultimo.fase as FaseMataMata;
}

export type RegistroPontos = {
  jogadorId: string;
  posicao_grupo: number;
  chave: Chave | null;
  fase_mata_mata: FaseMataMata | null;
  pontos_grupo: number;
  pontos_mata_mata: number;
  pontos_total: number;
};

type Tabelas = { tabela_pontos_grupo: PontosGrupo[]; tabela_pontos_mata_mata: PontosMataMata[] };

/**
 * Pontos de cada jogador na etapa = pontos da posição no grupo + pontos da fase alcançada na sua chave.
 * `pendentes` lista quem está numa chave mas ainda sem fase definida (mata-mata incompleto).
 */
export function calcularPontosEtapa(
  tabelas: Tabelas,
  linhas: LinhaGeral[],
  jogosMM: JogoMM[],
): { registros: RegistroPontos[]; pendentes: string[] } {
  const pendentes: string[] = [];
  const registros = linhas.map((l): RegistroPontos => {
    const pontos_grupo = tabelas.tabela_pontos_grupo.find((p) => p.posicao === l.posicaoGrupo)?.pontos ?? 0;
    const chave = l.destino === "eliminado" ? null : l.destino;
    const fase = chave ? faseAlcancada(jogosMM.filter((j) => j.chave === chave), l.jogadorId) : null;
    if (chave && !fase) pendentes.push(l.jogadorId);
    const pontos_mata_mata = fase ? (tabelas.tabela_pontos_mata_mata.find((p) => p.chave === chave && p.fase === fase)?.pontos ?? 0) : 0;
    return {
      jogadorId: l.jogadorId,
      posicao_grupo: l.posicaoGrupo,
      chave,
      fase_mata_mata: fase,
      pontos_grupo,
      pontos_mata_mata,
      pontos_total: pontos_grupo + pontos_mata_mata,
    };
  });
  return { registros, pendentes };
}
