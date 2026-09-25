"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { aplicarTema, salvarTema, temaSalvo } from "@/lib/tema";

// O tema vive no atributo data-theme do <html>; o ícone acompanha esse atributo.
function assinar(aoMudar: () => void) {
  const obs = new MutationObserver(aoMudar);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const escuroAgora = () => document.documentElement.getAttribute("data-theme") === "escuro";
const escuroNoServidor = () => false;

/** Botão do cabeçalho que alterna entre tema claro e escuro e lembra a escolha neste aparelho. */
export function TemaButton() {
  const escuro = useSyncExternalStore(assinar, escuroAgora, escuroNoServidor);

  // Em desenvolvimento o React remonta o <html> e apaga o atributo posto pelo script do <head>.
  // Em produção não muda nada.
  useLayoutEffect(() => aplicarTema(temaSalvo()), []);

  return (
    <button
      onClick={() => salvarTema(escuro ? "claro" : "escuro")}
      aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-marca-escura"
    >
      {escuro ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
