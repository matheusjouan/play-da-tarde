"use client";

import { classificarGrupo, type Classificacao } from "@/lib/engine/classificacao";
import { chavePar, gerarConfrontos } from "@/lib/engine/confrontos";
import { useCollection } from "@/lib/useCollection";
import type { Grupo, Jogador, Partida } from "@/lib/types";

export type GrupoCalculado = {
  grupo: Grupo;
  /** Jogos na ordem das rodadas (todos contra todos). */
  jogos: Partida[];
  classificacao: Classificacao;
  completo: boolean;
};

/** Jogadores, grupos e partidas de uma etapa em tempo real, com a classificação de cada grupo já calculada. */
export function useEtapaDados(etapaId: string | undefined) {
  const jogadores = useCollection<Jogador>("jogadores");
  const grupos = useCollection<Grupo>("grupos", { onde: { campo: "etapaId", igual: etapaId } });
  const partidas = useCollection<Partida>("partidas", { onde: { campo: "etapaId", igual: etapaId } });

  const nome = (id: string | null) => jogadores.data.find((j) => j.id === id)?.nome ?? "—";

  const calculados: GrupoCalculado[] = [...grupos.data]
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((grupo) => {
      const porPar = new Map(
        partidas.data.filter((p) => p.grupoId === grupo.id).map((p) => [chavePar(p.jogador1Id ?? "", p.jogador2Id ?? ""), p]),
      );
      const jogos = gerarConfrontos(grupo.jogadorIds).flatMap(([a, b]) => porPar.get(chavePar(a, b)) ?? []);
      return {
        grupo,
        jogos,
        classificacao: classificarGrupo(grupo.jogadorIds, jogos, grupo.desempate_manual),
        completo: jogos.length > 0 && jogos.every((p) => p.vencedorId),
      };
    });

  return {
    nome,
    grupos: calculados,
    partidas: partidas.data,
    loading: jogadores.loading || grupos.loading || partidas.loading,
    error: jogadores.error || grupos.error || partidas.error,
  };
}
