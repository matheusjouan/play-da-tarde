"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { inputCls } from "@/components/ui";
import { agruparPorTemporada, ordenarEtapas } from "@/lib/etapas";
import { useCollection } from "@/lib/useCollection";
import type { Etapa } from "@/lib/types";

// A escolha fica no layout raiz, que não é desmontado ao trocar de aba:
// escolher a 2ª etapa em Grupos mantém a 2ª etapa em Geral e Chaves.
const EscolhaContext = createContext<[string | null, (id: string) => void] | null>(null);

export function EtapaSelecionadaProvider({ children }: { children: ReactNode }) {
  const escolha = useState<string | null>(null);
  return <EscolhaContext.Provider value={escolha}>{children}</EscolhaContext.Provider>;
}

/**
 * Etapa escolhida pelo usuário; padrão = a mais recente (maior temporada, depois maior número).
 * Só etapas jogadas no sistema (importadas não têm grupos/chaves).
 * `incluirFinals: false` (Grupos, Geral): a Finals não aparece e não vira o padrão.
 */
export function useEtapaSelecionada({ incluirFinals = true }: { incluirFinals?: boolean } = {}) {
  const ctx = useContext(EscolhaContext);
  if (!ctx) throw new Error("useEtapaSelecionada precisa estar dentro de <EtapaSelecionadaProvider>");
  const [escolhida, setEscolhida] = ctx;
  const etapas = useCollection<Etapa>("etapas");
  const lista = ordenarEtapas(etapas.data.filter((e) => e.origem === "sistema" && (incluirFinals || e.tipo !== "finals")));
  const etapa = lista.find((e) => e.id === escolhida) ?? lista[0];
  return { etapa, lista, setEtapaId: setEscolhida, loading: etapas.loading, error: etapas.error };
}

export function EtapaSelect({ lista, etapa, onChange }: { lista: Etapa[]; etapa?: Etapa; onChange: (id: string) => void }) {
  if (lista.length <= 1) return null;
  const grupos = agruparPorTemporada(lista);
  return (
    <select className={`${inputCls} mb-4`} value={etapa?.id} onChange={(e) => onChange(e.target.value)} aria-label="Etapa">
      {grupos.length === 1
        ? lista.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))
        : grupos.map(([temporada, etapas]) => (
            <optgroup key={temporada} label={`Temporada ${temporada}`}>
              {etapas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </optgroup>
          ))}
    </select>
  );
}
