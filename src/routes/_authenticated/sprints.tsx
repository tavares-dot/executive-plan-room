import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Section } from "@/components/PageHeader";
import { sprintsQuery, dailyEntriesQuery } from "@/lib/queries";
import { fmtBRL, fmtDate, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/sprints")({
  head: () => ({ meta: [{ title: "Sprints · Legacy" }] }),
  component: SprintsPage,
});

function SprintsPage() {
  const { data: sprints = [] } = useQuery(sprintsQuery);
  const { data: entries = [] } = useQuery(dailyEntriesQuery());

  const totalsBySprint: Record<string, number> = {};
  entries.forEach((e: any) => {
    if (!e.sprint_id) return;
    totalsBySprint[e.sprint_id] = (totalsBySprint[e.sprint_id] ?? 0) + Number(e.receita ?? 0);
  });

  return (
    <>
      <PageHeader eyebrow="Execução" title="Sprints" subtitle="Meta e realizado por sprint, alimentado automaticamente pelos lançamentos diários." />
      <Section title="Sprints cadastrados">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sprints.map((s: any) => {
            const meta = Number(s.meta_receita);
            const real = totalsBySprint[s.id] ?? 0;
            const pct = meta ? (real / meta) * 100 : 0;
            return (
              <div key={s.id} className="rounded-lg border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.nome}</p>
                <p className="mt-1 text-xs text-muted-foreground">{fmtDate(s.data_inicio)} → {fmtDate(s.data_fim)}</p>
                <p className="mt-4 text-lg font-semibold num-tabular text-primary">{fmtBRL(real)}</p>
                <p className="text-xs text-muted-foreground">de {fmtBRL(meta)} ({fmtPct(pct)})</p>
                <div className="mt-3 h-1.5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary rounded" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
