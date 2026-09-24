"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Trophy } from "lucide-react";
import { useEtapaSelecionada } from "@/components/EtapaSelect";
import { useCollection } from "@/lib/useCollection";
import { VAGAS_FINALS } from "@/lib/useRank";
import type { ChaveDoc, Etapa, Partida } from "@/lib/types";

type Props = { temporada: number; finals?: Etapa; nome: (id: string | null) => string };

/** Destaque da Finals da temporada na aba Rank: vagas → chave divulgada → campeão. */
export function FinalsCard({ temporada, finals, nome }: Props) {
  const router = useRouter();
  const { setEtapaId } = useEtapaSelecionada();
  const chaves = useCollection<ChaveDoc>("chaves", { onde: { campo: "etapaId", igual: finals?.id } });
  const partidas = useCollection<Partida>("partidas", { onde: { campo: "etapaId", igual: finals?.id } });

  const gerada = chaves.data.length > 0;
  const campeao = partidas.data.find((p) => p.fase === "final")?.vencedorId ?? null;

  const texto = !finals
    ? `Os ${VAGAS_FINALS} primeiros do Rank garantem vaga na Finals.`
    : campeao
      ? `Campeão: ${nome(campeao)}`
      : gerada
        ? "Chave divulgada — acompanhe os jogos."
        : "Chave em breve.";

  const conteudo = (
    <>
      <Trophy className="shrink-0 text-amber-500" size={28} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{finals?.nome ?? `Finals ${temporada}`}</span>
        <span className="block text-sm text-slate-600">{texto}</span>
      </span>
      {finals && <ChevronRight className="shrink-0 text-slate-400" size={20} />}
    </>
  );

  const cls = "flex min-h-16 w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left";
  if (!finals) return <div className={cls}>{conteudo}</div>;
  return (
    <button
      className={`${cls} hover:bg-amber-100`}
      onClick={() => {
        setEtapaId(finals.id);
        router.push("/chaves");
      }}
    >
      {conteudo}
    </button>
  );
}
