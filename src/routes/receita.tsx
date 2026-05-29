import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber } from "@/components/Editable";
import { usePlan, fmtBRL } from "@/lib/plan-store";
import { ComposedChart, Line, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/receita")({
  head: () => ({ meta: [{ title: "Receita · Legacy" }] }),
  component: ReceitaPage,
});

function ReceitaPage() {
  const { state, setState } = usePlan();
  const data = state.receitaMensal;
  const acumRealizado = data.reduce((a, b) => a + b.realizado, 0);
  const acumMeta = data.reduce((a, b) => a + b.meta, 0);
  const acumForecast = data.reduce((a, b) => a + b.forecast, 0);

  const update = (i: number, key: "meta" | "realizado" | "forecast", v: number) =>
    setState((s) => {
      const r = [...s.receitaMensal];
      r[i] = { ...r[i], [key]: v };
      return { ...s, receitaMensal: r };
    });

  return (
    <>
      <PageHeader eyebrow="Performance" title="Receita" subtitle="Realizado x meta x forecast acumulado e mensal." />

      <Section title="Visão Acumulada">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="Meta Acumulada" value={acumMeta} />
          <Card label="Realizado Acumulado" value={acumRealizado} accent />
          <Card label="Forecast Acumulado" value={acumForecast} />
        </div>
      </Section>

      <Section title="Evolução Mensal">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={48} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                  formatter={(v: any) => fmtBRL(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="realizado" name="Realizado" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forecast" name="Forecast" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
                <Line dataKey="meta" name="Meta" stroke="var(--color-foreground)" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <Section title="Tabela Editável">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Mês</th>
                <th className="px-4 py-3 text-right">Meta</th>
                <th className="px-4 py-3 text-right">Realizado</th>
                <th className="px-4 py-3 text-right">Forecast</th>
                <th className="px-4 py-3 text-right">% Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((r, i) => {
                const pct = r.meta ? (r.realizado / r.meta) * 100 : 0;
                return (
                  <tr key={r.mes} className="hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium">{r.mes}</td>
                    <td className="px-4 py-3 text-right"><EditableNumber value={r.meta} onChange={(v) => update(i, "meta", v)} format="brl" /></td>
                    <td className="px-4 py-3 text-right"><EditableNumber value={r.realizado} onChange={(v) => update(i, "realizado", v)} format="brl" /></td>
                    <td className="px-4 py-3 text-right"><EditableNumber value={r.forecast} onChange={(v) => update(i, "forecast", v)} format="brl" /></td>
                    <td className="px-4 py-3 text-right num-tabular text-muted-foreground">{pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

function Card({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-6 ${accent ? "border-primary/40" : "border-border"}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-3 text-2xl font-semibold num-tabular ${accent ? "text-primary" : ""}`}>{fmtBRL(value)}</p>
    </div>
  );
}
