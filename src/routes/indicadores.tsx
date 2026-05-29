import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber, EditableText } from "@/components/Editable";
import { usePlan } from "@/lib/plan-store";

export const Route = createFileRoute("/indicadores")({
  head: () => ({ meta: [{ title: "Indicadores · Legacy" }] }),
  component: IndicadoresPage,
});

type Cat = "marketing" | "sdr" | "closer" | "receita";
const CATS: { key: Cat; title: string; desc: string }[] = [
  { key: "marketing", title: "Marketing", desc: "Geração de demanda e qualificação inicial." },
  { key: "sdr", title: "SDR", desc: "Prospecção ativa e agendamento." },
  { key: "closer", title: "Closer", desc: "Reuniões, propostas e taxa de fechamento." },
  { key: "receita", title: "Receita", desc: "Resultado financeiro e eficiência." },
];

function IndicadoresPage() {
  const { state, setState } = usePlan();

  const update = (cat: Cat, id: string, patch: any) =>
    setState((s) => ({
      ...s,
      indicadores: { ...s.indicadores, [cat]: s.indicadores[cat].map((i) => (i.id === id ? { ...i, ...patch } : i)) },
    }));

  const add = (cat: Cat) =>
    setState((s) => ({
      ...s,
      indicadores: { ...s.indicadores, [cat]: [...s.indicadores[cat], { id: cat + "-" + Date.now(), nome: "Novo Indicador", meta: 0, atual: 0 }] },
    }));

  return (
    <>
      <PageHeader eyebrow="Painel" title="Indicadores" subtitle="KPIs por área. Tudo editável e configurável." />

      {CATS.map((c) => (
        <Section key={c.key} title={c.title} description={c.desc} action={
          <button onClick={() => add(c.key)} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent">+ Indicador</button>
        }>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.indicadores[c.key].map((i) => {
              const pct = i.meta ? Math.min(100, (i.atual / i.meta) * 100) : 0;
              return (
                <div key={i.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    <EditableText value={i.nome} onChange={(v) => update(c.key, i.id, { nome: v })} />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-primary">
                      <EditableNumber value={i.atual} onChange={(v) => update(c.key, i.id, { atual: v })} format="num" />
                    </span>
                    <span className="text-xs text-muted-foreground">/ <EditableNumber value={i.meta} onChange={(v) => update(c.key, i.id, { meta: v })} format="num" className="text-xs" /></span>
                  </div>
                  <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground num-tabular">{pct.toFixed(0)}% da meta</p>
                </div>
              );
            })}
          </div>
        </Section>
      ))}
    </>
  );
}
