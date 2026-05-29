import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber } from "@/components/Editable";
import { usePlan, fmtBRL } from "@/lib/plan-store";
import { ArrowUpRight, Target, TrendingUp, Users, Briefcase, Wallet, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resumo Executivo · Plano Comercial Junho 2026 — Legacy" },
      { name: "description", content: "Resumo executivo do Plano Comercial de Junho 2026 da Legacy Executoria." },
    ],
  }),
  component: Index,
});

function KpiCard({
  icon: Icon, label, value, onChange, format = "brl", accent,
}: { icon: any; label: string; value: number; onChange: (n: number) => void; format?: "brl" | "num"; accent?: boolean }) {
  return (
    <div className={`group relative rounded-lg border bg-card p-6 transition-shadow hover:shadow-sm ${accent ? "border-primary/40" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">{label}</span>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">
        <EditableNumber value={value} onChange={onChange} format={format} />
      </div>
    </div>
  );
}

function Index() {
  const { state, setState } = usePlan();
  const h = state.home;
  const gap = (h.metaReceita || 0) - (h.receitaRealizada || 0);
  const pct = h.metaReceita > 0 ? Math.min(100, (h.receitaRealizada / h.metaReceita) * 100) : 0;

  const set = (k: keyof typeof h) => (n: number) =>
    setState((s) => ({ ...s, home: { ...s.home, [k]: n } }));

  return (
    <>
      <PageHeader
        eyebrow="Legacy Executoria"
        title="Plano Comercial Junho 2026"
        subtitle="Execução, Receita e Governança"
      />

      <Section title="Visão do Mês" description="Indicadores-chave editáveis. Clique em qualquer número para atualizar.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Target} label="Meta Receita" value={h.metaReceita} onChange={set("metaReceita")} accent />
          <KpiCard icon={TrendingUp} label="Receita Realizada" value={h.receitaRealizada} onChange={set("receitaRealizada")} />
          <KpiCard icon={Activity} label="Gap" value={gap} onChange={() => {}} />
          <KpiCard icon={Wallet} label="Forecast" value={h.forecast} onChange={set("forecast")} />
          <KpiCard icon={Users} label="Reuniões" value={h.reunioes} onChange={set("reunioes")} format="num" />
          <KpiCard icon={Briefcase} label="Fechamentos" value={h.fechamentos} onChange={set("fechamentos")} format="num" />
          <KpiCard icon={Wallet} label="Ticket Médio" value={h.ticketMedio} onChange={set("ticketMedio")} />
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Progresso da Meta</p>
            <p className="mt-4 text-3xl font-semibold num-tabular">{pct.toFixed(1)}%</p>
            <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{fmtBRL(h.receitaRealizada)} de {fmtBRL(h.metaReceita)}</p>
          </div>
        </div>
      </Section>

      <Section title="Governança" description="Princípios de execução do mês.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { t: "Disciplina de Sprint", d: "Quatro sprints semanais com objetivos claros, base trabalhada e checklist auditável." },
            { t: "Rituais Diários", d: "Daily, Checkpoint SDR, Operacional e Fechamento — cadência inegociável." },
            { t: "Forecast Vivo", d: "Commit, Best Case e Pipeline atualizados continuamente para decisão executiva." },
          ].map((c) => (
            <div key={c.t} className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
