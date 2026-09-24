"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Voltar } from "@/components/Voltar";
import { Alerta, btnIcon, btnPrimary, Card, Carregando, Field, inputCls, Vazio } from "@/components/ui";
import { criarRegulamento, excluirRegulamento } from "@/lib/repo";
import { useCollection } from "@/lib/useCollection";
import type { Etapa, Regulamento } from "@/lib/types";

export default function AdminRegulamentosPage() {
  const etapas = useCollection<Etapa>("etapas", { ordenarPor: "numero" });
  const regulamentos = useCollection<Regulamento>("regulamentos", { ordenarPor: "titulo" });
  const [etapaId, setEtapaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [link, setLink] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const nomeEtapa = (id: string) => etapas.data.find((e) => e.id === id)?.nome ?? "Etapa removida";

  async function adicionar(ev: FormEvent) {
    ev.preventDefault();
    setErro(null);
    if (!etapaId) return setErro("Escolha a etapa.");
    if (!titulo.trim()) return setErro("Informe o título.");
    if (!/^https:\/\/\S+$/.test(link.trim())) return setErro("O link deve começar com https://");
    setSalvando(true);
    try {
      await criarRegulamento({ etapaId, titulo: titulo.trim(), link: link.trim() });
      setTitulo("");
      setLink("");
    } catch (e) {
      setErro(`Erro ao salvar: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(r: Regulamento) {
    if (confirm(`Excluir "${r.titulo}"?`)) await excluirRegulamento(r.id);
  }

  return (
    <>
      <Voltar />
      <PageHeader title="Regulamentos" subtitle="Cole o link de compartilhamento do Google Drive" />

      <Card className="mb-4">
        {etapas.data.length === 0 && !etapas.loading ? (
          <p className="text-sm text-slate-500">Cadastre uma etapa antes de adicionar regulamentos.</p>
        ) : (
          <form onSubmit={adicionar} className="space-y-3">
            <Field label="Etapa">
              <select className={inputCls} value={etapaId} onChange={(e) => setEtapaId(e.target.value)}>
                <option value="">Selecione…</option>
                {etapas.data.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Título">
              <input className={inputCls} placeholder="ex.: Regulamento 3ª Etapa" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </Field>
            <Field label="Link">
              <input className={inputCls} type="url" placeholder="https://drive.google.com/…" value={link} onChange={(e) => setLink(e.target.value)} />
            </Field>
            {erro && <Alerta>{erro}</Alerta>}
            <button type="submit" className={`${btnPrimary} w-full`} disabled={salvando}>
              <Plus size={18} /> Adicionar
            </button>
          </form>
        )}
      </Card>

      {regulamentos.loading ? (
        <Carregando />
      ) : regulamentos.data.length === 0 ? (
        <Vazio>Nenhum regulamento cadastrado.</Vazio>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {regulamentos.data.map((r) => (
            <li key={r.id} className="flex items-center gap-1 pl-4 pr-2">
              <span className="flex-1 py-2">
                <span className="block font-medium">{r.titulo}</span>
                <span className="block text-sm text-slate-500">{nomeEtapa(r.etapaId)}</span>
              </span>
              <a href={r.link} target="_blank" rel="noopener noreferrer" className={btnIcon} aria-label="Abrir link">
                <ExternalLink size={18} />
              </a>
              <button className={btnIcon} onClick={() => excluir(r)} aria-label={`Excluir ${r.titulo}`}>
                <Trash2 size={18} className="text-red-600" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
