import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SprintStatus = "Não iniciado" | "Em andamento" | "Concluído";

export interface SprintData {
  objetivo: string;
  base: { label: string; value: number }[];
  metaReceita: number;
  metaSDR: number;
  metaClosers: number;
  checklist: { id: string; label: string; status: SprintStatus }[];
}

export interface SDRData {
  id: string;
  nome: string;
  metaLigacoes: number;
  metaConexoes: number;
  metaReunioes: number;
  resultadoLigacoes: number;
  resultadoConexoes: number;
  resultadoReunioes: number;
  semanal: { semana: string; reunioes: number }[];
}

export interface CloserData {
  id: string;
  nome: string;
  metaReceita: number;
  metaReunioes: number;
  metaFechamentos: number;
  resReceita: number;
  resReunioes: number;
  resFechamentos: number;
}

export interface RitualItem { id: string; nome: string; horario: string; feito: boolean; }

export interface PlanState {
  home: {
    metaReceita: number;
    receitaRealizada: number;
    forecast: number;
    reunioes: number;
    fechamentos: number;
    ticketMedio: number;
  };
  warRoom: {
    metaJunho: number;
    receita: number;
    forecast: number;
    funil: { etapa: string; valor: number }[];
  };
  sprints: { S1: SprintData; S2: SprintData; S3: SprintData; S4: SprintData };
  sdrs: SDRData[];
  closers: CloserData[];
  receitaMensal: { mes: string; meta: number; realizado: number; forecast: number }[];
  rituais: RitualItem[];
  indicadores: {
    marketing: { id: string; nome: string; meta: number; atual: number }[];
    sdr: { id: string; nome: string; meta: number; atual: number }[];
    closer: { id: string; nome: string; meta: number; atual: number }[];
    receita: { id: string; nome: string; meta: number; atual: number }[];
  };
  forecast: { commit: number; bestCase: number; pipeline: number; gap: number; receitaPrevista: number };
}

const mkSprint = (objetivo: string, base: { label: string; value: number }[]): SprintData => ({
  objetivo,
  base,
  metaReceita: 162500,
  metaSDR: 40,
  metaClosers: 8,
  checklist: [
    { id: "1", label: "Lista trabalhada e validada", status: "Não iniciado" },
    { id: "2", label: "Cadência de prospecção ativa", status: "Não iniciado" },
    { id: "3", label: "Reuniões agendadas e confirmadas", status: "Não iniciado" },
    { id: "4", label: "Propostas enviadas", status: "Não iniciado" },
    { id: "5", label: "Fechamentos da semana", status: "Não iniciado" },
  ],
});

const DEFAULT: PlanState = {
  home: {
    metaReceita: 650000,
    receitaRealizada: 0,
    forecast: 0,
    reunioes: 0,
    fechamentos: 0,
    ticketMedio: 18000,
  },
  warRoom: {
    metaJunho: 650000,
    receita: 0,
    forecast: 0,
    funil: [
      { etapa: "Tentativas", valor: 0 },
      { etapa: "Conexões", valor: 0 },
      { etapa: "Agendamentos", valor: 0 },
      { etapa: "Reuniões", valor: 0 },
      { etapa: "Propostas", valor: 0 },
      { etapa: "Fechamentos", valor: 0 },
    ],
  },
  sprints: {
    S1: mkSprint("Ativar base trabalhada de Maio + Abril e prospectar leads novos.", [
      { label: "Base Maio", value: 0 },
      { label: "Base Abril", value: 0 },
      { label: "Leads Novos", value: 0 },
    ]),
    S2: mkSprint("Trabalhar base de Março, reativar Abril e Maio, leads novos.", [
      { label: "Base Março", value: 0 },
      { label: "Base Maio", value: 0 },
      { label: "Base Abril", value: 0 },
      { label: "Leads Novos", value: 0 },
    ]),
    S3: mkSprint("Reativar base Fevereiro/Março e leads novos qualificados.", [
      { label: "Base Fevereiro", value: 0 },
      { label: "Base Março", value: 0 },
      { label: "Leads Novos", value: 0 },
    ]),
    S4: mkSprint("Pipeline, negociações finais e fechamentos do mês.", [
      { label: "Base Janeiro", value: 0 },
      { label: "Pipeline", value: 0 },
      { label: "Negociações", value: 0 },
      { label: "Fechamentos", value: 0 },
    ]),
  },
  sdrs: [
    {
      id: "sdr1", nome: "SDR 1",
      metaLigacoes: 400, metaConexoes: 120, metaReunioes: 24,
      resultadoLigacoes: 0, resultadoConexoes: 0, resultadoReunioes: 0,
      semanal: [
        { semana: "S1", reunioes: 0 }, { semana: "S2", reunioes: 0 },
        { semana: "S3", reunioes: 0 }, { semana: "S4", reunioes: 0 },
      ],
    },
    {
      id: "sdr2", nome: "SDR 2",
      metaLigacoes: 400, metaConexoes: 120, metaReunioes: 24,
      resultadoLigacoes: 0, resultadoConexoes: 0, resultadoReunioes: 0,
      semanal: [
        { semana: "S1", reunioes: 0 }, { semana: "S2", reunioes: 0 },
        { semana: "S3", reunioes: 0 }, { semana: "S4", reunioes: 0 },
      ],
    },
  ],
  closers: [
    { id: "c1", nome: "Closer 1", metaReceita: 325000, metaReunioes: 24, metaFechamentos: 10, resReceita: 0, resReunioes: 0, resFechamentos: 0 },
    { id: "c2", nome: "Closer 2", metaReceita: 325000, metaReunioes: 24, metaFechamentos: 10, resReceita: 0, resReunioes: 0, resFechamentos: 0 },
  ],
  receitaMensal: [
    { mes: "Jan", meta: 500000, realizado: 0, forecast: 0 },
    { mes: "Fev", meta: 520000, realizado: 0, forecast: 0 },
    { mes: "Mar", meta: 560000, realizado: 0, forecast: 0 },
    { mes: "Abr", meta: 590000, realizado: 0, forecast: 0 },
    { mes: "Mai", meta: 620000, realizado: 0, forecast: 0 },
    { mes: "Jun", meta: 650000, realizado: 0, forecast: 0 },
  ],
  rituais: [
    { id: "r1", nome: "Daily Comercial", horario: "09:00", feito: false },
    { id: "r2", nome: "Checkpoint SDR", horario: "11:30", feito: false },
    { id: "r3", nome: "Operacional", horario: "14:00", feito: false },
    { id: "r4", nome: "Fechamento do Dia", horario: "18:00", feito: false },
    { id: "r5", nome: "Sprint Planning", horario: "Segunda 08:30", feito: false },
    { id: "r6", nome: "Sprint Review", horario: "Sexta 17:00", feito: false },
    { id: "r7", nome: "Sprint Closing", horario: "Sexta 18:00", feito: false },
  ],
  indicadores: {
    marketing: [
      { id: "m1", nome: "Leads Gerados", meta: 600, atual: 0 },
      { id: "m2", nome: "MQLs", meta: 240, atual: 0 },
      { id: "m3", nome: "CPL (R$)", meta: 80, atual: 0 },
    ],
    sdr: [
      { id: "s1", nome: "Ligações", meta: 800, atual: 0 },
      { id: "s2", nome: "Conexões", meta: 240, atual: 0 },
      { id: "s3", nome: "Reuniões Agendadas", meta: 48, atual: 0 },
    ],
    closer: [
      { id: "cl1", nome: "Reuniões Realizadas", meta: 48, atual: 0 },
      { id: "cl2", nome: "Propostas Enviadas", meta: 30, atual: 0 },
      { id: "cl3", nome: "Taxa de Fechamento %", meta: 35, atual: 0 },
    ],
    receita: [
      { id: "r1", nome: "Receita Realizada (R$)", meta: 650000, atual: 0 },
      { id: "r2", nome: "Ticket Médio (R$)", meta: 18000, atual: 0 },
      { id: "r3", nome: "Ciclo de Vendas (dias)", meta: 28, atual: 0 },
    ],
  },
  forecast: { commit: 0, bestCase: 0, pipeline: 0, gap: 0, receitaPrevista: 0 },
};

const STORAGE_KEY = "legacy.plano.junho.2026";

type Ctx = {
  state: PlanState;
  setState: (updater: (s: PlanState) => PlanState) => void;
  reset: () => void;
};

const PlanCtx = createContext<Ctx | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, setRaw] = useState<PlanState>(DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRaw({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  return (
    <PlanCtx.Provider
      value={{
        state,
        setState: (u) => setRaw((s) => u(s)),
        reset: () => setRaw(DEFAULT),
      }}
    >
      {children}
    </PlanCtx.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanCtx);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}

export function fmtBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
}
export function fmtNum(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n || 0);
}
