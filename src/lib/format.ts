export const fmtBRL = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtNum = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

export const fmtPct = (n: number | null | undefined, digits = 1) =>
  `${(n ?? 0).toFixed(digits)}%`;

export const fmtDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export type Semaforo = "excelente" | "saudavel" | "atencao" | "critico";

export const semaforoFromPct = (realizado: number, meta: number): Semaforo => {
  if (meta <= 0) return "atencao";
  const pct = (realizado / meta) * 100;
  if (pct >= 100) return "excelente";
  if (pct >= 80) return "saudavel";
  if (pct >= 60) return "atencao";
  return "critico";
};

export const semaforoColors: Record<Semaforo, { dot: string; bg: string; text: string; border: string }> = {
  excelente: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
  saudavel: { dot: "bg-sky-500", bg: "bg-sky-500/10", text: "text-sky-500", border: "border-sky-500/30" },
  atencao: { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
  critico: { dot: "bg-rose-500", bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/30" },
};
