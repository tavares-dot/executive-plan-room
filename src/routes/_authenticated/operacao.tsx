import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Section } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sdrsQuery, closersQuery, sprintsQuery, dailyEntriesQuery, ALL_OPERATIONAL_KEYS } from "@/lib/queries";
import { fmtBRL, fmtDate, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/operacao")({
  head: () => ({ meta: [{ title: "Operação Diária · Legacy" }] }),
  component: OperacaoPage,
});

type Entry = {
  id: string; data: string; sdr_id: string | null; closer_id: string | null; sprint_id: string | null;
  tentativas: number; conexoes: number; agendamentos: number; reunioes_realizadas: number; no_show: number;
  negociacoes: number; propostas: number; fechamentos: number; receita: number;
  sla_medio_horas: number | null; leads_parados: number | null;
  observacoes: string | null; gargalos: string | null; aprendizados: string | null;
};

const blank = (): Partial<Entry> => ({
  data: new Date().toISOString().slice(0, 10),
  tentativas: 0, conexoes: 0, agendamentos: 0, reunioes_realizadas: 0, no_show: 0,
  negociacoes: 0, propostas: 0, fechamentos: 0, receita: 0,
});

function OperacaoPage() {
  const qc = useQueryClient();
  const { data: entries = [] } = useQuery(dailyEntriesQuery());
  const { data: sdrs = [] } = useQuery(sdrsQuery);
  const { data: closers = [] } = useQuery(closersQuery);
  const { data: sprints = [] } = useQuery(sprintsQuery);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Entry>>(blank());

  const invalidate = () => ALL_OPERATIONAL_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: k as any }));

  const saveMut = useMutation({
    mutationFn: async (e: Partial<Entry>) => {
      const payload: any = { ...e };
      if (e.id) {
        const { error } = await supabase.from("daily_entries").update(payload).eq("id", e.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        payload.created_by = u.user?.id;
        const { error } = await supabase.from("daily_entries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { invalidate(); setOpen(false); setDraft(blank()); toast.success("Lançamento salvo."); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar."),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Removido."); },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => { setDraft(blank()); setOpen(true); };
  const openEdit = (row: Entry) => { setDraft(row); setOpen(true); };

  const total = entries.reduce(
    (acc: any, r: any) => ({
      tent: acc.tent + (r.tentativas ?? 0),
      con: acc.con + (r.conexoes ?? 0),
      ag: acc.ag + (r.agendamentos ?? 0),
      re: acc.re + (r.reunioes_realizadas ?? 0),
      fe: acc.fe + (r.fechamentos ?? 0),
      rec: acc.rec + Number(r.receita ?? 0),
    }), { tent: 0, con: 0, ag: 0, re: 0, fe: 0, rec: 0 });

  const sdrName = (id: string | null) => sdrs.find((s: any) => s.id === id)?.nome ?? "—";
  const closerName = (id: string | null) => closers.find((c: any) => c.id === id)?.nome ?? "—";

  return (
    <>
      <PageHeader
        eyebrow="Entrada única"
        title="Operação Diária"
        subtitle="Tudo nasce aqui. Toda métrica, gráfico e forecast da plataforma consome este lançamento."
        actions={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Novo lançamento</Button>}
      />

      <Section title="Totais consolidados">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Tot label="Tentativas" v={fmtNum(total.tent)} />
          <Tot label="Conexões" v={fmtNum(total.con)} />
          <Tot label="Agendamentos" v={fmtNum(total.ag)} />
          <Tot label="Reuniões" v={fmtNum(total.re)} />
          <Tot label="Fechamentos" v={fmtNum(total.fe)} />
          <Tot label="Receita" v={fmtBRL(total.rec)} accent />
        </div>
      </Section>

      <Section title="Lançamentos">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>SDR</TableHead>
                <TableHead>Closer</TableHead>
                <TableHead className="text-right">Tent.</TableHead>
                <TableHead className="text-right">Conex.</TableHead>
                <TableHead className="text-right">Agend.</TableHead>
                <TableHead className="text-right">Reun.</TableHead>
                <TableHead className="text-right">No-Show</TableHead>
                <TableHead className="text-right">Negoc.</TableHead>
                <TableHead className="text-right">Fech.</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow><TableCell colSpan={12} className="text-center py-10 text-sm text-muted-foreground">Nenhum lançamento ainda. Clique em "Novo lançamento".</TableCell></TableRow>
              )}
              {entries.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{fmtDate(r.data)}</TableCell>
                  <TableCell>{sdrName(r.sdr_id)}</TableCell>
                  <TableCell>{closerName(r.closer_id)}</TableCell>
                  <TableCell className="text-right num-tabular">{r.tentativas}</TableCell>
                  <TableCell className="text-right num-tabular">{r.conexoes}</TableCell>
                  <TableCell className="text-right num-tabular">{r.agendamentos}</TableCell>
                  <TableCell className="text-right num-tabular">{r.reunioes_realizadas}</TableCell>
                  <TableCell className="text-right num-tabular">{r.no_show}</TableCell>
                  <TableCell className="text-right num-tabular">{r.negociacoes}</TableCell>
                  <TableCell className="text-right num-tabular">{r.fechamentos}</TableCell>
                  <TableCell className="text-right num-tabular">{fmtBRL(r.receita)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Remover?")) delMut.mutate(r.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(draft); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Field label="Data"><Input type="date" value={draft.data ?? ""} onChange={(e) => setDraft({ ...draft, data: e.target.value })} required /></Field>
              <Field label="SDR">
                <Select value={draft.sdr_id ?? "none"} onValueChange={(v) => setDraft({ ...draft, sdr_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {sdrs.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Closer">
                <Select value={draft.closer_id ?? "none"} onValueChange={(v) => setDraft({ ...draft, closer_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {closers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sprint">
                <Select value={draft.sprint_id ?? "none"} onValueChange={(v) => setDraft({ ...draft, sprint_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {sprints.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <NumField label="Tentativas" v={draft.tentativas} on={(n) => setDraft({ ...draft, tentativas: n })} />
              <NumField label="Conexões" v={draft.conexoes} on={(n) => setDraft({ ...draft, conexoes: n })} />
              <NumField label="Agendamentos" v={draft.agendamentos} on={(n) => setDraft({ ...draft, agendamentos: n })} />
              <NumField label="Reuniões" v={draft.reunioes_realizadas} on={(n) => setDraft({ ...draft, reunioes_realizadas: n })} />
              <NumField label="No-Show" v={draft.no_show} on={(n) => setDraft({ ...draft, no_show: n })} />
              <NumField label="Negociações" v={draft.negociacoes} on={(n) => setDraft({ ...draft, negociacoes: n })} />
              <NumField label="Propostas" v={draft.propostas} on={(n) => setDraft({ ...draft, propostas: n })} />
              <NumField label="Fechamentos" v={draft.fechamentos} on={(n) => setDraft({ ...draft, fechamentos: n })} />
              <NumField label="Receita (R$)" v={draft.receita} on={(n) => setDraft({ ...draft, receita: n })} />
              <NumField label="SLA médio (h)" v={draft.sla_medio_horas ?? 0} on={(n) => setDraft({ ...draft, sla_medio_horas: n })} step="0.1" />
            </div>

            <Field label="Observações"><Textarea value={draft.observacoes ?? ""} onChange={(e) => setDraft({ ...draft, observacoes: e.target.value })} /></Field>
            <Field label="Gargalos"><Textarea value={draft.gargalos ?? ""} onChange={(e) => setDraft({ ...draft, gargalos: e.target.value })} /></Field>
            <Field label="Aprendizados"><Textarea value={draft.aprendizados ?? ""} onChange={(e) => setDraft({ ...draft, aprendizados: e.target.value })} /></Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMut.isPending}>{saveMut.isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs mb-1.5 block">{label}</Label>{children}</div>;
}
function NumField({ label, v, on, step }: { label: string; v: any; on: (n: number) => void; step?: string }) {
  return <Field label={label}><Input type="number" step={step ?? "1"} value={v ?? 0} onChange={(e) => on(Number(e.target.value))} /></Field>;
}
function Tot({ label, v, accent }: { label: string; v: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${accent ? "border-primary/40" : "border-border"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-lg font-semibold num-tabular ${accent ? "text-primary" : ""}`}>{v}</p>
    </div>
  );
}
