import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber } from "@/components/Editable";
import { usePlan, fmtNum } from "@/lib/plan-store";

export const Route = createFileRoute("/calendario")({
  head: () => ({ meta: [{ title: "Calendário Operacional · Legacy" }] }),
  component: Calendario,
});

const BASES = ["Maio", "Abril", "Março", "Fevereiro", "Janeiro", "Leads Novos"] as const;
const SPRINTS = ["S1", "S2", "S3", "S4"] as const;

function heatColor(value: number, max: number) {
  if (max <= 0 || value <= 0) return "bg-muted/60";
  const r = value / max;
  if (r > 0.75) return "bg-primary text-primary-foreground";
  if (r > 0.5) return "bg-primary/70 text-primary-foreground";
  if (r > 0.25) return "bg-primary/40 text-primary";
  return "bg-primary/15 text-primary";
}

function Calendario() {
  const { state, setState } = usePlan();
  const cells = state.calendario;
  const max = Math.max(1, ...cells.map((c) => c.valor));

  const get = (base: string, sprint: string) =>
    cells.find((c) => c.base === base && c.sprint === sprint)?.valor ?? 0;

  const update = (base: string, sprint: string, v: number) =>
    setState((s) => ({
      ...s,
      calendario: s.calendario.map((c) =>
        c.base === base && c.sprint === sprint ? { ...c, valor: v } : c,
      ),
    }));

  const sprintTotal = (sp: string) => cells.filter((c) => c.sprint === sp).reduce((a, b) => a + b.valor, 0);
  const baseTotal = (b: string) => cells.filter((c) => c.base === b).reduce((a, c) => a + c.valor, 0);

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Calendário Operacional"
        subtitle="Distribuição das bases trabalhadas por sprint. Heatmap editável."
      />

      <Section title="Heatmap de Bases × Sprints">
        <div className="rounded-lg border border-border bg-card p-6 overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 py-1">Base</th>
                {SPRINTS.map((s) => (
                  <th key={s} className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 py-1">{s}</th>
                ))}
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {BASES.map((base) => (
                <tr key={base}>
                  <td className="text-sm font-medium text-foreground/80 px-2 py-1 whitespace-nowrap">{base}</td>
                  {SPRINTS.map((sp) => {
                    const v = get(base, sp);
                    return (
                      <td key={sp} className="p-0">
                        <div className={`rounded-md aspect-[2/1] min-h-[52px] flex items-center justify-center font-semibold text-sm num-tabular transition-colors ${heatColor(v, max)}`}>
                          <EditableNumber value={v} onChange={(n) => update(base, sp, n)} format="num" />
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-sm font-semibold num-tabular text-right px-2">{fmtNum(baseTotal(base))}</td>
                </tr>
              ))}
              <tr>
                <td className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 pt-3">Total</td>
                {SPRINTS.map((sp) => (
                  <td key={sp} className="text-sm font-semibold num-tabular text-center pt-3">{fmtNum(sprintTotal(sp))}</td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>

          <div className="mt-6 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Menos</span>
            <div className="flex gap-1">
              {[0.15, 0.4, 0.7, 1].map((o) => (
                <div key={o} className="h-3 w-6 rounded" style={{ background: `color-mix(in oklab, var(--primary) ${o * 100}%, transparent)` }} />
              ))}
            </div>
            <span>Mais</span>
          </div>
        </div>
      </Section>
    </>
  );
}
