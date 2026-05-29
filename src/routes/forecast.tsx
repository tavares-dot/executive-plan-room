import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber } from "@/components/Editable";
import { usePlan, fmtBRL } from "@/lib/plan-store";

export const Route = createFileRoute("/forecast")({
  head: () => ({ meta: [{ title: "Forecast · Legacy" }] }),
  component: ForecastPage,
});

function ForecastPage() {
  const { state, setState } = usePlan();
  const f = state.forecast;
  const set = (k: keyof typeof f) => (n: number) =>
    setState((s) => ({ ...s, forecast: { ...s.forecast, [k]: n } }));

  const cards: { key: keyof typeof f; label: string; tone?: string; desc: string }[] = [
    { key: "commit", label: "Commit", desc: "Receita comprometida com alta probabilidade." },
    { key: "bestCase", label: "Best Case", desc: "Cenário otimista de fechamento.", tone: "primary" },
    { key: "pipeline", label: "Pipeline", desc: "Total de oportunidades em aberto." },
    { key: "gap", label: "Gap", desc: "Distância para a meta." },
    { key: "receitaPrevista", label: "Receita Prevista", desc: "Projeção consolidada do mês.", tone: "primary" },
  ];

  return (
    <>
      <PageHeader eyebrow="Projeção" title="Forecast" subtitle="Cenários de fechamento e leitura executiva do pipeline." />

      <Section title="Cenários">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.key} className={`rounded-lg border bg-card p-6 ${c.tone === "primary" ? "border-primary/40" : "border-border"}`}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <div className={`mt-3 text-2xl font-semibold ${c.tone === "primary" ? "text-primary" : ""}`}>
                <EditableNumber value={f[c.key]} onChange={set(c.key)} format="brl" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Resumo">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <Stat label="Commit + Best Case" value={f.commit + f.bestCase} />
            <Stat label="Pipeline Total" value={f.pipeline} />
            <Stat label="Gap" value={f.gap} />
            <Stat label="Receita Prevista" value={f.receitaPrevista} accent />
          </div>
        </div>
      </Section>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold num-tabular ${accent ? "text-primary" : ""}`}>{fmtBRL(value)}</p>
    </div>
  );
}
