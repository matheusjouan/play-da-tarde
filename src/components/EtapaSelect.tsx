"use client";

import { useState } from "react";
import { inputCls } from "@/components/ui";
import type { Etapa } from "@/lib/types";

/** Etapas jogadas no sistema (não importadas), da mais recente para a mais antiga. */
function etapasJogaveis(etapas: Etapa[]): Etapa[] {
  return etapas.filter((e) => e.origem === "sistema").sort((a, b) => b.numero - a.numero);
}

/** Etapa escolhida pelo usuário; padrão = a mais recente. */
export function useEtapaSelecionada(etapas: Etapa[]) {
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const lista = etapasJogaveis(etapas);
  const etapa = lista.find((e) => e.id === escolhida) ?? lista[0];
  return { etapa, lista, setEtapaId: setEscolhida };
}

export function EtapaSelect({ lista, etapa, onChange }: { lista: Etapa[]; etapa?: Etapa; onChange: (id: string) => void }) {
  if (lista.length <= 1) return null;
  return (
    <select className={`${inputCls} mb-4`} value={etapa?.id} onChange={(e) => onChange(e.target.value)} aria-label="Etapa">
      {lista.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nome}
        </option>
      ))}
    </select>
  );
}
