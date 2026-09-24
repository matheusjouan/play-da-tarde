"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { JogoCard, type JogoExibido } from "@/components/chaves/JogoCard";
import { NOME_FASE, type FaseMM } from "@/lib/engine/chave";

type Jogo = JogoExibido & { fase: FaseMM; slot: number; id?: string };

type Props = {
  fases: FaseMM[];
  jogos: Jogo[];
  nome: (id: string | null) => string;
  seed: (id: string | null) => number | null;
  onEditar?: (jogo: Jogo) => void;
};

/** Chave em abas por fase (Oitavas / Quartas / Semi / Final), pensada para o celular. */
export function ChaveView({ fases, jogos, nome, seed, onEditar }: Props) {
  // Abre na primeira fase que ainda tem jogo sem vencedor.
  const faseAtual = fases.find((f) => jogos.some((j) => j.fase === f && !j.vencedorId)) ?? fases[fases.length - 1];
  const [escolhida, setEscolhida] = useState<FaseMM | null>(null);
  const fase = escolhida && fases.includes(escolhida) ? escolhida : faseAtual;

  const doFase = jogos.filter((j) => j.fase === fase).sort((a, b) => a.slot - b.slot);
  const final = jogos.find((j) => j.fase === "final");
  const campeao = final?.vencedorId;

  return (
    <div>
      {campeao && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Trophy className="text-amber-600" size={24} />
          <div>
            <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">Campeão</p>
            <p className="font-semibold">{nome(campeao)}</p>
          </div>
        </div>
      )}

      <div role="tablist" className="mb-3 flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {fases.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={f === fase}
            onClick={() => setEscolhida(f)}
            className={`min-h-11 flex-1 rounded-md px-3 text-sm font-medium whitespace-nowrap ${
              f === fase ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"
            }`}
          >
            {NOME_FASE[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {doFase.map((j, i) => (
          <div key={`${j.fase}-${j.slot}`}>
            {/* separa as metades da chave (quem só se cruza na final) */}
            {fase !== "final" && i === doFase.length / 2 && <div className="my-4 border-t-2 border-dashed border-slate-200" />}
            <JogoCard
              jogo={j}
              nome={nome}
              seed={seed}
              onEditar={onEditar && j.jogador1Id && j.jogador2Id ? () => onEditar(j) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
