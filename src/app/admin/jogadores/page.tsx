"use client";

import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Voltar } from "@/components/Voltar";
import { Alerta, btnIcon, btnPrimary, Card, Carregando, inputCls, Vazio } from "@/components/ui";
import { criarJogador, excluirJogador, nomeJaExiste, renomearJogador } from "@/lib/repo";
import { limparNome, normalizarNome } from "@/lib/nomes";
import { useCollection } from "@/lib/useCollection";
import type { Jogador } from "@/lib/types";

export default function JogadoresPage() {
  const { data: jogadores, loading, error } = useCollection<Jogador>("jogadores", { ordenarPor: "nome_normalizado" });
  const [novo, setNovo] = useState("");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null);
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function executar(acao: () => Promise<void>) {
    setSalvando(true);
    setMsg(null);
    try {
      await acao();
    } catch (e) {
      setMsg({ tipo: "erro", texto: `Erro ao salvar: ${e instanceof Error ? e.message : e}` });
    } finally {
      setSalvando(false);
    }
  }

  function adicionar(e: FormEvent) {
    e.preventDefault();
    const nome = limparNome(novo);
    if (!nome) return;
    if (nomeJaExiste(jogadores, nome)) {
      setMsg({ tipo: "erro", texto: `Já existe um jogador chamado "${nome}".` });
      return;
    }
    executar(async () => {
      await criarJogador(nome);
      setNovo("");
      setMsg({ tipo: "ok", texto: `"${nome}" cadastrado.` });
    });
  }

  function salvarEdicao() {
    if (!editando) return;
    const nome = limparNome(editando.nome);
    if (!nome) return;
    if (nomeJaExiste(jogadores, nome, editando.id)) {
      setMsg({ tipo: "erro", texto: `Já existe um jogador chamado "${nome}".` });
      return;
    }
    executar(async () => {
      await renomearJogador(editando.id, nome);
      setEditando(null);
    });
  }

  function excluir(j: Jogador) {
    if (!confirm(`Excluir "${j.nome}"?`)) return;
    executar(async () => {
      const ok = await excluirJogador(j.id);
      setMsg(ok ? { tipo: "ok", texto: `"${j.nome}" excluído.` } : { tipo: "erro", texto: `"${j.nome}" está em um grupo e não pode ser excluído.` });
    });
  }

  const filtro = normalizarNome(busca);
  const visiveis = filtro ? jogadores.filter((j) => j.nome_normalizado.includes(filtro)) : jogadores;

  return (
    <>
      <Voltar />
      <PageHeader title="Jogadores" subtitle={`${jogadores.length} cadastrados`} />

      <Card className="mb-4">
        <form onSubmit={adicionar} className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Nome do novo jogador"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
          />
          <button type="submit" className={btnPrimary} disabled={salvando || !novo.trim()}>
            <Plus size={18} /> Adicionar
          </button>
        </form>
      </Card>

      {msg && <div className="mb-4"><Alerta tipo={msg.tipo}>{msg.texto}</Alerta></div>}
      {error && <div className="mb-4"><Alerta>Erro ao carregar: {error}</Alerta></div>}

      {jogadores.length > 8 && (
        <div className="relative mb-2">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={18} />
          <input className={`${inputCls} pl-10`} placeholder="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      )}

      {loading ? (
        <Carregando />
      ) : visiveis.length === 0 ? (
        <Vazio>{busca ? "Nenhum jogador encontrado." : "Nenhum jogador cadastrado."}</Vazio>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {visiveis.map((j) =>
            editando?.id === j.id ? (
              <li key={j.id} className="flex items-center gap-1 px-2 py-1">
                <input
                  autoFocus
                  className={inputCls}
                  value={editando.nome}
                  onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && salvarEdicao()}
                />
                <button className={btnIcon} onClick={salvarEdicao} disabled={salvando} aria-label="Salvar">
                  <Check size={20} className="text-emerald-700" />
                </button>
                <button className={btnIcon} onClick={() => setEditando(null)} aria-label="Cancelar">
                  <X size={20} />
                </button>
              </li>
            ) : (
              <li key={j.id} className="flex items-center gap-1 pl-4 pr-2">
                <span className="flex-1 py-2">{j.nome}</span>
                <button className={btnIcon} onClick={() => setEditando({ id: j.id, nome: j.nome })} aria-label={`Editar ${j.nome}`}>
                  <Pencil size={18} />
                </button>
                <button className={btnIcon} onClick={() => excluir(j)} disabled={salvando} aria-label={`Excluir ${j.nome}`}>
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </>
  );
}
