import type { Chave, Etapa, FaseMataMata, PontosGrupo, PontosMataMata, SemId } from "@/lib/types";

// Valores padrão sugeridos (extraídos da 2ª Etapa) — sempre editáveis por etapa.

export const FASES_MATA_MATA: { fase: FaseMataMata; label: string }[] = [
  { fase: "campeao", label: "Campeão" },
  { fase: "vice", label: "Vice" },
  { fase: "semi", label: "Semifinal" },
  { fase: "quartas", label: "Quartas" },
  { fase: "oitavas", label: "Oitavas" },
];

export const CHAVES: { chave: Chave; label: string }[] = [
  { chave: "ouro", label: "Ouro" },
  { chave: "prata", label: "Prata" },
];

export const PONTOS_GRUPO_PADRAO: PontosGrupo[] = [
  { posicao: 1, pontos: 400 },
  { posicao: 2, pontos: 320 },
  { posicao: 3, pontos: 260 },
  { posicao: 4, pontos: 200 },
  { posicao: 5, pontos: 40 },
  { posicao: 6, pontos: 25 },
];

const PONTOS_OURO = { campeao: 1000, vice: 650, semi: 400, quartas: 200, oitavas: 100 };
const PONTOS_PRATA = { campeao: 250, vice: 165, semi: 100, quartas: 50, oitavas: 25 };

export const PONTOS_MATA_MATA_PADRAO: PontosMataMata[] = FASES_MATA_MATA.flatMap(({ fase }) => [
  { fase, chave: "ouro" as const, pontos: PONTOS_OURO[fase] },
  { fase, chave: "prata" as const, pontos: PONTOS_PRATA[fase] },
]);

export function novaEtapaPadrao(numero: number): SemId<Etapa> {
  return {
    nome: `${numero}ª Etapa`,
    numero,
    temporada: new Date().getFullYear(),
    tipo: "regular",
    origem: "sistema",
    status: "grupos",
    data_inicio: "",
    data_fim: "",
    vagas_ouro: 16,
    vagas_prata: 16,
    tabela_pontos_grupo: PONTOS_GRUPO_PADRAO,
    tabela_pontos_mata_mata: PONTOS_MATA_MATA_PADRAO,
  };
}
