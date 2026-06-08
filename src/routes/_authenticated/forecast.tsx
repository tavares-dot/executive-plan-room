import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Section } from "@/components/PageHeader";
import { forecastMonthQuery, opportunitiesQuery, closerScoreboardQuery } from "@/lib/queries";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/forecast")({
  head: () => ({ meta: [{ title: "Forecast · Legacy" }] }),
  component: ForecastPage,
});

function ForecastPage() {
  const { data: months = [] } = useQuery(forecastMonthQuery);
  const { data: opps = [] } = useQuery(opportunitiesQuery);
  const { data: closers = [] } = useQuery(closerScoreboardQuery);

  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;
  const f: any = months.find((x: any) => x.ano === ano && x.mes === mes) ?? months[0];

  const commit = opps.filter((o: any) => Number(o.probability) >= 80 && !["Fechado-Ganho","Fechado-Perdido"].includes(o.stage))
    .reduce((s: number, o: any) => s + Number(o.amount), 0);
  const bestCase = opps.filter((o: any) => !["Fechado-Ganho","Fechado-Perdido"].includes(o.stage))
    .reduce((s: number, o: any) => s + Number(o.amount), 0);
  const perdido = opps.filter((o: any) => o.stage === "Fechado-Perdido").reduce((s: number, o: any) => s + Number(o.amount), 0);

  const meta = Number(f?.meta_receita ?? 0);
  const realizado = Number(f?.receita_realizada ?? 0);
  const pip = Number(f?.pipeline_ponderado ?? 0);
  const ritmo = f?.dias_uteis ? Number(f.gap) / Math.max(1, Number(f.dias_uteis)) : 0;

  return (
    <>
      <PageHeader eyebrow="Projeção" title="Forecast" subtitle="Cenários, pipeline ponderado e ritmo necessário." />

      <Section title="Cenários do mês">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card label="Commit" value={fmtBRL(commit)} />
          <Card label="Best Case" value={fmtBRL(bestCase)} accent />
          <Card label="Pipeline Ponderado" value={fmtBRL(pip)} />
          <Card label="Perdido" value={fmtBRL(perdido)} />
          <Card label="Receita realizada" value={fmtBRL(realizado)} accent />
          <Card label="Gap" value={fmtBRL(f?.gap ?? 0)} />
          <Card label="Contratos restantes" value={fmtNum(f?.contratos_restantes ?? 0)} />
          <Card label="Ritmo diário necessário" value={fmtBRL(ritmo)} />
        </div>
      </Section>

      <Section title="Resumo">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <Stat label="Meta" value={fmtBRL(meta)} />
            <Stat label="Realizado + Pipeline pond." value={fmtBRL(realizado + pip)} accent />
            <Stat label="% Meta" value={fmtPct(meta ? (realizado / meta) * 100 : 0)} />
            <Stat label="Dias úteis restantes" value={fmtNum(f?.dias_uteis ?? 0)} />
          </div>
        </div>
      </Section>

      <Section title="Forecast por Closer">
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {closers.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sem closers cadastrados.</div>}
          {closers.map((c: any) => {
            const ind = Number(c.negociacoes) * Number(c.ticket_medio || 0) * (Number(c.win_rate || 0) / 100);
            return (
              <div key={c.closer_id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-medium">{c.nome}</span>
                <div className="text-right">
                  <p className="text-sm num-tabular font-semibold">{fmtBRL(ind)}</p>
                  <p className="text-[11px] text-muted-foreground">{fmtPct(c.win_rate)} win · {fmtBRL(c.ticket_medio)} ticket</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-5 ${accent ? "border-primary/40" : "border-border"}`}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-3 text-xl font-semibold num-tabular ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold num-tabular ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
