import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { chavePar, gerarConfrontos, type Par } from "@/lib/engine/confrontos";
import { db } from "@/lib/firebase";
import { limparNome, normalizarNome } from "@/lib/nomes";
import type { Etapa, Grupo, Jogador, Partida, Regulamento, SemId } from "@/lib/types";

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

/** Exclui o grupo e todos os seus jogos. */
export async function excluirGrupo(grupo: Grupo) {
  const batch = writeBatch(db);
  for (const [a, b] of gerarConfrontos(grupo.jogadorIds)) batch.delete(partidaGrupoRef(grupo.id, a, b));
  batch.delete(doc(db, "grupos", grupo.id));
  await batch.commit();
}

// ---------- Regulamentos ----------

export async function criarRegulamento(dados: SemId<Regulamento>) {
  await addDoc(collection(db, "regulamentos"), dados);
}

export async function excluirRegulamento(id: string) {
  await deleteDoc(doc(db, "regulamentos", id));
}
