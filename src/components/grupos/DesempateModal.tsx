"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Alerta, btnIcon, btnPrimary } from "@/components/ui";

type Props = {
  empatados: string[];
  nome: (id: string) => string;
  onSalvar: (ordem: string[]) => Promise<void>;
  onFechar: () => void;
};

/** Admin define a ordem de jogadores em empate total (sorteio feito fora do sistema). */
export function DesempateModal({ empatados, nome, onSalvar, onFechar }: Props) {
  const [ordem, setOrdem] = useState(empatados);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function mover(i: number, delta: -1 | 1) {
    const nova = [...ordem];
    [nova[i], nova[i + delta]] = [nova[i + delta], nova[i]];
    setOrdem(nova);
  }

  async function salvar() {
    setSalvando(true);
    try {
      await onSalvar(ordem);
      onFechar();
    } catch (e) {
      setErro(`Erro ao salvar: ${e instanceof Error ? e.message : e}`);
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Definir desempate" onFechar={onFechar}>
      <p className="mb-3 text-sm text-slate-600">
        Estes jogadores estão empatados em vitórias, saldo de sets e saldo de games. Ordene conforme o sorteio.
      </p>
      <ol className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {ordem.map((id, i) => (
          <li key={id} className="flex items-center gap-2 pl-3">
            <span className="w-6 text-slate-400">{i + 1}º</span>
            <span className="flex-1 font-medium">{nome(id)}</span>
            <button className={btnIcon} disabled={i === 0} onClick={() => mover(i, -1)} aria-label={`Subir ${nome(id)}`}>
              <ArrowUp size={18} />
            </button>
            <button className={btnIcon} disabled={i === ordem.length - 1} onClick={() => mover(i, 1)} aria-label={`Descer ${nome(id)}`}>
              <ArrowDown size={18} />
            </button>
          </li>
        ))}
      </ol>
      {erro && <Alerta>{erro}</Alerta>}
      <button className={`${btnPrimary} w-full`} disabled={salvando} onClick={salvar}>
        {salvando ? "Salvando…" : "Salvar ordem"}
      </button>
    </Modal>
  );
}
