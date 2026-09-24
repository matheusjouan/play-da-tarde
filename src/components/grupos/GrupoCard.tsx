"use client";

import { AlertTriangle, ChevronDown } from "lucide-react";
import { ListaJogos } from "@/components/grupos/ListaJogos";
import { TabelaClassificacao } from "@/components/grupos/TabelaClassificacao";
import { btnSecondary } from "@/components/ui";
import type { Classificacao } from "@/lib/engine/classificacao";
import type { Grupo, Partida } from "@/lib/types";

type Props = {
  grupo: Grupo;
  jogos: Partida[];
  classificacao: Classificacao;
  nome: (id: string | null) => string;
  isAdmin: boolean;
  abertoInicial: boolean;
  onEditarPlacar: (p: Partida) => void;
  onDesempatar: (empatados: string[]) => void;
};

export function GrupoCard({ grupo, jogos, classificacao, nome, isAdmin, abertoInicial, onEditarPlacar, onDesempatar }: Props) {
  const jogados = jogos.filter((p) => p.vencedorId).length;
  const completo = jogos.length > 0 && jogados === jogos.length;
  // Empate total só é sinalizado com o grupo completo (no meio do grupo é normal haver empates).
  const empates = completo ? classificacao.empates : [];
  const lider = jogados > 0 ? nome(classificacao.linhas[0]?.jogadorId ?? null) : null;

  return (
    <details open={abertoInicial} className="group rounded-xl border border-slate-200 bg-white">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
        <span className="flex-1">
          <span className="flex items-center gap-2 text-lg font-semibold">
            {grupo.nome}
            {empates.length > 0 && <AlertTriangle size={16} className="text-amber-600" aria-label="Empate a definir" />}
          </span>
          <span className="block text-sm text-slate-500">
            {jogados}/{jogos.length} jogos{completo ? " · encerrado" : ""}
            {lider && ` · 1º ${lider}`}
          </span>
        </span>
        <ChevronDown size={20} className="text-slate-400 transition-transform group-open:rotate-180" />
      </summary>

      <div className="space-y-4 px-4 pb-4">
        {empates.map((bloco) => (
          <div key={bloco.join()} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Empate total: {bloco.map((id) => nome(id)).join(", ")}</p>
            <p className="text-amber-800">A ordem deve ser definida por sorteio.</p>
            {isAdmin && (
              <button className={`${btnSecondary} mt-2 w-full`} onClick={() => onDesempatar(bloco)}>
                Definir ordem
              </button>
            )}
          </div>
        ))}

        <TabelaClassificacao
          linhas={classificacao.linhas}
          nome={(id) => nome(id)}
          empatados={new Set(empates.flat())}
        />

        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-600">Jogos</h3>
          <ListaJogos jogos={jogos} nome={nome} isAdmin={isAdmin} onEditar={onEditarPlacar} />
        </div>
      </div>
    </details>
  );
}
