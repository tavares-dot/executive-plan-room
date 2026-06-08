import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Section } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { meetingsQuery, closersQuery, originsQuery, productsQuery } from "@/lib/queries";
import { fmtBRL, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reunioes")({
  head: () => ({ meta: [{ title: "Reuniões · Legacy" }] }),
  component: ReunioesPage,
});

function ReunioesPage() {
  const qc = useQueryClient();
  const { data: meetings = [] } = useQuery(meetingsQuery);
  const { data: closers = [] } = useQuery(closersQuery);
  const { data: origins = [] } = useQuery(originsQuery);
  const { data: products = [] } = useQuery(productsQuery);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ data: new Date().toISOString().slice(0, 10), empresa: "", contato: "", valor_estimado: 0, receita_gerada: 0, realizada: false, proposta_enviada: false, negociacao_aberta: false, fechou: false });

  const save = useMutation({
    mutationFn: async (e: any) => {
      const payload = { ...e };
      ["origin_id","closer_id","product_id"].forEach(k => { if (payload[k] === "none") payload[k] = null; });
      const { data: u } = await supabase.auth.getUser();
      payload.created_by = u.user?.id;
      const { error } = await supabase.from("meetings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["meetings"] }); setOpen(false); toast.success("Reunião salva."); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("meetings").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });

  return (
    <>
      <PageHeader eyebrow="Closers" title="Reuniões dos Closers" subtitle="Agenda, status e desfecho de cada reunião comercial."
        actions={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Nova reunião</Button>} />
      <Section title="Lista">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr><th className="text-left p-3">Data</th><th className="text-left p-3">Empresa</th><th className="text-left p-3">Contato</th><th className="text-left p-3">Closer</th><th className="text-right p-3">Valor est.</th><th className="text-center p-3">Realizada</th><th className="text-center p-3">Proposta</th><th className="text-center p-3">Negoc.</th><th className="text-center p-3">Fechou</th><th className="text-right p-3">Receita</th><th></th></tr>
            </thead>
            <tbody>
              {meetings.length === 0 && <tr><td colSpan={11} className="p-10 text-center text-muted-foreground">Sem reuniões registradas.</td></tr>}
              {meetings.map((m: any) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="p-3">{fmtDate(m.data)}</td>
                  <td className="p-3 font-medium">{m.empresa}</td>
                  <td className="p-3">{m.contato ?? "—"}</td>
                  <td className="p-3">{closers.find((c: any) => c.id === m.closer_id)?.nome ?? "—"}</td>
                  <td className="p-3 text-right num-tabular">{fmtBRL(m.valor_estimado)}</td>
                  <td className="p-3 text-center">{m.realizada ? "✓" : "—"}</td>
                  <td className="p-3 text-center">{m.proposta_enviada ? "✓" : "—"}</td>
                  <td className="p-3 text-center">{m.negociacao_aberta ? "✓" : "—"}</td>
                  <td className="p-3 text-center">{m.fechou ? "🏆" : "—"}</td>
                  <td className="p-3 text-right num-tabular font-semibold">{fmtBRL(m.receita_gerada)}</td>
                  <td className="p-3 text-right"><Button size="icon" variant="ghost" onClick={() => del.mutate(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova reunião</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(draft); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <F label="Data"><Input type="date" value={draft.data} onChange={(e) => setDraft({ ...draft, data: e.target.value })} required /></F>
              <F label="Empresa"><Input value={draft.empresa} onChange={(e) => setDraft({ ...draft, empresa: e.target.value })} required /></F>
              <F label="Contato"><Input value={draft.contato} onChange={(e) => setDraft({ ...draft, contato: e.target.value })} /></F>
              <F label="Valor estimado"><Input type="number" value={draft.valor_estimado} onChange={(e) => setDraft({ ...draft, valor_estimado: Number(e.target.value) })} /></F>
              <F label="Closer">
                <Select value={draft.closer_id ?? "none"} onValueChange={(v) => setDraft({ ...draft, closer_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{closers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="Origem">
                <Select value={draft.origin_id ?? "none"} onValueChange={(v) => setDraft({ ...draft, origin_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{origins.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="Produto">
                <Select value={draft.product_id ?? "none"} onValueChange={(v) => setDraft({ ...draft, product_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="Receita gerada"><Input type="number" value={draft.receita_gerada} onChange={(e) => setDraft({ ...draft, receita_gerada: Number(e.target.value) })} /></F>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <SW label="Realizada" v={draft.realizada} on={(b) => setDraft({ ...draft, realizada: b })} />
              <SW label="Proposta enviada" v={draft.proposta_enviada} on={(b) => setDraft({ ...draft, proposta_enviada: b })} />
              <SW label="Negociação aberta" v={draft.negociacao_aberta} on={(b) => setDraft({ ...draft, negociacao_aberta: b })} />
              <SW label="Fechou" v={draft.fechou} on={(b) => setDraft({ ...draft, fechou: b })} />
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={save.isPending}>Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label className="text-xs mb-1.5 block">{label}</Label>{children}</div>; }
function SW({ label, v, on }: { label: string; v: boolean; on: (b: boolean) => void }) {
  return <div className="flex items-center justify-between rounded border border-border bg-background px-3 py-2"><Label className="text-xs">{label}</Label><Switch checked={v} onCheckedChange={on} /></div>;
}
