import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Section } from "@/components/PageHeader";
import { weeklyRollupQuery } from "@/lib/queries";
import { fmtBRL, fmtNum, fmtPct, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/semanal")({
  head: () => ({ meta: [{ title: "Semanal · Legacy" }] }),
  component: SemanalPage,
});

function SemanalPage() {
  const { data = [] } = useQuery(weeklyRollupQuery);
  return (
    <>
      <PageHeader eyebrow="Consolidação" title="Controle Semanal" subtitle="Agregação automática dos lançamentos diários por semana." />
      <Section title="Semanas">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left p-3">Semana</th>
                <th className="text-right p-3">Tentativas</th>
                <th className="text-right p-3">Conexões</th>
                <th className="text-right p-3">Agend.</th>
                <th className="text-right p-3">Reuniões</th>
                <th className="text-right p-3">Fech.</th>
                <th className="text-right p-3">T. Con.</th>
                <th className="text-right p-3">Show</th>
                <th className="text-right p-3">Win</th>
                <th className="text-right p-3">Receita</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">Sem dados ainda.</td></tr>}
              {data.map((r: any) => (
                <tr key={r.semana} className="border-b border-border last:border-0">
                  <td className="p-3">{fmtDate(r.semana)}</td>
                  <td className="p-3 text-right num-tabular">{fmtNum(r.tentativas)}</td>
                  <td className="p-3 text-right num-tabular">{fmtNum(r.conexoes)}</td>
                  <td className="p-3 text-right num-tabular">{fmtNum(r.agendamentos)}</td>
                  <td className="p-3 text-right num-tabular">{fmtNum(r.reunioes)}</td>
                  <td className="p-3 text-right num-tabular">{fmtNum(r.fechamentos)}</td>
                  <td className="p-3 text-right num-tabular">{fmtPct(r.taxa_conexao)}</td>
                  <td className="p-3 text-right num-tabular">{fmtPct(r.show_rate)}</td>
                  <td className="p-3 text-right num-tabular">{fmtPct(r.win_rate)}</td>
                  <td className="p-3 text-right num-tabular font-semibold">{fmtBRL(r.receita)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
