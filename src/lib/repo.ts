import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { limparNome, normalizarNome } from "@/lib/nomes";
import type { Etapa, Jogador, Regulamento, SemId } from "@/lib/types";

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

/** Retorna false (sem excluir) se o jogador estiver em algum grupo. */
export async function excluirJogador(id: string): Promise<boolean> {
  const emGrupo = await getDocs(query(collection(db, "grupos"), where("jogadorIds", "array-contains", id), limit(1)));
  if (!emGrupo.empty) return false;
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

/** Retorna false (sem excluir) se a etapa já tiver grupos. */
export async function excluirEtapa(id: string): Promise<boolean> {
  const grupos = await getDocs(query(collection(db, "grupos"), where("etapaId", "==", id), limit(1)));
  if (!grupos.empty) return false;
  await deleteDoc(doc(db, "etapas", id));
  return true;
}

// ---------- Regulamentos ----------

export async function criarRegulamento(dados: SemId<Regulamento>) {
  await addDoc(collection(db, "regulamentos"), dados);
}

export async function excluirRegulamento(id: string) {
  await deleteDoc(doc(db, "regulamentos", id));
}
