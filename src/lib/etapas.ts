import { temporadaDe, type Etapa } from "@/lib/types";

/** Mais recente primeiro: maior temporada, depois maior número. */
export function ordenarEtapas<T extends Pick<Etapa, "numero" | "temporada">>(etapas: T[]): T[] {
  return [...etapas].sort((a, b) => temporadaDe(b) - temporadaDe(a) || b.numero - a.numero);
}

/** [[2027, [...]], [2026, [...]]] — etapas já ordenadas da mais recente para a mais antiga. */
export function agruparPorTemporada<T extends Pick<Etapa, "numero" | "temporada">>(etapas: T[]): [number, T[]][] {
  const grupos = new Map<number, T[]>();
  for (const e of ordenarEtapas(etapas)) grupos.set(temporadaDe(e), [...(grupos.get(temporadaDe(e)) ?? []), e]);
  return [...grupos.entries()];
}

/** O número da etapa só precisa ser único dentro da temporada. */
export function numeroEmUso(etapas: Pick<Etapa, "numero" | "temporada">[], numero: number, temporada: number): boolean {
  return etapas.some((e) => e.numero === numero && temporadaDe(e) === temporada);
}

/** Próximo número livre na temporada (1 se a temporada ainda não tem etapas). */
export function proximoNumero(etapas: Pick<Etapa, "numero" | "temporada">[], temporada: number): number {
  const nums = etapas.filter((e) => temporadaDe(e) === temporada).map((e) => e.numero);
  return nums.length ? Math.max(...nums) + 1 : 1;
}
