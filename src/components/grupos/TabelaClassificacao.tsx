import { saldo } from "@/lib/formato";
import type { LinhaClassificacao } from "@/lib/engine/classificacao";

type Props = {
  linhas: LinhaClassificacao[];
  nome: (id: string) => string;
  empatados: Set<string>;
};

/** Formato da planilha da organização. No celular rola na horizontal com o nome fixo. */
export function TabelaClassificacao({ linhas, nome, empatados }: Props) {
  const th = "px-1.5 py-2 text-center font-semibold";
  const td = "px-1.5 py-2 text-center tabular-nums";
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[20rem] border-separate border-spacing-0 text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className={`${th} sticky left-0 z-10 bg-white text-left`}>Jogador</th>
            <th className={th} title="Vitórias">V</th>
            <th className={th} title="Derrotas">D</th>
            <th className={`${th} leading-tight`}>
              Saldo
              <br />
              sets
            </th>
            <th className={`${th} leading-tight`}>
              Saldo
              <br />
              games
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.jogadorId} className="border-t border-slate-100">
              <td className="sticky left-0 z-10 max-w-44 border-t border-slate-100 bg-white py-2 pr-2">
                <span className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-right text-slate-400 tabular-nums">{l.posicao}º</span>
                  <span className="truncate font-medium">{nome(l.jogadorId)}</span>
                  {empatados.has(l.jogadorId) && (
                    <span className="shrink-0 rounded bg-amber-100 px-1 text-xs font-semibold text-amber-800" title="Empate total">
                      =
                    </span>
                  )}
                </span>
              </td>
              <td className={`${td} border-t border-slate-100 font-semibold`}>{l.vitorias}</td>
              <td className={`${td} border-t border-slate-100`}>{l.derrotas}</td>
              <td className={`${td} border-t border-slate-100`}>{saldo(l.saldoSets)}</td>
              <td className={`${td} border-t border-slate-100`}>{saldo(l.saldoGames)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
