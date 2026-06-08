import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const must = async <T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> => {
  const { data, error } = await p;
  if (error) throw error;
  return (data ?? []) as T;
};

/* ---------------- Reference ---------------- */
export const sdrsQuery = queryOptions({
  queryKey: ["sdrs"],
  queryFn: () => must(supabase.from("sdrs").select("*").order("nome")),
});

export const closersQuery = queryOptions({
  queryKey: ["closers"],
  queryFn: () => must(supabase.from("closers").select("*").order("nome")),
});

export const sprintsQuery = queryOptions({
  queryKey: ["sprints"],
  queryFn: () => must(supabase.from("sprints").select("*").order("ordem")),
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: () => must(supabase.from("products").select("*").order("nome")),
});

export const originsQuery = queryOptions({
  queryKey: ["origins"],
  queryFn: () => must(supabase.from("origins").select("*").order("nome")),
});

export const thresholdsQuery = queryOptions({
  queryKey: ["thresholds"],
  queryFn: async () => {
    const { data, error } = await supabase.from("thresholds").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const monthlyTargetsQuery = queryOptions({
  queryKey: ["monthly_targets"],
  queryFn: () => must(supabase.from("monthly_targets").select("*").order("ano").order("mes")),
});

/* ---------------- Operacional ---------------- */
export const dailyEntriesQuery = (opts?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: ["daily_entries", opts],
    queryFn: async () => {
      let q = supabase.from("daily_entries").select("*").order("data", { ascending: false });
      if (opts?.from) q = q.gte("data", opts.from);
      if (opts?.to) q = q.lte("data", opts.to);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const meetingsQuery = queryOptions({
  queryKey: ["meetings"],
  queryFn: () => must(supabase.from("meetings").select("*").order("data", { ascending: false }).limit(500)),
});

export const opportunitiesQuery = queryOptions({
  queryKey: ["opportunities"],
  queryFn: () => must(supabase.from("opportunities").select("*").order("updated_at", { ascending: false })),
});

export const leadsQuery = queryOptions({
  queryKey: ["leads"],
  queryFn: () => must(supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(500)),
});

export const kanbanQuery = queryOptions({
  queryKey: ["kanban_cards"],
  queryFn: () => must(supabase.from("kanban_cards").select("*").order("ordem")),
});

/* ---------------- Views agregadas ---------------- */
export const funnelMonthQuery = queryOptions({
  queryKey: ["v_funnel_month"],
  queryFn: () => must(supabase.from("v_funnel_month").select("*").order("mes", { ascending: false })),
});

export const weeklyRollupQuery = queryOptions({
  queryKey: ["v_weekly_rollup"],
  queryFn: () => must(supabase.from("v_weekly_rollup").select("*").order("semana", { ascending: false })),
});

export const monthlyRollupQuery = queryOptions({
  queryKey: ["v_monthly_rollup"],
  queryFn: () => must(supabase.from("v_monthly_rollup").select("*").order("ano").order("mes")),
});

export const sdrScoreboardQuery = queryOptions({
  queryKey: ["v_sdr_scoreboard"],
  queryFn: () => must(supabase.from("v_sdr_scoreboard").select("*").order("receita" as any, { ascending: false })),
});

export const closerScoreboardQuery = queryOptions({
  queryKey: ["v_closer_scoreboard"],
  queryFn: () => must(supabase.from("v_closer_scoreboard").select("*").order("receita", { ascending: false })),
});

export const forecastMonthQuery = queryOptions({
  queryKey: ["v_forecast_month"],
  queryFn: () => must(supabase.from("v_forecast_month").select("*").order("ano").order("mes")),
});

/* ---------------- Helpers ---------------- */
export const ALL_OPERATIONAL_KEYS = [
  ["daily_entries"], ["meetings"], ["opportunities"], ["leads"],
  ["v_funnel_month"], ["v_weekly_rollup"], ["v_monthly_rollup"],
  ["v_sdr_scoreboard"], ["v_closer_scoreboard"], ["v_forecast_month"],
] as const;
