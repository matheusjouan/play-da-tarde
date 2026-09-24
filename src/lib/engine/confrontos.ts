export type Par = [string, string];

/** Chave única de um confronto, independente da ordem dos jogadores. */
export function chavePar(a: string, b: string): string {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

/**
 * Todos contra todos (método do círculo): n jogadores → n·(n−1)/2 confrontos,
 * ordenados por rodada, de forma que ninguém jogue duas vezes na mesma rodada.
 */
export function gerarConfrontos(jogadorIds: string[]): Par[] {
  const lista: (string | null)[] = [...jogadorIds];
  if (lista.length % 2 === 1) lista.push(null); // folga na rodada
  const n = lista.length;
  const pares: Par[] = [];

  for (let rodada = 0; rodada < n - 1; rodada++) {
    for (let i = 0; i < n / 2; i++) {
      const a = lista[i];
      const b = lista[n - 1 - i];
      if (a && b) pares.push([a, b]);
    }
    // gira todos menos o primeiro
    lista.splice(1, 0, lista.pop()!);
  }
  return pares;
}
