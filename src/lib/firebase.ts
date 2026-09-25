import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Variáveis NEXT_PUBLIC_* precisam ser lidas literalmente para o Next embuti-las no bundle.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Só controla a UI. A proteção real está em firestore.rules.
const lista = (valor: string | undefined) =>
  (valor ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const ADMIN_EMAILS = lista(process.env.NEXT_PUBLIC_ADMIN_EMAILS);
/** Só lançam/editam placar (DEC-029). */
const PLACAR_EMAILS = lista(process.env.NEXT_PUBLIC_PLACAR_EMAILS);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

export function isPlacarEmail(email: string | null | undefined): boolean {
  return !!email && PLACAR_EMAILS.includes(email.toLowerCase());
}
