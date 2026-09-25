import { Pencil } from "lucide-react";
import { ehWO } from "@/lib/engine/placar";
import type { Partida } from "@/lib/types";

type Props = {
  jogos: Partida[];
  nome: (id: string | null) => string;
  podeEditar: boolean;
  onEditar: (p: Partida) => void;
};

export function ListaJogos({ jogos, nome, podeEditar, onEditar }: Props) {
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {jogos.map((p) => {
        const temPlacar = p.sets.length > 0;
        const venceu = (id: string | null) => (temPlacar && p.vencedorId === id ? "font-semibold text-slate-900" : "text-slate-600");
        const conteudo = (
          <>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={`truncate ${venceu(p.jogador1Id)}`}>{nome(p.jogador1Id)}</span>
              <span className={`truncate ${venceu(p.jogador2Id)}`}>{nome(p.jogador2Id)}</span>
            </span>
            {temPlacar ? (
              <span className="flex items-center gap-2">
                {ehWO(p.sets) && <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-semibold text-slate-700">W.O.</span>}
                <span className="flex gap-2 tabular-nums">
                  {p.sets.map((s, i) => (
                    <span key={i} className={`flex flex-col items-center ${s.superTieBreak ? "text-amber-700" : ""}`}>
                      <span className={s.games1 > s.games2 ? "font-semibold" : "text-slate-500"}>{s.games1}</span>
                      <span className={s.games2 > s.games1 ? "font-semibold" : "text-slate-500"}>{s.games2}</span>
                    </span>
                  ))}
                </span>
              </span>
            ) : (
              <span className="text-xs text-slate-400">a jogar</span>
            )}
            {podeEditar && <Pencil size={16} className="shrink-0 text-emerald-700" />}
          </>
        );
        return (
          <li key={p.id}>
            {podeEditar ? (
              <button
                onClick={() => onEditar(p)}
                className="flex min-h-14 w-full items-center gap-3 py-2 text-left hover:bg-slate-50"
                aria-label={`Editar placar: ${nome(p.jogador1Id)} × ${nome(p.jogador2Id)}`}
              >
                {conteudo}
              </button>
            ) : (
              <div className="flex min-h-14 items-center gap-3 py-2">{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
