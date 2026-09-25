"use client";

import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where, type QueryConstraint } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Estado<T> = { data: T[]; loading: boolean; error: string | null };

type Opcoes = {
  ordenarPor?: string;
  decrescente?: boolean;
  /** Máximo de documentos. Com `ordenarPor`, documentos sem o campo ficam de fora da consulta. */
  limite?: number;
  /** Filtro de igualdade. Se `igual` for undefined, não consulta (útil enquanto o id ainda não é conhecido). */
  onde?: { campo: string; igual: string | undefined };
};

const VAZIO = { data: [], loading: false, error: null };

/** Lê uma coleção em tempo real (onSnapshot). Não combine `onde` + `ordenarPor` (exigiria índice composto). */
export function useCollection<T extends { id: string }>(nome: string, opcoes: Opcoes = {}): Estado<T> {
  const { ordenarPor, decrescente, limite, onde } = opcoes;
  const campo = onde?.campo;
  const igual = onde?.igual;
  const semFiltro = !!campo && igual === undefined;
  const chave = `${nome}|${ordenarPor}|${decrescente}|${limite}|${campo}|${igual}`;

  const [estado, setEstado] = useState<Estado<T> & { chave: string }>({ ...VAZIO, loading: true, chave });

  useEffect(() => {
    if (semFiltro) return;
    const restricoes: QueryConstraint[] = [];
    if (campo && igual !== undefined) restricoes.push(where(campo, "==", igual));
    if (ordenarPor) restricoes.push(orderBy(ordenarPor, decrescente ? "desc" : "asc"));
    if (limite) restricoes.push(limit(limite));
    return onSnapshot(
      query(collection(db, nome), ...restricoes),
      (snap) =>
        setEstado({
          // "estimate": um serverTimestamp ainda não confirmado já vem com a hora do aparelho (em vez de null).
          data: snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }) as T),
          loading: false,
          error: null,
          chave,
        }),
      (err) => setEstado({ data: [], loading: false, error: err.message, chave }),
    );
  }, [nome, ordenarPor, decrescente, limite, campo, igual, semFiltro, chave]);

  if (semFiltro) return VAZIO;
  // Enquanto a nova consulta não responde, não mostra dados da consulta anterior.
  if (estado.chave !== chave) return { ...VAZIO, loading: true };
  return estado;
}
