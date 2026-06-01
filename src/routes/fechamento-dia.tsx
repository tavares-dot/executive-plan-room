import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableText } from "@/components/Editable";
import { usePlan, type FechamentoDia } from "@/lib/plan-store";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/fechamento-dia")({
  head: () => ({ meta: [{ title: "Fechamento do Dia · Legacy" }] }),
  component: Fechamento,
});

const todayISO = () => new Date().toISOString().slice(0, 10);

function Fechamento() {
  const { state, setState } = usePlan();
  const [date, setDate] = useState(todayISO());

  const current = state.fechamentos.find((f) => f.date === date);

  const upsert = (patch: Partial<FechamentoDia>) =>
    setState((s) => {
      const exists = s.fechamentos.some((f) => f.date === date);
      const list = exists
        ? s.fechamentos.map((f) => f.date === date ? { ...f, ...patch } : f)
        : [...s.fechamentos, {
            date, resultado: "", gargalos: "", aprendizado: "",
            ajustes: "", responsavel: "", prazo: "", ...patch,
          } as FechamentoDia];
      return { ...s, fechamentos: list };
    });

  const del = () => setState((s) => ({ ...s, fechamentos: s.fechamentos.filter((f) => f.date !== date) }));

  const f: FechamentoDia = current ?? {
    date, resultado: "", gargalos: "", aprendizado: "", ajustes: "", responsavel: "", prazo: "",
  };

  const dates = [...state.fechamentos].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHeader
        eyebrow="Ritual diário"
        title="Fechamento do Dia"
        subtitle="Consolidação de resultado, gargalos, aprendizado e ajustes para o próximo dia."
        actions={
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="bg-card border border-border rounded px-3 py-1.5 text-sm" />
        }
      />

      <Section title={`Fechamento — ${date}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Resultado do dia" value={f.resultado} onChange={(v) => upsert({ resultado: v })} />
          <Field label="Gargalos identificados" value={f.gargalos} onChange={(v) => upsert({ gargalos: v })} />
          <Field label="Principal aprendizado" value={f.aprendizado} onChange={(v) => upsert({ aprendizado: v })} />
          <Field label="Ajustes para o próximo dia" value={f.ajustes} onChange={(v) => upsert({ ajustes: v })} />
          <Field label="Responsável pela correção" value={f.responsavel} onChange={(v) => upsert({ responsavel: v })} single />
          <Field label="Prazo de execução" value={f.prazo} onChange={(v) => upsert({ prazo: v })} single />
        </div>
        {current && (
          <button onClick={del} className="mt-4 inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300">
            <Trash2 className="h-3.5 w-3.5" /> Excluir fechamento desta data
          </button>
        )}
      </Section>

      <Section title="Histórico" description="Fechamentos lançados anteriormente.">
        {dates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum fechamento registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {dates.map((d) => (
              <button key={d.date} onClick={() => setDate(d.date)}
                className="w-full text-left rounded-md border border-border bg-card p-3 hover:bg-accent/30 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{d.date}</span>
                  <span className="text-muted-foreground">Resp.: {d.responsavel || "—"}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{d.resultado || "Sem resumo."}</p>
              </button>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function Field({ label, value, onChange, single }: { label: string; value: string; onChange: (v: string) => void; single?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <EditableText value={value} onChange={onChange} multiline={!single} placeholder="Clique para preencher" />
    </div>
  );
}
