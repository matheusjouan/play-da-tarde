"use client";

import { EtapaSelect, useEtapaSelecionada } from "@/components/EtapaSelect";
import { PageHeader } from "@/components/PageHeader";
import { Alerta, Card, Carregando, Vazio } from "@/components/ui";
import { chavePar, gerarConfrontos } from "@/lib/engine/confrontos";
import { useCollection } from "@/lib/useCollection";
import type { Etapa, Grupo, Jogador, Partida } from "@/lib/types";

export default function GruposPage() {
  const etapas = useCollection<Etapa>("etapas");
  const { etapa, lista, setEtapaId } = useEtapaSelecionada(etapas.data);
  const jogadores = useCollection<Jogador>("jogadores");
  const grupos = useCollection<Grupo>("grupos", { onde: { campo: "etapaId", igual: etapa?.id } });
  const partidas = useCollection<Partida>("partidas", { onde: { campo: "etapaId", igual: etapa?.id } });

  const nome = (id: string | null) => jogadores.data.find((j) => j.id === id)?.nome ?? "—";
  const listaGrupos = [...grupos.data].sort((a, b) => a.nome.localeCompare(b.nome));

  // Jogos na ordem das rodadas (todos contra todos).
  function jogosOrdenados(g: Grupo): Partida[] {
    const porPar = new Map(
      partidas.data.filter((p) => p.grupoId === g.id).map((p) => [chavePar(p.jogador1Id ?? "", p.jogador2Id ?? ""), p]),
    );
    return gerarConfrontos(g.jogadorIds).flatMap(([a, b]) => porPar.get(chavePar(a, b)) ?? []);
  }

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
          {listaGrupos.map((g) => {
            const jogos = jogosOrdenados(g);
            return (
              <Card key={g.id}>
                <h2 className="text-lg font-semibold">{g.nome}</h2>
                <p className="mb-3 text-sm text-slate-500">
                  {g.jogadorIds.length} jogadores · {jogos.length} jogos
                </p>
                <ul className="mb-4 flex flex-wrap gap-1.5">
                  {g.jogadorIds.map((id) => (
                    <li key={id} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                      {nome(id)}
                    </li>
                  ))}
                </ul>
                <h3 className="mb-1 text-sm font-semibold text-slate-600">Jogos</h3>
                <ul className="divide-y divide-slate-100 text-sm">
                  {jogos.map((p) => (
                    <li key={p.id} className="flex min-h-11 items-center gap-2">
                      <span className="flex-1 text-right">{nome(p.jogador1Id)}</span>
                      <span className="text-xs text-slate-400">×</span>
                      <span className="flex-1">{nome(p.jogador2Id)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
