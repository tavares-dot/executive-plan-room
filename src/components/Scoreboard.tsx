import { useQuery } from "@tanstack/react-query";
import { forecastMonthQuery, monthlyTargetsQuery } from "@/lib/queries";
import { fmtBRL, fmtPct } from "@/lib/format";

export function Scoreboard() {
  const { data: forecast } = useQuery(forecastMonthQuery);
  const { data: targets } = useQuery(monthlyTargetsQuery);

  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();
  const f = (forecast ?? []).find((x: any) => x.ano === ano && x.mes === mes)
    ?? (forecast ?? [])[0];
  const t = (targets ?? []).find((x: any) => x.ano === ano && x.mes === mes);

  if (!f && !t) return null;

  const meta = Number(f?.meta_receita ?? t?.meta_receita ?? 0);
  const realizado = Number(f?.receita_realizada ?? 0);
  const gap = Number(f?.gap ?? Math.max(meta - realizado, 0));
  const pct = meta > 0 ? (realizado / meta) * 100 : 0;

  return (
    <div className="border-b border-border bg-card/40 backdrop-blur">
      <div className="max-w-[1400px] mx-auto w-full px-6 md:px-10 py-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs">
        <span className="text-muted-foreground uppercase tracking-wider">Meta do mês</span>
        <span className="num-tabular font-semibold">{fmtBRL(meta)}</span>
        <span className="text-muted-foreground uppercase tracking-wider">Realizado</span>
        <span className="num-tabular font-semibold text-emerald-500">{fmtBRL(realizado)}</span>
        <span className="text-muted-foreground uppercase tracking-wider">Gap</span>
        <span className="num-tabular font-semibold text-amber-500">{fmtBRL(gap)}</span>
        <span className="text-muted-foreground uppercase tracking-wider">% Meta</span>
        <span className="num-tabular font-semibold">{fmtPct(pct, 1)}</span>
      </div>
    </div>
  );
}
