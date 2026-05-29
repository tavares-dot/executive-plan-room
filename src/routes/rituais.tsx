import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableText } from "@/components/Editable";
import { usePlan } from "@/lib/plan-store";
import { Check } from "lucide-react";

export const Route = createFileRoute("/rituais")({
  head: () => ({ meta: [{ title: "Rituais · Legacy" }] }),
  component: RituaisPage,
});

function RituaisPage() {
  const { state, setState } = usePlan();
  const update = (id: string, patch: any) =>
    setState((s) => ({ ...s, rituais: s.rituais.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const total = state.rituais.length;
  const feitos = state.rituais.filter((r) => r.feito).length;

  return (
    <>
      <PageHeader eyebrow="Cadência" title="Rituais" subtitle={`${feitos} de ${total} rituais realizados`} />

      <Section title="Timeline da Semana">
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
          <ul className="space-y-3">
            {state.rituais.map((r) => (
              <li key={r.id} className="relative pl-12">
                <button
                  onClick={() => update(r.id, { feito: !r.feito })}
                  className={`absolute left-0 top-1 h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
                    r.feito ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground hover:border-primary"
                  }`}
                  aria-label="Marcar como realizado"
                >
                  {r.feito && <Check className="h-4 w-4" />}
                </button>
                <div className={`rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4 ${r.feito ? "opacity-60" : ""}`}>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      <EditableText value={r.nome} onChange={(v) => update(r.id, { nome: v })} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <EditableText value={r.horario} onChange={(v) => update(r.id, { horario: v })} />
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${r.feito ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {r.feito ? "Realizado" : "Pendente"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
