import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SprintStatus = "Não iniciado" | "Em andamento" | "Concluído";

export interface SprintData {
  objetivo: string;
  base: { label: string; value: number }[];
  metaReceita: number;
  metaSDR: number;
  metaClosers: number;
  status: SprintStatus;
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
  semanal: { semana: string; reunioes: number; tentativas?: number; conexoes?: number; agendamentos?: number }[];
  // Operacional ampliado
  tentativas3C?: number;
  whatsapp?: number;
  agendamentos?: number;
  reunioesGeradas?: number;
  slaMedio?: number; // em horas
  leadsParados?: number;
  principalMotivoPerda?: string;
  insights?: string;
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

export type ActionStatus = "Não iniciado" | "Em andamento" | "Concluído";
export interface ActionItem { id: string; titulo: string; responsavel: string; prazo: string; status: ActionStatus; }

export type RiskLevel = "green" | "yellow" | "orange" | "red";
export interface RiskCard { id: string; nivel: RiskLevel; titulo: string; observacao: string; }

export interface CalendarioCell { base: string; sprint: "S1" | "S2" | "S3" | "S4"; valor: number; }

export interface PlanState {
  home: {
    metaReceita: number;
    receitaRealizada: number;
    forecast: number;
    comprometido: number;
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
  calendario: CalendarioCell[];
  proximasAcoes: ActionItem[];
  riscos: RiskCard[];
  sdrEntries: SDREntry[];
  closerEntries: CloserEntry[];
  fechamentos: FechamentoDia[];
  sprintTargets: Record<SprintKey, SprintTarget>;
  checkpoint13: { meta: number; realizado: number; contratosEsperados: number; contratosRealizados: number };
}

export type SprintKey = "S1" | "S2" | "S3" | "S4";

export interface SDREntry {
  id: string; date: string; sdrId: string; sprint: SprintKey;
  tentativas: number; conexoes: number; agendamentos: number;
  reunioes: number; noShow: number; obs: string;
}
export interface CloserEntry {
  id: string; date: string; closerId: string; sprint: SprintKey;
  reunioes: number; negociacoes: number; vendas: number;
  valorVendido: number; perdidos: number; noShow: number; obs: string;
}
export interface FechamentoDia {
  date: string; resultado: string; gargalos: string; aprendizado: string;
  ajustes: string; responsavel: string; prazo: string;
}
export interface SprintTarget {
  receita: number; contratos: number; reunioes: number; negociacoes: number; agendamentos: number;
}

const mkSprint = (objetivo: string, base: { label: string; value: number }[]): SprintData => ({
  objetivo,
  base,
  metaReceita: 162500,
  metaSDR: 40,
  metaClosers: 8,
  status: "Não iniciado",
  checklist: [
    { id: "1", label: "Lista trabalhada e validada", status: "Não iniciado" },
    { id: "2", label: "Cadência de prospecção ativa", status: "Não iniciado" },
    { id: "3", label: "Reuniões agendadas e confirmadas", status: "Não iniciado" },
    { id: "4", label: "Propostas enviadas", status: "Não iniciado" },
    { id: "5", label: "Fechamentos da semana", status: "Não iniciado" },
  ],
});

const BASES = ["Maio", "Abril", "Março", "Fevereiro", "Janeiro", "Leads Novos"] as const;
const SPRINTS = ["S1", "S2", "S3", "S4"] as const;

const DEFAULT: PlanState = {
  home: {
    metaReceita: 650000,
    receitaRealizada: 0,
    forecast: 0,
    comprometido: 0,
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
      metaLigacoes: 4600, metaConexoes: 460, metaReunioes: 80,
      resultadoLigacoes: 3120, resultadoConexoes: 312, resultadoReunioes: 58,
      tentativas3C: 3120, whatsapp: 880, agendamentos: 96, reunioesGeradas: 58,
      slaMedio: 2.4, leadsParados: 18,
      principalMotivoPerda: "Sem fit / orçamento",
      insights: "Volume forte, conexão saudável. Atenção ao SLA acima de 2h.",
      semanal: [
        { semana: "S1", reunioes: 18, tentativas: 820, conexoes: 88, agendamentos: 26 },
        { semana: "S2", reunioes: 16, tentativas: 790, conexoes: 80, agendamentos: 24 },
        { semana: "S3", reunioes: 14, tentativas: 770, conexoes: 74, agendamentos: 24 },
        { semana: "S4", reunioes: 10, tentativas: 740, conexoes: 70, agendamentos: 22 },
      ],
    },
    {
      id: "sdr2", nome: "SDR 2",
      metaLigacoes: 4600, metaConexoes: 460, metaReunioes: 80,
      resultadoLigacoes: 2740, resultadoConexoes: 196, resultadoReunioes: 38,
      tentativas3C: 2740, whatsapp: 540, agendamentos: 52, reunioesGeradas: 38,
      slaMedio: 4.8, leadsParados: 41,
      principalMotivoPerda: "Lead frio / sem retorno",
      insights: "Conexão abaixo de 8%. Excesso de leads parados. Revisar cadência.",
      semanal: [
        { semana: "S1", reunioes: 12, tentativas: 720, conexoes: 58, agendamentos: 16 },
        { semana: "S2", reunioes: 10, tentativas: 700, conexoes: 50, agendamentos: 14 },
        { semana: "S3", reunioes: 9, tentativas: 680, conexoes: 46, agendamentos: 12 },
        { semana: "S4", reunioes: 7, tentativas: 640, conexoes: 42, agendamentos: 10 },
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
  calendario: BASES.flatMap((base) =>
    SPRINTS.map((sprint) => ({ base, sprint, valor: 0 })),
  ),
  proximasAcoes: [
    { id: "a1", titulo: "Validar lista de Maio com SDRs", responsavel: "Head Comercial", prazo: "S1", status: "Não iniciado" },
    { id: "a2", titulo: "Revisar propostas em aberto > 7 dias", responsavel: "Closers", prazo: "S1", status: "Não iniciado" },
    { id: "a3", titulo: "Reativar base Março com cadência nova", responsavel: "SDRs", prazo: "S2", status: "Não iniciado" },
    { id: "a4", titulo: "Checkpoint de forecast com diretoria", responsavel: "Head Comercial", prazo: "S3", status: "Não iniciado" },
  ],
  riscos: [
    { id: "rk1", nivel: "green", titulo: "Geração de Leads", observacao: "Volume dentro do esperado." },
    { id: "rk2", nivel: "yellow", titulo: "Taxa de Conexão", observacao: "Monitorar cadência de SDRs." },
    { id: "rk3", nivel: "orange", titulo: "Comparecimento em Reuniões", observacao: "No-show acima da média histórica." },
    { id: "rk4", nivel: "red", titulo: "Taxa de Fechamento", observacao: "Pipeline maduro abaixo do necessário para meta." },
  ],
  sdrEntries: [],
  closerEntries: [],
  fechamentos: [],
  sprintTargets: {
    S1: { receita: 140000, contratos: 7, reunioes: 35, negociacoes: 24, agendamentos: 50 },
    S2: { receita: 160000, contratos: 8, reunioes: 40, negociacoes: 28, agendamentos: 58 },
    S3: { receita: 170000, contratos: 9, reunioes: 42, negociacoes: 30, agendamentos: 60 },
    S4: { receita: 180000, contratos: 9, reunioes: 44, negociacoes: 31, agendamentos: 62 },
  },
  checkpoint13: { meta: 280000, realizado: 0, contratosEsperados: 14, contratosRealizados: 0 },

};

const STORAGE_KEY = "legacy.plano.junho.2026.v2";

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
      if (raw) {
        const parsed = JSON.parse(raw);
        setRaw({
          ...DEFAULT,
          ...parsed,
          home: { ...DEFAULT.home, ...(parsed.home || {}) },
          sprints: {
            S1: { ...DEFAULT.sprints.S1, ...(parsed.sprints?.S1 || {}) },
            S2: { ...DEFAULT.sprints.S2, ...(parsed.sprints?.S2 || {}) },
            S3: { ...DEFAULT.sprints.S3, ...(parsed.sprints?.S3 || {}) },
            S4: { ...DEFAULT.sprints.S4, ...(parsed.sprints?.S4 || {}) },
          },
          calendario: parsed.calendario?.length ? parsed.calendario : DEFAULT.calendario,
          proximasAcoes: parsed.proximasAcoes ?? DEFAULT.proximasAcoes,
          riscos: parsed.riscos ?? DEFAULT.riscos,
          sdrs: (parsed.sdrs ?? DEFAULT.sdrs).map((sd: any, i: number) => ({
            ...(DEFAULT.sdrs[i] ?? DEFAULT.sdrs[0]),
            ...sd,
            tentativas3C: sd.tentativas3C ?? sd.resultadoLigacoes ?? DEFAULT.sdrs[i]?.tentativas3C ?? 0,
            whatsapp: sd.whatsapp ?? DEFAULT.sdrs[i]?.whatsapp ?? 0,
            agendamentos: sd.agendamentos ?? DEFAULT.sdrs[i]?.agendamentos ?? 0,
            reunioesGeradas: sd.reunioesGeradas ?? sd.resultadoReunioes ?? DEFAULT.sdrs[i]?.reunioesGeradas ?? 0,
            slaMedio: sd.slaMedio ?? DEFAULT.sdrs[i]?.slaMedio ?? 0,
            leadsParados: sd.leadsParados ?? DEFAULT.sdrs[i]?.leadsParados ?? 0,
            principalMotivoPerda: sd.principalMotivoPerda ?? DEFAULT.sdrs[i]?.principalMotivoPerda ?? "",
            insights: sd.insights ?? DEFAULT.sdrs[i]?.insights ?? "",
          })),
          sdrEntries: parsed.sdrEntries ?? DEFAULT.sdrEntries,
          closerEntries: parsed.closerEntries ?? DEFAULT.closerEntries,
          fechamentos: parsed.fechamentos ?? DEFAULT.fechamentos,
          sprintTargets: { ...DEFAULT.sprintTargets, ...(parsed.sprintTargets || {}) },
          checkpoint13: { ...DEFAULT.checkpoint13, ...(parsed.checkpoint13 || {}) },
        });
      }
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
