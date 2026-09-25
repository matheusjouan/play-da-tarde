import { Check } from "lucide-react";
import { ehWO } from "@/lib/engine/placar";
import type { SetPlacar } from "@/lib/types";

type Props = {
  titulo: string;
  /** Nome da etapa, em cinza ao lado do título. */
  etapa?: string;
  jogador1: string;
  jogador2: string;
  jogador1Venceu: boolean;
  jogador2Venceu: boolean;
  sets: SetPlacar[];
  data: string | null;
};

/** Um placar recente: título (grupo ou fase), os dois jogadores com o vencedor em verde, placar por set e data. */
export function RecenteCard({ titulo, etapa, jogador1, jogador2, jogador1Venceu, jogador2Venceu, sets, data }: Props) {
  const linha = (nome: string, venceu: boolean, lado: 1 | 2) => (
    <div className={`flex min-h-10 items-center gap-2 ${venceu ? "font-semibold text-emerald-700" : "text-slate-600"}`}>
      <span className="flex w-4 shrink-0 justify-center">{venceu && <Check size={16} strokeWidth={3} aria-label="Vencedor" />}</span>
      <span className="min-w-0 flex-1 truncate">{nome}</span>
      <span className="flex gap-2 tabular-nums">
        {sets.map((s, i) => {
          const g = lado === 1 ? s.games1 : s.games2;
          const o = lado === 1 ? s.games2 : s.games1;
          return (
            <span
              key={i}
              className={`w-5 text-center ${s.superTieBreak ? "text-amber-700" : ""} ${g > o ? "font-semibold" : "font-normal text-slate-500"}`}
            >
              {g}
            </span>
          );
        })}
      </span>
    </div>
  );

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <header className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="truncate font-bold tracking-wide text-slate-900 uppercase">{titulo}</h2>
        {etapa && <span className="shrink-0 text-xs text-slate-400">{etapa}</span>}
      </header>
      {linha(jogador1, jogador1Venceu, 1)}
      <div className="border-t border-slate-100" />
      {linha(jogador2, jogador2Venceu, 2)}
      <footer className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>{data ? `Data: ${data}` : ""}</span>
        {ehWO(sets) && <span className="rounded bg-slate-200 px-1.5 py-0.5 font-semibold text-slate-700">W.O.</span>}
      </footer>
    </article>
  );
}
