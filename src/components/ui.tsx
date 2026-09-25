import type { ReactNode } from "react";

// Classes compartilhadas (mobile-first: alvos de toque ≥ 44px).
export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-marca px-4 font-medium text-white hover:bg-marca-escura disabled:opacity-50";
export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-superficie px-4 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50";
export const btnIcon =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50";
export const inputCls =
  "min-h-11 w-full rounded-lg border border-slate-300 bg-superficie px-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-superficie p-4 ${className}`}>{children}</section>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function Alerta({ tipo = "erro", children }: { tipo?: "erro" | "ok"; children: ReactNode }) {
  const cls = tipo === "erro" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return <p className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</p>;
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">{children}</p>;
}

export function Carregando() {
  return <p className="p-6 text-center text-slate-400">Carregando…</p>;
}
