"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Acordeao, alternar } from "@/components/Acordeao";
import { useAuth } from "@/components/AuthProvider";
import { EtapaSelect, useEtapaSelecionada } from "@/components/EtapaSelect";
import { DesempateModal } from "@/components/grupos/DesempateModal";
import { TabelaClassificacao } from "@/components/grupos/TabelaClassificacao";
import { PageHeader } from "@/components/PageHeader";
import { Alerta, btnSecondary, Carregando, Vazio } from "@/components/ui";
import { classificarGeral, type Destino, type LinhaGeral } from "@/lib/engine/geral";
import { salvarDesempateGeral } from "@/lib/repo";
import { useEtapaDados } from "@/lib/useEtapaDados";

const SECOES: { destino: Destino; titulo: string; cor: string }[] = [
  { destino: "ouro", titulo: "Chave Ouro", cor: "bg-amber-400" },
  { destino: "prata", titulo: "Chave Prata", cor: "bg-slate-400" },
  { destino: "eliminado", titulo: "Eliminados", cor: "bg-red-300" },
];

export default function GeralPage() {
  const { isAdmin } = useAuth();
  const etapas = useEtapaSelecionada();
  const { etapa, lista, setEtapaId } = etapas;
  const dados = useEtapaDados(etapa?.id);
  const [desempate, setDesempate] = useState<string[] | null>(null);
  // Só uma chave aberta por vez; todas começam fechadas.
  const [aberto, setAberto] = useState<string | null>(null);

  const geral = etapa
    ? classificarGeral(
        dados.grupos.map((g) => ({ grupoId: g.grupo.id, linhas: g.classificacao.linhas })),
        etapa.vagas_ouro,
        etapa.vagas_prata,
        etapa.desempate_geral,
      )
    : null;

  const letra = (grupoId: string) => dados.grupos.find((g) => g.grupo.id === grupoId)?.grupo.nome.replace(/^Grupo\s+/i, "") ?? "?";
  const completo = dados.grupos.length > 0 && dados.grupos.every((g) => g.completo);
  const jogados = dados.grupos.reduce((s, g) => s + g.jogos.filter((p) => p.vencedorId).length, 0);
  const total = dados.grupos.reduce((s, g) => s + g.jogos.length, 0);
  // Empate que decide vaga só é sinalizado com todos os grupos encerrados.
  const empates = completo && geral ? geral.empates : [];

  const loading = etapas.loading || dados.loading;
  const error = etapas.error || dados.error;

  return (
    <>
      <PageHeader title="Classificação Geral" subtitle={etapa?.nome ?? "Todos os participantes da etapa"} />
      <EtapaSelect lista={lista} etapa={etapa} onChange={setEtapaId} />
      {error && <Alerta>Erro ao carregar: {error}</Alerta>}

      {loading ? (
        <Carregando />
      ) : !etapa ? (
        <Vazio>Nenhuma etapa em andamento.</Vazio>
      ) : etapa.tipo === "finals" ? (
        <Vazio>A Finals não tem fase de grupos.</Vazio>
      ) : !geral || geral.linhas.length === 0 ? (
        <Vazio>Os grupos desta etapa ainda não foram montados.</Vazio>
      ) : (
        <div className="space-y-4">
          <p className={`rounded-lg px-3 py-2 text-sm ${completo ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
            {completo
              ? "Fase de grupos encerrada — classificação final."
              : `Parcial: ${jogados}/${total} jogos disputados. A classificação muda a cada resultado.`}
          </p>

          {empates.map((bloco) => (
            <div key={bloco.join()} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Empate total decidindo vaga: {bloco.map((id) => dados.nome(id)).join(", ")}</p>
              <p className="text-amber-800">A ordem deve ser definida por sorteio.</p>
              {isAdmin && (
                <button className={`${btnSecondary} mt-2 w-full`} onClick={() => setDesempate(bloco)}>
                  Definir ordem
                </button>
              )}
            </div>
          ))}

          <div className="space-y-3">
            {SECOES.map(({ destino, titulo, cor }) => {
              const linhas = geral.linhas.filter((l) => l.destino === destino);
              if (linhas.length === 0) return null;
              const temEmpate = linhas.some((l) => empates.flat().includes(l.jogadorId));
              return (
                <Acordeao
                  key={destino}
                  aberto={aberto === destino}
                  onAlternar={() => setAberto(alternar(aberto, destino))}
                  titulo={
                    <>
                      <span className={`size-3 shrink-0 rounded-full ${cor}`} />
                      {titulo}
                      <span className="text-sm font-normal text-slate-500">({linhas.length})</span>
                      {temEmpate && <AlertTriangle size={16} className="text-amber-600" aria-label="Empate a definir" />}
                    </>
                  }
                  subtitulo={`${linhas[0].posicao}º ao ${linhas[linhas.length - 1].posicao}º · 1º ${dados.nome(linhas[0].jogadorId)}`}
                >
                  <TabelaClassificacao<LinhaGeral>
                    linhas={linhas}
                    nome={dados.nome}
                    empatados={new Set(empates.flat())}
                    origem={(l) => `Grupo ${letra(l.grupoId)} · ${l.posicaoGrupo}º`}
                  />
                </Acordeao>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && etapa && desempate && (
        <DesempateModal
          empatados={desempate}
          nome={dados.nome}
          onSalvar={(ordem) => salvarDesempateGeral(etapa, ordem)}
          onFechar={() => setDesempate(null)}
        />
      )}
    </>
  );
}
