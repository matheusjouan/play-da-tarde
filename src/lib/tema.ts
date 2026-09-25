// Tema claro/escuro (DEC-028). Preferência salva só neste aparelho (localStorage); padrão = claro.

export type Tema = "claro" | "escuro";

export const CHAVE_TEMA = "tema";

/** Lê o tema salvo; qualquer valor desconhecido ou erro de acesso (modo privado etc.) = claro. */
export function temaSalvo(): Tema {
  try {
    return localStorage.getItem(CHAVE_TEMA) === "escuro" ? "escuro" : "claro";
  } catch {
    return "claro";
  }
}

export function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute("data-theme", tema);
}

export function salvarTema(tema: Tema) {
  aplicarTema(tema);
  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // Sem armazenamento: o tema vale só até recarregar a página.
  }
}

/**
 * Roda no <head> antes da primeira pintura: aplica o tema salvo sem "piscar" o claro.
 * Mesma regra de `temaSalvo`.
 */
export const SCRIPT_TEMA = `(function(){try{if(localStorage.getItem("${CHAVE_TEMA}")==="escuro")document.documentElement.setAttribute("data-theme","escuro")}catch(e){}})()`;
