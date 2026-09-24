"use client";

import { useRouter } from "next/navigation";
import { EtapaForm } from "@/components/EtapaForm";
import { PageHeader } from "@/components/PageHeader";
import { Voltar } from "@/components/Voltar";
import { Carregando } from "@/components/ui";
import { novaEtapaPadrao } from "@/lib/defaults";
import { criarEtapa } from "@/lib/repo";
import { useCollection } from "@/lib/useCollection";
import type { Etapa } from "@/lib/types";

export default function NovaEtapaPage() {
  const router = useRouter();
  const { data: etapas, loading } = useCollection<Etapa>("etapas");

  const numeros = etapas.map((e) => e.numero);
  const proximo = numeros.length ? Math.max(...numeros) + 1 : 1;

  return (
    <>
      <Voltar href="/admin/etapas" label="Etapas" />
      <PageHeader title="Nova etapa" subtitle="Valores de pontos pré-preenchidos com o padrão — edite se precisar" />
      {loading ? (
        <Carregando />
      ) : (
        <EtapaForm
          inicial={novaEtapaPadrao(proximo)}
          numerosEmUso={numeros}
          onSalvar={async (dados) => {
            await criarEtapa(dados);
            router.push("/admin/etapas");
          }}
        />
      )}
    </>
  );
}
