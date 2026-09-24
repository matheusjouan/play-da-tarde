"use client";

import { EtapaSelect, useEtapaSelecionada } from "@/components/EtapaSelect";
import { PageHeader } from "@/components/PageHeader";
import { Vazio } from "@/components/ui";

export default function GeralPage() {
  const { etapa, lista, setEtapaId } = useEtapaSelecionada();
  return (
    <>
      <PageHeader title="Classificação Geral" subtitle={etapa?.nome ?? "Todos os participantes da etapa"} />
      <EtapaSelect lista={lista} etapa={etapa} onChange={setEtapaId} />
      <Vazio>Em construção</Vazio>
    </>
  );
}
