"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  aberto: boolean;
  onAlternar: () => void;
  children: ReactNode;
};

/**
 * Item de acordeão controlado pela página (só um aberto por vez, todos começam fechados).
 * Ao abrir, o item aberto acima fecha e a página "pula": rola este item até o topo.
 */
export function Acordeao({ titulo, subtitulo, aberto, onAlternar, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (aberto) ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [aberto]);

  return (
    <section ref={ref} className="scroll-mt-16 rounded-xl border border-slate-200 bg-white">
      <button onClick={onAlternar} aria-expanded={aberto} className="flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-lg font-semibold">{titulo}</span>
          {subtitulo && <span className="block truncate text-sm text-slate-500">{subtitulo}</span>}
        </span>
        <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && <div className="space-y-4 px-4 pb-4">{children}</div>}
    </section>
  );
}

/** Estado de "qual item está aberto" (só um por vez, todos começam fechados). */
export function alternar(atual: string | null, id: string): string | null {
  return atual === id ? null : id;
}
