"use client";

import { useState } from "react";
import { AlertTriangle, Trophy } from "lucide-react";
import { Acordeao, alternar } from "@/components/Acordeao";
import { useAuth } from "@/components/AuthProvider";
import { FinalsCard } from "@/components/chaves/FinalsCard";
import { DesempateModal } from "@/components/grupos/DesempateModal";
import { PageHeader } from "@/components/PageHeader";
import { Alerta, btnSecondary, Carregando, inputCls, Vazio } from "@/components/ui";
import { FASES_MATA_MATA } from "@/lib/defaults";
import { salvarDesempateRank } from "@/lib/repo";
import { useRank, VAGAS_FINALS } from "@/lib/useRank";
import type { FaseMataMata, RankingPorEtapa } from "@/lib/types";

const NOME_FASE = Object.fromEntries(FASES_MATA_MATA.map((f) => [f.fase, f.label])) as Record<FaseMataMata, string>;

export default function RankPage() {
  const { isAdmin } = useAuth();
  const [temporadaEscolhida, setTemporada] = useState<number | null>(null);
  const [ordem, setOrdem] = useState<"pontos" | "nome">("pontos");
  const [aberto, setAberto] = useState<string | null>(null);
  const [desempatando, setDesempatando] = useState(false);
  const r = useRank(temporadaEscolhida);
  const { nome, temporada } = r;

  const linhas =
    ordem === "nome"
      ? [...r.linhas].sort((a, b) => nome(a.jogadorId).localeCompare(nome(b.jogadorId)))
      : [...r.linhas].sort((a, b) => a.posicao - b.posicao || nome(a.jogadorId).localeCompare(nome(b.jogadorId)));

  const detalhe = (reg: RankingPorEtapa) =>
    [
      reg.posicao_final ? `${reg.posicao_final}º na etapa` : reg.posicao_grupo ? `${reg.posicao_grupo}º no grupo` : null,
      reg.chave && reg.fase_mata_mata
        ? `${reg.chave === "ouro" ? "Ouro" : "Prata"}: ${NOME_FASE[reg.fase_mata_mata]}`
        : reg.origem === "sistema" && !reg.chave
          ? "eliminado"
          : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <>
      <PageHeader title="Rank da Temporada" subtitle={temporada ? `Temporada ${temporada}` : "Pontos acumulados em todas as etapas"} />
      {r.error && <Alerta>Erro ao carregar: {r.error}</Alerta>}

      {r.loading ? (
        <Carregando />
      ) : !temporada ? (
        <Vazio>Nenhuma etapa cadastrada.</Vazio>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            {r.temporadas.length > 1 && (
              <select className={`${inputCls} flex-1`} value={temporada} onChange={(e) => setTemporada(Number(e.target.value))} aria-label="Temporada">
                {r.temporadas.map((t) => (
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
                  className={`min-h-11 rounded-md text-sm font-medium ${ordem === o ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  {o === "pontos" ? "Por pontos" : "Por nome"}
                </button>
              ))}
            </div>
          </div>

          <FinalsCard temporada={temporada} finals={r.finals} nome={nome} />

          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
            {r.contam.length > 0 ? `Somando: ${r.contam.map((e) => e.nome).join(", ")}.` : "Nenhuma etapa pontuada ainda."}
            {r.emAndamento.length === 1 && ` A ${r.emAndamento[0].nome} entra quando for finalizada.`}
            {r.emAndamento.length > 1 && ` ${r.emAndamento.map((e) => e.nome).join(", ")} entram quando forem finalizadas.`}
          </p>

          {r.empateCorte.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="flex gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                Empate em pontos na disputa da {VAGAS_FINALS}ª vaga da Finals: {r.empateCorte.map(nome).join(", ")}. A organização define a ordem.
              </p>
              {isAdmin && (
                <button className={`${btnSecondary} mt-2 w-full`} onClick={() => setDesempatando(true)}>
                  Definir ordem
                </button>
              )}
            </div>
          )}

          {r.linhas.length === 0 ? (
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
                        {l.porEtapa.map((reg) => (
                          <li key={reg.etapaId} className="flex items-center gap-3 py-2">
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium">{r.etapaDe(reg.etapaId)?.nome}</span>
                              <span className="block text-xs text-slate-500">{detalhe(reg as RankingPorEtapa)}</span>
                            </span>
                            <span className="text-right tabular-nums">
                              <span className="block font-semibold">{reg.pontos_total}</span>
                              <span className="block text-xs text-slate-500">
                                grupo {reg.pontos_grupo} + mata-mata {reg.pontos_mata_mata}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Acordeao>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isAdmin && desempatando && temporada && (
        <DesempateModal
          empatados={r.empateCorte}
          nome={nome}
          descricao="Estes jogadores estão empatados em pontos na disputa das vagas da Finals. Ordene conforme a decisão da organização."
          onSalvar={(ordemBloco) => salvarDesempateRank(temporada, r.desempate, ordemBloco)}
          onFechar={() => setDesempatando(false)}
        />
      )}
    </>
  );
}
