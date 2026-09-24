"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Voltar } from "@/components/Voltar";
import { Alerta, btnPrimary, Card, Carregando, Field, inputCls } from "@/components/ui";
import { novaEtapaPadrao } from "@/lib/defaults";
import { casarJogador, lerCsv, type LinhaImportada } from "@/lib/engine/importacao";
import { importarEtapa } from "@/lib/repo";
import { useCollection } from "@/lib/useCollection";
import type { Etapa, Jogador } from "@/lib/types";

type Item = LinhaImportada & { escolha: string; tipo: "exato" | "sugestao" | "novo" };
const NOVO = "__novo__";

export default function ImportarPage() {
  const router = useRouter();
  const jogadores = useCollection<Jogador>("jogadores", { ordenarPor: "nome_normalizado" });
  const etapas = useCollection<Etapa>("etapas");
  const [numero, setNumero] = useState(2);
  const [nome, setNome] = useState("2ª Etapa");
  const [temporada, setTemporada] = useState(2026);
  const [itens, setItens] = useState<Item[] | null>(null);
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function lerArquivo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErro(null);
    const { linhas, erro } = lerCsv(await f.text());
    if (erro) {
      setItens(null);
      return setErro(erro);
    }
    setArquivo(f.name);
    setItens(
      linhas.map((l) => {
        const c = casarJogador(l.nome, jogadores.data);
        return { ...l, tipo: c.tipo, escolha: c.tipo === "novo" ? NOVO : c.jogador.id };
      }),
    );
  }

  const escolher = (i: number, escolha: string) => setItens((atual) => atual!.map((x, j) => (j === i ? { ...x, escolha } : x)));

  // Validações antes de importar
  const comErro = itens?.filter((i) => i.erro) ?? [];
  const escolhidos = itens?.filter((i) => i.escolha !== NOVO).map((i) => i.escolha) ?? [];
  const repetidos = new Set(escolhidos.filter((id, i) => escolhidos.indexOf(id) !== i));
  const numeroEmUso = etapas.data.some((e) => e.numero === numero);
  const nomeJogador = (id: string) => jogadores.data.find((j) => j.id === id)?.nome ?? "?";
  const resumo = itens && {
    existentes: itens.filter((i) => i.escolha !== NOVO).length,
    novos: itens.filter((i) => i.escolha === NOVO).length,
    conferir: itens.filter((i) => i.tipo === "sugestao").length,
  };
  const podeImportar = !!itens && itens.length > 0 && comErro.length === 0 && repetidos.size === 0 && !numeroEmUso && !!nome.trim();

  async function importar() {
    if (!itens || !podeImportar) return;
    if (!confirm(`Importar ${nome} (${temporada}) com ${itens.length} jogadores (${resumo!.novos} novos)?`)) return;
    setSalvando(true);
    setErro(null);
    try {
      const etapa: Omit<Etapa, "id"> = { ...novaEtapaPadrao(numero), nome: nome.trim(), temporada, origem: "importado", status: "finalizada" };
      await importarEtapa(
        etapa,
        itens.map((i) => ({ ...i, jogadorId: i.escolha === NOVO ? null : i.escolha })),
      );
      router.push("/rank");
    } catch (e) {
      setErro(`Erro ao importar: ${e instanceof Error ? e.message : e}`);
      setSalvando(false);
    }
  }

  if (jogadores.loading || etapas.loading) return <Carregando />;

  return (
    <>
      <Voltar />
      <PageHeader title="Importar etapa" subtitle="Pontos de uma etapa passada (CSV)" />

      <Card className="mb-4 space-y-3">
        <div className="grid grid-cols-[5rem_1fr_6rem] gap-3">
          <Field label="Número">
            <input className={inputCls} inputMode="numeric" value={numero || ""} onChange={(e) => setNumero(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Nome">
            <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="Temporada">
            <input className={inputCls} inputMode="numeric" value={temporada || ""} onChange={(e) => setTemporada(Number(e.target.value) || 0)} />
          </Field>
        </div>
        {numeroEmUso && <Alerta>Já existe uma etapa com o número {numero}.</Alerta>}

        <label className={`${btnPrimary} w-full cursor-pointer`}>
          <FileUp size={18} /> {arquivo ?? "Escolher arquivo CSV"}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={lerArquivo} />
        </label>
        <p className="text-xs text-slate-500">
          Colunas: <code>nome, pontos_grupo, pontos_mata_mata</code> (opcionais: <code>pontos_total, posicao_final</code>). Separador vírgula ou
          ponto e vírgula.
        </p>
      </Card>

      {erro && <div className="mb-4"><Alerta>{erro}</Alerta></div>}

      {itens && resumo && (
        <>
          <p className="mb-2 text-sm text-slate-600">
            {itens.length} linhas · {resumo.existentes} jogadores existentes · {resumo.novos} novos
            {resumo.conferir > 0 && <strong className="text-amber-700"> · {resumo.conferir} sugestões para conferir</strong>}
          </p>
          <ul className="mb-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {itens.map((it, i) => (
              <li key={it.linha} className="space-y-1.5 px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="w-7 shrink-0 text-right text-xs text-slate-400">{it.posicao_final ? `${it.posicao_final}º` : ""}</span>
                  <span className="flex-1 font-medium">{it.nome}</span>
                  <span className="text-sm text-slate-500 tabular-nums">
                    {it.pontos_grupo} + {it.pontos_mata_mata} = <strong className="text-slate-800">{it.pontos_total}</strong>
                  </span>
                </div>
                {it.erro ? (
                  <p className="pl-9 text-sm text-red-700">Linha {it.linha}: {it.erro}</p>
                ) : (
                  <div className="flex items-center gap-2 pl-9">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                        it.escolha === NOVO
                          ? "bg-sky-100 text-sky-800"
                          : it.tipo === "sugestao" && it.escolha !== ""
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {it.escolha === NOVO ? "novo" : it.tipo === "sugestao" ? "confira" : "igual"}
                    </span>
                    <select
                      className={`${inputCls} min-h-10 text-sm ${repetidos.has(it.escolha) ? "border-red-400" : ""}`}
                      value={it.escolha}
                      onChange={(e) => escolher(i, e.target.value)}
                      aria-label={`Jogador para ${it.nome}`}
                    >
                      <option value={NOVO}>➕ Cadastrar novo: {it.nome}</option>
                      {jogadores.data.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {repetidos.size > 0 && (
            <div className="mb-3">
              <Alerta>Mais de uma linha aponta para o mesmo jogador: {[...repetidos].map(nomeJogador).join(", ")}.</Alerta>
            </div>
          )}
          {comErro.length > 0 && (
            <div className="mb-3">
              <Alerta>Corrija as {comErro.length} linha(s) com erro no arquivo e escolha-o de novo.</Alerta>
            </div>
          )}
          <button className={`${btnPrimary} w-full`} disabled={!podeImportar || salvando} onClick={importar}>
            <Upload size={18} /> {salvando ? "Importando…" : `Importar ${itens.length} jogadores`}
          </button>
        </>
      )}
    </>
  );
}
