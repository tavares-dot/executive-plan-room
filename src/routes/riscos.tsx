import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableText } from "@/components/Editable";
import { usePlan } from "@/lib/plan-store";
import type { RiskLevel } from "@/lib/plan-store";

export const Route = createFileRoute("/riscos")({
  head: () => ({ meta: [{ title: "Painel de Riscos · Legacy" }] }),
  component: RiscosPage,
});

const LEVELS: { value: RiskLevel; label: string; dot: string; ring: string; emoji: string }[] = [
  { value: "green", label: "Saudável", dot: "bg-emerald-500", ring: "border-emerald-500/40", emoji: "🟢" },
  { value: "yellow", label: "Atenção", dot: "bg-yellow-400", ring: "border-yellow-400/50", emoji: "🟡" },
  { value: "orange", label: "Risco", dot: "bg-orange-500", ring: "border-orange-500/50", emoji: "🟠" },
  { value: "red", label: "Crítico", dot: "bg-red-500", ring: "border-red-500/50", emoji: "🔴" },
];

function levelMeta(v: RiskLevel) {
  return LEVELS.find((l) => l.value === v) ?? LEVELS[0];
}

function RiscosPage() {
  const { state, setState } = usePlan();
  const riscos = state.riscos;

  const update = (id: string, patch: any) =>
    setState((s) => ({ ...s, riscos: s.riscos.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  return (
    <>
      <PageHeader
        eyebrow="Governança"
        title="Painel de Riscos"
        subtitle="Sinais críticos da operação comercial. Observações editáveis."
      />

      <Section title="Sinalização">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riscos.map((r) => {
            const meta = levelMeta(r.nivel);
            return (
              <div key={r.id} className={`rounded-lg border-2 bg-card p-5 ${meta.ring}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <div className="text-sm font-semibold">
                      <EditableText value={r.titulo} onChange={(v) => update(r.id, { titulo: v })} />
                    </div>
                  </div>
                  <select
                    value={r.nivel}
                    onChange={(e) => update(r.id, { nivel: e.target.value as RiskLevel })}
                    className="text-[11px] bg-transparent border border-border rounded px-2 py-1 outline-none focus:border-primary"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.emoji} {l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-foreground/80 leading-relaxed">
                  <EditableText
                    value={r.observacao}
                    onChange={(v) => update(r.id, { observacao: v })}
                    multiline
                    placeholder="Observação executiva sobre este risco..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Legenda">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LEVELS.map((l) => (
            <div key={l.value} className="rounded-md border border-border bg-card px-3 py-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} />
              <span className="text-xs text-foreground/80">{l.label}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
