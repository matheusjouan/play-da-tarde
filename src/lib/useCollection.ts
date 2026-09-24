"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Estado<T> = { data: T[]; loading: boolean; error: string | null };

/** Lê uma coleção inteira em tempo real (onSnapshot). */
export function useCollection<T extends { id: string }>(nome: string, ordenarPor?: string): Estado<T> {
  const [estado, setEstado] = useState<Estado<T>>({ data: [], loading: true, error: null });

  useEffect(() => {
    const ref = collection(db, nome);
    const q = ordenarPor ? query(ref, orderBy(ordenarPor)) : ref;
    return onSnapshot(
      q,
      (snap) =>
        setEstado({
          data: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T),
          loading: false,
          error: null,
        }),
      (err) => setEstado({ data: [], loading: false, error: err.message }),
    );
  }, [nome, ordenarPor]);

  return estado;
}
