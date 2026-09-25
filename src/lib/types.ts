// Tipos espelhando o schema do Firestore (docs/SPEC.md, seção 4).

import type { Timestamp } from "firebase/firestore";

export type TipoEtapa = "regular" | "finals";
export type OrigemEtapa = "sistema" | "importado";
export type StatusEtapa = "grupos" | "mata_mata" | "finalizada";
export type Chave = "ouro" | "prata";
export type FaseMataMata = "campeao" | "vice" | "semi" | "quartas" | "oitavas";

export type PontosGrupo = { posicao: number; pontos: number };
export type PontosMataMata = { fase: FaseMataMata; chave: Chave; pontos: number };

export type Etapa = {
  id: string;
  nome: string;
  numero: number;
  /** Ano da temporada. Ausente em etapas antigas → use temporadaDe(). */
  temporada?: number;
  tipo: TipoEtapa;
  origem: OrigemEtapa;
  status: StatusEtapa;
  data_inicio: string;
  data_fim: string;
  vagas_ouro: number;
  vagas_prata: number;
  tabela_pontos_grupo: PontosGrupo[];
  tabela_pontos_mata_mata: PontosMataMata[];
  desempate_geral?: string[];
};

const TEMPORADA_PADRAO = 2026;

export function temporadaDe(etapa: Pick<Etapa, "temporada">): number {
  return etapa.temporada ?? TEMPORADA_PADRAO;
}

export type Jogador = {
  id: string;
  nome: string;
  nome_normalizado: string;
};

export type Grupo = {
  id: string;
  etapaId: string;
  nome: string;
  jogadorIds: string[];
  desempate_manual?: string[];
};

export type FasePartida = "grupo" | "oitavas" | "quartas" | "semi" | "final";

export type SetPlacar = { games1: number; games2: number; superTieBreak?: boolean };

export type Partida = {
  id: string;
  etapaId: string;
  grupoId?: string;
  fase: FasePartida;
  chave?: Chave;
  slot?: number;
  jogador1Id: string | null;
  jogador2Id: string | null;
  sets: SetPlacar[];
  vencedorId: string | null;
  /** Quando o placar foi lançado/alterado pela última vez (aba Recentes). Ausente = sem placar ou lançado antes da v1.1. */
  atualizado_em?: Timestamp | null;
};

/** chaves/{etapaId}_{ouro|prata}. "Travada" é derivado: algum jogo do mata-mata com placar. */
export type ChaveDoc = {
  id: string;
  etapaId: string;
  chave: Chave;
  /** seeds[0] = #1 */
  seeds: string[];
  /** Admin reordenou os seeds manualmente (não avisar que difere do cálculo automático). */
  ajusteManual?: boolean;
};

/** ranking_por_etapa/{etapaId}_{jogadorId} */
export type RankingPorEtapa = {
  id: string;
  jogadorId: string;
  etapaId: string;
  origem: OrigemEtapa;
  posicao_grupo?: number | null;
  posicao_final?: number | null;
  chave?: Chave | null;
  fase_mata_mata?: FaseMataMata | null;
  pontos_grupo: number;
  pontos_mata_mata: number;
  pontos_total: number;
};

/** temporadas/{ano} */
export type TemporadaDoc = {
  id: string;
  desempate_rank?: string[];
};

export type Regulamento = {
  id: string;
  etapaId: string;
  titulo: string;
  link: string;
};

export type SemId<T> = Omit<T, "id">;
