import type {
  PlanState, SDRData, CloserData, PipelineOpp, Semaforo, Thresholds, AlertItem,
} from "./plan-store";

/* ============ Derivações puras (cálculos) ============ */

export const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);
export const pct = (a: number, b: number) => safeDiv(a, b) * 100;

export const calcGap = (meta: number, realizado: number) => Math.max(0, meta - realizado);

export const calcTaxaConexao = (conexoes: number, tentativas: number) => pct(conexoes, tentativas);
export const calcTaxaAgendamento = (agendamentos: number, conexoes: number) => pct(agendamentos, conexoes);
export const calcShowRate = (reunioes: number, agendamentos: number) => pct(reunioes, agendamentos);
export const calcWinRate = (fechamentos: number, propostasOuNeg: number) => pct(fechamentos, propostasOuNeg);
export const calcTicketMedio = (receita: number, fechamentos: number) => safeDiv(receita, fechamentos);

export const calcContratosRestantes = (necessarios: number, realizados: number) =>
  Math.max(0, necessarios - realizados);

export const calcPipelinePonderado = (opps: PipelineOpp[] = []) =>
  opps
    .filter((o) => o.stage !== "Fechado-Ganho" && o.stage !== "Fechado-Perdido")
    .reduce((acc, o) => acc + o.amount * (o.probability / 100), 0);

export type AgingBucket = "0-3d" | "4-7d" | "8-14d" | "15-30d" | "30+d";
export const calcAgingBucket = (daysInStage: number): AgingBucket => {
  if (daysInStage <= 3) return "0-3d";
  if (daysInStage <= 7) return "4-7d";
  if (daysInStage <= 14) return "8-14d";
  if (daysInStage <= 30) return "15-30d";
  return "30+d";
};

/* ============ Semáforos ============ */

export function semaforoFromScore(score: number): Semaforo {
  if (score >= 85) return "excelente";
  if (score >= 70) return "saudavel";
  if (score >= 50) return "atencao";
  return "critico";
}

export function semaforoTaxaConexao(taxa: number, t: Thresholds): Semaforo {
  if (taxa < t.taxaConexaoCritico) return "critico";
  if (taxa < t.taxaConexaoMin) return "atencao";
  if (taxa >= t.taxaConexaoMin * 1.2) return "excelente";
  return "saudavel";
}

export function semaforoShowRate(sr: number, t: Thresholds): Semaforo {
  if (sr < t.showRateMin * 0.75) return "critico";
  if (sr < t.showRateMin) return "atencao";
  if (sr >= t.showRateMin + 15) return "excelente";
  return "saudavel";
}

export function semaforoSLA(slaH: number, t: Thresholds): Semaforo {
  if (slaH > t.slaMaxHoras * 2) return "critico";
  if (slaH > t.slaMaxHoras) return "atencao";
  if (slaH <= t.slaMaxHoras / 2) return "excelente";
  return "saudavel";
}

/* ============ Selectors ============ */

export interface SdrDerived {
  sdr: SDRData;
  tentativas: number; conexoes: number; agendamentos: number; reunioes: number;
  whatsapp: number; sla: number; parados: number;
  taxaConexao: number; taxaAgendamento: number;
  scoreOperacional: number; scoreQualitativo: number; scoreGeral: number;
  semaforo: Semaforo;
}

export function selectSdrMetrics(state: PlanState, sdrId: string): SdrDerived | null {
  const sdr = state.sdrs.find((s) => s.id === sdrId);
  if (!sdr) return null;
  return computeSdrDerived(sdr, state.thresholds);
}

export function computeSdrDerived(sdr: SDRData, th?: Thresholds): SdrDerived {
  const t = th ?? DEFAULT_THRESHOLDS;
  const tentativas = sdr.tentativas3C ?? sdr.resultadoLigacoes ?? 0;
  const conexoes = sdr.resultadoConexoes ?? 0;
  const agendamentos = sdr.agendamentos ?? 0;
  const reunioes = sdr.reunioesGeradas ?? sdr.resultadoReunioes ?? 0;
  const whatsapp = sdr.whatsapp ?? 0;
  const sla = sdr.slaMedio ?? 0;
  const parados = sdr.leadsParados ?? 0;
  const taxaConexao = calcTaxaConexao(conexoes, tentativas);
  const taxaAgendamento = calcTaxaAgendamento(agendamentos, conexoes);

  const volume = Math.min(100, pct(tentativas, sdr.metaLigacoes || 1));
  const gerConexao = Math.min(100, pct(conexoes, sdr.metaConexoes || 1));
  const gerReun = Math.min(100, pct(reunioes, sdr.metaReunioes || 1));
  const tcScore = Math.min(100, (taxaConexao / t.taxaConexaoMin) * 100);
  const taScore = Math.min(100, (taxaAgendamento / t.taxaAgendamentoMin) * 100);

  const scoreOperacional = Math.round(volume * 0.20 + gerConexao * 0.20 + gerReun * 0.25 + tcScore * 0.20 + taScore * 0.15);

  const slaScore = sla <= t.slaMaxHoras / 2 ? 100 : sla <= t.slaMaxHoras ? 85 : sla <= t.slaMaxHoras * 2 ? 60 : 25;
  const paradosScore = parados <= 5 ? 100 : parados <= t.leadsParadosMax ? 75 : parados <= t.leadsParadosMax * 2 ? 45 : 15;
  const eficiencia = tcScore * 0.5 + taScore * 0.5;
  const equilibrio = Math.max(0, 100 - Math.abs(volume - eficiencia));
  const scoreQualitativo = Math.round(slaScore * 0.35 + paradosScore * 0.30 + eficiencia * 0.20 + equilibrio * 0.15);

  const scoreGeral = Math.round(scoreOperacional * 0.55 + scoreQualitativo * 0.45);

  let semaforo = semaforoFromScore(scoreGeral);
  if (taxaConexao < t.taxaConexaoCritico) semaforo = "critico";
  else if (sla > t.slaMaxHoras * 2 || parados > t.leadsParadosMax * 1.5) {
    semaforo = semaforo === "excelente" ? "atencao" : "critico";
  }

  return { sdr, tentativas, conexoes, agendamentos, reunioes, whatsapp, sla, parados, taxaConexao, taxaAgendamento, scoreOperacional, scoreQualitativo, scoreGeral, semaforo };
}

export interface CloserDerived {
  closer: CloserData;
  reunioes: number; propostas: number; negociacoes: number; fechamentos: number;
  noShow: number; receita: number;
  showRate: number; winRate: number; ticketMedio: number;
  scoreOperacional: number; scoreQualitativo: number; scoreGeral: number;
  semaforo: Semaforo; forecastIndividual: number;
}

export function computeCloserDerived(c: CloserData, th?: Thresholds): CloserDerived {
  const t = th ?? DEFAULT_THRESHOLDS;
  const reunioes = c.resReunioes ?? 0;
  const propostas = c.propostas ?? 0;
  const negociacoes = c.negociacoes ?? 0;
  const fechamentos = c.resFechamentos ?? 0;
  const noShow = c.noShow ?? 0;
  const receita = c.resReceita ?? 0;

  const agendados = reunioes + noShow;
  const showRate = agendados > 0 ? pct(reunioes, agendados) : 0;
  const winRate = calcWinRate(fechamentos, negociacoes || propostas);
  const ticketMedio = calcTicketMedio(receita, fechamentos);

  const volReun = Math.min(100, pct(reunioes, c.metaReunioes || 1));
  const volFech = Math.min(100, pct(fechamentos, c.metaFechamentos || 1));
  const volRec = Math.min(100, pct(receita, c.metaReceita || 1));
  const wrScore = Math.min(100, (winRate / 30) * 100);
  const srScore = Math.min(100, (showRate / t.showRateMin) * 100);

  const scoreOperacional = Math.round(volReun * 0.20 + volFech * 0.30 + volRec * 0.30 + wrScore * 0.20);
  const scoreQualitativo = Math.round(srScore * 0.45 + wrScore * 0.35 + Math.min(100, pct(ticketMedio, t.ticketAlvo || 1)) * 0.20);
  const scoreGeral = Math.round(scoreOperacional * 0.6 + scoreQualitativo * 0.4);

  let semaforo = semaforoFromScore(scoreGeral);
  if (showRate < t.showRateMin * 0.75) semaforo = "critico";

  const forecastIndividual = c.forecastIndividual ?? (negociacoes * ticketMedio * (winRate / 100));

  return { closer: c, reunioes, propostas, negociacoes, fechamentos, noShow, receita, showRate, winRate, ticketMedio, scoreOperacional, scoreQualitativo, scoreGeral, semaforo, forecastIndividual };
}

export function selectCloserMetrics(state: PlanState, closerId: string): CloserDerived | null {
  const c = state.closers.find((x) => x.id === closerId);
  return c ? computeCloserDerived(c, state.thresholds) : null;
}

/* ============ Forecast & KPIs operacionais ============ */

export interface OperacaoKpis {
  tentativas: number; conexoes: number; agendamentos: number; reunioes: number;
  fechamentos: number; receita: number;
  taxaConexao: number; taxaAgendamento: number; showRate: number;
  winRate: number; ticketMedio: number;
  gap: number; contratosRestantes: number; pipelinePonderado: number;
  ritmoDiarioNecessario: number; diasRestantes: number;
  semaforoGeral: Semaforo;
}

export function selectKpisOperacao(state: PlanState): OperacaoKpis {
  const t = state.thresholds ?? DEFAULT_THRESHOLDS;
  const sdrs = state.sdrs.map((s) => computeSdrDerived(s, t));
  const closers = state.closers.map((c) => computeCloserDerived(c, t));
  const tentativas = sdrs.reduce((a, s) => a + s.tentativas, 0);
  const conexoes = sdrs.reduce((a, s) => a + s.conexoes, 0);
  const agendamentos = sdrs.reduce((a, s) => a + s.agendamentos, 0);
  const reunioes = closers.reduce((a, c) => a + c.reunioes, 0);
  const fechamentos = closers.reduce((a, c) => a + c.fechamentos, 0);
  const receita = closers.reduce((a, c) => a + c.receita, 0);
  const noShow = closers.reduce((a, c) => a + c.noShow, 0);
  const negociacoes = closers.reduce((a, c) => a + c.negociacoes, 0);

  const taxaConexao = calcTaxaConexao(conexoes, tentativas);
  const taxaAgendamento = calcTaxaAgendamento(agendamentos, conexoes);
  const showRate = pct(reunioes, reunioes + noShow);
  const winRate = calcWinRate(fechamentos, negociacoes);
  const ticketMedio = calcTicketMedio(receita, fechamentos);

  const gap = calcGap(t.metaMes, receita);
  const contratosRestantes = calcContratosRestantes(t.contratosNecessarios, fechamentos);
  const pipelinePonderado = calcPipelinePonderado(state.pipeline ?? []);
  const diasRestantes = state.forecastAdv?.diasRestantes ?? t.diasUteis;
  const ritmoDiarioNecessario = diasRestantes > 0 ? gap / diasRestantes : gap;

  const scoreAvg = sdrs.length + closers.length > 0
    ? ([...sdrs.map((s) => s.scoreGeral), ...closers.map((c) => c.scoreGeral)]
        .reduce((a, b) => a + b, 0)) / (sdrs.length + closers.length)
    : 0;
  const semaforoGeral = semaforoFromScore(scoreAvg);

  return { tentativas, conexoes, agendamentos, reunioes, fechamentos, receita, taxaConexao, taxaAgendamento, showRate, winRate, ticketMedio, gap, contratosRestantes, pipelinePonderado, ritmoDiarioNecessario, diasRestantes, semaforoGeral };
}

export function selectForecast(state: PlanState) {
  const k = selectKpisOperacao(state);
  const t = state.thresholds ?? DEFAULT_THRESHOLDS;
  const commit = state.forecastAdv?.commit ?? state.forecast.commit ?? 0;
  const bestCase = state.forecastAdv?.bestCase ?? state.forecast.bestCase ?? 0;
  const worstCase = state.forecastAdv?.worstCase ?? Math.max(0, commit * 0.7);
  const projecaoFechamento = k.receita + k.pipelinePonderado;
  return {
    commit, bestCase, worstCase,
    pipelinePonderado: k.pipelinePonderado,
    gap: k.gap,
    contratosRestantes: k.contratosRestantes,
    ritmoDiarioNecessario: k.ritmoDiarioNecessario,
    projecaoFechamento,
    diasRestantes: k.diasRestantes,
    metaMes: t.metaMes,
    pctMeta: pct(k.receita, t.metaMes),
  };
}

/* ============ Alertas automáticos ============ */

export function selectAlertasAuto(state: PlanState): AlertItem[] {
  const t = state.thresholds ?? DEFAULT_THRESHOLDS;
  const now = new Date().toISOString();
  const alerts: AlertItem[] = [];

  state.sdrs.forEach((sdr) => {
    const d = computeSdrDerived(sdr, t);
    if (d.taxaConexao < t.taxaConexaoCritico)
      alerts.push({ id: `auto-${sdr.id}-conn`, nivel: "critico", area: "sdr", mensagem: `${sdr.nome}: conexão ${d.taxaConexao.toFixed(1)}% (< ${t.taxaConexaoCritico}%)`, criadoEm: now, refId: sdr.id });
    if (d.sla > t.slaMaxHoras * 2)
      alerts.push({ id: `auto-${sdr.id}-sla`, nivel: "atencao", area: "sdr", mensagem: `${sdr.nome}: SLA ${d.sla.toFixed(1)}h`, criadoEm: now, refId: sdr.id });
    if (d.parados > t.leadsParadosMax * 1.5)
      alerts.push({ id: `auto-${sdr.id}-parados`, nivel: "critico", area: "sdr", mensagem: `${sdr.nome}: ${d.parados} leads parados`, criadoEm: now, refId: sdr.id });
  });

  state.closers.forEach((c) => {
    const d = computeCloserDerived(c, t);
    if (d.showRate && d.showRate < t.showRateMin)
      alerts.push({ id: `auto-${c.id}-show`, nivel: d.showRate < t.showRateMin * 0.75 ? "critico" : "atencao", area: "closer", mensagem: `${c.nome}: show rate ${d.showRate.toFixed(1)}% (< ${t.showRateMin}%)`, criadoEm: now, refId: c.id });
  });

  const k = selectKpisOperacao(state);
  if (k.receita < t.metaMes * (t.planBMinPctMes / 100) && k.diasRestantes <= 10) {
    alerts.push({ id: "auto-planb", nivel: "critico", area: "forecast", mensagem: `Receita abaixo de ${t.planBMinPctMes}% da meta — ativar Plano B`, criadoEm: now });
  }

  (state.pipeline ?? []).forEach((o) => {
    if (calcAgingBucket(o.daysInStage) === "30+d")
      alerts.push({ id: `auto-opp-${o.id}-aging`, nivel: "atencao", area: "pipeline", mensagem: `${o.empresa}: ${o.daysInStage}d em ${o.stage}`, criadoEm: now, refId: o.id });
  });

  return alerts;
}

/* ============ Defaults locais (fallback se thresholds ausente) ============ */

export const DEFAULT_THRESHOLDS: Thresholds = {
  taxaConexaoMin: 10, taxaConexaoCritico: 8,
  taxaAgendamentoMin: 25, showRateMin: 60,
  slaMaxHoras: 2, leadsParadosMax: 25,
  rejeicaoMqlMax: 35, planBMinPctMes: 50,
  ticketAlvo: 20000, metaMes: 650000,
  diasUteis: 23, contratosNecessarios: 33,
};

/* ============ Helpers de mutação para pipeline ============ */

export const recomputeWeighted = (o: PipelineOpp): PipelineOpp => ({
  ...o,
  weightedAmount: o.amount * (o.probability / 100),
});
