import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber, EditableText } from "@/components/Editable";
import { usePlan, fmtBRL } from "@/lib/plan-store";
import type { PlanState } from "@/lib/plan-store";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/sprints")({
  head: () => ({ meta: [{ title: "Painel de Sprints · Legacy" }] }),
  component: SprintsBoard,
});

const STATUSES = ["Não iniciado", "Em andamento", "Concluído"] as const;
const statusStyles: Record<string, string> = {
  "Não iniciado": "bg-muted text-muted-foreground border-border",
  "Em andamento": "bg-accent text-accent-foreground border-primary/30",
  "Concluído": "bg-primary/10 text-primary border-primary/40",
};

const keys: (keyof PlanState["sprints"])[] = ["S1", "S2", "S3", "S4"];

function SprintsBoard() {
  const { state, setState } = usePlan();

  const update = (k: keyof PlanState["sprints"], patch: any) =>
    setState((s) => ({ ...s, sprints: { ...s.sprints, [k]: { ...s.sprints[k], ...patch } } }));

  const cycleStatus = (cur: string) => {
    const i = STATUSES.indexOf(cur as any);
    return STATUSES[(i + 1) % STATUSES.length];
  };

  return (
    <>
      <PageHeader
        eyebrow="Execução"
        title="Painel de Sprints"
        subtitle="Visão consolidada das 4 sprints. Tudo editável."
      />

      <Section title="Sprints do Mês">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {keys.map((k, i) => {
            const sp = state.sprints[k];
            const done = sp.checklist.filter((c) => c.status === "Concluído").length;
            const total = sp.checklist.length;
            const pct = total ? (done / total) * 100 : 0;
            return (
              <div key={k} className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Sprint {i + 1}</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">{k}</h3>
                  </div>
                  <button
                    onClick={() => update(k, { status: cycleStatus(sp.status) })}
                    className={`text-[11px] px-3 py-1 rounded-full border font-medium ${statusStyles[sp.status]}`}
                  >
                    {sp.status}
                  </button>
                </div>

                <div className="text-sm text-foreground/80 leading-relaxed">
                  <EditableText
                    value={sp.objetivo}
                    onChange={(v) => update(k, { objetivo: v })}
                    multiline
                    placeholder="Objetivo da sprint"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Receita" value={sp.metaReceita} onChange={(v) => update(k, { metaReceita: v })} format="brl" />
                  <Stat label="Meta SDR" value={sp.metaSDR} onChange={(v) => update(k, { metaSDR: v })} format="num" />
                  <Stat label="Meta Closer" value={sp.metaClosers} onChange={(v) => update(k, { metaClosers: v })} format="num" />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Bases trabalhadas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sp.base.map((b, j) => (
                      <span key={j} className="text-[11px] px-2 py-1 rounded-md bg-muted text-foreground/80">
                        {b.label} · <span className="num-tabular font-medium">{b.value}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Checklist</span>
                    <span className="num-tabular">{done}/{total}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <Link
                    to={`/s${i + 1}` as any}
                    className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Abrir Sprint {i + 1} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Distribuição da Meta">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {keys.map((k, i) => {
            const sp = state.sprints[k];
            return (
              <div key={k} className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sprint {i + 1}</p>
                <p className="mt-2 text-lg font-semibold text-primary num-tabular">{fmtBRL(sp.metaReceita)}</p>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function Stat({ label, value, onChange, format }: { label: string; value: number; onChange: (n: number) => void; format: "brl" | "num" }) {
  return (
    <div className="rounded-md border border-border p-2">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-semibold">
        <EditableNumber value={value} onChange={onChange} format={format} />
      </div>
    </div>
  );
}
