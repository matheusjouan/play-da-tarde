"use client";

import { EtapaSelect, useEtapaSelecionada } from "@/components/EtapaSelect";
import { PageHeader } from "@/components/PageHeader";
import { Vazio } from "@/components/ui";

export default function ChavesPage() {
  const { etapa, lista, setEtapaId } = useEtapaSelecionada();
  return (
    <>
      <PageHeader title="Chaves Ouro e Prata" subtitle={etapa?.nome ?? "Mata-mata da etapa"} />
      <EtapaSelect lista={lista} etapa={etapa} onChange={setEtapaId} />
      <Vazio>Em construção</Vazio>
    </>
  );
}
