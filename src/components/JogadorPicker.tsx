"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { btnIcon, btnPrimary, inputCls } from "@/components/ui";
import { normalizarNome } from "@/lib/nomes";
import type { Jogador } from "@/lib/types";

type Props = {
  titulo: string;
  disponiveis: Jogador[];
  onConfirmar: (ids: string[]) => Promise<void>;
  onFechar: () => void;
};

/** Tela cheia (mobile) para escolher vários jogadores. */
export function JogadorPicker({ titulo, disponiveis, onConfirmar, onFechar }: Props) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const filtro = normalizarNome(busca);
  const visiveis = filtro ? disponiveis.filter((j) => j.nome_normalizado.includes(filtro)) : disponiveis;

  function alternar(id: string) {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function confirmar() {
    setSalvando(true);
    setErro(null);
    try {
      await onConfirmar(selecionados);
      onFechar();
    } catch (e) {
      setErro(`Erro ao salvar: ${e instanceof Error ? e.message : e}`);
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-slate-200 px-2">
        <button className={btnIcon} onClick={onFechar} aria-label="Fechar">
          <X size={22} />
        </button>
        <h2 className="flex-1 font-semibold">{titulo}</h2>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-4">
        <div className="relative mb-3">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={18} />
          <input className={`${inputCls} pl-10`} placeholder="Buscar jogador" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        {disponiveis.length === 0 ? (
          <p className="p-6 text-center text-slate-500">
            Todos os jogadores já estão em grupos desta etapa.{" "}
            <Link href="/admin/jogadores" className="text-emerald-700 underline">
              Cadastrar jogadores
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {visiveis.map((j) => (
              <li key={j.id}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4">
                  <input
                    type="checkbox"
                    className="size-5 accent-emerald-700"
                    checked={selecionados.includes(j.id)}
                    onChange={() => alternar(j.id)}
                  />
                  {j.nome}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl">
          {erro && <p className="mb-2 text-sm text-red-700">{erro}</p>}
          <button className={`${btnPrimary} w-full`} disabled={salvando || selecionados.length === 0} onClick={confirmar}>
            {salvando ? "Salvando…" : `Confirmar (${selecionados.length} selecionados)`}
          </button>
        </div>
      </footer>
    </div>
  );
}
