import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  sdrsQuery, closersQuery, sprintsQuery, dailyEntriesQuery, thresholdsQuery,
} from "@/lib/queries";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cockpit-diario")({
  head: () => ({ meta: [{ title: "Cockpit Diário SDR & Closers · Legacy" }] }),
  component: CockpitDiario,
});

type View = "diario" | "semanal" | "mensal";

const isoToday = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const startOfWeekISO = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const dow = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
};
const startOfMonthISO = (iso: string) => iso.slice(0, 7) + "-01";

const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

function CockpitDiario() {
  const { data: sdrs = [] } = useQuery(sdrsQuery);
  const { data: closers = [] } = useQuery(closersQuery);
  const { data: sprints = [] } = useQuery(sprintsQuery);
  const { data: thr } = useQuery(thresholdsQuery);

  const [view, setView] = useState<View>("diario");
  const [refDate, setRefDate] = useState<string>(isoToday());
  const [sdrFilter, setSdrFilter] = useState<string>("all");
  const [closerFilter, setCloserFilter] = useState<string>("all");
  const [sprintFilter, setSprintFilter] = useState<string>("all");

  const { from, to } = useMemo(() => {
    if (view === "diario") return { from: refDate, to: refDate };
    if (view === "semanal") {
      const s = startOfWeekISO(refDate);
      return { from: s, to: addDays(s, 6) };
    }
    const s = startOfMonthISO(refDate);
    return { from: s, to: addDays(s, 31).slice(0, 7) + "-01" };
  }, [view, refDate]);

  const { data: entries = [] } = useQuery(dailyEntriesQuery({ from, to }));

  const filtered = useMemo(
    () => entries.filter((e: any) =>
      (sdrFilter === "all" || e.sdr_id === sdrFilter) &&
      (closerFilter === "all" || e.closer_id === closerFilter) &&
      (sprintFilter === "all" || e.sprint_id === sprintFilter)
    ),
    [entries, sdrFilter, closerFilter, sprintFilter],
  );

  /* ---------- Bloco 1: SDR Performance ---------- */
  const sdrRows = useMemo(() => {
    const map = new Map<string, any>();
    for (const e of filtered as any[]) {
      if (!e.sdr_id) continue;
      const r = map.get(e.sdr_id) ?? { tentativas: 0, conexoes: 0, cpc: 0, agendamentos: 0, no_show: 0 };
      r.tentativas += e.tentativas ?? 0;
      r.conexoes += e.conexoes ?? 0;
      r.cpc += e.cpc ?? 0;
      r.agendamentos += e.agendamentos ?? 0;
      r.no_show += e.no_show ?? 0;
      map.set(e.sdr_id, r);
    }
    return Array.from(map.entries()).map(([id, r]) => {
      const nome = sdrs.find((s: any) => s.id === id)?.nome ?? "—";
      return { id, nome, ...r,
        taxa_conexao: pct(r.conexoes, r.tentativas),
        taxa_cpc: pct(r.cpc, r.conexoes),
        taxa_agendamento: pct(r.agendamentos, r.cpc),
      };
    }).sort((a, b) => b.tentativas - a.tentativas);
  }, [filtered, sdrs]);

  /* ---------- Bloco 2: Closer Performance ---------- */
  const closerRows = useMemo(() => {
    const map = new Map<string, any>();
    for (const e of filtered as any[]) {
      if (!e.closer_id) continue;
      const r = map.get(e.closer_id) ?? { agendamentos: 0, reunioes: 0, negociacoes: 0, vendas: 0, perdidos: 0, no_show: 0 };
      r.agendamentos += e.agendamentos ?? 0;
      r.reunioes += e.reunioes_realizadas ?? 0;
      r.negociacoes += e.negociacoes ?? 0;
      r.vendas += e.fechamentos ?? 0;
      r.no_show += e.no_show ?? 0;
      map.set(e.closer_id, r);
    }
    return Array.from(map.entries()).map(([id, r]) => {
      const nome = closers.find((c: any) => c.id === id)?.nome ?? "—";
      r.perdidos = Math.max(0, r.negociacoes - r.vendas);
      return { id, nome, ...r,
        show_rate: pct(r.reunioes, r.agendamentos),
        win_rate: pct(r.vendas, r.negociacoes),
      };
    }).sort((a, b) => b.vendas - a.vendas);
  }, [filtered, closers]);

  /* ---------- Bloco 3: Consolidado ---------- */
  const total = useMemo(() => filtered.reduce((a: any, e: any) => ({
    tentativas: a.tentativas + (e.tentativas ?? 0),
    conexoes: a.conexoes + (e.conexoes ?? 0),
    cpc: a.cpc + (e.cpc ?? 0),
    agendamentos: a.agendamentos + (e.agendamentos ?? 0),
    reunioes: a.reunioes + (e.reunioes_realizadas ?? 0),
    negociacoes: a.negociacoes + (e.negociacoes ?? 0),
    vendas: a.vendas + (e.fechamentos ?? 0),
    receita: a.receita + Number(e.receita ?? 0),
  }), { tentativas: 0, conexoes: 0, cpc: 0, agendamentos: 0, reunioes: 0, negociacoes: 0, vendas: 0, receita: 0 }),
  [filtered]);

  /* ---------- Bloco 4: Conversões ---------- */
  const conv = [
    { etapa: "Tentativa → Conexão", v: pct(total.conexoes, total.tentativas) },
    { etapa: "Conexão → CPC", v: pct(total.cpc, total.conexoes) },
    { etapa: "CPC → Agendamento", v: pct(total.agendamentos, total.cpc) },
    { etapa: "Agendamento → Reunião", v: pct(total.reunioes, total.agendamentos) },
    { etapa: "Reunião → Negociação", v: pct(total.negociacoes, total.reunioes) },
    { etapa: "Negociação → Venda", v: pct(total.vendas, total.negociacoes) },
  ];

  /* ---------- Bloco 5: Alertas ---------- */
  const taxaConexaoGeral = pct(total.conexoes, total.tentativas);
  const showRateGeral = pct(total.reunioes, total.agendamentos);
  const winRateGeral = pct(total.vendas, total.negociacoes);
  const conMin = Number(thr?.taxa_conexao_min ?? 10);
  const conCrit = Number(thr?.taxa_conexao_critico ?? 8);
  const showMin = Number(thr?.show_rate_min ?? 70);
  const winMin = Number(thr?.win_rate_min ?? 30);

  const alerts = [
    statusOf("Taxa de Conexão", taxaConexaoGeral, conMin, conCrit, true),
    statusOf("Show Rate", showRateGeral, showMin, showMin - 5, true),
    statusOf("Win Rate", winRateGeral, winMin, winMin - 5, true),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Cockpit operacional"
        title="Cockpit Diário SDR & Closers"
        subtitle="Visão consolidada da operação comercial. Alimentado por Operação Diária; tudo calculado automaticamente."
      />

      {/* ---------- Filtros ---------- */}
      <Section title="Filtros & Visão">
        <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap gap-3 items-end">
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="diario">Diário</TabsTrigger>
              <TabsTrigger value="semanal">Semanal</TabsTrigger>
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
            </TabsList>
          </Tabs>
          <FilterField label={view === "mensal" ? "Mês" : "Data ref."}>
            <Input
              type={view === "mensal" ? "month" : "date"}
              value={view === "mensal" ? refDate.slice(0, 7) : refDate}
              onChange={(e) => setRefDate(view === "mensal" ? e.target.value + "-01" : e.target.value)}
            />
          </FilterField>
          <FilterField label="SDR">
            <Select value={sdrFilter} onValueChange={setSdrFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {sdrs.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Closer">
            <Select value={closerFilter} onValueChange={setCloserFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {closers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Sprint">
            <Select value={sprintFilter} onValueChange={setSprintFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {sprints.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <div className="ml-auto text-xs text-muted-foreground">
            Período: <span className="font-medium text-foreground">{from}</span> → <span className="font-medium text-foreground">{to}</span>
          </div>
        </div>
      </Section>

      {/* ---------- Bloco 3: Consolidado ---------- */}
      <Section title="Bloco 03 — Operação Consolidada">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Tentativas" v={fmtNum(total.tentativas)} />
          <KPI label="Conexões" v={fmtNum(total.conexoes)} />
          <KPI label="CPC" v={fmtNum(total.cpc)} />
          <KPI label="Agendamentos" v={fmtNum(total.agendamentos)} />
          <KPI label="Reuniões realizadas" v={fmtNum(total.reunioes)} />
          <KPI label="Negociações abertas" v={fmtNum(total.negociacoes)} />
          <KPI label="Vendas" v={fmtNum(total.vendas)} />
          <KPI label="Receita gerada" v={fmtBRL(total.receita)} accent />
        </div>
      </Section>

      {/* ---------- Bloco 5: Alertas ---------- */}
      <Section title="Bloco 05 — Alertas Automáticos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.map((a) => <AlertCard key={a.label} {...a} />)}
        </div>
      </Section>

      {/* ---------- Bloco 1: SDR ---------- */}
      <Section title="Bloco 01 — SDR Performance">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SDR</TableHead>
                <TableHead className="text-right">Tentativas</TableHead>
                <TableHead className="text-right">Conexões</TableHead>
                <TableHead className="text-right">Tx Conexão</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">Tx CPC</TableHead>
                <TableHead className="text-right">Agend.</TableHead>
                <TableHead className="text-right">Tx Agend.</TableHead>
                <TableHead className="text-right">No-Show</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdrRows.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Sem dados no período.</TableCell></TableRow>}
              {sdrRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.tentativas)}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.conexoes)}</TableCell>
                  <TableCell className="text-right num-tabular"><Pill ok={r.taxa_conexao >= conMin} warn={r.taxa_conexao >= conCrit && r.taxa_conexao < conMin}>{fmtPct(r.taxa_conexao)}</Pill></TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.cpc)}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtPct(r.taxa_cpc)}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.agendamentos)}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtPct(r.taxa_agendamento)}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.no_show)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* ---------- Bloco 2: Closer ---------- */}
      <Section title="Bloco 02 — Closer Performance">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Closer</TableHead>
                <TableHead className="text-right">Reun. Agend.</TableHead>
                <TableHead className="text-right">Reun. Realiz.</TableHead>
                <TableHead className="text-right">Show Rate</TableHead>
                <TableHead className="text-right">Negociações</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
                <TableHead className="text-right">Perdidos</TableHead>
                <TableHead className="text-right">No-Show</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closerRows.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">Sem dados no período.</TableCell></TableRow>}
              {closerRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.agendamentos)}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.reunioes)}</TableCell>
                  <TableCell className="text-right num-tabular"><Pill ok={r.show_rate >= showMin} warn={r.show_rate >= showMin - 5 && r.show_rate < showMin}>{fmtPct(r.show_rate)}</Pill></TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.negociacoes)}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.vendas)}</TableCell>
                  <TableCell className="text-right num-tabular"><Pill ok={r.win_rate >= winMin} warn={r.win_rate >= winMin - 5 && r.win_rate < winMin}>{fmtPct(r.win_rate)}</Pill></TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.perdidos)}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtNum(r.no_show)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* ---------- Bloco 4: Conversões ---------- */}
      <Section title="Bloco 04 — Conversões do Funil">
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {conv.map((c) => (
            <div key={c.etapa} className="flex items-center gap-4 px-4 py-3">
              <span className="text-sm font-medium w-56 shrink-0">{c.etapa}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, c.v)}%` }} />
              </div>
              <span className="num-tabular text-sm w-16 text-right font-semibold">{fmtPct(c.v)}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ---------- helpers ---------- */
function statusOf(label: string, value: number, min: number, crit: number, hasData = true) {
  let status: "verde" | "amarelo" | "vermelho" = "verde";
  if (!hasData) status = "amarelo";
  else if (value < crit) status = "vermelho";
  else if (value < min) status = "amarelo";
  return { label, value, min, status };
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-[10px] uppercase tracking-wider mb-1 block">{label}</Label>{children}</div>;
}

function KPI({ label, v, accent }: { label: string; v: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${accent ? "border-primary/40" : "border-border"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-lg font-semibold num-tabular ${accent ? "text-primary" : ""}`}>{v}</p>
    </div>
  );
}

function Pill({ children, ok, warn }: { children: React.ReactNode; ok?: boolean; warn?: boolean }) {
  const cls = ok
    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
    : warn
    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
    : "bg-rose-500/10 text-rose-500 border-rose-500/30";
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded ${cls}`}>{children}</span>;
}

function AlertCard({ label, value, min, status }: { label: string; value: number; min: number; status: "verde" | "amarelo" | "vermelho" }) {
  const cfg = {
    verde: { dot: "bg-emerald-500", border: "border-emerald-500/30", text: "text-emerald-500", msg: "Acima da meta" },
    amarelo: { dot: "bg-amber-500", border: "border-amber-500/30", text: "text-amber-500", msg: "Atenção" },
    vermelho: { dot: "bg-rose-500", border: "border-rose-500/30", text: "text-rose-500", msg: "Crítico" },
  }[status];
  return (
    <div className={`rounded-lg border bg-card p-4 ${cfg.border}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Badge variant="outline" className={`ml-auto ${cfg.text} border-current`}>{cfg.msg}</Badge>
      </div>
      <p className="mt-3 text-2xl font-semibold num-tabular">{fmtPct(value)}</p>
      <p className="text-[11px] text-muted-foreground mt-1">Meta mínima {fmtPct(min)}</p>
    </div>
  );
}
