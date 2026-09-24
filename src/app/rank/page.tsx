"use client";

import { useState } from "react";
import { AlertTriangle, Trophy } from "lucide-react";
import { Acordeao, alternar } from "@/components/Acordeao";
import { PageHeader } from "@/components/PageHeader";
import { Alerta, Carregando, inputCls, Vazio } from "@/components/ui";
import { FASES_MATA_MATA } from "@/lib/defaults";
import { empateNoCorte, montarRank } from "@/lib/engine/rank";
import { useCollection } from "@/lib/useCollection";
import { temporadaDe, type Etapa, type FaseMataMata, type Jogador, type RankingPorEtapa } from "@/lib/types";

const VAGAS_FINALS = 8;
const NOME_FASE = Object.fromEntries(FASES_MATA_MATA.map((f) => [f.fase, f.label])) as Record<FaseMataMata, string>;

export default function RankPage() {
  const etapas = useCollection<Etapa>("etapas");
  const registros = useCollection<RankingPorEtapa>("ranking_por_etapa");
  const jogadores = useCollection<Jogador>("jogadores");
  const [temporadaEscolhida, setTemporada] = useState<number | null>(null);
  const [ordem, setOrdem] = useState<"pontos" | "nome">("pontos");
  const [aberto, setAberto] = useState<string | null>(null);

  const nome = (id: string) => jogadores.data.find((j) => j.id === id)?.nome ?? "—";
  const regulares = etapas.data.filter((e) => e.tipo === "regular");
  const temporadas = [...new Set(regulares.map(temporadaDe))].sort((a, b) => b - a);
  const temporada = temporadaEscolhida ?? temporadas[0];

  const etapasTemporada = regulares.filter((e) => temporadaDe(e) === temporada).sort((a, b) => a.numero - b.numero);
  const contam = etapasTemporada.filter((e) => registros.data.some((r) => r.etapaId === e.id));
  const emAndamento = etapasTemporada.filter((e) => !contam.includes(e));
  const etapaDe = (id: string) => etapas.data.find((e) => e.id === id);

  const rank = montarRank(registros.data, contam.map((e) => e.id));
  const linhas =
    ordem === "nome"
      ? [...rank].sort((a, b) => nome(a.jogadorId).localeCompare(nome(b.jogadorId)))
      : [...rank].sort((a, b) => a.posicao - b.posicao || nome(a.jogadorId).localeCompare(nome(b.jogadorId)));
  const empateCorte = empateNoCorte(rank, VAGAS_FINALS);

  const detalhe = (r: RankingPorEtapa) =>
    [
      r.posicao_final ? `${r.posicao_final}º na etapa` : r.posicao_grupo ? `${r.posicao_grupo}º no grupo` : null,
      r.chave && r.fase_mata_mata ? `${r.chave === "ouro" ? "Ouro" : "Prata"}: ${NOME_FASE[r.fase_mata_mata]}` : r.origem === "sistema" && !r.chave ? "eliminado" : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const loading = etapas.loading || registros.loading || jogadores.loading;
  const error = etapas.error || registros.error || jogadores.error;

  return (
    <>
      <PageHeader title="Rank da Temporada" subtitle={temporada ? `Temporada ${temporada}` : "Pontos acumulados em todas as etapas"} />
      {error && <Alerta>Erro ao carregar: {error}</Alerta>}

      {loading ? (
        <Carregando />
      ) : !temporada ? (
        <Vazio>Nenhuma etapa cadastrada.</Vazio>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            {temporadas.length > 1 && (
              <select className={`${inputCls} flex-1`} value={temporada} onChange={(e) => setTemporada(Number(e.target.value))} aria-label="Temporada">
                {temporadas.map((t) => (
                  <option key={t} value={t}>
                    Temporada {t}
                  </option>
                ))}
              </select>
            )}
            <div className="grid flex-1 grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              {(["pontos", "nome"] as const).map((o) => (
                <button
                  key={o}
                  aria-pressed={ordem === o}
                  onClick={() => setOrdem(o)}
                  className={`min-h-10 rounded-md text-sm font-medium ${ordem === o ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  {o === "pontos" ? "Por pontos" : "Por nome"}
                </button>
              ))}
            </div>
          </div>

          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
            {contam.length > 0 ? `Somando: ${contam.map((e) => e.nome).join(", ")}.` : "Nenhuma etapa pontuada ainda."}
            {emAndamento.length === 1 && ` A ${emAndamento[0].nome} entra quando for finalizada.`}
            {emAndamento.length > 1 && ` ${emAndamento.map((e) => e.nome).join(", ")} entram quando forem finalizadas.`}
          </p>

          {empateCorte.length > 0 && (
            <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Empate na disputa da {VAGAS_FINALS}ª vaga da Finals: {empateCorte.map(nome).join(", ")}. Critério de desempate a definir.
            </p>
          )}

          {rank.length === 0 ? (
            <Vazio>Sem pontos nesta temporada.</Vazio>
          ) : (
            <div className="space-y-2">
              {linhas.map((l, i) => {
                const naFinals = l.posicao <= VAGAS_FINALS;
                const corte = ordem === "pontos" && i > 0 && linhas[i - 1].posicao <= VAGAS_FINALS && !naFinals;
                return (
                  <div key={l.jogadorId}>
                    {corte && (
                      <p className="my-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                        <span className="h-px flex-1 bg-emerald-300" /> Top {VAGAS_FINALS} — vagas na Finals <span className="h-px flex-1 bg-emerald-300" />
                      </p>
                    )}
                    <Acordeao
                      aberto={aberto === l.jogadorId}
                      onAlternar={() => setAberto(alternar(aberto, l.jogadorId))}
                      className={naFinals ? "border-emerald-300" : ""}
                      titulo={
                        <>
                          <span className={`w-8 shrink-0 text-right text-base tabular-nums ${naFinals ? "text-emerald-700" : "text-slate-400"}`}>
                            {l.posicao}º
                          </span>
                          <span className="truncate text-base">{nome(l.jogadorId)}</span>
                          {l.posicao === 1 && <Trophy size={16} className="shrink-0 text-amber-500" />}
                        </>
                      }
                      direita={<span className="text-lg font-bold tabular-nums">{l.total}</span>}
                    >
                      <ul className="divide-y divide-slate-100 text-sm">
                        {l.porEtapa.map((r) => {
                          const reg = r as RankingPorEtapa;
                          return (
                            <li key={r.etapaId} className="flex items-center gap-3 py-2">
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium">{etapaDe(r.etapaId)?.nome}</span>
                                <span className="block text-xs text-slate-500">{detalhe(reg)}</span>
                              </span>
                              <span className="text-right tabular-nums">
                                <span className="block font-semibold">{r.pontos_total}</span>
                                <span className="block text-xs text-slate-500">
                                  grupo {r.pontos_grupo} + mata-mata {r.pontos_mata_mata}
                                </span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </Acordeao>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
