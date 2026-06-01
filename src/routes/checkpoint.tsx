import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber } from "@/components/Editable";
import { usePlan, fmtBRL } from "@/lib/plan-store";
import { Flag, AlertOctagon } from "lucide-react";

export const Route = createFileRoute("/checkpoint")({
  head: () => ({ meta: [{ title: "Checkpoint 13/06 · Legacy" }] }),
  component: Checkpoint,
});

function Checkpoint() {
  const { state, setState } = usePlan();
  const c = state.checkpoint13;
  const pct = c.meta > 0 ? Math.min(100, (c.realizado / c.meta) * 100) : 0;

  const status: "verde" | "amarelo" | "vermelho" =
    c.realizado >= 280000 ? "verde"
    : c.realizado >= 200000 ? "amarelo"
    : "vermelho";

  const statusLabel = status === "verde" ? "No ritmo" : status === "amarelo" ? "Atenção" : "Crítico — Plano B";
  const statusColor =
    status === "verde" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    : status === "amarelo" ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
    : "text-rose-400 bg-rose-500/10 border-rose-500/30";

  const set = (k: "meta" | "realizado" | "contratosEsperados" | "contratosRealizados") => (n: number) =>
    setState((s) => ({ ...s, checkpoint13: { ...s.checkpoint13, [k]: n } }));

  const planoB = [
    "Mutirão comercial",
    "Recuperação de negociações abertas",
    "Campanha de indicações",
    "Intensificação de WhatsApp",
    "Reabordagem de leads antigos",
    "Aumento da cadência dos closers",
    "Revisão diária de forecast",
  ];

  return (
    <>
      <PageHeader
        eyebrow="Marco crítico"
        title="Checkpoint 13/06"
        subtitle="Meio do mês. Marco de 50% da meta de junho. Se vermelho, ativar Plano B imediatamente."
        actions={
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs uppercase tracking-wider font-medium ${statusColor}`}>
            <Flag className="h-3.5 w-3.5" /> {statusLabel}
          </div>
        }
      />

      <Section title="Status do Checkpoint">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta esperada até 13/06</p>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              <EditableNumber value={c.meta} onChange={set("meta")} format="brl" />
            </div>
            <div className="mt-6 h-3 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-700 ${
                status === "verde" ? "bg-emerald-500" : status === "amarelo" ? "bg-amber-500" : "bg-rose-500"
              }`} style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Realizado até hoje</p>
                <div className="mt-1 font-semibold"><EditableNumber value={c.realizado} onChange={set("realizado")} format="brl" /></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gap</p>
                <p className="mt-1 font-semibold num-tabular">{fmtBRL(Math.max(0, c.meta - c.realizado))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progresso</p>
                <p className="mt-1 font-semibold num-tabular text-primary">{pct.toFixed(0)}%</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contratos esperados</p>
              <div className="mt-1 text-2xl font-semibold"><EditableNumber value={c.contratosEsperados} onChange={set("contratosEsperados")} /></div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contratos realizados</p>
              <div className="mt-1 text-2xl font-semibold text-primary"><EditableNumber value={c.contratosRealizados} onChange={set("contratosRealizados")} /></div>
            </div>
            <div className="mt-auto text-[10px] text-muted-foreground space-y-0.5 border-t border-border pt-3">
              <p>🟢 Verde: ≥ R$ 280k</p>
              <p>🟡 Amarelo: R$ 200k–279k</p>
              <p>🔴 Vermelho: &lt; R$ 200k</p>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Plano B"
        description={status === "vermelho" ? "Ativar agora — checkpoint em zona crítica." : "Plano de contingência se o checkpoint ficar vermelho."}
      >
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${status === "vermelho" ? "" : "opacity-80"}`}>
          {planoB.map((p, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${status === "vermelho" ? "border-rose-500/30 bg-rose-500/5" : "border-border bg-card"}`}>
              <AlertOctagon className={`h-4 w-4 mt-0.5 ${status === "vermelho" ? "text-rose-400" : "text-muted-foreground"}`} />
              <span className="text-sm">{p}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
