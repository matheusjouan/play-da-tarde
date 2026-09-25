"use client";

import { PageHeader } from "@/components/PageHeader";
import { RecenteCard } from "@/components/recentes/RecenteCard";
import { Alerta, Carregando, Vazio } from "@/components/ui";
import { dataCurta, rotuloPartida } from "@/lib/formato";
import { useCollection } from "@/lib/useCollection";
import type { Etapa, Grupo, Jogador, Partida } from "@/lib/types";

const QUANTIDADE = 5;

export default function RecentesPage() {
  // Só partidas com `atualizado_em` (placar lançado a partir da v1.1), da mais recente para a mais antiga.
  const partidas = useCollection<Partida>("partidas", { ordenarPor: "atualizado_em", decrescente: true, limite: QUANTIDADE });
  const jogadores = useCollection<Jogador>("jogadores");
  const grupos = useCollection<Grupo>("grupos");
  const etapas = useCollection<Etapa>("etapas");

  const nome = (id: string | null) => jogadores.data.find((j) => j.id === id)?.nome ?? "—";
  const recentes = partidas.data.filter((p) => p.sets.length > 0);

  const loading = partidas.loading || jogadores.loading || grupos.loading || etapas.loading;
  const error = partidas.error || jogadores.error || grupos.error || etapas.error;

  return (
    <>
      <PageHeader title="Recentes" subtitle={`Últimos ${QUANTIDADE} placares lançados ou alterados`} />
      {error && <Alerta>Erro ao carregar: {error}</Alerta>}

      {loading ? (
        <Carregando />
      ) : recentes.length === 0 ? (
        <Vazio>Nenhum placar lançado ainda.</Vazio>
      ) : (
        <div className="space-y-3">
          {recentes.map((p) => {
            const etapa = etapas.data.find((e) => e.id === p.etapaId);
            const grupo = grupos.data.find((g) => g.id === p.grupoId);
            return (
              <RecenteCard
                key={p.id}
                titulo={rotuloPartida(p, grupo?.nome, etapa?.tipo === "finals")}
                etapa={etapa?.nome}
                jogador1={nome(p.jogador1Id)}
                jogador2={nome(p.jogador2Id)}
                jogador1Venceu={!!p.jogador1Id && p.vencedorId === p.jogador1Id}
                jogador2Venceu={!!p.jogador2Id && p.vencedorId === p.jogador2Id}
                sets={p.sets}
                data={p.atualizado_em ? dataCurta(p.atualizado_em.toDate()) : null}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
