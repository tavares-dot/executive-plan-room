import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Section } from "@/components/PageHeader";
import { forecastMonthQuery } from "@/lib/queries";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/mensal")({
  head: () => ({ meta: [{ title: "Mensal · Legacy" }] }),
  component: MensalPage,
});

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function MensalPage() {
  const { data = [] } = useQuery(forecastMonthQuery);
  return (
    <>
      <PageHeader eyebrow="Consolidação" title="Controle Mensal" subtitle="Meta vs realizado, mês a mês. Forecast e gap calculados automaticamente." />
      <Section title="Junho — Dezembro 2026">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left p-3">Mês</th>
                <th className="text-right p-3">Meta</th>
                <th className="text-right p-3">Realizado</th>
                <th className="text-right p-3">% Meta</th>
                <th className="text-right p-3">Gap</th>
                <th className="text-right p-3">Pipeline pond.</th>
                <th className="text-right p-3">Forecast total</th>
                <th className="text-right p-3">Fech. / Nec.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r: any) => {
                const meta = Number(r.meta_receita);
                const real = Number(r.receita_realizada);
                const pip = Number(r.pipeline_ponderado);
                const pct = meta ? (real / meta) * 100 : 0;
                return (
                  <tr key={`${r.ano}-${r.mes}`} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium">{MESES[r.mes - 1]} {r.ano}</td>
                    <td className="p-3 text-right num-tabular">{fmtBRL(meta)}</td>
                    <td className="p-3 text-right num-tabular text-emerald-500">{fmtBRL(real)}</td>
                    <td className="p-3 text-right num-tabular">{fmtPct(pct)}</td>
                    <td className="p-3 text-right num-tabular text-amber-500">{fmtBRL(r.gap)}</td>
                    <td className="p-3 text-right num-tabular">{fmtBRL(pip)}</td>
                    <td className="p-3 text-right num-tabular font-semibold">{fmtBRL(real + pip)}</td>
                    <td className="p-3 text-right num-tabular">{fmtNum(r.fechamentos_realizados)} / {fmtNum(r.contratos_necessarios)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
