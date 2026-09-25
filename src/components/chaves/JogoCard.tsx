import { Pencil } from "lucide-react";
import { ehWO } from "@/lib/engine/placar";
import type { SetPlacar } from "@/lib/types";

export type JogoExibido = {
  jogador1Id: string | null;
  jogador2Id: string | null;
  vencedorId: string | null;
  sets?: SetPlacar[];
};

type Props = {
  jogo: JogoExibido;
  nome: (id: string | null) => string;
  seed: (id: string | null) => number | null;
  /** Só quando o admin pode editar (os dois jogadores definidos, chave gerada). */
  onEditar?: () => void;
};

/** Um confronto do mata-mata: dois jogadores com seed, placar por set, vencedor em destaque. */
export function JogoCard({ jogo, nome, seed, onEditar }: Props) {
  const sets = jogo.sets ?? [];
  const bye = !!jogo.vencedorId && (!jogo.jogador1Id || !jogo.jogador2Id);

  const linha = (id: string | null, lado: 1 | 2) => {
    const venceu = !!id && jogo.vencedorId === id;
    const s = seed(id);
    return (
      <div className={`flex min-h-10 items-center gap-2 px-3 ${venceu ? "font-semibold text-slate-900" : "text-slate-600"}`}>
        <span className="w-6 shrink-0 text-right text-xs text-slate-400 tabular-nums">{s ? `${s}` : ""}</span>
        <span className={`min-w-0 flex-1 truncate ${id ? "" : "text-slate-400 italic"}`}>
          {id ? nome(id) : bye ? "bye" : "a definir"}
        </span>
        <span className="flex gap-2 tabular-nums">
          {sets.map((st, i) => {
            const g = lado === 1 ? st.games1 : st.games2;
            const o = lado === 1 ? st.games2 : st.games1;
            return (
              <span key={i} className={`w-5 text-center ${st.superTieBreak ? "text-amber-700" : ""} ${g > o ? "font-semibold" : "text-slate-500"}`}>
                {g}
              </span>
            );
          })}
        </span>
      </div>
    );
  };

  const conteudo = (
    <>
      {linha(jogo.jogador1Id, 1)}
      <div className="border-t border-slate-100" />
      {linha(jogo.jogador2Id, 2)}
    </>
  );

  return (
    <div className="relative rounded-xl border border-slate-200 bg-superficie">
      {ehWO(sets) && (
        <span className="absolute -top-2 right-3 rounded bg-slate-200 px-1.5 text-xs font-semibold text-slate-700">W.O.</span>
      )}
      {bye && <span className="absolute -top-2 right-3 rounded bg-slate-100 px-1.5 text-xs text-slate-500">avança direto</span>}
      {onEditar ? (
        <button onClick={onEditar} className="flex w-full items-center py-1 text-left hover:bg-slate-50" aria-label="Editar placar">
          <span className="flex-1">{conteudo}</span>
          <Pencil size={16} className="mr-3 shrink-0 text-emerald-700" />
        </button>
      ) : (
        <div className="py-1">{conteudo}</div>
      )}
    </div>
  );
}
