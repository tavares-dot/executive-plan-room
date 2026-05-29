import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { EditableNumber, EditableText } from "@/components/Editable";
import { usePlan, fmtBRL } from "@/lib/plan-store";

export const Route = createFileRoute("/closers")({
  head: () => ({ meta: [{ title: "Closers · Legacy" }] }),
  component: ClosersPage,
});

function ClosersPage() {
  const { state, setState } = usePlan();
  const update = (id: string, patch: any) =>
    setState((s) => ({ ...s, closers: s.closers.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  return (
    <>
      <PageHeader eyebrow="Time" title="Closers" subtitle="Performance individual de fechamento e receita." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.closers.map((c) => {
          const pct = c.metaReceita ? Math.min(100, (c.resReceita / c.metaReceita) * 100) : 0;
          return (
            <div key={c.id} className="rounded-lg border border-border bg-card p-6 fade-in">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">
                  <EditableText value={c.nome} onChange={(v) => update(c.id, { nome: v })} />
                </h3>
                <span className="text-xs text-muted-foreground num-tabular">{pct.toFixed(0)}% da meta</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Box label="Meta Receita" value={c.metaReceita} onChange={(v) => update(c.id, { metaReceita: v })} format="brl" />
                <Box label="Meta Reuniões" value={c.metaReunioes} onChange={(v) => update(c.id, { metaReunioes: v })} format="num" />
                <Box label="Meta Fechamentos" value={c.metaFechamentos} onChange={(v) => update(c.id, { metaFechamentos: v })} format="num" />
                <Box label="Receita Atual" value={c.resReceita} onChange={(v) => update(c.id, { resReceita: v })} format="brl" accent />
                <Box label="Reuniões Atual" value={c.resReunioes} onChange={(v) => update(c.id, { resReunioes: v })} format="num" accent />
                <Box label="Fechamentos Atual" value={c.resFechamentos} onChange={(v) => update(c.id, { resFechamentos: v })} format="num" accent />
              </div>
              <div className="mt-6 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground num-tabular">{fmtBRL(c.resReceita)} de {fmtBRL(c.metaReceita)}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Box({ label, value, onChange, format, accent }: { label: string; value: number; onChange: (n: number) => void; format: "brl" | "num"; accent?: boolean }) {
  return (
    <div className={`rounded-md p-3 border ${accent ? "border-primary/30 bg-primary/5" : "border-border"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className={`mt-1 text-base font-semibold ${accent ? "text-primary" : ""}`}>
        <EditableNumber value={value} onChange={onChange} format={format} />
      </div>
    </div>
  );
}
