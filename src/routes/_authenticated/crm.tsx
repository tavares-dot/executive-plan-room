import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Section } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { opportunitiesQuery, leadsQuery, closersQuery } from "@/lib/queries";
import { fmtBRL, fmtDate } from "@/lib/format";

const STAGES = ["Prospec","Qualificado","Reuniao","Proposta","Negociacao","Fechado-Ganho","Fechado-Perdido"];

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({ meta: [{ title: "CRM · Legacy" }] }),
  component: CRMPage,
});

function CRMPage() {
  const qc = useQueryClient();
  const { data: opps = [] } = useQuery(opportunitiesQuery);
  const { data: leads = [] } = useQuery(leadsQuery);
  const { data: closers = [] } = useQuery(closersQuery);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ empresa: "", amount: 0, probability: 20, stage: "Prospec", days_in_stage: 0 });

  const save = useMutation({
    mutationFn: async (e: any) => {
      const payload = { ...e };
      if (payload.closer_id === "none") payload.closer_id = null;
      const { error } = await supabase.from("opportunities").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["opportunities"] }); qc.invalidateQueries({ queryKey: ["v_forecast_month"] }); setOpen(false); toast.success("Oportunidade salva."); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="Pipeline" title="CRM" subtitle="Oportunidades, leads e atividades. Pronto para integração com 3C Plus, RD, HubSpot, Pipedrive."
        actions={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Nova oportunidade</Button>} />

      <Section title={`Oportunidades (${opps.length})`}>
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr><th className="text-left p-3">Empresa</th><th className="text-left p-3">Closer</th><th className="text-left p-3">Stage</th><th className="text-right p-3">Valor</th><th className="text-right p-3">Prob.</th><th className="text-right p-3">Ponderado</th><th className="text-right p-3">Dias stage</th><th className="text-left p-3">Próx. passo</th></tr>
            </thead>
            <tbody>
              {opps.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">Sem oportunidades.</td></tr>}
              {opps.map((o: any) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{o.empresa}</td>
                  <td className="p-3">{closers.find((c: any) => c.id === o.closer_id)?.nome ?? "—"}</td>
                  <td className="p-3"><span className="text-xs px-2 py-1 rounded-full bg-muted">{o.stage}</span></td>
                  <td className="p-3 text-right num-tabular">{fmtBRL(o.amount)}</td>
                  <td className="p-3 text-right num-tabular">{o.probability}%</td>
                  <td className="p-3 text-right num-tabular font-semibold text-primary">{fmtBRL(Number(o.amount) * o.probability / 100)}</td>
                  <td className="p-3 text-right num-tabular">{o.days_in_stage}d</td>
                  <td className="p-3 text-xs text-muted-foreground">{o.next_step ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={`Leads (${leads.length})`}>
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr><th className="text-left p-3">Criado em</th><th className="text-left p-3">Status</th><th className="text-left p-3">Criticidade</th></tr>
            </thead>
            <tbody>
              {leads.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-muted-foreground">Sem leads — importação CRM em breve.</td></tr>}
              {leads.map((l: any) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="p-3">{fmtDate(l.created_at)}</td>
                  <td className="p-3">{l.status}</td>
                  <td className="p-3">{l.criticidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova oportunidade</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(draft); }} className="space-y-3">
            <div><Label className="text-xs">Empresa</Label><Input value={draft.empresa} onChange={(e) => setDraft({ ...draft, empresa: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Valor</Label><Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Probabilidade (%)</Label><Input type="number" min={0} max={100} value={draft.probability} onChange={(e) => setDraft({ ...draft, probability: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Stage</Label>
                <Select value={draft.stage} onValueChange={(v) => setDraft({ ...draft, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Closer</Label>
                <Select value={draft.closer_id ?? "none"} onValueChange={(v) => setDraft({ ...draft, closer_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{closers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Próximo passo</Label><Input value={draft.next_step ?? ""} onChange={(e) => setDraft({ ...draft, next_step: e.target.value })} /></div>
              <div><Label className="text-xs">Dias em stage</Label><Input type="number" value={draft.days_in_stage} onChange={(e) => setDraft({ ...draft, days_in_stage: Number(e.target.value) })} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
