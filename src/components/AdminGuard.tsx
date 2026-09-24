"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Carregando } from "@/components/ui";

/** Esconde a tela para quem não é admin (a proteção real está em firestore.rules). */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Carregando />;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
        <ShieldAlert size={28} />
        <p className="font-medium">Área restrita</p>
        <p className="text-sm">Entre com a conta de administrador para acessar.</p>
      </div>
    );
  }
  return <>{children}</>;
}
