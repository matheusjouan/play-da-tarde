import type { Chave } from "../types";
import type { LinhaClassificacao } from "./classificacao";

// Classificação geral da etapa e destino de cada jogador (docs/SPEC.md, 3.2).

export type Destino = Chave | "eliminado";

export type LinhaGeral = LinhaClassificacao & {
  grupoId: string;
  /** Posição dentro do grupo (a `posicao` herdada vira a posição geral). */
  posicaoGrupo: number;
  destino: Destino;
};

export type ClassificacaoGeral = {
  linhas: LinhaGeral[];
  /** Empates totais que decidem quem entra em Ouro/Prata e ainda não têm ordem manual. */
  empates: string[][];
};

type Entrada = { grupoId: string; linhas: LinhaClassificacao[] };

const empatados = (a: LinhaGeral, b: LinhaGeral) =>
  a.posicaoGrupo === b.posicaoGrupo && a.vitorias === b.vitorias && a.saldoSets === b.saldoSets && a.saldoGames === b.saldoGames;

/**
 * Ordena todos os jogadores por: posição no grupo → vitórias → saldo de sets → saldo de games → ordem manual.
 * Os primeiros `vagasOuro` vão para a Ouro, os próximos `vagasPrata` para a Prata, o restante é eliminado.
 * Ex.: 8 grupos de 5 → 1º/2º Ouro, 3º/4º Prata, 5º eliminado.
 *      6 grupos → 1º/2º (12) + 4 melhores 3º na Ouro.
 */
export function classificarGeral(
  grupos: Entrada[],
  vagasOuro: number,
  vagasPrata: number,
  desempateManual: string[] = [],
): ClassificacaoGeral {
  const ordemManual = (id: string) => {
    const i = desempateManual.indexOf(id);
    return i === -1 ? Infinity : i;
  };

  const ordemGrupo = new Map(grupos.map((g, i) => [g.grupoId, i]));
  const todas = grupos.flatMap((g) => g.linhas.map((l) => ({ ...l, grupoId: g.grupoId, posicaoGrupo: l.posicao })));

  const ordenadas = todas.sort(
    (a, b) =>
      a.posicaoGrupo - b.posicaoGrupo ||
      b.vitorias - a.vitorias ||
      b.saldoSets - a.saldoSets ||
      b.saldoGames - a.saldoGames ||
      ordemManual(a.jogadorId) - ordemManual(b.jogadorId) ||
      ordemGrupo.get(a.grupoId)! - ordemGrupo.get(b.grupoId)!,
  );

  const cortes = [vagasOuro, vagasOuro + vagasPrata];
  const linhas: LinhaGeral[] = ordenadas.map((l, i) => ({
    ...l,
    posicao: i + 1,
    destino: i < vagasOuro ? "ouro" : i < vagasOuro + vagasPrata ? "prata" : "eliminado",
  }));

  // Só importa o empate que atravessa um corte (decide Ouro × Prata ou Prata × eliminado).
  const empates: string[][] = [];
  for (let i = 0; i < linhas.length; ) {
    let j = i + 1;
    while (j < linhas.length && empatados(linhas[i], linhas[j])) j++;
    const bloco = linhas.slice(i, j);
    const cruzaCorte = cortes.some((c) => i < c && c < j);
    const resolvido = bloco.every((l) => desempateManual.includes(l.jogadorId));
    if (cruzaCorte && !resolvido && bloco.some((l) => l.jogos > 0)) empates.push(bloco.map((l) => l.jogadorId));
    i = j;
  }

  return { linhas, empates };
}
