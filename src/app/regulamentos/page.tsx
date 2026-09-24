"use client";

import { ExternalLink, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Alerta, Carregando, Vazio } from "@/components/ui";
import { ordenarEtapas } from "@/lib/etapas";
import { useCollection } from "@/lib/useCollection";
import { temporadaDe, type Etapa, type Regulamento } from "@/lib/types";

export default function RegulamentosPage() {
  const etapas = useCollection<Etapa>("etapas");
  const regulamentos = useCollection<Regulamento>("regulamentos", { ordenarPor: "titulo" });

  // Etapas mais recentes primeiro; só as que têm regulamento.
  const porEtapa = ordenarEtapas(etapas.data)
    .map((e) => ({ etapa: e, docs: regulamentos.data.filter((r) => r.etapaId === e.id) }))
    .filter((g) => g.docs.length > 0);

  const loading = etapas.loading || regulamentos.loading;
  const error = etapas.error || regulamentos.error;

  return (
    <>
      <PageHeader title="Regulamentos" subtitle="Documentos de cada etapa" />
      {error && <Alerta>Erro ao carregar: {error}</Alerta>}
      {loading ? (
        <Carregando />
      ) : porEtapa.length === 0 ? (
        <Vazio>Nenhum regulamento publicado ainda.</Vazio>
      ) : (
        <div className="space-y-5">
          {porEtapa.map(({ etapa, docs }) => (
            <section key={etapa.id}>
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
                {etapa.nome} · {temporadaDe(etapa)}
              </h2>
              <ul className="space-y-2">
                {docs.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 hover:bg-slate-50"
                    >
                      <FileText className="text-emerald-700" size={22} />
                      <span className="flex-1 font-medium">{r.titulo}</span>
                      <ExternalLink className="text-slate-400" size={18} />
                    </a>
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
