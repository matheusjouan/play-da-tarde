// Tipos espelhando o schema do Firestore (docs/SPEC.md, seção 4).

export type TipoEtapa = "regular" | "finals";
export type OrigemEtapa = "sistema" | "importado";
export type StatusEtapa = "grupos" | "mata_mata" | "finalizada";
export type Chave = "ouro" | "prata";
export type FaseMataMata = "campeao" | "vice" | "semi" | "quartas" | "oitavas";

export type PontosGrupo = { posicao: number; pontos: number };
export type PontosMataMata = { fase: FaseMataMata; chave: Chave; pontos: number };

export type Etapa = {
  id: string;
  nome: string;
  numero: number;
  tipo: TipoEtapa;
  origem: OrigemEtapa;
  status: StatusEtapa;
  data_inicio: string;
  data_fim: string;
  vagas_ouro: number;
  vagas_prata: number;
  tabela_pontos_grupo: PontosGrupo[];
  tabela_pontos_mata_mata: PontosMataMata[];
  desempate_geral?: string[];
};

export type Jogador = {
  id: string;
  nome: string;
  nome_normalizado: string;
};

export type Regulamento = {
  id: string;
  etapaId: string;
  titulo: string;
  link: string;
};

export type SemId<T> = Omit<T, "id">;
