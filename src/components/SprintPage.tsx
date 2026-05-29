import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber, EditableText } from "@/components/Editable";
import { usePlan } from "@/lib/plan-store";
import type { PlanState } from "@/lib/plan-store";

type SprintKey = keyof PlanState["sprints"];

const STATUSES = ["Não iniciado", "Em andamento", "Concluído"] as const;
const statusStyles: Record<string, string> = {
  "Não iniciado": "bg-muted text-muted-foreground border-border",
  "Em andamento": "bg-accent text-accent-foreground border-primary/30",
  "Concluído": "bg-primary/10 text-primary border-primary/40",
};

export function SprintPage({ skey, num, title }: { skey: SprintKey; num: number; title: string }) {
  const { state, setState } = usePlan();
  const sprint = state.sprints[skey];

  const update = (patch: Partial<typeof sprint>) =>
    setState((s) => ({ ...s, sprints: { ...s.sprints, [skey]: { ...s.sprints[skey], ...patch } } }));

  const updateBase = (i: number, key: "label" | "value", v: any) => {
    const b = [...sprint.base];
    (b[i] as any)[key] = v;
    update({ base: b });
  };

  const updateCheck = (i: number, patch: any) => {
    const c = [...sprint.checklist];
    c[i] = { ...c[i], ...patch };
    update({ checklist: c });
  };

  const cycleStatus = (cur: string) => {
    const idx = STATUSES.indexOf(cur as any);
    return STATUSES[(idx + 1) % STATUSES.length];
  };

  const done = sprint.checklist.filter((c) => c.status === "Concluído").length;
  const total = sprint.checklist.length;

  return (
    <>
      <PageHeader eyebrow={`Sprint ${num}`} title={title} subtitle="Objetivo, base trabalhada, metas e checklist." />

      <Section title="Objetivo">
        <div className="rounded-lg border border-border bg-card p-6">
          <EditableText
            value={sprint.objetivo}
            onChange={(v) => update({ objetivo: v })}
            multiline
            placeholder="Descreva o objetivo desta sprint..."
            className="text-base leading-relaxed"
          />
        </div>
      </Section>

      <Section title="Base Trabalhada">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sprint.base.map((b, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                <EditableText value={b.label} onChange={(v) => updateBase(i, "label", v)} />
              </div>
              <div className="mt-3 text-2xl font-semibold">
                <EditableNumber value={b.value} onChange={(v) => updateBase(i, "value", v)} format="num" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Metas da Sprint">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta Receita</p>
            <div className="mt-3 text-2xl font-semibold text-primary">
              <EditableNumber value={sprint.metaReceita} onChange={(v) => update({ metaReceita: v })} format="brl" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta SDR (reuniões)</p>
            <div className="mt-3 text-2xl font-semibold">
              <EditableNumber value={sprint.metaSDR} onChange={(v) => update({ metaSDR: v })} format="num" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta Closers (fechamentos)</p>
            <div className="mt-3 text-2xl font-semibold">
              <EditableNumber value={sprint.metaClosers} onChange={(v) => update({ metaClosers: v })} format="num" />
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Checklist da Sprint"
        description={`${done}/${total} concluídos · clique no status para avançar`}
      >
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {sprint.checklist.map((c, i) => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4">
              <span className="text-xs text-muted-foreground num-tabular w-6">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex-1">
                <EditableText value={c.label} onChange={(v) => updateCheck(i, { label: v })} />
              </div>
              <button
                onClick={() => updateCheck(i, { status: cycleStatus(c.status) })}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${statusStyles[c.status]}`}
              >
                {c.status}
              </button>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
