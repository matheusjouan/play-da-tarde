"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Alerta, btnIcon, btnPrimary, btnSecondary, Card, Field, inputCls } from "@/components/ui";
import { CHAVES, FASES_MATA_MATA } from "@/lib/defaults";
import type { Chave, Etapa, FaseMataMata, SemId } from "@/lib/types";

type Props = {
  inicial: SemId<Etapa>;
  numerosEmUso: number[];
  onSalvar: (dados: SemId<Etapa>) => Promise<void>;
};

const num = (v: string) => (v === "" ? 0 : Math.max(0, Math.floor(Number(v)) || 0));

export function EtapaForm({ inicial, numerosEmUso, onSalvar }: Props) {
  const [e, setE] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const set = <K extends keyof SemId<Etapa>>(campo: K, valor: SemId<Etapa>[K]) => setE((atual) => ({ ...atual, [campo]: valor }));
  const regular = e.tipo === "regular";

  function setPontosGrupo(i: number, pontos: number) {
    set("tabela_pontos_grupo", e.tabela_pontos_grupo.map((p, j) => (j === i ? { ...p, pontos } : p)));
  }
  function addPosicao() {
    set("tabela_pontos_grupo", [...e.tabela_pontos_grupo, { posicao: e.tabela_pontos_grupo.length + 1, pontos: 0 }]);
  }
  function removerUltimaPosicao() {
    set("tabela_pontos_grupo", e.tabela_pontos_grupo.slice(0, -1));
  }
  function pontosMM(fase: FaseMataMata, chave: Chave) {
    return e.tabela_pontos_mata_mata.find((p) => p.fase === fase && p.chave === chave)?.pontos ?? 0;
  }
  function setPontosMM(fase: FaseMataMata, chave: Chave, pontos: number) {
    const outros = e.tabela_pontos_mata_mata.filter((p) => !(p.fase === fase && p.chave === chave));
    set("tabela_pontos_mata_mata", [...outros, { fase, chave, pontos }]);
  }

  async function salvar(ev: FormEvent) {
    ev.preventDefault();
    setErro(null);
    if (!e.nome.trim()) return setErro("Informe o nome da etapa.");
    if (e.numero < 1) return setErro("Informe o número da etapa.");
    if (numerosEmUso.includes(e.numero)) return setErro(`Já existe uma etapa com o número ${e.numero}.`);

    // Etapa Finals não pontua: tabelas vazias.
    const dados: SemId<Etapa> = regular
      ? { ...e, nome: e.nome.trim() }
      : { ...e, nome: e.nome.trim(), tabela_pontos_grupo: [], tabela_pontos_mata_mata: [] };

    setSalvando(true);
    try {
      await onSalvar(dados);
    } catch (err) {
      setErro(`Erro ao salvar: ${err instanceof Error ? err.message : err}`);
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <Card className="space-y-3">
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <Field label="Número">
            <input className={inputCls} inputMode="numeric" value={e.numero || ""} onChange={(v) => set("numero", num(v.target.value))} />
          </Field>
          <Field label="Nome">
            <input className={inputCls} value={e.nome} onChange={(v) => set("nome", v.target.value)} />
          </Field>
        </div>
        <Field label="Tipo">
          <select className={inputCls} value={e.tipo} onChange={(v) => set("tipo", v.target.value as Etapa["tipo"])}>
            <option value="regular">Regular (pontua no Rank)</option>
            <option value="finals">Finals (não pontua)</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Início">
            <input className={inputCls} placeholder="ex.: 01/10" value={e.data_inicio} onChange={(v) => set("data_inicio", v.target.value)} />
          </Field>
          <Field label="Fim">
            <input className={inputCls} placeholder="ex.: 30/11" value={e.data_fim} onChange={(v) => set("data_fim", v.target.value)} />
          </Field>
        </div>
      </Card>

      {regular && (
        <>
          <Card className="space-y-3">
            <h2 className="font-semibold">Vagas no mata-mata</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Chave Ouro">
                <input className={inputCls} inputMode="numeric" value={e.vagas_ouro} onChange={(v) => set("vagas_ouro", num(v.target.value))} />
              </Field>
              <Field label="Chave Prata">
                <input className={inputCls} inputMode="numeric" value={e.vagas_prata} onChange={(v) => set("vagas_prata", num(v.target.value))} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="font-semibold">Pontos por posição no grupo</h2>
            <ul className="space-y-2">
              {e.tabela_pontos_grupo.map((p, i) => (
                <li key={p.posicao} className="flex items-center gap-3">
                  <span className="w-10 text-right font-medium text-slate-600">{p.posicao}º</span>
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    aria-label={`Pontos do ${p.posicao}º lugar`}
                    value={p.pontos}
                    onChange={(v) => setPontosGrupo(i, num(v.target.value))}
                  />
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button type="button" className={btnSecondary} onClick={addPosicao}>
                <Plus size={18} /> Posição
              </button>
              {e.tabela_pontos_grupo.length > 1 && (
                <button type="button" className={btnIcon} onClick={removerUltimaPosicao} aria-label="Remover última posição">
                  <Trash2 size={18} className="text-red-600" />
                </button>
              )}
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="font-semibold">Pontos por fase no mata-mata</h2>
            <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-2">
              <span />
              {CHAVES.map((c) => (
                <span key={c.chave} className="text-center text-sm font-semibold text-slate-600">
                  {c.label}
                </span>
              ))}
              {FASES_MATA_MATA.map(({ fase, label }) => (
                <div key={fase} className="contents">
                  <span className="text-slate-700">{label}</span>
                  {CHAVES.map(({ chave, label: lc }) => (
                    <input
                      key={chave}
                      className={`${inputCls} text-center`}
                      inputMode="numeric"
                      aria-label={`${label} ${lc}`}
                      value={pontosMM(fase, chave)}
                      onChange={(v) => setPontosMM(fase, chave, num(v.target.value))}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {erro && <Alerta>{erro}</Alerta>}
      <button type="submit" className={`${btnPrimary} w-full`} disabled={salvando}>
        {salvando ? "Salvando…" : "Salvar etapa"}
      </button>
    </form>
  );
}
