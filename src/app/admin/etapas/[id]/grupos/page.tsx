"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import { JogadorPicker } from "@/components/JogadorPicker";
import { PageHeader } from "@/components/PageHeader";
import { Voltar } from "@/components/Voltar";
import { Alerta, btnIcon, btnPrimary, btnSecondary, Card, Carregando, Vazio } from "@/components/ui";
import { adicionarJogadoresGrupo, criarGrupo, excluirGrupo, removerJogadorGrupo, renomearGrupo } from "@/lib/repo";
import { useCollection } from "@/lib/useCollection";
import type { Etapa, Grupo, Jogador, Partida } from "@/lib/types";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Picker = { modo: "novo" } | { modo: "adicionar"; grupo: Grupo } | null;

export default function GruposAdminPage() {
  const { id: etapaId } = useParams<{ id: string }>();
  const etapas = useCollection<Etapa>("etapas");
  const jogadores = useCollection<Jogador>("jogadores", { ordenarPor: "nome_normalizado" });
  const grupos = useCollection<Grupo>("grupos", { onde: { campo: "etapaId", igual: etapaId } });
  const partidas = useCollection<Partida>("partidas", { onde: { campo: "etapaId", igual: etapaId } });
  const [picker, setPicker] = useState<Picker>(null);
  const [erro, setErro] = useState<string | null>(null);

  const etapa = etapas.data.find((e) => e.id === etapaId);
  const listaGrupos = [...grupos.data].sort((a, b) => a.nome.localeCompare(b.nome));
  const nomeJogador = (id: string) => jogadores.data.find((j) => j.id === id)?.nome ?? "(jogador removido)";
  const emAlgumGrupo = new Set(grupos.data.flatMap((g) => g.jogadorIds));
  const disponiveis = jogadores.data.filter((j) => !emAlgumGrupo.has(j.id));
  const proximoNome = `Grupo ${[...LETRAS].find((l) => !grupos.data.some((g) => g.nome === `Grupo ${l}`)) ?? grupos.data.length + 1}`;
  const jogosDoGrupo = (g: Grupo) => partidas.data.filter((p) => p.grupoId === g.id);

  async function executar(acao: () => Promise<void>) {
    setErro(null);
    try {
      await acao();
    } catch (e) {
      setErro(`Erro ao salvar: ${e instanceof Error ? e.message : e}`);
    }
  }

  function remover(g: Grupo, jogadorId: string) {
    const comPlacar = jogosDoGrupo(g).filter((p) => p.sets.length > 0 && (p.jogador1Id === jogadorId || p.jogador2Id === jogadorId));
    const aviso = comPlacar.length ? `\n\nATENÇÃO: ${comPlacar.length} jogo(s) com placar serão apagados.` : "";
    if (confirm(`Remover ${nomeJogador(jogadorId)} do ${g.nome}? Os jogos dele neste grupo serão apagados.${aviso}`)) {
      executar(() => removerJogadorGrupo(g, jogadorId));
    }
  }

  function renomear(g: Grupo) {
    const nome = prompt("Nome do grupo", g.nome)?.trim();
    if (nome && nome !== g.nome) executar(() => renomearGrupo(g.id, nome));
  }

  function excluir(g: Grupo) {
    if (confirm(`Excluir o ${g.nome} e todos os seus ${jogosDoGrupo(g).length} jogos?`)) executar(() => excluirGrupo(g));
  }

  const loading = etapas.loading || jogadores.loading || grupos.loading;

  return (
    <>
      <Voltar href={`/admin/etapas/${etapaId}`} label={etapa?.nome ?? "Etapa"} />
      <PageHeader
        title="Grupos"
        subtitle={`${etapa?.nome ?? ""} · ${grupos.data.length} grupos · ${emAlgumGrupo.size} jogadores · ${partidas.data.filter((p) => p.fase === "grupo").length} jogos`}
      />

      <button className={`${btnPrimary} mb-4 w-full`} onClick={() => setPicker({ modo: "novo" })}>
        <Plus size={18} /> Novo grupo ({proximoNome})
      </button>

      {erro && <div className="mb-4"><Alerta>{erro}</Alerta></div>}

      {loading ? (
        <Carregando />
      ) : listaGrupos.length === 0 ? (
        <Vazio>Nenhum grupo criado nesta etapa.</Vazio>
      ) : (
        <div className="space-y-3">
          {listaGrupos.map((g) => (
            <Card key={g.id}>
              <div className="mb-2 flex items-center gap-1">
                <h2 className="flex-1 text-lg font-semibold">{g.nome}</h2>
                <span className="text-sm text-slate-500">{jogosDoGrupo(g).length} jogos</span>
                <button className={btnIcon} onClick={() => renomear(g)} aria-label={`Renomear ${g.nome}`}>
                  <Pencil size={18} />
                </button>
                <button className={btnIcon} onClick={() => excluir(g)} aria-label={`Excluir ${g.nome}`}>
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
              <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                {g.jogadorIds.map((jid) => (
                  <li key={jid} className="flex items-center pl-3">
                    <span className="flex-1">{nomeJogador(jid)}</span>
                    <button className={btnIcon} onClick={() => remover(g, jid)} aria-label={`Remover ${nomeJogador(jid)}`}>
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
              <button className={`${btnSecondary} w-full`} onClick={() => setPicker({ modo: "adicionar", grupo: g })}>
                <UserPlus size={18} /> Adicionar jogadores
              </button>
            </Card>
          ))}
        </div>
      )}

      {picker && (
        <JogadorPicker
          titulo={picker.modo === "novo" ? `Novo ${proximoNome}` : `Adicionar ao ${picker.grupo.nome}`}
          disponiveis={disponiveis}
          onFechar={() => setPicker(null)}
          onConfirmar={(ids) =>
            picker.modo === "novo" ? criarGrupo(etapaId, proximoNome, ids) : adicionarJogadoresGrupo(picker.grupo, ids)
          }
        />
      )}
    </>
  );
}
