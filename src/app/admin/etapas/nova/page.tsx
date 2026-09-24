"use client";

import { useRouter } from "next/navigation";
import { EtapaForm } from "@/components/EtapaForm";
import { PageHeader } from "@/components/PageHeader";
import { Voltar } from "@/components/Voltar";
import { Carregando } from "@/components/ui";
import { novaEtapaPadrao } from "@/lib/defaults";
import { proximoNumero } from "@/lib/etapas";
import { criarEtapa } from "@/lib/repo";
import { useCollection } from "@/lib/useCollection";
import type { Etapa } from "@/lib/types";

export default function NovaEtapaPage() {
  const router = useRouter();
  const { data: etapas, loading } = useCollection<Etapa>("etapas");
  const inicial = novaEtapaPadrao(1);
  inicial.numero = proximoNumero(etapas, inicial.temporada!);
  inicial.nome = `${inicial.numero}ª Etapa`;

  return (
    <>
      <Voltar href="/admin/etapas" label="Etapas" />
      <PageHeader title="Nova etapa" subtitle="Valores de pontos pré-preenchidos com o padrão — edite se precisar" />
      {loading ? (
        <Carregando />
      ) : (
        <EtapaForm
          inicial={inicial}
          outras={etapas}
          onSalvar={async (dados) => {
            await criarEtapa(dados);
            router.push("/admin/etapas");
          }}
        />
      )}
    </>
  );
}
