"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Voltar } from "@/components/Voltar";
import { Alerta, btnPrimary, Card, Carregando, Vazio } from "@/components/ui";
import { FASES_MATA_MATA } from "@/lib/defaults";
import { classificarGeral } from "@/lib/engine/geral";
import { calcularPontosEtapa } from "@/lib/engine/pontos";
import { finalizarEtapa } from "@/lib/repo";
import { useCollection } from "@/lib/useCollection";
import { useEtapaDados } from "@/lib/useEtapaDados";
import type { Etapa, FaseMataMata, RankingPorEtapa } from "@/lib/types";

const NOME_FASE = Object.fromEntries(FASES_MATA_MATA.map((f) => [f.fase, f.label])) as Record<FaseMataMata, string>;

type Linha = {
  jogadorId: string;
  detalhe: string;
  pontos_grupo: number;
  pontos_mata_mata: number;
  pontos_total: number;
};

export default function PontuacaoPage() {
  const { id: etapaId } = useParams<{ id: string }>();
  const etapas = useCollection<Etapa>("etapas");
  const salvos = useCollection<RankingPorEtapa>("ranking_por_etapa", { onde: { campo: "etapaId", igual: etapaId } });
  const dados = useEtapaDados(etapaId);
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const etapa = etapas.data.find((e) => e.id === etapaId);
  const loading = etapas.loading || salvos.loading || dados.loading;
  if (loading) return <Carregando />;
  if (!etapa) return <Vazio>Etapa não encontrada.</Vazio>;

  const cabecalho = (
    <>
      <Voltar href={`/admin/etapas/${etapaId}`} label={etapa.nome} />
      <PageHeader title="Pontuação" subtitle={`${etapa.nome} · Rank da temporada`} />
    </>
  );

  if (etapa.tipo === "finals") {
    return (
      <>
        {cabecalho}
        <Vazio>A Finals não gera pontos para o Rank.</Vazio>
      </>
    );
  }

  const ordenar = (l: Linha[]) => [...l].sort((a, b) => b.pontos_total - a.pontos_total || dados.nome(a.jogadorId).localeCompare(dados.nome(b.jogadorId)));
  const detalheSalvo = (r: RankingPorEtapa) =>
    [
      r.posicao_final ? `${r.posicao_final}º na etapa` : r.posicao_grupo ? `${r.posicao_grupo}º no grupo` : null,
      r.chave && r.fase_mata_mata ? `${r.chave === "ouro" ? "Ouro" : "Prata"}: ${NOME_FASE[r.fase_mata_mata]}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  // Etapa importada: só mostra o que foi gravado.
  if (etapa.origem === "importado") {
    return (
      <>
        {cabecalho}
        <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">Etapa importada de planilha — {salvos.data.length} jogadores.</p>
        <ListaPontos linhas={ordenar(salvos.data.map((r) => ({ ...r, detalhe: detalheSalvo(r) })))} nome={dados.nome} />
      </>
    );
  }

  // Etapa jogada no sistema: calcula a partir de grupos + mata-mata.
  const geral = classificarGeral(
    dados.grupos.map((g) => ({ grupoId: g.grupo.id, linhas: g.classificacao.linhas })),
    etapa.vagas_ouro,
    etapa.vagas_prata,
    etapa.desempate_geral,
  );
  const { registros, pendentes } = calcularPontosEtapa(
    etapa,
    geral.linhas,
    dados.partidas.filter((p) => p.fase !== "grupo"),
  );
  const faltamGrupo = dados.grupos.reduce((s, g) => s + g.jogos.filter((p) => !p.vencedorId).length, 0);
  const pronto = dados.grupos.length > 0 && faltamGrupo === 0 && pendentes.length === 0;
  const finalizada = etapa.status === "finalizada";
  const mudou =
    finalizada &&
    (salvos.data.length !== registros.length ||
      registros.some((r) => salvos.data.find((s) => s.jogadorId === r.jogadorId)?.pontos_total !== r.pontos_total));

  async function finalizar() {
    if (!confirm(finalizada ? "Atualizar a pontuação gravada desta etapa?" : `Finalizar ${etapa!.nome} e gravar a pontuação de ${registros.length} jogadores no Rank?`)) return;
    setSalvando(true);
    setMsg(null);
    try {
      await finalizarEtapa(etapaId, registros);
      setMsg({ tipo: "ok", texto: "Pontuação gravada. O Rank da temporada já está atualizado." });
    } catch (e) {
      setMsg({ tipo: "erro", texto: `Erro ao salvar: ${e instanceof Error ? e.message : e}` });
    } finally {
      setSalvando(false);
    }
  }

  const linhas: Linha[] = registros.map((r) => ({
    ...r,
    detalhe: [
      `${r.posicao_grupo}º no grupo`,
      r.chave ? `${r.chave === "ouro" ? "Ouro" : "Prata"}: ${r.fase_mata_mata ? NOME_FASE[r.fase_mata_mata] : "em andamento"}` : "eliminado",
    ].join(" · "),
  }));

  return (
    <>
      {cabecalho}
      <Card className="mb-4 space-y-2">
        {finalizada && !mudou && (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={18} /> Etapa finalizada — pontuação gravada no Rank.
          </p>
        )}
        {mudou && <Alerta>Os resultados mudaram depois da finalização. Atualize a pontuação.</Alerta>}
        {!pronto && (
          <p className="text-sm text-slate-600">
            Prévia. Para finalizar:{" "}
            {faltamGrupo > 0 ? `faltam ${faltamGrupo} jogos de grupo.` : `mata-mata incompleto (${pendentes.length} jogadores sem fase definida).`}
          </p>
        )}
        {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}
        {(!finalizada || mudou) && (
          <button className={`${btnPrimary} w-full`} disabled={!pronto || salvando} onClick={finalizar}>
            {salvando ? "Gravando…" : finalizada ? "Atualizar pontuação" : "Finalizar etapa e gravar pontuação"}
          </button>
        )}
      </Card>
      <ListaPontos linhas={ordenar(linhas)} nome={dados.nome} />
    </>
  );
}

function ListaPontos({ linhas, nome }: { linhas: Linha[]; nome: (id: string) => string }) {
  if (linhas.length === 0) return <Vazio>Sem jogadores.</Vazio>;
  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {linhas.map((l) => (
        <li key={l.jogadorId} className="flex items-center gap-3 px-4 py-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{nome(l.jogadorId)}</span>
            <span className="block text-xs text-slate-500">{l.detalhe}</span>
          </span>
          <span className="text-right text-sm tabular-nums">
            <span className="block font-semibold">{l.pontos_total}</span>
            <span className="block text-xs text-slate-500">
              {l.pontos_grupo} + {l.pontos_mata_mata}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
