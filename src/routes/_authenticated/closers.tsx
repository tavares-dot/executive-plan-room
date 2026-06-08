import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Section } from "@/components/PageHeader";
import { closerScoreboardQuery } from "@/lib/queries";
import { fmtBRL, fmtNum, fmtPct, semaforoColors, semaforoFromPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/closers")({
  head: () => ({ meta: [{ title: "Closer Ops · Legacy" }] }),
  component: ClosersPage,
});

function ClosersPage() {
  const { data = [] } = useQuery(closerScoreboardQuery);
  return (
    <>
      <PageHeader eyebrow="Time" title="Closer Ops" subtitle="Performance individual: show rate, win rate, ticket, receita." />
      <Section title="Scoreboard">
        {data.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Cadastre closers em /governanca.</div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Closer</th>
                  <th className="text-right p-3">Reuniões</th>
                  <th className="text-right p-3">Propostas</th>
                  <th className="text-right p-3">Negoc.</th>
                  <th className="text-right p-3">Fech.</th>
                  <th className="text-right p-3">Show</th>
                  <th className="text-right p-3">Win</th>
                  <th className="text-right p-3">Ticket</th>
                  <th className="text-right p-3">Receita</th>
                  <th className="text-right p-3">Meta</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r: any, i: number) => {
                  const sem = semaforoFromPct(Number(r.receita), Number(r.meta_receita) || 1);
                  const c = semaforoColors[sem];
                  return (
                    <tr key={r.closer_id} className="border-b border-border last:border-0">
                      <td className="p-3 text-muted-foreground num-tabular">{i + 1}</td>
                      <td className="p-3 font-medium">{r.nome}</td>
                      <td className="p-3 text-right num-tabular">{fmtNum(r.reunioes)}</td>
                      <td className="p-3 text-right num-tabular">{fmtNum(r.propostas)}</td>
                      <td className="p-3 text-right num-tabular">{fmtNum(r.negociacoes)}</td>
                      <td className="p-3 text-right num-tabular">{fmtNum(r.fechamentos)}</td>
                      <td className="p-3 text-right num-tabular">{fmtPct(r.show_rate)}</td>
                      <td className="p-3 text-right num-tabular">{fmtPct(r.win_rate)}</td>
                      <td className="p-3 text-right num-tabular">{fmtBRL(r.ticket_medio)}</td>
                      <td className="p-3 text-right num-tabular font-semibold">{fmtBRL(r.receita)}</td>
                      <td className="p-3 text-right num-tabular text-muted-foreground">{fmtBRL(r.meta_receita)}</td>
                      <td className="p-3 text-center"><span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${c.bg} ${c.text}`}><span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />{sem}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}
