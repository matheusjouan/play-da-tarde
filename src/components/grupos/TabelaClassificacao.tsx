import { saldo } from "@/lib/formato";
import type { LinhaClassificacao } from "@/lib/engine/classificacao";

type Props<T extends LinhaClassificacao> = {
  linhas: T[];
  nome: (id: string) => string;
  empatados: Set<string>;
  /** Linha extra sob o nome (classificação geral), ex.: "Grupo A · 1º". */
  origem?: (linha: T) => string;
};

/**
 * Formato da planilha da organização. Layout fixo: colunas numéricas com largura fixa
 * (tabelas empilhadas ficam alinhadas) e o nome ocupa o resto, cortado com "…" no celular.
 */
export function TabelaClassificacao<T extends LinhaClassificacao>({ linhas, nome, empatados, origem }: Props<T>) {
  const th = "px-1.5 py-2 text-center font-semibold";
  const td = "border-t border-slate-100 px-1.5 py-2 text-center tabular-nums";
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[18rem] table-fixed border-separate border-spacing-0 text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className={`${th} sticky left-0 z-10 bg-white text-left`}>Jogador</th>
            <th className={`${th} w-7`} title="Vitórias">
              V
            </th>
            <th className={`${th} w-7`} title="Derrotas">
              D
            </th>
            <th className={`${th} w-11 leading-tight`}>
              Saldo
              <br />
              sets
            </th>
            <th className={`${th} w-12 leading-tight`}>
              Saldo
              <br />
              games
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.jogadorId}>
              <td className="sticky left-0 z-10 border-t border-slate-100 bg-white py-2 pr-2">
                <span className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-right text-slate-400 tabular-nums">{l.posicao}º</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{nome(l.jogadorId)}</span>
                    {origem && <span className="block text-xs text-slate-500">{origem(l)}</span>}
                  </span>
                  {empatados.has(l.jogadorId) && (
                    <span className="shrink-0 rounded bg-amber-100 px-1 text-xs font-semibold text-amber-800" title="Empate total">
                      =
                    </span>
                  )}
                </span>
              </td>
              <td className={`${td} font-semibold`}>{l.vitorias}</td>
              <td className={td}>{l.derrotas}</td>
              <td className={td}>{saldo(l.saldoSets)}</td>
              <td className={td}>{saldo(l.saldoGames)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
