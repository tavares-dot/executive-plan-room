import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableText } from "@/components/Editable";
import { usePlan } from "@/lib/plan-store";
import type { ActionStatus } from "@/lib/plan-store";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/acoes")({
  head: () => ({ meta: [{ title: "Plano de Ação · Legacy" }] }),
  component: AcoesPage,
});

const STATUSES: ActionStatus[] = ["Não iniciado", "Em andamento", "Concluído"];
const styles: Record<ActionStatus, string> = {
  "Não iniciado": "bg-muted text-muted-foreground border-border",
  "Em andamento": "bg-accent text-accent-foreground border-primary/30",
  "Concluído": "bg-primary/10 text-primary border-primary/40",
};

function AcoesPage() {
  const { state, setState } = usePlan();
  const acoes = state.proximasAcoes;

  const update = (id: string, patch: any) =>
    setState((s) => ({ ...s, proximasAcoes: s.proximasAcoes.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));

  const remove = (id: string) =>
    setState((s) => ({ ...s, proximasAcoes: s.proximasAcoes.filter((a) => a.id !== id) }));

  const add = () =>
    setState((s) => ({
      ...s,
      proximasAcoes: [
        ...s.proximasAcoes,
        { id: "a" + Date.now(), titulo: "Nova ação", responsavel: "—", prazo: "S1", status: "Não iniciado" },
      ],
    }));

  const cycle = (cur: ActionStatus) => STATUSES[(STATUSES.indexOf(cur) + 1) % STATUSES.length];

  const done = acoes.filter((a) => a.status === "Concluído").length;

  return (
    <>
      <PageHeader
        eyebrow="Governança"
        title="Plano de Ação"
        subtitle={`Próximas ações executivas · ${done}/${acoes.length} concluídas`}
        actions={
          <button onClick={add} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent">
            <Plus className="h-3.5 w-3.5" /> Nova ação
          </button>
        }
      />

      <Section title="Próximas Ações">
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {acoes.map((a, i) => (
            <div key={a.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5">
              <span className="col-span-1 text-xs text-muted-foreground num-tabular">{String(i + 1).padStart(2, "0")}</span>
              <div className="col-span-5 text-sm">
                <EditableText value={a.titulo} onChange={(v) => update(a.id, { titulo: v })} />
              </div>
              <div className="col-span-2 text-xs text-foreground/70">
                <EditableText value={a.responsavel} onChange={(v) => update(a.id, { responsavel: v })} />
              </div>
              <div className="col-span-1 text-xs text-foreground/70 num-tabular">
                <EditableText value={a.prazo} onChange={(v) => update(a.id, { prazo: v })} />
              </div>
              <div className="col-span-2">
                <button
                  onClick={() => update(a.id, { status: cycle(a.status) })}
                  className={`w-full text-[11px] px-2 py-1 rounded-full border font-medium ${styles[a.status]}`}
                >
                  {a.status}
                </button>
              </div>
              <button onClick={() => remove(a.id)} className="col-span-1 justify-self-end text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!acoes.length && <p className="px-5 py-8 text-sm text-muted-foreground text-center">Nenhuma ação cadastrada.</p>}
        </div>
      </Section>
    </>
  );
}
