"use client";

import { useState } from "react";
import { alternar } from "@/components/Acordeao";
import { useAuth } from "@/components/AuthProvider";
import { EtapaSelect, useEtapaSelecionada } from "@/components/EtapaSelect";
import { DesempateModal } from "@/components/grupos/DesempateModal";
import { GrupoCard } from "@/components/grupos/GrupoCard";
import { PlacarModal } from "@/components/grupos/PlacarModal";
import { PageHeader } from "@/components/PageHeader";
import { Alerta, Carregando, Vazio } from "@/components/ui";
import { salvarDesempateGrupo } from "@/lib/repo";
import { useEtapaDados } from "@/lib/useEtapaDados";
import type { Grupo } from "@/lib/types";

export default function GruposPage() {
  const { isAdmin } = useAuth();
  const etapas = useEtapaSelecionada();
  const { etapa, lista, setEtapaId } = etapas;
  const dados = useEtapaDados(etapa?.id);
  const { nome } = dados;
  const [editando, setEditando] = useState<string | null>(null);
  // Só um grupo aberto por vez; todos começam fechados.
  const [aberto, setAberto] = useState<string | null>(null);
  const [desempate, setDesempate] = useState<{ grupo: Grupo; empatados: string[] } | null>(null);

  // Pega a versão mais recente da partida (tempo real) enquanto o modal está aberto.
  const partidaEditando = dados.partidas.find((p) => p.id === editando);

  const loading = etapas.loading || dados.loading;
  const error = etapas.error || dados.error;

  return (
    <>
      <PageHeader title="Fase de Grupos" subtitle={etapa?.nome ?? "Classificação e jogos de cada grupo"} />
      <EtapaSelect lista={lista} etapa={etapa} onChange={setEtapaId} />
      {error && <Alerta>Erro ao carregar: {error}</Alerta>}

      {loading ? (
        <Carregando />
      ) : !etapa ? (
        <Vazio>Nenhuma etapa em andamento.</Vazio>
      ) : etapa.tipo === "finals" ? (
        <Vazio>A Finals não tem fase de grupos — veja a aba Chaves.</Vazio>
      ) : dados.grupos.length === 0 ? (
        <Vazio>Os grupos desta etapa ainda não foram montados.</Vazio>
      ) : (
        <div className="space-y-3">
          {dados.grupos.map(({ grupo: g, jogos, classificacao }) => (
            <GrupoCard
              key={g.id}
              grupo={g}
              jogos={jogos}
              classificacao={classificacao}
              nome={nome}
              isAdmin={isAdmin}
              aberto={aberto === g.id}
              onAlternar={() => setAberto(alternar(aberto, g.id))}
              onEditarPlacar={(p) => setEditando(p.id)}
              onDesempatar={(empatados) => setDesempate({ grupo: g, empatados })}
            />
          ))}
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
