import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { montarChave, proximoJogo, type FaseMM } from "@/lib/engine/chave";
import { chavePar, gerarConfrontos, planejarSubstituicao, type Par } from "@/lib/engine/confrontos";
import type { LinhaImportada } from "@/lib/engine/importacao";
import type { RegistroPontos } from "@/lib/engine/pontos";
import { db } from "@/lib/firebase";
import { limparNome, normalizarNome } from "@/lib/nomes";
import type { Chave, Etapa, Grupo, Jogador, Partida, RankingPorEtapa, Regulamento, SemId, SetPlacar } from "@/lib/types";

// Escritas no Firestore. As regras (firestore.rules) rejeitam tudo que não vier do admin.

// ---------- Jogadores ----------

export function nomeJaExiste(jogadores: Jogador[], nome: string, ignorarId?: string): boolean {
  const n = normalizarNome(nome);
  return jogadores.some((j) => j.id !== ignorarId && j.nome_normalizado === n);
}

export async function criarJogador(nome: string) {
  await addDoc(collection(db, "jogadores"), {
    nome: limparNome(nome),
    nome_normalizado: normalizarNome(nome),
  });
}

export async function renomearJogador(id: string, nome: string) {
  await updateDoc(doc(db, "jogadores", id), {
    nome: limparNome(nome),
    nome_normalizado: normalizarNome(nome),
  });
}

/** Retorna false (sem excluir) se o jogador estiver em algum grupo ou tiver pontuação registrada. */
export async function excluirJogador(id: string): Promise<boolean> {
  const emGrupo = await getDocs(query(collection(db, "grupos"), where("jogadorIds", "array-contains", id), limit(1)));
  if (!emGrupo.empty) return false;
  const pontuou = await getDocs(query(collection(db, "ranking_por_etapa"), where("jogadorId", "==", id), limit(1)));
  if (!pontuou.empty) return false;
  await deleteDoc(doc(db, "jogadores", id));
  return true;
}

// ---------- Etapas ----------

export async function criarEtapa(dados: SemId<Etapa>): Promise<string> {
  const ref = await addDoc(collection(db, "etapas"), dados);
  return ref.id;
}

export async function atualizarEtapa(id: string, dados: Partial<SemId<Etapa>>) {
  await updateDoc(doc(db, "etapas", id), dados);
}

/** Retorna false (sem excluir) se a etapa já tiver grupos. Apaga junto pontuação, chaves e jogos da etapa. */
export async function excluirEtapa(id: string): Promise<boolean> {
  const grupos = await getDocs(query(collection(db, "grupos"), where("etapaId", "==", id), limit(1)));
  if (!grupos.empty) return false;
  const batch = writeBatch(db);
  for (const col of ["ranking_por_etapa", "chaves", "partidas"]) {
    const docs = await getDocs(query(collection(db, col), where("etapaId", "==", id)));
    docs.forEach((d) => batch.delete(d.ref));
  }
  batch.delete(doc(db, "etapas", id));
  await batch.commit();
  return true;
}

// ---------- Pontuação ----------

/** Grava a pontuação da etapa (substitui a anterior, se houver) e marca a etapa como finalizada. */
export async function finalizarEtapa(etapaId: string, registros: RegistroPontos[]) {
  const antigos = await getDocs(query(collection(db, "ranking_por_etapa"), where("etapaId", "==", etapaId)));
  const batch = writeBatch(db);
  antigos.forEach((d) => batch.delete(d.ref));
  for (const r of registros) {
    const dado: SemId<RankingPorEtapa> = { ...r, etapaId, origem: "sistema" };
    batch.set(doc(db, "ranking_por_etapa", `${etapaId}_${r.jogadorId}`), dado);
  }
  batch.update(doc(db, "etapas", etapaId), { status: "finalizada" });
  await batch.commit();
}

/** P1: ordem manual de empatados em pontos no Rank da temporada. */
export async function salvarDesempateRank(temporada: number, atual: string[], ordemBloco: string[]) {
  const outros = atual.filter((id) => !ordemBloco.includes(id));
  await setDoc(doc(db, "temporadas", String(temporada)), { desempate_rank: [...outros, ...ordemBloco] }, { merge: true });
}

export type ItemImportacao = LinhaImportada & { jogadorId: string | null };

/**
 * Importa uma etapa passada (origem "importado", já finalizada): cria a etapa, os jogadores novos
 * (jogadorId null) e a pontuação de cada um.
 */
export async function importarEtapa(etapa: SemId<Etapa>, itens: ItemImportacao[]) {
  const batch = writeBatch(db);
  const etapaRef = doc(collection(db, "etapas"));
  batch.set(etapaRef, etapa);
  for (const item of itens) {
    let jogadorId = item.jogadorId;
    if (!jogadorId) {
      const ref = doc(collection(db, "jogadores"));
      batch.set(ref, { nome: limparNome(item.nome), nome_normalizado: normalizarNome(item.nome) });
      jogadorId = ref.id;
    }
    const dado: SemId<RankingPorEtapa> = {
      jogadorId,
      etapaId: etapaRef.id,
      origem: "importado",
      posicao_final: item.posicao_final,
      pontos_grupo: item.pontos_grupo,
      pontos_mata_mata: item.pontos_mata_mata,
      pontos_total: item.pontos_total,
    };
    batch.set(doc(db, "ranking_por_etapa", `${etapaRef.id}_${jogadorId}`), dado);
  }
  await batch.commit();
}

// ---------- Grupos e confrontos ----------
// Id da partida de grupo é determinístico (grupo + par de jogadores): impede confronto duplicado
// e permite apagar os jogos de um jogador sem consulta.

function partidaGrupoRef(grupoId: string, a: string, b: string) {
  return doc(db, "partidas", `${grupoId}__${chavePar(a, b)}`);
}

function novaPartidaGrupo(etapaId: string, grupoId: string, [a, b]: Par): SemId<Partida> {
  return { etapaId, grupoId, fase: "grupo", jogador1Id: a, jogador2Id: b, sets: [], vencedorId: null };
}

export async function criarGrupo(etapaId: string, nome: string, jogadorIds: string[]) {
  const batch = writeBatch(db);
  const grupoRef = doc(collection(db, "grupos"));
  batch.set(grupoRef, { etapaId, nome, jogadorIds });
  for (const par of gerarConfrontos(jogadorIds)) {
    batch.set(partidaGrupoRef(grupoRef.id, ...par), novaPartidaGrupo(etapaId, grupoRef.id, par));
  }
  await batch.commit();
}

export async function renomearGrupo(grupoId: string, nome: string) {
  await updateDoc(doc(db, "grupos", grupoId), { nome });
}

/** Adiciona jogadores e cria só os confrontos novos (os jogos já existentes ficam intactos). */
export async function adicionarJogadoresGrupo(grupo: Grupo, novosIds: string[]) {
  const todos = [...grupo.jogadorIds, ...novosIds];
  const batch = writeBatch(db);
  batch.update(doc(db, "grupos", grupo.id), { jogadorIds: todos });
  for (const par of gerarConfrontos(todos)) {
    if (novosIds.includes(par[0]) || novosIds.includes(par[1])) {
      batch.set(partidaGrupoRef(grupo.id, ...par), novaPartidaGrupo(grupo.etapaId, grupo.id, par));
    }
  }
  await batch.commit();
}

/** Remove o jogador do grupo e apaga todos os jogos dele nesse grupo. */
export async function removerJogadorGrupo(grupo: Grupo, jogadorId: string) {
  const batch = writeBatch(db);
  batch.update(doc(db, "grupos", grupo.id), { jogadorIds: grupo.jogadorIds.filter((id) => id !== jogadorId) });
  for (const outro of grupo.jogadorIds) {
    if (outro !== jogadorId) batch.delete(partidaGrupoRef(grupo.id, jogadorId, outro));
  }
  await batch.commit();
}

/**
 * Substitui um jogador (SPEC 3.6): o novo entra na mesma posição, os jogos do antigo são apagados
 * (inclusive com placar) e são criados os confrontos do novo. O jogador que saiu não pontua na etapa.
 */
export async function substituirJogadorGrupo(grupo: Grupo, antigoId: string, novoId: string) {
  const plano = planejarSubstituicao(grupo.jogadorIds, antigoId, novoId);
  const batch = writeBatch(db);
  batch.update(doc(db, "grupos", grupo.id), {
    jogadorIds: plano.jogadorIds,
    desempate_manual: (grupo.desempate_manual ?? []).filter((id) => id !== antigoId),
  });
  for (const [a, b] of plano.remover) batch.delete(partidaGrupoRef(grupo.id, a, b));
  for (const par of plano.criar) batch.set(partidaGrupoRef(grupo.id, ...par), novaPartidaGrupo(grupo.etapaId, grupo.id, par));
  await batch.commit();
}

/** Exclui o grupo e todos os seus jogos. */
export async function excluirGrupo(grupo: Grupo) {
  const batch = writeBatch(db);
  for (const [a, b] of gerarConfrontos(grupo.jogadorIds)) batch.delete(partidaGrupoRef(grupo.id, a, b));
  batch.delete(doc(db, "grupos", grupo.id));
  await batch.commit();
}

// ---------- Placar e desempate ----------

// `atualizado_em` alimenta a aba Recentes: gravado ao salvar, removido ao limpar (o jogo sai da lista).

export async function salvarPlacar(partidaId: string, sets: SetPlacar[], vencedorId: string) {
  await updateDoc(doc(db, "partidas", partidaId), { sets, vencedorId, atualizado_em: serverTimestamp() });
}

export async function limparPlacar(partidaId: string) {
  await updateDoc(doc(db, "partidas", partidaId), { sets: [], vencedorId: null, atualizado_em: deleteField() });
}

/** Grava a ordem manual de um bloco de jogadores empatados, preservando a de outros blocos. */
export async function salvarDesempateGrupo(grupo: Grupo, ordemBloco: string[]) {
  const outros = (grupo.desempate_manual ?? []).filter((id) => !ordemBloco.includes(id));
  await updateDoc(doc(db, "grupos", grupo.id), { desempate_manual: [...outros, ...ordemBloco] });
}

/** Ordem manual de empatados na classificação geral (decide vaga Ouro/Prata). */
export async function salvarDesempateGeral(etapa: Etapa, ordemBloco: string[]) {
  const outros = (etapa.desempate_geral ?? []).filter((id) => !ordemBloco.includes(id));
  await updateDoc(doc(db, "etapas", etapa.id), { desempate_geral: [...outros, ...ordemBloco] });
}

// ---------- Mata-mata ----------

function partidaChaveRef(etapaId: string, chave: Chave, fase: FaseMM, slot: number) {
  return doc(db, "partidas", `${etapaId}__${chave}__${fase}__${slot}`);
}

/**
 * Gera (ou regenera) uma chave: apaga os jogos antigos dessa chave, grava os seeds e cria todos os jogos
 * (byes já resolvidos). Coloca a etapa em "mata_mata".
 */
export async function gerarChave(etapaId: string, chave: Chave, seeds: string[], jogosExistentes: Partida[], ajusteManual = false) {
  const batch = writeBatch(db);
  for (const p of jogosExistentes) batch.delete(doc(db, "partidas", p.id));
  batch.set(doc(db, "chaves", `${etapaId}_${chave}`), { etapaId, chave, seeds, ajusteManual });
  for (const j of montarChave(seeds)) {
    const partida: SemId<Partida> = {
      etapaId,
      fase: j.fase,
      chave,
      slot: j.slot,
      jogador1Id: j.jogador1Id,
      jogador2Id: j.jogador2Id,
      sets: [],
      vencedorId: j.vencedorId,
    };
    batch.set(partidaChaveRef(etapaId, chave, j.fase, j.slot), partida);
  }
  batch.update(doc(db, "etapas", etapaId), { status: "mata_mata" });
  await batch.commit();
}

function jogoSeguinte(partida: Partida, fases: FaseMM[], jogosDaChave: Partida[]) {
  const prox = proximoJogo(fases, partida.fase as FaseMM, partida.slot ?? 0);
  if (!prox) return null;
  const alvo = jogosDaChave.find((p) => p.fase === prox.fase && p.slot === prox.slot);
  return alvo ? { alvo, campo: prox.lado === 1 ? ("jogador1Id" as const) : ("jogador2Id" as const) } : null;
}

/** Salva o placar e coloca o vencedor no jogo seguinte. Bloqueia se o jogo seguinte já tiver placar e o vencedor mudar. */
export async function salvarPlacarMataMata(partida: Partida, fases: FaseMM[], jogosDaChave: Partida[], sets: SetPlacar[], vencedorId: string) {
  const seguinte = jogoSeguinte(partida, fases, jogosDaChave);
  if (seguinte && seguinte.alvo.sets.length > 0 && seguinte.alvo[seguinte.campo] !== vencedorId) {
    throw new Error("O jogo da fase seguinte já tem placar. Apague aquele placar antes de mudar o vencedor deste jogo.");
  }
  const batch = writeBatch(db);
  batch.update(doc(db, "partidas", partida.id), { sets, vencedorId, atualizado_em: serverTimestamp() });
  if (seguinte) batch.update(doc(db, "partidas", seguinte.alvo.id), { [seguinte.campo]: vencedorId });
  await batch.commit();
}

/** Apaga o placar e tira o vencedor do jogo seguinte (se aquele jogo ainda não foi disputado). */
export async function limparPlacarMataMata(partida: Partida, fases: FaseMM[], jogosDaChave: Partida[]) {
  const seguinte = jogoSeguinte(partida, fases, jogosDaChave);
  if (seguinte && seguinte.alvo.sets.length > 0) {
    throw new Error("O jogo da fase seguinte já tem placar. Apague aquele placar primeiro.");
  }
  const batch = writeBatch(db);
  batch.update(doc(db, "partidas", partida.id), { sets: [], vencedorId: null, atualizado_em: deleteField() });
  if (seguinte) batch.update(doc(db, "partidas", seguinte.alvo.id), { [seguinte.campo]: null });
  await batch.commit();
}

// ---------- Regulamentos ----------

export async function criarRegulamento(dados: SemId<Regulamento>) {
  await addDoc(collection(db, "regulamentos"), dados);
}

export async function excluirRegulamento(id: string) {
  await deleteDoc(doc(db, "regulamentos", id));
}
