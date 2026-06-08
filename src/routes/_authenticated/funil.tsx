import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Section } from "@/components/PageHeader";
import { funnelMonthQuery } from "@/lib/queries";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/funil")({
  head: () => ({ meta: [{ title: "Funil · Legacy" }] }),
  component: FunilPage,
});

function FunilPage() {
  const { data = [] } = useQuery(funnelMonthQuery);
  const fn: any = data[0];

  const stages = fn ? [
    { label: "Tentativas de contato", v: Number(fn.tentativas), conv: null },
    { label: "Conexões efetivas", v: Number(fn.conexoes), conv: Number(fn.taxa_conexao) },
    { label: "Reuniões agendadas", v: Number(fn.agendamentos), conv: Number(fn.taxa_agendamento) },
    { label: "Reuniões realizadas", v: Number(fn.reunioes), conv: Number(fn.show_rate) },
    { label: "Negociações", v: Number(fn.negociacoes), conv: null },
    { label: "Fechamentos", v: Number(fn.fechamentos), conv: Number(fn.win_rate) },
  ] : [];
  const max = Math.max(...stages.map((s) => s.v), 1);

  return (
    <>
      <PageHeader eyebrow="Conversão" title="Funil Comercial" subtitle="Atualizado em tempo real a partir dos lançamentos diários." />

      <Section title="Etapas do mês">
        {!fn ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Sem dados — registre lançamentos em /operacao.</div>
        ) : (
          <div className="space-y-3">
            {stages.map((s) => {
              const pct = (s.v / max) * 100;
              return (
                <div key={s.label} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{s.label}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="num-tabular font-semibold">{fmtNum(s.v)}</span>
                      {s.conv !== null && <span className="text-xs text-primary">{fmtPct(s.conv)}</span>}
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary rounded transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 flex items-center justify-between">
              <p className="text-sm font-medium">Receita gerada</p>
              <p className="text-xl font-semibold num-tabular text-primary">{fmtBRL(fn.receita)} <span className="text-xs text-muted-foreground font-normal">· ticket {fmtBRL(fn.ticket_medio)}</span></p>
            </div>
          </div>
        )}
      </Section>

      <Section title="Histórico mensal">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr><th className="text-left p-3">Mês</th><th className="text-right p-3">Tentativas</th><th className="text-right p-3">Conexões</th><th className="text-right p-3">Reuniões</th><th className="text-right p-3">Fechamentos</th><th className="text-right p-3">Win</th><th className="text-right p-3">Receita</th></tr>
            </thead>
            <tbody>
              {data.map((r: any) => (
                <tr key={r.mes} className="border-b border-border last:border-0">
                  <td className="p-3">{new Date(r.mes).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</td>
                  <td className="p-3 text-right num-tabular">{fmtNum(r.tentativas)}</td>
                  <td className="p-3 text-right num-tabular">{fmtNum(r.conexoes)} <span className="text-xs text-muted-foreground">({fmtPct(r.taxa_conexao)})</span></td>
                  <td className="p-3 text-right num-tabular">{fmtNum(r.reunioes)}</td>
                  <td className="p-3 text-right num-tabular">{fmtNum(r.fechamentos)}</td>
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
