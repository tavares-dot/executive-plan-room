import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, Section } from "@/components/PageHeader";
import { EditableNumber, EditableText } from "@/components/Editable";
import { usePlan, fmtNum, type SDRData } from "@/lib/plan-store";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend, ScatterChart, Scatter, ZAxis,
} from "recharts";

export const Route = createFileRoute("/sdrs")({
  head: () => ({ meta: [{ title: "Pré-vendas / SDRs · Legacy" }] }),
  component: SDRsPage,
});

type Semaforo = "excelente" | "saudavel" | "atencao" | "critico";

interface SDRMetrics {
  sdr: SDRData;
  tentativas: number;
  conexoes: number;
  agendamentos: number;
  reunioes: number;
  whatsapp: number;
  sla: number;
  parados: number;
  taxaConexao: number;
  taxaAgendamento: number;
  pctMetaReunioes: number;
  scoreOp: number;
  scoreQual: number;
  scoreGeral: number;
  semaforo: Semaforo;
}

function semaforoFrom(score: number): Semaforo {
  if (score >= 85) return "excelente";
  if (score >= 70) return "saudavel";
  if (score >= 50) return "atencao";
  return "critico";
}

const SEMAFORO_LABEL: Record<Semaforo, string> = {
  excelente: "Excelente",
  saudavel: "Saudável",
  atencao: "Atenção",
  critico: "Crítico",
};

const SEMAFORO_CLASSES: Record<Semaforo, string> = {
  excelente: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  saudavel: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  atencao: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  critico: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const SEMAFORO_DOT: Record<Semaforo, string> = {
  excelente: "bg-emerald-400",
  saudavel: "bg-sky-400",
  atencao: "bg-amber-400",
  critico: "bg-rose-500",
};

function computeMetrics(sdr: SDRData): SDRMetrics {
  const tentativas = sdr.tentativas3C ?? sdr.resultadoLigacoes ?? 0;
  const conexoes = sdr.resultadoConexoes ?? 0;
  const agendamentos = sdr.agendamentos ?? 0;
  const reunioes = sdr.reunioesGeradas ?? sdr.resultadoReunioes ?? 0;
  const whatsapp = sdr.whatsapp ?? 0;
  const sla = sdr.slaMedio ?? 0;
  const parados = sdr.leadsParados ?? 0;
  const taxaConexao = tentativas > 0 ? (conexoes / tentativas) * 100 : 0;
  const taxaAgendamento = conexoes > 0 ? (agendamentos / conexoes) * 100 : 0;
  const pctMetaReunioes = sdr.metaReunioes > 0 ? (reunioes / sdr.metaReunioes) * 100 : 0;

  // Score operacional (volume + geração + disciplina)
  const volume = Math.min(100, (tentativas / Math.max(1, sdr.metaLigacoes)) * 100);
  const gerConexao = Math.min(100, (conexoes / Math.max(1, sdr.metaConexoes)) * 100);
  const gerAgenda = Math.min(100, pctMetaReunioes);
  const taxaConScore = Math.min(100, (taxaConexao / 10) * 100); // 10% = 100
  const taxaAgScore = Math.min(100, (taxaAgendamento / 25) * 100); // 25% = 100
  const scoreOp = Math.round(
    volume * 0.20 + gerConexao * 0.20 + gerAgenda * 0.25 + taxaConScore * 0.20 + taxaAgScore * 0.15,
  );

  // Score qualitativo (SLA + leads parados + eficiência)
  const slaScore = sla <= 1 ? 100 : sla <= 2 ? 90 : sla <= 3 ? 75 : sla <= 5 ? 50 : 25;
  const paradosScore = parados <= 5 ? 100 : parados <= 15 ? 80 : parados <= 25 ? 60 : parados <= 40 ? 35 : 15;
  const eficiencia = taxaConScore * 0.5 + taxaAgScore * 0.5;
  const equilibrio = Math.max(0, 100 - Math.abs(volume - eficiencia));
  const scoreQual = Math.round(slaScore * 0.35 + paradosScore * 0.30 + eficiencia * 0.20 + equilibrio * 0.15);

  const scoreGeral = Math.round(scoreOp * 0.55 + scoreQual * 0.45);

  // Semáforo com regras de negócio adicionais
  let semaforo = semaforoFrom(scoreGeral);
  if (taxaConexao < 8) semaforo = "critico";
  else if (sla > 4 || parados > 30) semaforo = semaforo === "excelente" ? "atencao" : "critico";

  return { sdr, tentativas, conexoes, agendamentos, reunioes, whatsapp, sla, parados, taxaConexao, taxaAgendamento, pctMetaReunioes, scoreOp, scoreQual, scoreGeral, semaforo };
}

function SDRsPage() {
  const { state, setState } = usePlan();
  const [sprintFilter, setSprintFilter] = useState<"Todas" | "S1" | "S2" | "S3" | "S4">("Todas");
  const [sdrFilter, setSdrFilter] = useState<string>("Todos");
  const [criticidade, setCriticidade] = useState<"Todas" | Semaforo>("Todas");

  const updateSdr = (id: string, patch: Partial<SDRData>) =>
    setState((s) => ({ ...s, sdrs: s.sdrs.map((sd) => (sd.id === id ? { ...sd, ...patch } : sd)) }));

  const updateSem = (id: string, i: number, key: "reunioes" | "tentativas" | "conexoes" | "agendamentos", v: number) =>
    setState((s) => ({
      ...s,
      sdrs: s.sdrs.map((sd) => {
        if (sd.id !== id) return sd;
        const sem = [...sd.semanal];
        sem[i] = { ...sem[i], [key]: v };
        return { ...sd, semanal: sem };
      }),
    }));

  const metrics = useMemo(() => state.sdrs.map(computeMetrics), [state.sdrs]);

  const filtered = useMemo(() => metrics.filter((m) => {
    if (sdrFilter !== "Todos" && m.sdr.id !== sdrFilter) return false;
    if (criticidade !== "Todas" && m.semaforo !== criticidade) return false;
    return true;
  }), [metrics, sdrFilter, criticidade]);

  const totals = useMemo(() => {
    const t = filtered.reduce((a, m) => {
      const sem = sprintFilter === "Todas" ? m.sdr.semanal : m.sdr.semanal.filter((w) => w.semana === sprintFilter);
      const tent = sprintFilter === "Todas" ? m.tentativas : sem.reduce((x, w) => x + (w.tentativas ?? 0), 0);
      const con = sprintFilter === "Todas" ? m.conexoes : sem.reduce((x, w) => x + (w.conexoes ?? 0), 0);
      const ag = sprintFilter === "Todas" ? m.agendamentos : sem.reduce((x, w) => x + (w.agendamentos ?? 0), 0);
      return {
        tent: a.tent + tent,
        con: a.con + con,
        ag: a.ag + ag,
        sla: a.sla + m.sla,
        parados: a.parados + m.parados,
        scoreSum: a.scoreSum + m.scoreGeral,
        n: a.n + 1,
      };
    }, { tent: 0, con: 0, ag: 0, sla: 0, parados: 0, scoreSum: 0, n: 0 });
    const taxaCon = t.tent > 0 ? (t.con / t.tent) * 100 : 0;
    const taxaAg = t.con > 0 ? (t.ag / t.con) * 100 : 0;
    const slaAvg = t.n > 0 ? t.sla / t.n : 0;
    const scoreAvg = t.n > 0 ? t.scoreSum / t.n : 0;
    const semGeral = semaforoFrom(scoreAvg);
    return { ...t, taxaCon, taxaAg, slaAvg, scoreAvg, semGeral };
  }, [filtered, sprintFilter]);

  // Alertas/gargalos automáticos
  const alertas = useMemo(() => {
    const list: { sdr: string; nivel: Semaforo; msg: string }[] = [];
    metrics.forEach((m) => {
      if (m.taxaConexao < 8) list.push({ sdr: m.sdr.nome, nivel: "critico", msg: `Conexão em ${m.taxaConexao.toFixed(1)}% (alvo ≥ 10%)` });
      if (m.parados > 30) list.push({ sdr: m.sdr.nome, nivel: "critico", msg: `${m.parados} leads parados` });
      if (m.sla > 4) list.push({ sdr: m.sdr.nome, nivel: "atencao", msg: `SLA médio em ${m.sla.toFixed(1)}h` });
      if (m.tentativas > m.sdr.metaLigacoes * 0.6 && m.taxaConexao < 9) list.push({ sdr: m.sdr.nome, nivel: "atencao", msg: "Alto volume com baixa eficiência" });
      const tendencia = m.sdr.semanal.map((w) => w.reunioes);
      const queda = tendencia.length >= 2 && tendencia[tendencia.length - 1] < tendencia[0] * 0.6;
      if (queda) list.push({ sdr: m.sdr.nome, nivel: "atencao", msg: "Queda de rendimento ao longo das sprints" });
    });
    return list;
  }, [metrics]);

  const semanaChartData = useMemo(() => {
    const semanas = ["S1", "S2", "S3", "S4"];
    return semanas.map((semana) => {
      const row: any = { semana };
      filtered.forEach((m) => {
        const w = m.sdr.semanal.find((x) => x.semana === semana);
        row[m.sdr.nome] = w?.reunioes ?? 0;
      });
      return row;
    });
  }, [filtered]);

  const funilChartData = useMemo(() => filtered.map((m) => ({
    nome: m.sdr.nome,
    Tentativas: m.tentativas,
    Conexões: m.conexoes,
    Agendamentos: m.agendamentos,
  })), [filtered]);

  const taxaChartData = useMemo(() => filtered.map((m) => ({
    nome: m.sdr.nome,
    "Taxa Conexão": Number(m.taxaConexao.toFixed(1)),
    "Taxa Agendamento": Number(m.taxaAgendamento.toFixed(1)),
  })), [filtered]);

  const scatterData = useMemo(() => filtered.map((m) => ({
    nome: m.sdr.nome,
    volume: m.tentativas,
    qualidade: Number(((m.taxaConexao + m.taxaAgendamento) / 2).toFixed(1)),
    score: m.scoreGeral,
  })), [filtered]);

  const palette = ["#007FFF", "#0E6ECF", "#98BADC", "#EAECEE"];

  return (
    <>
      <PageHeader
        eyebrow="Pré-vendas"
        title="SDRs · Cockpit de Produtividade"
        subtitle="Visão executiva da produtividade, qualidade e disciplina operacional do time de pré-vendas."
        actions={
          <div className="flex items-center gap-2">
            <Select label="Sprint" value={sprintFilter} onChange={(v) => setSprintFilter(v as any)} options={["Todas", "S1", "S2", "S3", "S4"]} />
            <Select label="SDR" value={sdrFilter} onChange={setSdrFilter} options={["Todos", ...state.sdrs.map((s) => s.id)]} labelMap={Object.fromEntries(state.sdrs.map((s) => [s.id, s.nome]))} />
            <Select label="Criticidade" value={criticidade} onChange={(v) => setCriticidade(v as any)} options={["Todas", "excelente", "saudavel", "atencao", "critico"]} labelMap={SEMAFORO_LABEL as any} />
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
        <Kpi label="Tentativas" value={fmtNum(totals.tent)} sub="3C totais" />
        <Kpi label="Conexões" value={fmtNum(totals.con)} sub={`${totals.taxaCon.toFixed(1)}% de conexão`} accent={totals.taxaCon < 8 ? "rose" : totals.taxaCon < 10 ? "amber" : "emerald"} />
        <Kpi label="Agendamentos" value={fmtNum(totals.ag)} sub={`${totals.taxaAg.toFixed(1)}% de agendamento`} accent={totals.taxaAg < 20 ? "amber" : "emerald"} />
        <Kpi label="Taxa de Conexão" value={`${totals.taxaCon.toFixed(1)}%`} sub="meta ≥ 10%" accent={totals.taxaCon < 8 ? "rose" : totals.taxaCon < 10 ? "amber" : "emerald"} />
        <Kpi label="Taxa de Agendamento" value={`${totals.taxaAg.toFixed(1)}%`} sub="meta ≥ 25%" accent={totals.taxaAg < 20 ? "amber" : "emerald"} />
        <Kpi label="SLA Médio" value={`${totals.slaAvg.toFixed(1)}h`} sub="meta ≤ 2h" accent={totals.slaAvg > 4 ? "rose" : totals.slaAvg > 2 ? "amber" : "emerald"} />
        <Kpi label="Leads Parados" value={fmtNum(totals.parados)} sub="acumulado" accent={totals.parados > 50 ? "rose" : totals.parados > 25 ? "amber" : "emerald"} />
        <Kpi label="Status Geral" value={SEMAFORO_LABEL[totals.semGeral]} sub={`Score ${totals.scoreAvg.toFixed(0)}/100`} accent={
          totals.semGeral === "critico" ? "rose" :
          totals.semGeral === "atencao" ? "amber" :
          totals.semGeral === "excelente" ? "emerald" : "sky"
        } />
      </div>

      {/* Tabela Comparativa Premium */}
      <Section title="Comparativo por SDR" description="Leitura gerencial — metas, eficiência e qualidade lado a lado.">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th className="text-left">SDR</Th>
                  <Th>Tent. 3C</Th>
                  <Th>Conexões</Th>
                  <Th>WhatsApp</Th>
                  <Th>Agend.</Th>
                  <Th>Reun.</Th>
                  <Th>SLA</Th>
                  <Th>% Con.</Th>
                  <Th>% Agend.</Th>
                  <Th>Parados</Th>
                  <Th className="text-left">Motivo perda</Th>
                  <Th>Score Op.</Th>
                  <Th>Score Qual.</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.sdr.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-3 font-medium">
                      <EditableText value={m.sdr.nome} onChange={(v) => updateSdr(m.sdr.id, { nome: v })} />
                    </td>
                    <NumTd value={m.tentativas} onChange={(v) => updateSdr(m.sdr.id, { tentativas3C: v })} />
                    <NumTd value={m.conexoes} onChange={(v) => updateSdr(m.sdr.id, { resultadoConexoes: v })} />
                    <NumTd value={m.whatsapp} onChange={(v) => updateSdr(m.sdr.id, { whatsapp: v })} />
                    <NumTd value={m.agendamentos} onChange={(v) => updateSdr(m.sdr.id, { agendamentos: v })} />
                    <NumTd value={m.reunioes} onChange={(v) => updateSdr(m.sdr.id, { reunioesGeradas: v })} />
                    <td className="px-3 py-3 text-center">
                      <EditableNumber value={m.sla} onChange={(v) => updateSdr(m.sdr.id, { slaMedio: v })} format="num" className={m.sla > 4 ? "text-rose-400" : m.sla > 2 ? "text-amber-400" : ""} />
                      <span className="text-[10px] text-muted-foreground ml-0.5">h</span>
                    </td>
                    <td className={`px-3 py-3 text-center num-tabular ${m.taxaConexao < 8 ? "text-rose-400" : m.taxaConexao < 10 ? "text-amber-400" : "text-emerald-400"}`}>{m.taxaConexao.toFixed(1)}%</td>
                    <td className={`px-3 py-3 text-center num-tabular ${m.taxaAgendamento < 20 ? "text-amber-400" : "text-emerald-400"}`}>{m.taxaAgendamento.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-center">
                      <EditableNumber value={m.parados} onChange={(v) => updateSdr(m.sdr.id, { leadsParados: v })} format="num" className={m.parados > 30 ? "text-rose-400" : m.parados > 15 ? "text-amber-400" : ""} />
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px]">
                      <EditableText value={m.sdr.principalMotivoPerda ?? ""} onChange={(v) => updateSdr(m.sdr.id, { principalMotivoPerda: v })} placeholder="—" />
                    </td>
                    <td className="px-3 py-3 text-center"><ScorePill score={m.scoreOp} /></td>
                    <td className="px-3 py-3 text-center"><ScorePill score={m.scoreQual} /></td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border ${SEMAFORO_CLASSES[m.semaforo]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${SEMAFORO_DOT[m.semaforo]}`} />
                        {SEMAFORO_LABEL[m.semaforo]}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={14} className="px-3 py-8 text-center text-muted-foreground text-sm">Nenhum SDR no filtro atual.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Score Cards */}
      <Section title="Score por SDR" description="Combinação de volume, eficiência, velocidade e disciplina.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div key={m.sdr.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">{m.sdr.nome}</h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${SEMAFORO_CLASSES[m.semaforo]}`}>{SEMAFORO_LABEL[m.semaforo]}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <ScoreBlock label="Operacional" value={m.scoreOp} />
                <ScoreBlock label="Qualitativo" value={m.scoreQual} />
                <ScoreBlock label="Geral" value={m.scoreGeral} accent />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <Mini label="Volume" pct={Math.min(100, (m.tentativas / Math.max(1, m.sdr.metaLigacoes)) * 100)} />
                <Mini label="Eficiência" pct={Math.min(100, (m.taxaConexao / 10) * 100)} />
                <Mini label="SLA" pct={m.sla <= 1 ? 100 : m.sla <= 2 ? 90 : m.sla <= 3 ? 75 : m.sla <= 5 ? 50 : 25} />
                <Mini label="Meta Reuniões" pct={Math.min(100, m.pctMetaReunioes)} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Gráficos */}
      <Section title="Visualizações estratégicas" description="Tendências semanais, funil e relação volume × qualidade.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Chart title="Reuniões por Semana (S1–S4)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={semanaChartData}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {filtered.map((m, i) => (
                  <Line key={m.sdr.id} type="monotone" dataKey={m.sdr.nome} stroke={palette[i % palette.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Funil por SDR — Tentativas × Conexões × Agendamentos">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funilChartData}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Tentativas" fill={palette[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Conexões" fill={palette[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Agendamentos" fill={palette[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Taxa de Conversão por SDR">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taxaChartData}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Taxa Conexão" fill={palette[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Taxa Agendamento" fill={palette[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Chart>

          <Chart title="Volume × Qualidade (tamanho = score geral)">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="var(--color-border)" />
                <XAxis type="number" dataKey="volume" name="Tentativas" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="qualidade" name="Qualidade %" unit="%" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                <ZAxis type="number" dataKey="score" range={[80, 400]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={tooltipStyle}
                  formatter={(value: any, name: any, p: any) => name === "Tentativas" || name === "Qualidade %" ? value : value}
                  labelFormatter={() => ""}
                />
                <Scatter data={scatterData} fill={palette[0]} />
              </ScatterChart>
            </ResponsiveContainer>
          </Chart>
        </div>
      </Section>

      {/* Gargalos e Alertas */}
      <Section title="Gargalos & Alertas automáticos" description="Sinais derivados das regras operacionais Legacy.">
        {alertas.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Sem alertas. Operação dentro dos parâmetros.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {alertas.map((a, i) => (
              <div key={i} className={`rounded-lg border p-4 ${SEMAFORO_CLASSES[a.nivel]}`}>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                  <span className="font-semibold">{a.sdr}</span>
                  <span>{SEMAFORO_LABEL[a.nivel]}</span>
                </div>
                <p className="mt-2 text-sm text-foreground">{a.msg}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Leitura qualitativa */}
      <Section title="Leitura qualitativa de gestão" description="Observações, ICP, motivos de perda e aprendizados por SDR.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.sdrs.map((sdr) => (
            <div key={sdr.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-semibold">{sdr.nome}</h3>
                <span className="text-[11px] text-muted-foreground">Observação gerencial</span>
              </div>
              <div className="space-y-3 text-sm">
                <Field label="Principal motivo de perda">
                  <EditableText value={sdr.principalMotivoPerda ?? ""} onChange={(v) => updateSdr(sdr.id, { principalMotivoPerda: v })} placeholder="Ex: Sem fit / sem orçamento" />
                </Field>
                <Field label="Insights & sinais de ICP">
                  <EditableText value={sdr.insights ?? ""} onChange={(v) => updateSdr(sdr.id, { insights: v })} placeholder="Observações sobre qualidade de passagem, ICP e cadência" multiline />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Detalhe semanal editável (preserva edição inline) */}
      <Section title="Atividade semanal por SDR" description="Edite os volumes por sprint. Os totais e cards refletem automaticamente.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {state.sdrs.map((sdr) => (
            <div key={sdr.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-semibold">{sdr.nome}</h3>
                <span className="text-[11px] text-muted-foreground">Sprints S1–S4</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sdr.semanal}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="reunioes" name="Reuniões" fill={palette[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="text-left py-1 px-1 font-normal">Sprint</th>
                      <th className="text-center py-1 px-1 font-normal">Tent.</th>
                      <th className="text-center py-1 px-1 font-normal">Con.</th>
                      <th className="text-center py-1 px-1 font-normal">Agend.</th>
                      <th className="text-center py-1 px-1 font-normal">Reun.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sdr.semanal.map((w, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1.5 px-1 text-muted-foreground">{w.semana}</td>
                        <td className="text-center"><EditableNumber value={w.tentativas ?? 0} onChange={(v) => updateSem(sdr.id, i, "tentativas", v)} format="num" /></td>
                        <td className="text-center"><EditableNumber value={w.conexoes ?? 0} onChange={(v) => updateSem(sdr.id, i, "conexoes", v)} format="num" /></td>
                        <td className="text-center"><EditableNumber value={w.agendamentos ?? 0} onChange={(v) => updateSem(sdr.id, i, "agendamentos", v)} format="num" /></td>
                        <td className="text-center"><EditableNumber value={w.reunioes ?? 0} onChange={(v) => updateSem(sdr.id, i, "reunioes", v)} format="num" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button
            onClick={() => setState((s) => ({
              ...s,
              sdrs: [...s.sdrs, {
                id: "sdr" + (s.sdrs.length + 1),
                nome: "SDR " + (s.sdrs.length + 1),
                metaLigacoes: 4600, metaConexoes: 460, metaReunioes: 80,
                resultadoLigacoes: 0, resultadoConexoes: 0, resultadoReunioes: 0,
                tentativas3C: 0, whatsapp: 0, agendamentos: 0, reunioesGeradas: 0,
                slaMedio: 0, leadsParados: 0, principalMotivoPerda: "", insights: "",
                semanal: [
                  { semana: "S1", reunioes: 0, tentativas: 0, conexoes: 0, agendamentos: 0 },
                  { semana: "S2", reunioes: 0, tentativas: 0, conexoes: 0, agendamentos: 0 },
                  { semana: "S3", reunioes: 0, tentativas: 0, conexoes: 0, agendamentos: 0 },
                  { semana: "S4", reunioes: 0, tentativas: 0, conexoes: 0, agendamentos: 0 },
                ],
              }],
            }))}
            className="text-xs px-4 py-2 rounded-md border border-border hover:bg-accent transition-colors"
          >+ Adicionar SDR</button>
        </div>
      </Section>
    </>
  );
}

/* ---------- helpers visuais ---------- */

const tooltipStyle = { background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 };

function Kpi({ label, value, sub, accent = "sky" }: { label: string; value: string; sub?: string; accent?: "sky" | "emerald" | "amber" | "rose" }) {
  const accentMap: Record<string, string> = {
    sky: "text-sky-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-xl font-semibold num-tabular ${accentMap[accent]}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 font-medium text-center ${className}`}>{children}</th>;
}

function NumTd({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <td className="px-3 py-3 text-center">
      <EditableNumber value={value} onChange={onChange} format="num" />
    </td>
  );
}

function ScorePill({ score }: { score: number }) {
  const s = semaforoFrom(score);
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border num-tabular ${SEMAFORO_CLASSES[s]}`}>
      {score}
    </span>
  );
}

function ScoreBlock({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  const s = semaforoFrom(value);
  return (
    <div className={`rounded-lg p-3 border ${accent ? "border-primary/30 bg-primary/5" : "border-border"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`text-2xl font-semibold num-tabular ${accent ? "text-primary" : ""}`}>{value}</span>
        <span className="text-[10px] text-muted-foreground">/100</span>
      </div>
      <p className={`mt-1 text-[10px] ${SEMAFORO_CLASSES[s].split(" ").find((c) => c.startsWith("text-"))}`}>{SEMAFORO_LABEL[s]}</p>
    </div>
  );
}

function Mini({ label, pct }: { label: string; pct: number }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span className="num-tabular">{v.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Chart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">{title}</p>
      <div className="h-64">{children}</div>
    </div>
  );
}

function Select({ label, value, onChange, options, labelMap }: { label: string; value: string; onChange: (v: string) => void; options: string[]; labelMap?: Record<string, string> }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card border border-border rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>{labelMap?.[o] ?? (o.charAt(0).toUpperCase() + o.slice(1))}</option>
        ))}
      </select>
    </label>
  );
}
