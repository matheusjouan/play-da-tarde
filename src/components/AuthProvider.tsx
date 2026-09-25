"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, isAdminEmail, isPlacarEmail } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  isAdmin: boolean;
  /** Admin ou perfil "Placar" (DEC-029): pode lançar/editar placar, e só isso. */
  podeLancarPlacar: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }),
    [],
  );

  const isAdmin = !!user?.emailVerified && isAdminEmail(user.email);
  const value: AuthState = {
    user,
    isAdmin,
    podeLancarPlacar: isAdmin || (!!user?.emailVerified && isPlacarEmail(user.email)),
    loading,
    login: async () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    },
    logout: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

export function useIsAdmin(): boolean {
  return useAuth().isAdmin;
}
