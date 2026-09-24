// Rank da temporada (docs/SPEC.md, 3.8): soma dos pontos de cada etapa regular da temporada.

export type RegistroRank = { jogadorId: string; etapaId: string; pontos_grupo: number; pontos_mata_mata: number; pontos_total: number };

export type LinhaRank = {
  jogadorId: string;
  /** Posição compartilhada em empate não resolvido (1, 2, 2, 4…). */
  posicao: number;
  total: number;
  porEtapa: RegistroRank[];
};

/**
 * `etapaIds` = etapas regulares da temporada, na ordem de exibição.
 * Empate em pontos: vale a ordem manual do admin (P1); sem ela, a posição é compartilhada.
 */
export function montarRank(registros: RegistroRank[], etapaIds: string[], desempateManual: string[] = []): LinhaRank[] {
  const ordemManual = (id: string) => {
    const i = desempateManual.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  const porJogador = new Map<string, RegistroRank[]>();
  for (const r of registros) {
    if (!etapaIds.includes(r.etapaId)) continue;
    porJogador.set(r.jogadorId, [...(porJogador.get(r.jogadorId) ?? []), r]);
  }
  const linhas = [...porJogador.entries()]
    .map(([jogadorId, regs]) => ({
      jogadorId,
      posicao: 0,
      total: regs.reduce((s, r) => s + r.pontos_total, 0),
      porEtapa: [...regs].sort((a, b) => etapaIds.indexOf(a.etapaId) - etapaIds.indexOf(b.etapaId)),
    }))
    .sort((a, b) => b.total - a.total || ordemManual(a.jogadorId) - ordemManual(b.jogadorId));

  linhas.forEach((l, i) => {
    const ant = linhas[i - 1];
    const resolvido = ant && desempateManual.includes(ant.jogadorId) && desempateManual.includes(l.jogadorId);
    l.posicao = ant && l.total === ant.total && !resolvido ? ant.posicao : i + 1;
  });
  return linhas;
}

/** Jogadores em empate não resolvido que atravessa a linha de corte (ex.: 8ª vaga da Finals). */
export function empateNoCorte(linhas: LinhaRank[], corte: number): string[] {
  if (linhas.length <= corte) return [];
  const pos = linhas[corte - 1].posicao;
  if (linhas[corte].posicao !== pos) return [];
  return linhas.filter((l) => l.posicao === pos).map((l) => l.jogadorId);
}
