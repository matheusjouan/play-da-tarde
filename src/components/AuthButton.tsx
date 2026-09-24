"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, ShieldAlert, ShieldCheck } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/AuthProvider";

export function AuthButton() {
  const { user, isAdmin, loading, login, logout } = useAuth();
  const [erro, setErro] = useState<string | null>(null);

  if (loading) return null;

  async function entrar() {
    setErro(null);
    try {
      await login();
    } catch (e) {
      // Fechar o popup não é erro.
      if (e instanceof FirebaseError && e.code === "auth/popup-closed-by-user") return;
      setErro(e instanceof FirebaseError ? e.code : "erro desconhecido");
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        {erro && <span className="text-xs text-red-100">Falha: {erro}</span>}
        <button
          onClick={entrar}
          className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium hover:bg-emerald-800"
        >
          <LogIn size={18} /> Entrar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {isAdmin ? (
        <Link
          href="/admin"
          className="flex min-h-11 items-center"
          aria-label="Abrir administração"
        >
          <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck size={14} /> Admin
          </span>
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
          <ShieldAlert size={14} /> Sem permissão
        </span>
      )}
      <button
        onClick={logout}
        aria-label="Sair"
        title={`Sair (${user.email})`}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-emerald-800"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
