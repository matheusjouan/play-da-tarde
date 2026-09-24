"use client";

import { empateNoCorte, montarRank } from "@/lib/engine/rank";
import { useCollection } from "@/lib/useCollection";
import { temporadaDe, type Etapa, type Jogador, type RankingPorEtapa, type TemporadaDoc } from "@/lib/types";

export const VAGAS_FINALS = 8;

/** Rank de uma temporada (padrão: a mais recente), em tempo real. */
export function useRank(temporadaPedida?: number | null) {
  const etapas = useCollection<Etapa>("etapas");
  const registros = useCollection<RankingPorEtapa>("ranking_por_etapa");
  const jogadores = useCollection<Jogador>("jogadores");
  const temporadasDocs = useCollection<TemporadaDoc>("temporadas");

  const nome = (id: string | null) => jogadores.data.find((j) => j.id === id)?.nome ?? "—";
  const regulares = etapas.data.filter((e) => e.tipo === "regular");
  const temporadas = [...new Set(regulares.map(temporadaDe))].sort((a, b) => b - a);
  const temporada = temporadaPedida ?? temporadas[0];

  const etapasTemporada = regulares.filter((e) => temporadaDe(e) === temporada).sort((a, b) => a.numero - b.numero);
  const contam = etapasTemporada.filter((e) => registros.data.some((r) => r.etapaId === e.id));
  const emAndamento = etapasTemporada.filter((e) => !contam.includes(e));
  const desempate = temporadasDocs.data.find((t) => t.id === String(temporada))?.desempate_rank ?? [];

  const linhas = montarRank(registros.data, contam.map((e) => e.id), desempate);

  return {
    temporada,
    /** Etapa Finals desta temporada, se já foi criada. */
    finals: etapas.data.find((e) => e.tipo === "finals" && temporadaDe(e) === temporada),
    temporadas,
    linhas,
    contam,
    emAndamento,
    desempate,
    empateCorte: empateNoCorte(linhas, VAGAS_FINALS),
    nome,
    etapaDe: (id: string) => etapas.data.find((e) => e.id === id),
    loading: etapas.loading || registros.loading || jogadores.loading || temporadasDocs.loading,
    error: etapas.error || registros.error || jogadores.error || temporadasDocs.error,
  };
}
