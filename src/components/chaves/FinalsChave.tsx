"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ListOrdered, RefreshCw, Wand2 } from "lucide-react";
import { ChaveView } from "@/components/chaves/ChaveView";
import { DesempateModal } from "@/components/grupos/DesempateModal";
import { PlacarModal } from "@/components/grupos/PlacarModal";
import { Alerta, btnPrimary, btnSecondary, Card, Vazio } from "@/components/ui";
import { FASES_POR_TAMANHO, montarChave, tamanhoChave, type FaseMM } from "@/lib/engine/chave";
import { gerarChave, limparPlacarMataMata, salvarPlacarMataMata } from "@/lib/repo";
import { useRank, VAGAS_FINALS } from "@/lib/useRank";
import { temporadaDe, type ChaveDoc, type Etapa, type Partida } from "@/lib/types";

// A chave da Finals é gravada como a chave "ouro" da etapa do tipo "finals" (não gera pontos).
const CHAVE = "ouro" as const;

type Props = { etapa: Etapa; partidas: Partida[]; chaves: ChaveDoc[]; isAdmin: boolean };

/** Finals (SPEC P2): mata-mata direto com o Top 8 do Rank da temporada — 1×8, 4×5, 3×6, 2×7. */
export function FinalsChave({ etapa, partidas, chaves, isAdmin }: Props) {
  const temporada = temporadaDe(etapa);
  const rank = useRank(temporada);
  const [editando, setEditando] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Seeds = posição no Rank. Com empate não resolvido na 8ª vaga, não dá para montar.
  const seedsCalc = rank.empateCorte.length ? [] : rank.linhas.filter((l) => l.posicao <= VAGAS_FINALS).map((l) => l.jogadorId);
  const docChave = chaves.find((c) => c.chave === CHAVE);
  const jogosSalvos = partidas.filter((p) => p.fase !== "grupo" && p.chave === CHAVE);
  const travada = jogosSalvos.some((p) => p.sets.length > 0);
  const seeds = docChave?.seeds ?? seedsCalc;
  const tamanhoValido = seeds.length >= 2 && seeds.length <= 16;
  const fases: FaseMM[] = tamanhoValido ? FASES_POR_TAMANHO[tamanhoChave(seeds.length)] : [];
  const jogos = docChave ? jogosSalvos.map((p) => ({ ...p, fase: p.fase as FaseMM, slot: p.slot ?? 0 })) : tamanhoValido ? montarChave(seeds) : [];
  const seed = (id: string | null) => (id ? seeds.indexOf(id) + 1 || null : null);
  const desatualizada = !!docChave && !docChave.ajusteManual && seedsCalc.length > 0 && docChave.seeds.join() !== seedsCalc.join();
  const partidaEditando = jogosSalvos.find((p) => p.id === editando);

  async function executar(acao: () => Promise<void>) {
    setSalvando(true);
    setErro(null);
    try {
      await acao();
    } catch (e) {
      setErro(`Erro ao salvar: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSalvando(false);
    }
  }

  function gerar() {
    const aviso = rank.emAndamento.length
      ? `\n\nATENÇÃO: ${rank.emAndamento.map((e) => e.nome).join(", ")} ainda não foi(ram) finalizada(s) — o Top 8 pode mudar.`
      : "";
    const msg = docChave
      ? travada
        ? "ATENÇÃO: a Finals já tem resultados. Regenerar APAGA todos os placares. Continuar?"
        : "Regenerar a Finals com o Top 8 atual?"
      : `Gerar a Finals ${temporada} com o Top ${seedsCalc.length} do Rank?`;
    if (!confirm(msg + aviso)) return;
    if (travada && !confirm("Tem certeza? Esta ação não pode ser desfeita.")) return;
    executar(() => gerarChave(etapa.id, CHAVE, seedsCalc, jogosSalvos));
  }

  if (rank.loading) return null;

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
        Top {VAGAS_FINALS} do <Link href="/rank" className="font-medium text-emerald-700 underline">Rank {temporada}</Link> em mata-mata
        direto. Não vale pontos.
        {!docChave && " Prévia com o Rank atual."}
      </p>

      {rank.empateCorte.length > 0 && !docChave && (
        <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Empate na {VAGAS_FINALS}ª vaga: {rank.empateCorte.map(rank.nome).join(", ")}. Defina a ordem na aba Rank antes de gerar a Finals.
        </p>
      )}

      {isAdmin && (
        <Card className="space-y-2">
          {!docChave ? (
            <button className={`${btnPrimary} w-full`} disabled={salvando || seedsCalc.length < 2} onClick={gerar}>
              <Wand2 size={18} /> Gerar chave da Finals
            </button>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                {travada ? "Finals em andamento — travada (já tem resultados)." : "Chave gerada. Ainda pode ser ajustada."}
                {docChave.ajusteManual && " Seeds ajustados manualmente."}
              </p>
              {desatualizada && (
                <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />O Top {VAGAS_FINALS} do Rank mudou desde a geração.
                </p>
              )}
              <div className="flex gap-2">
                {!travada && (
                  <button className={`${btnSecondary} flex-1`} disabled={salvando} onClick={() => setAjustando(true)}>
                    <ListOrdered size={18} /> Ajustar seeds
                  </button>
                )}
                <button className={`${btnSecondary} flex-1 ${travada ? "text-red-700" : ""}`} disabled={salvando || seedsCalc.length < 2} onClick={gerar}>
                  <RefreshCw size={18} /> Regenerar
                </button>
              </div>
            </>
          )}
        </Card>
      )}

      {erro && <Alerta>{erro}</Alerta>}

      {!tamanhoValido ? (
        <Vazio>{rank.linhas.length < 2 ? "O Rank da temporada ainda não tem jogadores suficientes." : "Resolva o empate no Rank para montar a prévia."}</Vazio>
      ) : (
        <ChaveView
          key={`${etapa.id}-${!!docChave}`}
          fases={fases}
          jogos={jogos}
          nome={rank.nome}
          seed={seed}
          onEditar={isAdmin && docChave ? (j) => j.id && setEditando(j.id) : undefined}
        />
      )}

      {isAdmin && partidaEditando && (
        <PlacarModal
          key={partidaEditando.id}
          partida={partidaEditando}
          nome1={rank.nome(partidaEditando.jogador1Id)}
          nome2={rank.nome(partidaEditando.jogador2Id)}
          onFechar={() => setEditando(null)}
          onSalvar={(sets, vencedorId) => salvarPlacarMataMata(partidaEditando, fases, jogosSalvos, sets, vencedorId)}
          onLimpar={() => limparPlacarMataMata(partidaEditando, fases, jogosSalvos)}
        />
      )}
      {isAdmin && docChave && ajustando && (
        <DesempateModal
          titulo="Ajustar seeds"
          descricao="Ordem dos seeds (#1 no topo). Ao salvar, a chave é refeita com esta ordem."
          prefixo={(i) => `#${i + 1}`}
          empatados={docChave.seeds}
          nome={rank.nome}
          onSalvar={(ordem) => gerarChave(etapa.id, CHAVE, ordem, jogosSalvos, true)}
          onFechar={() => setAjustando(false)}
        />
      )}
    </div>
  );
}
