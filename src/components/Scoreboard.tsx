import { usePlan, fmtBRL } from "@/lib/plan-store";
import { EditableNumber } from "@/components/Editable";

export function Scoreboard() {
  const { state, setState } = usePlan();
  const h = state.home;
  const gap = (h.metaReceita || 0) - (h.receitaRealizada || 0);
  const pct = h.metaReceita > 0 ? Math.min(100, (h.receitaRealizada / h.metaReceita) * 100) : 0;

  const set = (k: keyof typeof h) => (n: number) =>
    setState((s) => ({ ...s, home: { ...s.home, [k]: n } }));

  const Cell = ({
    label, value, onChange, accent,
  }: { label: string; value: number; onChange?: (n: number) => void; accent?: boolean }) => (
    <div className="flex flex-col justify-center px-5 py-2 min-w-0">
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap">{label}</span>
      <div className={`mt-0.5 text-base md:text-lg font-semibold num-tabular truncate ${accent ? "text-primary" : "text-foreground"}`}>
        {onChange ? (
          <EditableNumber value={value} onChange={onChange} format="brl" />
        ) : (
          fmtBRL(value)
        )}
      </div>
    </div>
  );

  return (
    <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex items-stretch gap-1 divide-x divide-border overflow-x-auto">
          <Cell label="Meta Junho" value={h.metaReceita} onChange={set("metaReceita")} />
          <Cell label="Realizado" value={h.receitaRealizada} onChange={set("receitaRealizada")} accent />
          <Cell label="Gap" value={gap} />
          <Cell label="Forecast" value={h.forecast} onChange={set("forecast")} />
          <Cell label="Comprometido" value={h.comprometido} onChange={set("comprometido")} />
          <div className="flex flex-col justify-center px-5 py-2 flex-1 min-w-[160px]">
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Progresso</span>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-semibold num-tabular text-foreground">{pct.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
