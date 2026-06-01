import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber, EditableText } from "@/components/Editable";
import { usePlan, fmtBRL, fmtNum, type SDREntry, type CloserEntry, type SprintKey } from "@/lib/plan-store";
import { Plus, Trash2, Activity } from "lucide-react";

export const Route = createFileRoute("/cockpit")({
  head: () => ({ meta: [{ title: "Cockpit Diário · Legacy" }] }),
  component: Cockpit,
});

const todayISO = () => new Date().toISOString().slice(0, 10);
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);

// Metas diárias de referência
const META = {
  tentativasTotais: 400, tentativasSDR: 200,
  conexoesTotais: 40, conexoesSDR: 20,
  agendamentosTotais: 10, agendamentosSDR: 5,
  reunioes: 7, fechamentos: 2, receita: 30000,
};

function classifyConexao(p: number): "saudavel" | "atencao" | "critico" {
  if (p >= 10) return "saudavel";
  if (p >= 8) return "atencao";
  return "critico";
}

function statusColor(s: "saudavel" | "atencao" | "critico") {
  return s === "saudavel" ? "text-emerald-400" : s === "atencao" ? "text-amber-400" : "text-rose-400";
}

function statusBg(s: "saudavel" | "atencao" | "critico") {
  return s === "saudavel" ? "bg-emerald-500/10 border-emerald-500/30"
    : s === "atencao" ? "bg-amber-500/10 border-amber-500/30"
    : "bg-rose-500/10 border-rose-500/30";
}

function Cockpit() {
  const { state, setState } = usePlan();
  const [date, setDate] = useState(todayISO());
  const [sprintFilter, setSprintFilter] = useState<SprintKey | "all">("all");
  const [operatorFilter, setOperatorFilter] = useState<string | "all">("all");

  const sdrEntries = state.sdrEntries.filter((e) =>
    e.date === date &&
    (sprintFilter === "all" || e.sprint === sprintFilter) &&
    (operatorFilter === "all" || e.sdrId === operatorFilter)
  );
  const closerEntries = state.closerEntries.filter((e) =>
    e.date === date &&
    (sprintFilter === "all" || e.sprint === sprintFilter) &&
    (operatorFilter === "all" || e.closerId === operatorFilter)
  );

  const addSDR = () => {
    const e: SDREntry = {
      id: `sdre-${Date.now()}`, date, sdrId: state.sdrs[0]?.id ?? "sdr1",
      sprint: "S1", tentativas: 0, conexoes: 0, agendamentos: 0,
      reunioes: 0, noShow: 0, obs: "",
    };
    setState((s) => ({ ...s, sdrEntries: [...s.sdrEntries, e] }));
  };
  const addCloser = () => {
    const e: CloserEntry = {
      id: `ce-${Date.now()}`, date, closerId: state.closers[0]?.id ?? "c1",
      sprint: "S1", reunioes: 0, negociacoes: 0, vendas: 0,
      valorVendido: 0, perdidos: 0, noShow: 0, obs: "",
    };
    setState((s) => ({ ...s, closerEntries: [...s.closerEntries, e] }));
  };
  const updSDR = (id: string, patch: Partial<SDREntry>) =>
    setState((s) => ({ ...s, sdrEntries: s.sdrEntries.map((e) => e.id === id ? { ...e, ...patch } : e) }));
  const updCloser = (id: string, patch: Partial<CloserEntry>) =>
    setState((s) => ({ ...s, closerEntries: s.closerEntries.map((e) => e.id === id ? { ...e, ...patch } : e) }));
  const delSDR = (id: string) => setState((s) => ({ ...s, sdrEntries: s.sdrEntries.filter((e) => e.id !== id) }));
  const delCloser = (id: string) => setState((s) => ({ ...s, closerEntries: s.closerEntries.filter((e) => e.id !== id) }));

  // Resumo do dia
  const totals = useMemo(() => {
    const t = {
      tentativas: 0, conexoes: 0, agendamentos: 0, reunioes: 0,
      negociacoes: 0, vendas: 0, valorVendido: 0, perdidos: 0, noShow: 0,
    };
    sdrEntries.forEach((e) => {
      t.tentativas += e.tentativas; t.conexoes += e.conexoes;
      t.agendamentos += e.agendamentos; t.noShow += e.noShow;
    });
    closerEntries.forEach((e) => {
      t.reunioes += e.reunioes; t.negociacoes += e.negociacoes;
      t.vendas += e.vendas; t.valorVendido += e.valorVendido;
      t.perdidos += e.perdidos; t.noShow += e.noShow;
    });
    return t;
  }, [sdrEntries, closerEntries]);

  const conexaoPct = pct(totals.conexoes, totals.tentativas);
  const conexaoStatus = totals.tentativas > 0 ? classifyConexao(conexaoPct) : "atencao";
  const gapReceita = META.receita - totals.valorVendido;
  const diaStatus: "saudavel" | "atencao" | "critico" =
    totals.valorVendido >= META.receita ? "saudavel"
    : totals.valorVendido >= META.receita * 0.6 ? "atencao"
    : "critico";

  // Alertas
  const alertas: { msg: string; nivel: "saudavel" | "atencao" | "critico" }[] = [];
  if (totals.tentativas > 0) {
    alertas.push({ msg: `Taxa de conexão: ${conexaoPct.toFixed(1)}%`, nivel: conexaoStatus });
  }
  const showRate = totals.agendamentos > 0 ? (totals.reunioes / totals.agendamentos) * 100 : 100;
  if (totals.agendamentos > 0 && showRate < 60) {
    alertas.push({ msg: `Show rate crítico: ${showRate.toFixed(0)}%`, nivel: "critico" });
  }
  if (totals.tentativas < META.tentativasTotais * 0.7) {
    alertas.push({ msg: `Volume de tentativas abaixo do esperado (${totals.tentativas}/${META.tentativasTotais})`, nivel: "atencao" });
  }

  const sdrName = (id: string) => state.sdrs.find((s) => s.id === id)?.nome ?? id;
  const closerName = (id: string) => state.closers.find((c) => c.id === id)?.nome ?? id;

  // Bloco por operador
  const sdrBy = (sdrId: string) => sdrEntries.filter((e) => e.sdrId === sdrId);
  const closerBy = (cId: string) => closerEntries.filter((e) => e.closerId === cId);

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Cockpit Diário"
        subtitle="Lançamento manual diário enquanto o BI definitivo não está pronto. Foco em SDRs, Closers e gargalos do dia."
        actions={
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs ${statusBg(diaStatus)}`}>
            <Activity className="h-3.5 w-3.5" />
            <span className={`uppercase tracking-wider font-medium ${statusColor(diaStatus)}`}>
              {diaStatus === "saudavel" ? "Saudável" : diaStatus === "atencao" ? "Atenção" : "Crítico"}
            </span>
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 mb-8 p-4 rounded-lg border border-border bg-card">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Data</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="bg-background border border-border rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Sprint</label>
          <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value as any)}
            className="bg-background border border-border rounded px-3 py-1.5 text-sm">
            <option value="all">Todas</option>
            <option value="S1">S1</option><option value="S2">S2</option>
            <option value="S3">S3</option><option value="S4">S4</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Operador</label>
          <select value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)}
            className="bg-background border border-border rounded px-3 py-1.5 text-sm">
            <option value="all">Todos</option>
            {state.sdrs.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            {state.closers.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Resumo do dia */}
      <Section title="Resumo do Dia" description="Totais consolidados conforme filtros aplicados.">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: "Tentativas", v: totals.tentativas, m: META.tentativasTotais },
            { l: "Conexões", v: totals.conexoes, m: META.conexoesTotais },
            { l: "Agendamentos", v: totals.agendamentos, m: META.agendamentosTotais },
            { l: "Reuniões", v: totals.reunioes, m: META.reunioes },
            { l: "Negociações", v: totals.negociacoes, m: null },
            { l: "Vendas", v: totals.vendas, m: META.fechamentos },
            { l: "Perdidos", v: totals.perdidos, m: null },
            { l: "No-show", v: totals.noShow, m: null },
            { l: "Valor Vendido", v: totals.valorVendido, m: META.receita, brl: true },
            { l: "Gap Meta Dia", v: gapReceita, m: null, brl: true, accent: true },
          ].map((c, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.l}</p>
              <p className={`mt-1 text-lg font-semibold num-tabular ${c.accent ? "text-primary" : "text-foreground"}`}>
                {c.brl ? fmtBRL(c.v) : fmtNum(c.v)}
              </p>
              {c.m != null && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Meta: {c.brl ? fmtBRL(c.m) : fmtNum(c.m)}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Alertas */}
      {alertas.length > 0 && (
        <Section title="Alertas Automáticos">
          <div className="space-y-2">
            {alertas.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-md border ${statusBg(a.nivel)}`}>
                <div className={`w-2 h-2 rounded-full ${a.nivel === "saudavel" ? "bg-emerald-400" : a.nivel === "atencao" ? "bg-amber-400" : "bg-rose-400"}`} />
                <span className="text-sm">{a.msg}</span>
                <span className={`ml-auto text-[10px] uppercase tracking-wider font-medium ${statusColor(a.nivel)}`}>
                  {a.nivel === "saudavel" ? "Saudável" : a.nivel === "atencao" ? "Atenção" : "Crítico"}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* SDR — Lançamentos */}
      <Section
        title="Lançamento SDR"
        description="Um lançamento por SDR por dia. Taxas calculadas automaticamente."
        action={
          <button onClick={addSDR} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Novo lançamento
          </button>
        }
      >
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left px-3 py-2">SDR</th>
                <th className="text-left px-3 py-2">Sprint</th>
                <th className="text-right px-3 py-2">Tent.</th>
                <th className="text-right px-3 py-2">Conex.</th>
                <th className="text-right px-3 py-2">Agend.</th>
                <th className="text-right px-3 py-2">Reun.</th>
                <th className="text-right px-3 py-2">No-show</th>
                <th className="text-right px-3 py-2">% Conex</th>
                <th className="text-right px-3 py-2">% Agend</th>
                <th className="text-left px-3 py-2 min-w-[160px]">Observações</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sdrEntries.length === 0 && (
                <tr><td colSpan={11} className="text-center py-8 text-muted-foreground text-xs">
                  Nenhum lançamento para esta data. Clique em "Novo lançamento".
                </td></tr>
              )}
              {sdrEntries.map((e) => {
                const cP = pct(e.conexoes, e.tentativas);
                const aP = pct(e.agendamentos, e.conexoes);
                return (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-accent/20">
                    <td className="px-3 py-2">
                      <select value={e.sdrId} onChange={(ev) => updSDR(e.id, { sdrId: ev.target.value })}
                        className="bg-transparent border-0 outline-none text-sm">
                        {state.sdrs.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={e.sprint} onChange={(ev) => updSDR(e.id, { sprint: ev.target.value as SprintKey })}
                        className="bg-transparent border-0 outline-none text-sm">
                        <option>S1</option><option>S2</option><option>S3</option><option>S4</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.tentativas} onChange={(n) => updSDR(e.id, { tentativas: n })} /></td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.conexoes} onChange={(n) => updSDR(e.id, { conexoes: n })} /></td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.agendamentos} onChange={(n) => updSDR(e.id, { agendamentos: n })} /></td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.reunioes} onChange={(n) => updSDR(e.id, { reunioes: n })} /></td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.noShow} onChange={(n) => updSDR(e.id, { noShow: n })} /></td>
                    <td className={`px-3 py-2 text-right num-tabular ${statusColor(classifyConexao(cP))}`}>{cP.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right num-tabular text-muted-foreground">{aP.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-xs"><EditableText value={e.obs} onChange={(v) => updSDR(e.id, { obs: v })} placeholder="—" /></td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => delSDR(e.id)} className="text-muted-foreground hover:text-rose-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Closer — Lançamentos */}
      <Section
        title="Lançamento Closer"
        description="Um lançamento por Closer por dia. Win rate e ticket médio calculados automaticamente."
        action={
          <button onClick={addCloser} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Novo lançamento
          </button>
        }
      >
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left px-3 py-2">Closer</th>
                <th className="text-left px-3 py-2">Sprint</th>
                <th className="text-right px-3 py-2">Reun.</th>
                <th className="text-right px-3 py-2">Negoc.</th>
                <th className="text-right px-3 py-2">Vendas</th>
                <th className="text-right px-3 py-2">Valor</th>
                <th className="text-right px-3 py-2">Perd.</th>
                <th className="text-right px-3 py-2">No-show</th>
                <th className="text-right px-3 py-2">R→N</th>
                <th className="text-right px-3 py-2">N→V</th>
                <th className="text-right px-3 py-2">Ticket</th>
                <th className="text-left px-3 py-2 min-w-[160px]">Observações</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {closerEntries.length === 0 && (
                <tr><td colSpan={13} className="text-center py-8 text-muted-foreground text-xs">
                  Nenhum lançamento para esta data.
                </td></tr>
              )}
              {closerEntries.map((e) => {
                const rn = pct(e.negociacoes, e.reunioes);
                const nv = pct(e.vendas, e.negociacoes);
                const ticket = e.vendas > 0 ? e.valorVendido / e.vendas : 0;
                return (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-accent/20">
                    <td className="px-3 py-2">
                      <select value={e.closerId} onChange={(ev) => updCloser(e.id, { closerId: ev.target.value })}
                        className="bg-transparent border-0 outline-none text-sm">
                        {state.closers.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={e.sprint} onChange={(ev) => updCloser(e.id, { sprint: ev.target.value as SprintKey })}
                        className="bg-transparent border-0 outline-none text-sm">
                        <option>S1</option><option>S2</option><option>S3</option><option>S4</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.reunioes} onChange={(n) => updCloser(e.id, { reunioes: n })} /></td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.negociacoes} onChange={(n) => updCloser(e.id, { negociacoes: n })} /></td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.vendas} onChange={(n) => updCloser(e.id, { vendas: n })} /></td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.valorVendido} onChange={(n) => updCloser(e.id, { valorVendido: n })} format="brl" /></td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.perdidos} onChange={(n) => updCloser(e.id, { perdidos: n })} /></td>
                    <td className="px-3 py-2 text-right"><EditableNumber value={e.noShow} onChange={(n) => updCloser(e.id, { noShow: n })} /></td>
                    <td className="px-3 py-2 text-right num-tabular text-muted-foreground">{rn.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right num-tabular text-primary">{nv.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right num-tabular">{fmtBRL(ticket)}</td>
                    <td className="px-3 py-2 text-xs"><EditableText value={e.obs} onChange={(v) => updCloser(e.id, { obs: v })} placeholder="—" /></td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => delCloser(e.id)} className="text-muted-foreground hover:text-rose-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Visão por operador */}
      <Section title="Performance por Operador" description="Consolidado do dia por pessoa.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">SDRs</p>
            <div className="space-y-3">
              {state.sdrs.map((s) => {
                const es = sdrBy(s.id);
                const t = es.reduce((a, e) => ({
                  tent: a.tent + e.tentativas, conex: a.conex + e.conexoes,
                  agend: a.agend + e.agendamentos, reun: a.reun + e.reunioes, ns: a.ns + e.noShow,
                }), { tent: 0, conex: 0, agend: 0, reun: 0, ns: 0 });
                const cP = pct(t.conex, t.tent);
                const aP = pct(t.agend, t.conex);
                return (
                  <div key={s.id} className="border border-border/60 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{s.nome}</span>
                      <span className={`text-[10px] uppercase tracking-wider ${statusColor(classifyConexao(cP))}`}>
                        Conexão {cP.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <Mini label="Tent." v={t.tent} meta={META.tentativasSDR} />
                      <Mini label="Conex." v={t.conex} meta={META.conexoesSDR} />
                      <Mini label="Agend." v={t.agend} meta={META.agendamentosSDR} />
                      <Mini label="Reun." v={t.reun} />
                      <Mini label="No-show" v={t.ns} />
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">% Agend. (sobre conexões): {aP.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Closers</p>
            <div className="space-y-3">
              {state.closers.map((c) => {
                const es = closerBy(c.id);
                const t = es.reduce((a, e) => ({
                  reun: a.reun + e.reunioes, neg: a.neg + e.negociacoes,
                  ven: a.ven + e.vendas, val: a.val + e.valorVendido,
                  perd: a.perd + e.perdidos, ns: a.ns + e.noShow,
                }), { reun: 0, neg: 0, ven: 0, val: 0, perd: 0, ns: 0 });
                const win = pct(t.ven, t.reun);
                const ticket = t.ven > 0 ? t.val / t.ven : 0;
                return (
                  <div key={c.id} className="border border-border/60 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{c.nome}</span>
                      <span className="text-[10px] uppercase tracking-wider text-primary">
                        Win rate {win.toFixed(0)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <Mini label="Reun." v={t.reun} />
                      <Mini label="Negoc." v={t.neg} />
                      <Mini label="Vendas" v={t.ven} />
                      <Mini label="Perd." v={t.perd} />
                      <Mini label="No-show" v={t.ns} />
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Valor: <span className="num-tabular text-foreground">{fmtBRL(t.val)}</span> · Ticket médio: <span className="num-tabular text-foreground">{fmtBRL(ticket)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function Mini({ label, v, meta }: { label: string; v: number; meta?: number }) {
  const ok = meta != null ? v >= meta : true;
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`num-tabular text-sm font-medium ${meta != null ? (ok ? "text-emerald-400" : "text-foreground") : "text-foreground"}`}>
        {fmtNum(v)}{meta != null && <span className="text-[9px] text-muted-foreground"> /{meta}</span>}
      </p>
    </div>
  );
}
