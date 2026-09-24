// Rank da temporada (docs/SPEC.md, 3.8): soma dos pontos de cada etapa regular da temporada.

export type RegistroRank = { jogadorId: string; etapaId: string; pontos_grupo: number; pontos_mata_mata: number; pontos_total: number };

export type LinhaRank = {
  jogadorId: string;
  /** Posição compartilhada em caso de empate (1, 2, 2, 4…). */
  posicao: number;
  total: number;
  porEtapa: RegistroRank[];
};

/** `etapaIds` = etapas regulares da temporada, na ordem de exibição. */
export function montarRank(registros: RegistroRank[], etapaIds: string[]): LinhaRank[] {
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
    .sort((a, b) => b.total - a.total);
  linhas.forEach((l, i) => (l.posicao = i > 0 && l.total === linhas[i - 1].total ? linhas[i - 1].posicao : i + 1));
  return linhas;
}

/** Jogadores empatados na linha de corte (ex.: 8ª vaga da Finals) — critério de desempate ainda a definir (P1). */
export function empateNoCorte(linhas: LinhaRank[], corte: number): string[] {
  if (linhas.length <= corte) return [];
  const totalCorte = linhas[corte - 1].total;
  if (linhas[corte].total !== totalCorte) return [];
  return linhas.filter((l) => l.total === totalCorte).map((l) => l.jogadorId);
}
