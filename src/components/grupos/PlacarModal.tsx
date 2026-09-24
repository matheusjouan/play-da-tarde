"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Alerta, btnPrimary, btnSecondary } from "@/components/ui";
import { validarPlacar } from "@/lib/engine/placar";
import { limparPlacar, salvarPlacar } from "@/lib/repo";
import type { Partida, SetPlacar } from "@/lib/types";

type Props = {
  partida: Partida;
  nome1: string;
  nome2: string;
  onFechar: () => void;
  /** Padrão: gravação simples (fase de grupos). O mata-mata passa a própria (avança o vencedor). */
  onSalvar?: (sets: SetPlacar[], vencedorId: string) => Promise<void>;
  onLimpar?: () => Promise<void>;
};

// Campos: [set1 j1, set1 j2, set2 j1, set2 j2, stb j1, stb j2]
type Campos = [string, string, string, string, string, string];

function camposIniciais(sets: SetPlacar[]): Campos {
  const [s1, s2, s3] = sets;
  const v = (n?: number) => (n === undefined ? "" : String(n));
  return [v(s1?.games1), v(s1?.games2), v(s2?.games1), v(s2?.games2), v(s3?.games1), v(s3?.games2)];
}

const numero = (s: string) => (s.trim() === "" ? null : Number(s));

export function PlacarModal({
  partida,
  nome1,
  nome2,
  onFechar,
  onSalvar = (sets, vencedorId) => salvarPlacar(partida.id, sets, vencedorId),
  onLimpar = () => limparPlacar(partida.id),
}: Props) {
  const [c, setC] = useState<Campos>(camposIniciais(partida.sets));
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const setCampo = (i: number, valor: string) =>
    setC((atual) => atual.map((x, j) => (j === i ? valor.replace(/\D/g, "").slice(0, 2) : x)) as Campos);

  // Monta os sets a partir dos campos preenchidos.
  const [a1, b1, a2, b2, a3, b3] = c.map(numero);
  const doisSets = a1 !== null && b1 !== null && a2 !== null && b2 !== null;
  const umAUm = doisSets && Math.sign(a1 - b1) !== Math.sign(a2 - b2) && a1 !== b1 && a2 !== b2;
  const sets: SetPlacar[] = doisSets
    ? [
        { games1: a1, games2: b1 },
        { games1: a2, games2: b2 },
        ...(umAUm && a3 !== null && b3 !== null ? [{ games1: a3, games2: b3, superTieBreak: true }] : []),
      ]
    : [];
  const resultado = doisSets ? validarPlacar(sets) : null;
  const vencedorNome = resultado?.ok ? (resultado.vencedor === 1 ? nome1 : nome2) : null;

  async function executar(acao: () => Promise<void>) {
    setSalvando(true);
    setErroSalvar(null);
    try {
      await acao();
      onFechar();
    } catch (e) {
      setErroSalvar(`Erro ao salvar: ${e instanceof Error ? e.message : e}`);
      setSalvando(false);
    }
  }

  function salvar() {
    if (!resultado?.ok) return;
    const vencedorId = resultado.vencedor === 1 ? partida.jogador1Id : partida.jogador2Id;
    if (vencedorId) executar(() => onSalvar(sets, vencedorId));
  }

  function wo(vencedor: 1 | 2) {
    setC(vencedor === 1 ? ["6", "0", "6", "0", "", ""] : ["0", "6", "0", "6", "", ""]);
  }

  const input = (i: number, label: string) => (
    <input
      inputMode="numeric"
      aria-label={label}
      className="h-12 w-full rounded-lg border border-slate-300 text-center text-xl font-semibold focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
      value={c[i]}
      onChange={(e) => setCampo(i, e.target.value)}
      onFocus={(e) => e.target.select()}
    />
  );

  const colunas = umAUm ? "grid-cols-[1fr_3.5rem_3.5rem_3.5rem]" : "grid-cols-[1fr_3.5rem_3.5rem]";

  return (
    <Modal titulo="Placar" onFechar={onFechar}>
      <div className={`grid ${colunas} items-center gap-2`}>
        <span />
        <span className="text-center text-xs font-semibold text-slate-500">1º set</span>
        <span className="text-center text-xs font-semibold text-slate-500">2º set</span>
        {umAUm && <span className="text-center text-xs font-semibold text-amber-700">Super TB</span>}

        <span className="truncate font-medium">{nome1}</span>
        {input(0, `1º set ${nome1}`)}
        {input(2, `2º set ${nome1}`)}
        {umAUm && input(4, `Super tie-break ${nome1}`)}

        <span className="truncate font-medium">{nome2}</span>
        {input(1, `1º set ${nome2}`)}
        {input(3, `2º set ${nome2}`)}
        {umAUm && input(5, `Super tie-break ${nome2}`)}
      </div>

      {umAUm && <p className="mt-2 text-xs text-slate-500">1 set a 1: informe o super tie-break (até 10, 2 de diferença).</p>}

      <div className="mt-3 flex gap-2">
        <button type="button" className={`${btnSecondary} flex-1 text-sm`} onClick={() => wo(1)}>
          W.O. p/ {nome1.split(" ")[0]}
        </button>
        <button type="button" className={`${btnSecondary} flex-1 text-sm`} onClick={() => wo(2)}>
          W.O. p/ {nome2.split(" ")[0]}
        </button>
      </div>

      <div className="mt-3 min-h-10">
        {resultado && !resultado.ok && <Alerta>{resultado.erro}</Alerta>}
        {vencedorNome && <Alerta tipo="ok">Vencedor: {vencedorNome}</Alerta>}
        {erroSalvar && <Alerta>{erroSalvar}</Alerta>}
      </div>

      <button className={`${btnPrimary} mt-3 w-full`} disabled={!resultado?.ok || salvando} onClick={salvar}>
        {salvando ? "Salvando…" : "Salvar placar"}
      </button>
      {partida.sets.length > 0 && (
        <button
          className="mt-2 min-h-11 w-full text-sm text-red-600"
          disabled={salvando}
          onClick={() => confirm("Apagar o placar deste jogo?") && executar(onLimpar)}
        >
          Apagar placar
        </button>
      )}
    </Modal>
  );
}
