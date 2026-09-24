import { limparNome, normalizarNome } from "../nomes";

// Importação de pontos de etapa passada (CSV) — ex.: docs/dados/etapa2-ranking.csv.

export type LinhaImportada = {
  linha: number;
  nome: string;
  posicao_final: number | null;
  pontos_grupo: number;
  pontos_mata_mata: number;
  pontos_total: number;
  erro: string | null;
};

const COLUNAS = ["nome", "pontos_grupo", "pontos_mata_mata"] as const;

/** Lê CSV com cabeçalho (separador "," ou ";", BOM do Excel ignorado). Colunas: nome, pontos_grupo, pontos_mata_mata [, pontos_total, posicao_final]. */
export function lerCsv(texto: string): { linhas: LinhaImportada[]; erro: string | null } {
  const brutas = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (brutas.length < 2) return { linhas: [], erro: "Arquivo vazio ou sem dados." };
  const sep = brutas[0].includes(";") ? ";" : ",";
  const cab = brutas[0].split(sep).map((c) => c.trim().toLowerCase());
  const faltando = COLUNAS.filter((c) => !cab.includes(c));
  if (faltando.length) return { linhas: [], erro: `Colunas obrigatórias ausentes: ${faltando.join(", ")}.` };
  const idx = (c: string) => cab.indexOf(c);
  const num = (v: string | undefined) => (v === undefined || v.trim() === "" ? NaN : Number(v.trim().replace(",", ".")));

  const linhas = brutas.slice(1).map((l, i): LinhaImportada => {
    const c = l.split(sep).map((x) => x.trim().replace(/^"|"$/g, ""));
    const nome = limparNome(c[idx("nome")] ?? "");
    const pg = num(c[idx("pontos_grupo")]);
    const pm = num(c[idx("pontos_mata_mata")]);
    const pt = idx("pontos_total") >= 0 ? num(c[idx("pontos_total")]) : pg + pm;
    const pos = idx("posicao_final") >= 0 ? num(c[idx("posicao_final")]) : NaN;
    let erro: string | null = null;
    if (!nome) erro = "Nome vazio.";
    else if ([pg, pm, pt].some((n) => !Number.isInteger(n) || n < 0)) erro = "Pontos inválidos.";
    else if (pg + pm !== pt) erro = `Total ${pt} ≠ grupo ${pg} + mata-mata ${pm}.`;
    return {
      linha: i + 2,
      nome,
      posicao_final: Number.isInteger(pos) ? pos : null,
      pontos_grupo: pg || 0,
      pontos_mata_mata: pm || 0,
      pontos_total: pt || 0,
      erro,
    };
  });
  const nomes = linhas.map((l) => normalizarNome(l.nome));
  linhas.forEach((l, i) => {
    if (!l.erro && nomes.indexOf(nomes[i]) !== i) l.erro = "Nome repetido no arquivo.";
  });
  return { linhas, erro: null };
}

// ---------- Casamento de nomes com jogadores já cadastrados ----------

const IGNORAR = new Set(["da", "de", "do", "das", "dos", "e"]);

function tokens(nome: string): string[] {
  return normalizarNome(nome)
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter((t) => t.length > 1 && !IGNORAR.has(t));
}

function levenshtein(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Palavras "parecidas": iguais, ou com no máx. ~20% de letras diferentes (Bevilaqua ≈ Bevilacqua, Sousa ≈ Souza). */
function parecidas(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4) return false;
  return levenshtein(a, b) / Math.max(a.length, b.length) <= 0.2;
}

export type Casamento<J> = { tipo: "exato"; jogador: J } | { tipo: "sugestao"; jogador: J } | { tipo: "novo" };

/**
 * Exato = mesmo nome normalizado. Sugestão = mesmo primeiro nome + outra palavra parecida
 * (ex.: "Radislei Mariano (Japão)" → "Radislei (Japão)"). Sugestões devem ser conferidas pelo admin.
 */
export function casarJogador<J extends { nome: string }>(nome: string, jogadores: J[]): Casamento<J> {
  const n = normalizarNome(nome);
  const exato = jogadores.find((j) => normalizarNome(j.nome) === n);
  if (exato) return { tipo: "exato", jogador: exato };

  const tn = tokens(nome);
  let melhor: { j: J; pontos: number } | null = null;
  for (const j of jogadores) {
    const tj = tokens(j.nome);
    if (!tn[0] || !tj[0] || !parecidas(tn[0], tj[0])) continue;
    const outras = tn.slice(1).filter((t) => tj.slice(1).some((u) => parecidas(t, u))).length;
    if (outras === 0) continue;
    if (!melhor || outras > melhor.pontos) melhor = { j, pontos: outras };
  }
  return melhor ? { tipo: "sugestao", jogador: melhor.j } : { tipo: "novo" };
}
