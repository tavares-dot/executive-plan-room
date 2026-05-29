import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber, EditableText } from "@/components/Editable";
import { usePlan } from "@/lib/plan-store";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/sdrs")({
  head: () => ({ meta: [{ title: "SDRs · Legacy" }] }),
  component: SDRsPage,
});

function SDRsPage() {
  const { state, setState } = usePlan();

  const updateSdr = (id: string, patch: any) =>
    setState((s) => ({ ...s, sdrs: s.sdrs.map((sd) => (sd.id === id ? { ...sd, ...patch } : sd)) }));

  const updateSem = (id: string, i: number, v: number) =>
    setState((s) => ({
      ...s,
      sdrs: s.sdrs.map((sd) => {
        if (sd.id !== id) return sd;
        const sem = [...sd.semanal];
        sem[i] = { ...sem[i], reunioes: v };
        return { ...sd, semanal: sem };
      }),
    }));

  return (
    <>
      <PageHeader eyebrow="Time" title="SDRs" subtitle="Performance individual de prospecção e qualificação." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.sdrs.map((sdr) => {
          const pctReun = sdr.metaReunioes ? Math.min(100, (sdr.resultadoReunioes / sdr.metaReunioes) * 100) : 0;
          return (
            <div key={sdr.id} className="rounded-lg border border-border bg-card p-6 fade-in">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">
                  <EditableText value={sdr.nome} onChange={(v) => updateSdr(sdr.id, { nome: v })} />
                </h3>
                <span className="text-xs text-muted-foreground">{pctReun.toFixed(0)}% da meta de reuniões</span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <Metric label="Meta Ligações" value={sdr.metaLigacoes} onChange={(v) => updateSdr(sdr.id, { metaLigacoes: v })} />
                <Metric label="Meta Conexões" value={sdr.metaConexoes} onChange={(v) => updateSdr(sdr.id, { metaConexoes: v })} />
                <Metric label="Meta Reuniões" value={sdr.metaReunioes} onChange={(v) => updateSdr(sdr.id, { metaReunioes: v })} />
                <Metric label="Resultado Lig." value={sdr.resultadoLigacoes} onChange={(v) => updateSdr(sdr.id, { resultadoLigacoes: v })} accent />
                <Metric label="Resultado Con." value={sdr.resultadoConexoes} onChange={(v) => updateSdr(sdr.id, { resultadoConexoes: v })} accent />
                <Metric label="Resultado Reun." value={sdr.resultadoReunioes} onChange={(v) => updateSdr(sdr.id, { resultadoReunioes: v })} accent />
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Reuniões por Semana</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sdr.semanal}>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                      <Bar dataKey="reunioes" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {sdr.semanal.map((w, i) => (
                    <div key={i} className="text-center text-xs">
                      <div className="text-muted-foreground">{w.semana}</div>
                      <EditableNumber value={w.reunioes} onChange={(v) => updateSem(sdr.id, i, v)} format="num" className="text-sm font-medium" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Section title="" >
        <button
          onClick={() => setState((s) => ({
            ...s,
            sdrs: [...s.sdrs, {
              id: "sdr" + (s.sdrs.length + 1),
              nome: "SDR " + (s.sdrs.length + 1),
              metaLigacoes: 400, metaConexoes: 120, metaReunioes: 24,
              resultadoLigacoes: 0, resultadoConexoes: 0, resultadoReunioes: 0,
              semanal: [{ semana: "S1", reunioes: 0 }, { semana: "S2", reunioes: 0 }, { semana: "S3", reunioes: 0 }, { semana: "S4", reunioes: 0 }],
            }],
          }))}
          className="mt-2 text-xs px-4 py-2 rounded-md border border-border hover:bg-accent transition-colors"
        >+ Adicionar SDR</button>
      </Section>
    </>
  );
}

function Metric({ label, value, onChange, accent }: { label: string; value: number; onChange: (n: number) => void; accent?: boolean }) {
  return (
    <div className={`rounded-md p-3 border ${accent ? "border-primary/30 bg-primary/5" : "border-border"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className={`mt-1 text-lg font-semibold ${accent ? "text-primary" : ""}`}>
        <EditableNumber value={value} onChange={onChange} format="num" />
      </div>
    </div>
  );
}
