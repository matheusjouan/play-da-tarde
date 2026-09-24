"use client";

import { useState } from "react";
import { AlertTriangle, ListOrdered, RefreshCw, Wand2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ChaveView } from "@/components/chaves/ChaveView";
import { FinalsChave } from "@/components/chaves/FinalsChave";
import { EtapaSelect, useEtapaSelecionada } from "@/components/EtapaSelect";
import { DesempateModal } from "@/components/grupos/DesempateModal";
import { PlacarModal } from "@/components/grupos/PlacarModal";
import { PageHeader } from "@/components/PageHeader";
import { Alerta, btnPrimary, btnSecondary, Card, Carregando, Vazio } from "@/components/ui";
import { definirSeeds, FASES_POR_TAMANHO, montarChave, tamanhoChave, type FaseMM } from "@/lib/engine/chave";
import { classificarGeral } from "@/lib/engine/geral";
import { gerarChave, limparPlacarMataMata, salvarPlacarMataMata } from "@/lib/repo";
import { useCollection } from "@/lib/useCollection";
import { useEtapaDados } from "@/lib/useEtapaDados";
import type { Chave, ChaveDoc, Partida } from "@/lib/types";

const CHAVES: { chave: Chave; label: string; cor: string }[] = [
  { chave: "ouro", label: "Ouro", cor: "bg-amber-400" },
  { chave: "prata", label: "Prata", cor: "bg-slate-400" },
];

export default function ChavesPage() {
  const { isAdmin } = useAuth();
  const etapas = useEtapaSelecionada();
  const { etapa, lista, setEtapaId } = etapas;
  const dados = useEtapaDados(etapa?.id);
  const chavesDocs = useCollection<ChaveDoc>("chaves", { onde: { campo: "etapaId", igual: etapa?.id } });
  const [chave, setChave] = useState<Chave>("ouro");
  const [editando, setEditando] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // ---- Cálculo ao vivo (a partir dos grupos) ----
  const geral = etapa
    ? classificarGeral(
        dados.grupos.map((g) => ({ grupoId: g.grupo.id, linhas: g.classificacao.linhas })),
        etapa.vagas_ouro,
        etapa.vagas_prata,
        etapa.desempate_geral,
      )
    : null;
  const completo = dados.grupos.length > 0 && dados.grupos.every((g) => g.completo);
  const jogados = dados.grupos.reduce((s, g) => s + g.jogos.filter((p) => p.vencedorId).length, 0);
  const total = dados.grupos.reduce((s, g) => s + g.jogos.length, 0);
  const calculo = (c: Chave) => definirSeeds(geral?.linhas.filter((l) => l.destino === c) ?? []);
  const jogosSalvosDe = (c: Chave) => dados.partidas.filter((p) => p.fase !== "grupo" && p.chave === c);

  // ---- Chave selecionada ----
  const calc = calculo(chave);
  const docChave = chavesDocs.data.find((c) => c.chave === chave);
  const jogosSalvos = jogosSalvosDe(chave);
  const travada = jogosSalvos.some((p) => p.sets.length > 0);
  const seeds = docChave?.seeds ?? calc.seeds;
  const tamanhoValido = seeds.length >= 2 && seeds.length <= 16;
  const fases: FaseMM[] = tamanhoValido ? FASES_POR_TAMANHO[tamanhoChave(seeds.length)] : [];
  const jogos = docChave
    ? jogosSalvos.map((p) => ({ ...p, fase: p.fase as FaseMM, slot: p.slot ?? 0 }))
    : tamanhoValido
      ? montarChave(seeds)
      : [];
  const seed = (id: string | null) => (id ? seeds.indexOf(id) + 1 || null : null);

  // Classificação mudou depois da geração (ex.: placar de grupo corrigido)?
  const mesmosJogadores = !!docChave && [...docChave.seeds].sort().join() === [...calc.seeds].sort().join();
  const desatualizada =
    !!docChave && completo && (!mesmosJogadores || (!docChave.ajusteManual && docChave.seeds.join() !== calc.seeds.join()));

  const partidaEditando = jogosSalvos.find((p) => p.id === editando);
  const algumaGerada = chavesDocs.data.length > 0;

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

  function gerarAmbas() {
    if (!etapa) return;
    executar(async () => {
      for (const { chave: c } of CHAVES) {
        const s = calculo(c).seeds;
        if (s.length >= 2) await gerarChave(etapa.id, c, s, jogosSalvosDe(c));
      }
    });
  }

  function regenerar() {
    if (!etapa) return;
    const msg = travada
      ? `ATENÇÃO: a chave ${chave === "ouro" ? "Ouro" : "Prata"} já tem resultados. Regenerar APAGA todos os placares do mata-mata desta chave. Continuar?`
      : `Regenerar a chave ${chave === "ouro" ? "Ouro" : "Prata"} com a classificação atual?`;
    if (!confirm(msg)) return;
    if (travada && !confirm("Tem certeza? Esta ação não pode ser desfeita.")) return;
    executar(() => gerarChave(etapa.id, chave, calc.seeds, jogosSalvos));
  }

  const loading = etapas.loading || dados.loading || chavesDocs.loading;
  const error = etapas.error || dados.error || chavesDocs.error;

  return (
    <>
      <PageHeader
        title={etapa?.tipo === "finals" ? "Finals" : "Chaves Ouro e Prata"}
        subtitle={etapa?.nome ?? "Mata-mata da etapa"}
      />
      <EtapaSelect lista={lista} etapa={etapa} onChange={setEtapaId} />
      {error && <Alerta>Erro ao carregar: {error}</Alerta>}

      {loading ? (
        <Carregando />
      ) : !etapa ? (
        <Vazio>Nenhuma etapa em andamento.</Vazio>
      ) : etapa.tipo === "finals" ? (
        <FinalsChave etapa={etapa} partidas={dados.partidas} chaves={chavesDocs.data} isAdmin={isAdmin} />
      ) : dados.grupos.length === 0 ? (
        <Vazio>Os grupos desta etapa ainda não foram montados.</Vazio>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            {CHAVES.map((c) => (
              <button
                key={c.chave}
                onClick={() => setChave(c.chave)}
                aria-pressed={chave === c.chave}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-md font-semibold ${
                  chave === c.chave ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                <span className={`size-3 rounded-full ${c.cor}`} /> {c.label}
              </button>
            ))}
          </div>

          {/* Situação da chave */}
          {!docChave && !completo && (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
              <strong>Prévia</strong> com a classificação atual ({jogados}/{total} jogos de grupo). A chave oficial é gerada quando todos os
              jogos da fase de grupos terminarem.
            </p>
          )}
          {!docChave && completo && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <p>
                Fase de grupos encerrada. {isAdmin ? "Confira a prévia e gere as chaves." : "Aguardando a organização gerar as chaves."}
              </p>
              {isAdmin && !algumaGerada && (
                <button className={`${btnPrimary} mt-2 w-full`} disabled={salvando} onClick={gerarAmbas}>
                  <Wand2 size={18} /> Gerar chaves Ouro e Prata
                </button>
              )}
              {isAdmin && algumaGerada && (
                <button className={`${btnPrimary} mt-2 w-full`} disabled={salvando} onClick={regenerar}>
                  <Wand2 size={18} /> Gerar chave {chave === "ouro" ? "Ouro" : "Prata"}
                </button>
              )}
            </div>
          )}

          {isAdmin && docChave && (
            <Card className="space-y-2">
              <p className="text-sm text-slate-600">
                {travada ? "Chave em andamento — travada (já tem resultados)." : "Chave gerada. Ainda pode ser ajustada."}
                {docChave.ajusteManual && " Seeds ajustados manualmente."}
              </p>
              {desatualizada && (
                <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />A classificação dos grupos mudou desde a geração desta chave.
                </p>
              )}
              {!travada && calc.empates.length > 0 && !docChave.ajusteManual && (
                <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  Empate total na definição de seeds: {calc.empates.map((b) => b.map((id) => `${dados.nome(id)} (#${seed(id)})`).join(" = ")).join("; ")}.
                  Confira e ajuste se necessário.
                </p>
              )}
              <div className="flex gap-2">
                {!travada && (
                  <button className={`${btnSecondary} flex-1`} disabled={salvando} onClick={() => setAjustando(true)}>
                    <ListOrdered size={18} /> Ajustar seeds
                  </button>
                )}
                <button className={`${btnSecondary} flex-1 ${travada ? "text-red-700" : ""}`} disabled={salvando} onClick={regenerar}>
                  <RefreshCw size={18} /> Regenerar
                </button>
              </div>
            </Card>
          )}

          {erro && <Alerta>{erro}</Alerta>}

          {!tamanhoValido ? (
            <Vazio>
              {seeds.length > 16 ? "Mais de 16 classificados: ajuste as vagas da etapa (máx. 16 por chave)." : "Classificados insuficientes para montar a chave."}
            </Vazio>
          ) : (
            <ChaveView
              key={`${etapa.id}-${chave}-${!!docChave}`}
              fases={fases}
              jogos={jogos}
              nome={dados.nome}
              seed={seed}
              onEditar={isAdmin && docChave ? (j) => j.id && setEditando(j.id) : undefined}
            />
          )}
        </div>
      )}

      {isAdmin && partidaEditando && (
        <PlacarModal
          key={partidaEditando.id}
          partida={partidaEditando}
          nome1={dados.nome(partidaEditando.jogador1Id)}
          nome2={dados.nome(partidaEditando.jogador2Id)}
          onFechar={() => setEditando(null)}
          onSalvar={(sets, vencedorId) => salvarPlacarMataMata(partidaEditando, fases, jogosSalvos, sets, vencedorId)}
          onLimpar={() => limparPlacarMataMata(partidaEditando, fases, jogosSalvos)}
        />
      )}
      {isAdmin && etapa && docChave && ajustando && (
        <DesempateModal
          titulo="Ajustar seeds"
          descricao="Ordem dos seeds (#1 no topo). Ao salvar, a chave é refeita com esta ordem."
          prefixo={(i) => `#${i + 1}`}
          empatados={docChave.seeds}
          nome={dados.nome}
          onSalvar={(ordem) => gerarChave(etapa.id, chave, ordem, jogosSalvos as Partida[], true)}
          onFechar={() => setAjustando(false)}
        />
      )}
    </>
  );
}
