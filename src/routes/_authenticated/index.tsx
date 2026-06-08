import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Section } from "@/components/PageHeader";
import { forecastMonthQuery, funnelMonthQuery, sdrScoreboardQuery, closerScoreboardQuery } from "@/lib/queries";
import { fmtBRL, fmtNum, fmtPct, semaforoColors, semaforoFromPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Cockpit · Legacy Sales Ops" }] }),
  component: Cockpit,
});

function Cockpit() {
  const { data: forecast = [] } = useQuery(forecastMonthQuery);
  const { data: funnel = [] } = useQuery(funnelMonthQuery);
  const { data: sdrs = [] } = useQuery(sdrScoreboardQuery);
  const { data: closers = [] } = useQuery(closerScoreboardQuery);

  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;
  const f: any = forecast.find((x: any) => x.ano === ano && x.mes === mes) ?? forecast[0];
  const fn: any = funnel[0];

  const meta = Number(f?.meta_receita ?? 0);
  const realizado = Number(f?.receita_realizada ?? 0);
  const gap = Number(f?.gap ?? 0);
  const contratos = Number(f?.fechamentos_realizados ?? 0);
  const necessarios = Number(f?.contratos_necessarios ?? 0);
  const ticket = fn ? Number(fn.ticket_medio ?? 0) : 0;
  const pipelinePond = Number(f?.pipeline_ponderado ?? 0);

  const semaforo = semaforoFromPct(realizado, meta);

  return (
    <>
      <PageHeader eyebrow="Visão executiva" title="Cockpit Executivo" subtitle="Pulso de 30 segundos da operação comercial." />

      <Section title="KPIs do mês">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Meta" value={fmtBRL(meta)} />
          <Kpi label="Realizado" value={fmtBRL(realizado)} accent tone={semaforo} />
          <Kpi label="Gap" value={fmtBRL(gap)} tone={gap > 0 ? "atencao" : "excelente"} />
          <Kpi label="% Meta" value={fmtPct(meta ? (realizado / meta) * 100 : 0)} tone={semaforo} />
          <Kpi label="Contratos" value={`${fmtNum(contratos)} / ${fmtNum(necessarios)}`} />
          <Kpi label="Ticket Médio" value={fmtBRL(ticket)} />
          <Kpi label="Pipeline Ponderado" value={fmtBRL(pipelinePond)} />
          <Kpi label="Forecast Total" value={fmtBRL(realizado + pipelinePond)} accent />
        </div>
      </Section>

      <Section title="Funil consolidado">
        {!fn ? <Empty /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Stage label="Tentativas" v={fn.tentativas} />
            <Stage label="Conexões" v={fn.conexoes} sub={fmtPct(fn.taxa_conexao)} />
            <Stage label="Agendamentos" v={fn.agendamentos} sub={fmtPct(fn.taxa_agendamento)} />
            <Stage label="Reuniões" v={fn.reunioes} sub={fmtPct(fn.show_rate)} />
            <Stage label="Negociações" v={fn.negociacoes} />
            <Stage label="Fechamentos" v={fn.fechamentos} sub={fmtPct(fn.win_rate)} />
            <Stage label="Receita" v={fmtBRL(fn.receita)} highlight />
          </div>
        )}
      </Section>

      <Section title="Top SDRs">
        <ScoreList rows={sdrs.slice(0, 5).map((s: any) => ({ nome: s.nome, valor: fmtNum(s.reunioes) + " reuniões", sub: fmtPct(s.taxa_conexao) + " conexão" }))} />
      </Section>

      <Section title="Top Closers">
        <ScoreList rows={closers.slice(0, 5).map((c: any) => ({ nome: c.nome, valor: fmtBRL(c.receita), sub: fmtPct(c.win_rate) + " win" }))} />
      </Section>
    </>
  );
}

function Kpi({ label, value, accent, tone }: { label: string; value: string; accent?: boolean; tone?: "excelente"|"saudavel"|"atencao"|"critico" }) {
  const t = tone ? semaforoColors[tone] : null;
  return (
    <div className={`rounded-lg border bg-card p-5 ${accent ? "border-primary/40" : "border-border"}`}>
      <div className="flex items-center gap-2">
        {t && <span className={`h-2 w-2 rounded-full ${t.dot}`} />}
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-3 text-xl md:text-2xl font-semibold num-tabular ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function Stage({ label, v, sub, highlight }: { label: string; v: any; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold num-tabular">{typeof v === "number" ? fmtNum(v) : v}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function ScoreList({ rows }: { rows: { nome: string; valor: string; sub: string }[] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-5 num-tabular">{i + 1}.</span>
            <span className="text-sm font-medium">{r.nome}</span>
          </div>
          <div className="text-right">
            <p className="text-sm num-tabular font-semibold">{r.valor}</p>
            <p className="text-[11px] text-muted-foreground">{r.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
      Sem dados ainda — registre os primeiros lançamentos em <strong>/operacao</strong>.
    </div>
  );
}
