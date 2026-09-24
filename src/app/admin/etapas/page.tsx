"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Voltar } from "@/components/Voltar";
import { Alerta, btnPrimary, Carregando, Vazio } from "@/components/ui";
import { agruparPorTemporada } from "@/lib/etapas";
import { useCollection } from "@/lib/useCollection";
import type { Etapa } from "@/lib/types";

const STATUS = { grupos: "Fase de grupos", mata_mata: "Mata-mata", finalizada: "Finalizada" };

export default function EtapasPage() {
  const { data, loading, error } = useCollection<Etapa>("etapas");
  const temporadas = agruparPorTemporada(data);

  return (
    <>
      <Voltar />
      <PageHeader title="Etapas" />
      <Link href="/admin/etapas/nova" className={`${btnPrimary} mb-4 w-full`}>
        <Plus size={18} /> Nova etapa
      </Link>

      {error && <Alerta>Erro ao carregar: {error}</Alerta>}
      {loading ? (
        <Carregando />
      ) : data.length === 0 ? (
        <Vazio>Nenhuma etapa cadastrada.</Vazio>
      ) : (
        <div className="space-y-5">
          {temporadas.map(([temporada, etapas]) => (
            <section key={temporada}>
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">Temporada {temporada}</h2>
              <ul className="space-y-2">
                {etapas.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/admin/etapas/${e.id}`}
                      className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 hover:bg-slate-50"
                    >
                      <span className="flex-1">
                        <span className="block font-medium">{e.nome}</span>
                        <span className="block text-sm text-slate-500">
                          {e.tipo === "finals" ? "Finals" : "Regular"} · {STATUS[e.status]}
                          {e.origem === "importado" && " · importada"}
                        </span>
                      </span>
                      <ChevronRight className="text-slate-400" size={20} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
