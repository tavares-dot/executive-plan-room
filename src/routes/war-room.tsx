import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber, EditableText } from "@/components/Editable";
import { usePlan, fmtBRL, fmtNum } from "@/lib/plan-store";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/war-room")({
  head: () => ({ meta: [{ title: "War Room · Legacy" }] }),
  component: WarRoom,
});

function WarRoom() {
  const { state, setState } = usePlan();
  const wr = state.warRoom;
  const gap = wr.metaJunho - wr.receita;
  const pct = wr.metaJunho > 0 ? Math.min(100, (wr.receita / wr.metaJunho) * 100) : 0;
  const maxFunil = Math.max(1, ...wr.funil.map((f) => f.valor));

  const updateFunil = (i: number, v: number) =>
    setState((s) => {
      const f = [...s.warRoom.funil];
      f[i] = { ...f[i], valor: v };
      return { ...s, warRoom: { ...s.warRoom, funil: f } };
    });
  const updateFunilLabel = (i: number, l: string) =>
    setState((s) => {
      const f = [...s.warRoom.funil];
      f[i] = { ...f[i], etapa: l };
      return { ...s, warRoom: { ...s.warRoom, funil: f } };
    });

  return (
    <>
      <PageHeader
        eyebrow="Ao vivo"
        title="War Room"
        subtitle="Sala de comando comercial. Receita, gap e funil em tempo real."
        actions={<div className="flex items-center gap-2 text-xs text-muted-foreground"><Radio className="h-4 w-4" />Atualização contínua</div>}
      />

      <Section title="Status da Meta">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta Junho</p>
            <div className="mt-2 text-4xl font-semibold tracking-tight">
              <EditableNumber value={wr.metaJunho} onChange={(n) => setState((s) => ({ ...s, warRoom: { ...s.warRoom, metaJunho: n } }))} format="brl" />
            </div>
            <div className="mt-6 h-3 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Receita realizada</p>
                <div className="mt-1 font-semibold text-foreground"><EditableNumber value={wr.receita} onChange={(n) => setState((s) => ({ ...s, warRoom: { ...s.warRoom, receita: n } }))} format="brl" /></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gap</p>
                <p className="mt-1 font-semibold num-tabular">{fmtBRL(gap)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Forecast</p>
                <div className="mt-1 font-semibold"><EditableNumber value={wr.forecast} onChange={(n) => setState((s) => ({ ...s, warRoom: { ...s.warRoom, forecast: n } }))} format="brl" /></div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-8 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Progresso</p>
            <p className="mt-2 text-6xl font-semibold tracking-tight text-primary num-tabular">{pct.toFixed(0)}%</p>
            <p className="mt-2 text-sm text-muted-foreground">da meta mensal</p>
          </div>
        </div>
      </Section>

      <Section title="Funil Comercial" description="Volume por etapa. Clique para editar.">
        <div className="rounded-lg border border-border bg-card p-8">
          <div className="space-y-3">
            {wr.funil.map((f, i) => {
              const w = (f.valor / maxFunil) * 100;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-40 text-sm text-foreground">
                    <EditableText value={f.etapa} onChange={(v) => updateFunilLabel(i, v)} />
                  </div>
                  <div className="flex-1 h-9 bg-muted rounded relative overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 flex items-center justify-end pr-3"
                      style={{ width: `${Math.max(8, w)}%` }}
                    >
                      <span className="text-xs font-medium text-primary-foreground num-tabular">{fmtNum(f.valor)}</span>
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm font-medium">
                    <EditableNumber value={f.valor} onChange={(n) => updateFunil(i, n)} format="num" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    </>
  );
}
