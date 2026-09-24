"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Users } from "lucide-react";
import { EtapaForm } from "@/components/EtapaForm";
import { PageHeader } from "@/components/PageHeader";
import { Voltar } from "@/components/Voltar";
import { btnPrimary, Carregando, Vazio } from "@/components/ui";
import { atualizarEtapa, excluirEtapa } from "@/lib/repo";
import { useCollection } from "@/lib/useCollection";
import type { Etapa } from "@/lib/types";

export default function EditarEtapaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: etapas, loading } = useCollection<Etapa>("etapas");
  const etapa = etapas.find((e) => e.id === id);

  async function excluir() {
    if (!etapa || !confirm(`Excluir "${etapa.nome}"?`)) return;
    const ok = await excluirEtapa(etapa.id);
    if (!ok) return alert("Esta etapa já tem grupos e não pode ser excluída.");
    router.push("/admin/etapas");
  }

  return (
    <>
      <Voltar href="/admin/etapas" label="Etapas" />
      {loading ? (
        <Carregando />
      ) : !etapa ? (
        <Vazio>Etapa não encontrada.</Vazio>
      ) : (
        <>
          <PageHeader title={etapa.nome} />
          {etapa.origem === "sistema" && (
            <Link href={`/admin/etapas/${etapa.id}/grupos`} className={`${btnPrimary} mb-4 w-full`}>
              <Users size={18} /> Montar grupos
            </Link>
          )}
          {/* key: remonta o formulário se outra aba alterar a etapa */}
          <EtapaForm
            key={JSON.stringify(etapa)}
            inicial={etapa}
            numerosEmUso={etapas.filter((e) => e.id !== id).map((e) => e.numero)}
            onSalvar={async ({ ...dados }) => {
              delete (dados as Partial<Etapa>).id;
              await atualizarEtapa(id, dados);
              router.push("/admin/etapas");
            }}
          />
          <button onClick={excluir} className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm text-red-600">
            <Trash2 size={16} /> Excluir etapa
          </button>
        </>
      )}
    </>
  );
}
