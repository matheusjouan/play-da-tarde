/** Remove espaços extras: "  Felipe   Siqueira " → "Felipe Siqueira". */
export function limparNome(nome: string): string {
  return nome.replace(/\s+/g, " ").trim();
}

/** Chave de comparação: minúsculo, sem acento, sem espaços extras. "José  Inocêncio" → "jose inocencio". */
export function normalizarNome(nome: string): string {
  return limparNome(nome)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
