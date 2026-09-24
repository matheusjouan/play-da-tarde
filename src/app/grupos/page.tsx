"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EtapaSelect, useEtapaSelecionada } from "@/components/EtapaSelect";
import { DesempateModal } from "@/components/grupos/DesempateModal";
import { GrupoCard } from "@/components/grupos/GrupoCard";
import { PlacarModal } from "@/components/grupos/PlacarModal";
import { PageHeader } from "@/components/PageHeader";
import { Alerta, Carregando, Vazio } from "@/components/ui";
import { classificarGrupo } from "@/lib/engine/classificacao";
import { chavePar, gerarConfrontos } from "@/lib/engine/confrontos";
import { salvarDesempateGrupo } from "@/lib/repo";
import { useCollection } from "@/lib/useCollection";
import type { Grupo, Jogador, Partida } from "@/lib/types";

export default function GruposPage() {
  const { isAdmin } = useAuth();
  const etapas = useEtapaSelecionada();
  const { etapa, lista, setEtapaId } = etapas;
  const jogadores = useCollection<Jogador>("jogadores");
  const grupos = useCollection<Grupo>("grupos", { onde: { campo: "etapaId", igual: etapa?.id } });
  const partidas = useCollection<Partida>("partidas", { onde: { campo: "etapaId", igual: etapa?.id } });
  const [editando, setEditando] = useState<string | null>(null);
  const [desempate, setDesempate] = useState<{ grupo: Grupo; empatados: string[] } | null>(null);

  const nome = (id: string | null) => jogadores.data.find((j) => j.id === id)?.nome ?? "—";
  const listaGrupos = [...grupos.data].sort((a, b) => a.nome.localeCompare(b.nome));

  // Jogos na ordem das rodadas (todos contra todos).
  function jogosOrdenados(g: Grupo): Partida[] {
    const porPar = new Map(
      partidas.data.filter((p) => p.grupoId === g.id).map((p) => [chavePar(p.jogador1Id ?? "", p.jogador2Id ?? ""), p]),
    );
    return gerarConfrontos(g.jogadorIds).flatMap(([a, b]) => porPar.get(chavePar(a, b)) ?? []);
  }

  // Pega a versão mais recente da partida (tempo real) enquanto o modal está aberto.
  const partidaEditando = partidas.data.find((p) => p.id === editando);

  const loading = etapas.loading || jogadores.loading || grupos.loading || partidas.loading;
  const error = etapas.error || grupos.error || partidas.error;

  return (
    <>
      <PageHeader title="Fase de Grupos" subtitle={etapa?.nome ?? "Classificação e jogos de cada grupo"} />
      <EtapaSelect lista={lista} etapa={etapa} onChange={setEtapaId} />
      {error && <Alerta>Erro ao carregar: {error}</Alerta>}

      {loading ? (
        <Carregando />
      ) : !etapa ? (
        <Vazio>Nenhuma etapa em andamento.</Vazio>
      ) : listaGrupos.length === 0 ? (
        <Vazio>Os grupos desta etapa ainda não foram montados.</Vazio>
      ) : (
        <div className="space-y-3">
          {listaGrupos.map((g, i) => {
            const jogos = jogosOrdenados(g);
            return (
              <GrupoCard
                key={g.id}
                grupo={g}
                jogos={jogos}
                classificacao={classificarGrupo(g.jogadorIds, jogos, g.desempate_manual)}
                nome={nome}
                isAdmin={isAdmin}
                abertoInicial={i === 0}
                onEditarPlacar={(p) => setEditando(p.id)}
                onDesempatar={(empatados) => setDesempate({ grupo: g, empatados })}
              />
            );
          })}
        </div>
      )}

      {isAdmin && partidaEditando && (
        <PlacarModal
          key={partidaEditando.id}
          partida={partidaEditando}
          nome1={nome(partidaEditando.jogador1Id)}
          nome2={nome(partidaEditando.jogador2Id)}
          onFechar={() => setEditando(null)}
        />
      )}
      {isAdmin && desempate && (
        <DesempateModal
          empatados={desempate.empatados}
          nome={nome}
          onSalvar={(ordem) => salvarDesempateGrupo(desempate.grupo, ordem)}
          onFechar={() => setDesempate(null)}
        />
      )}
    </>
  );
}
