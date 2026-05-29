import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber } from "@/components/Editable";
import { usePlan, fmtBRL } from "@/lib/plan-store";

export const Route = createFileRoute("/meta-junho")({
  head: () => ({ meta: [{ title: "Meta Junho · Legacy" }] }),
  component: MetaJunho,
});

function MetaJunho() {
  const { state, setState } = usePlan();
  const meta = state.warRoom.metaJunho;
  const real = state.home.receitaRealizada;
  const pct = meta > 0 ? Math.min(100, (real / meta) * 100) : 0;
  const gap = meta - real;

  return (
    <>
      <PageHeader eyebrow="Meta" title="Meta Junho 2026" subtitle="Quebra da meta mensal e leitura de progresso." />
      <Section title="Meta Mensal">
        <div className="rounded-lg border border-border bg-card p-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta de Receita — Junho</p>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-primary">
            <EditableNumber value={meta} onChange={(n) => setState((s) => ({ ...s, warRoom: { ...s.warRoom, metaJunho: n } }))} format="brl" />
          </div>
          <div className="mt-8 h-3 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-sm text-muted-foreground num-tabular">
            <span>Realizado: <span className="text-foreground font-medium">{fmtBRL(real)}</span></span>
            <span>{pct.toFixed(1)}%</span>
            <span>Gap: <span className="text-foreground font-medium">{fmtBRL(gap)}</span></span>
          </div>
        </div>
      </Section>

      <Section title="Quebra Semanal" description="Distribuição sugerida da meta nas 4 sprints.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["S1", "S2", "S3", "S4"].map((s, i) => (
            <div key={s} className="rounded-lg border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Sprint {i + 1}</p>
              <p className="mt-3 text-2xl font-semibold num-tabular">{fmtBRL(meta / 4)}</p>
              <p className="mt-2 text-xs text-muted-foreground">25% da meta mensal</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
