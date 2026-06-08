import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Section } from "@/components/PageHeader";
import { sdrScoreboardQuery } from "@/lib/queries";
import { fmtNum, fmtPct, semaforoColors, semaforoFromPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/sdrs")({
  head: () => ({ meta: [{ title: "SDR Ops · Legacy" }] }),
  component: SDRsPage,
});

function SDRsPage() {
  const { data = [] } = useQuery(sdrScoreboardQuery);
  return (
    <>
      <PageHeader eyebrow="Time" title="SDR Ops" subtitle="Ranking e indicadores individuais por SDR — calculados em tempo real." />
      <Section title="Scoreboard">
        {data.length === 0 ? (
          <Empty />
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">SDR</th>
                  <th className="text-right p-3">Tentativas</th>
                  <th className="text-right p-3">Conexões</th>
                  <th className="text-right p-3">Agend.</th>
                  <th className="text-right p-3">Reuniões</th>
                  <th className="text-right p-3">Meta reun.</th>
                  <th className="text-right p-3">T. Con.</th>
                  <th className="text-right p-3">T. Agend.</th>
                  <th className="text-right p-3">SLA (h)</th>
                  <th className="text-right p-3">Parados</th>
                  <th className="text-center p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r: any, i: number) => {
                  const sem = semaforoFromPct(Number(r.reunioes), Number(r.meta_reunioes) || 1);
                  const c = semaforoColors[sem];
                  return (
                    <tr key={r.sdr_id} className="border-b border-border last:border-0">
                      <td className="p-3 text-muted-foreground num-tabular">{i + 1}</td>
                      <td className="p-3 font-medium">{r.nome}</td>
                      <td className="p-3 text-right num-tabular">{fmtNum(r.tentativas)}</td>
                      <td className="p-3 text-right num-tabular">{fmtNum(r.conexoes)}</td>
                      <td className="p-3 text-right num-tabular">{fmtNum(r.agendamentos)}</td>
                      <td className="p-3 text-right num-tabular font-semibold">{fmtNum(r.reunioes)}</td>
                      <td className="p-3 text-right num-tabular text-muted-foreground">{fmtNum(r.meta_reunioes)}</td>
                      <td className="p-3 text-right num-tabular">{fmtPct(r.taxa_conexao)}</td>
                      <td className="p-3 text-right num-tabular">{fmtPct(r.taxa_agendamento)}</td>
                      <td className="p-3 text-right num-tabular">{Number(r.sla_medio).toFixed(1)}</td>
                      <td className="p-3 text-right num-tabular">{fmtNum(r.leads_parados)}</td>
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

function Empty() {
  return <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Cadastre SDRs em /governanca e registre lançamentos em /operacao.</div>;
}
