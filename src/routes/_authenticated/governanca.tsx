import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, Section } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sdrsQuery, closersQuery, monthlyTargetsQuery, thresholdsQuery } from "@/lib/queries";
import { fmtBRL, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/governanca")({
  head: () => ({ meta: [{ title: "Governança · Legacy" }] }),
  component: GovernancaPage,
});

function GovernancaPage() {
  const qc = useQueryClient();
  const { data: sdrs = [] } = useQuery(sdrsQuery);
  const { data: closers = [] } = useQuery(closersQuery);
  const { data: targets = [] } = useQuery(monthlyTargetsQuery);
  const { data: thresholds } = useQuery(thresholdsQuery);

  const [sdrOpen, setSdrOpen] = useState(false);
  const [closerOpen, setCloserOpen] = useState(false);
  const [sdrDraft, setSdrDraft] = useState<any>({ nome: "", meta_ligacoes: 0, meta_conexoes: 0, meta_reunioes: 0 });
  const [closerDraft, setCloserDraft] = useState<any>({ nome: "", meta_reunioes: 0, meta_fechamentos: 0, meta_receita: 0 });

  const saveSdr = useMutation({
    mutationFn: async (d: any) => { const { error } = await supabase.from("sdrs").insert(d); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sdrs"] }); setSdrOpen(false); toast.success("SDR criado."); },
  });
  const delSdr = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sdrs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sdrs"] }),
  });
  const saveCloser = useMutation({
    mutationFn: async (d: any) => { const { error } = await supabase.from("closers").insert(d); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["closers"] }); setCloserOpen(false); toast.success("Closer criado."); },
  });
  const delCloser = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("closers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["closers"] }),
  });

  return (
    <>
      <PageHeader eyebrow="Admin" title="Governança" subtitle="Time, metas mensais e parâmetros globais da operação." />

      <Section title="SDRs" action={<Button size="sm" onClick={() => setSdrOpen(true)} className="gap-1"><Plus className="h-3 w-3" />Novo</Button>}>
        <List rows={sdrs.map((s: any) => ({ id: s.id, nome: s.nome, info: `${fmtNum(s.meta_reunioes)} reun. · ${fmtNum(s.meta_conexoes)} conex.` }))} onDel={(id) => delSdr.mutate(id)} />
      </Section>

      <Section title="Closers" action={<Button size="sm" onClick={() => setCloserOpen(true)} className="gap-1"><Plus className="h-3 w-3" />Novo</Button>}>
        <List rows={closers.map((c: any) => ({ id: c.id, nome: c.nome, info: `${fmtNum(c.meta_fechamentos)} fech. · ${fmtBRL(c.meta_receita)}` }))} onDel={(id) => delCloser.mutate(id)} />
      </Section>

      <Section title="Metas mensais">
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border"><tr><th className="text-left p-3">Mês</th><th className="text-right p-3">Receita</th><th className="text-right p-3">Contratos</th><th className="text-right p-3">Ticket</th><th className="text-right p-3">Dias úteis</th></tr></thead>
            <tbody>{targets.map((t: any) => (<tr key={t.id} className="border-b border-border last:border-0"><td className="p-3">{t.mes}/{t.ano}</td><td className="p-3 text-right num-tabular">{fmtBRL(t.meta_receita)}</td><td className="p-3 text-right num-tabular">{t.contratos_necessarios}</td><td className="p-3 text-right num-tabular">{fmtBRL(t.ticket_alvo)}</td><td className="p-3 text-right num-tabular">{t.dias_uteis}</td></tr>))}</tbody>
          </table>
        </div>
      </Section>

      <Section title="Parâmetros globais (thresholds)">
        {thresholds && (
          <div className="rounded-lg border border-border bg-card p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <P label="Taxa conexão mín" v={`${thresholds.taxa_conexao_min}%`} />
            <P label="Conexão crítico" v={`${thresholds.taxa_conexao_critico}%`} />
            <P label="Show rate mín" v={`${thresholds.show_rate_min}%`} />
            <P label="Win rate mín" v={`${thresholds.win_rate_min}%`} />
            <P label="SLA máx (h)" v={String(thresholds.sla_max_horas)} />
            <P label="Leads parados máx" v={String(thresholds.leads_parados_max)} />
            <P label="Plano B mín (%)" v={`${thresholds.plan_b_min_pct}%`} />
            <P label="Ticket alvo" v={fmtBRL(thresholds.ticket_alvo)} />
          </div>
        )}
      </Section>

      <Dialog open={sdrOpen} onOpenChange={setSdrOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo SDR</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveSdr.mutate(sdrDraft); }} className="space-y-3">
            <Field label="Nome"><Input value={sdrDraft.nome} onChange={(e) => setSdrDraft({ ...sdrDraft, nome: e.target.value })} required /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Meta ligações"><Input type="number" value={sdrDraft.meta_ligacoes} onChange={(e) => setSdrDraft({ ...sdrDraft, meta_ligacoes: Number(e.target.value) })} /></Field>
              <Field label="Meta conexões"><Input type="number" value={sdrDraft.meta_conexoes} onChange={(e) => setSdrDraft({ ...sdrDraft, meta_conexoes: Number(e.target.value) })} /></Field>
              <Field label="Meta reuniões"><Input type="number" value={sdrDraft.meta_reunioes} onChange={(e) => setSdrDraft({ ...sdrDraft, meta_reunioes: Number(e.target.value) })} /></Field>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setSdrOpen(false)}>Cancelar</Button><Button type="submit">Criar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={closerOpen} onOpenChange={setCloserOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Closer</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveCloser.mutate(closerDraft); }} className="space-y-3">
            <Field label="Nome"><Input value={closerDraft.nome} onChange={(e) => setCloserDraft({ ...closerDraft, nome: e.target.value })} required /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Meta reuniões"><Input type="number" value={closerDraft.meta_reunioes} onChange={(e) => setCloserDraft({ ...closerDraft, meta_reunioes: Number(e.target.value) })} /></Field>
              <Field label="Meta fechamentos"><Input type="number" value={closerDraft.meta_fechamentos} onChange={(e) => setCloserDraft({ ...closerDraft, meta_fechamentos: Number(e.target.value) })} /></Field>
              <Field label="Meta receita"><Input type="number" value={closerDraft.meta_receita} onChange={(e) => setCloserDraft({ ...closerDraft, meta_receita: Number(e.target.value) })} /></Field>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCloserOpen(false)}>Cancelar</Button><Button type="submit">Criar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label className="text-xs mb-1.5 block">{label}</Label>{children}</div>; }
function P({ label, v }: { label: string; v: string }) { return <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-base font-semibold num-tabular">{v}</p></div>; }

function List({ rows, onDel }: { rows: { id: string; nome: string; info: string }[]; onDel: (id: string) => void }) {
  if (!rows.length) return <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum cadastrado.</div>;
  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between px-5 py-3">
          <div><p className="text-sm font-medium">{r.nome}</p><p className="text-xs text-muted-foreground">{r.info}</p></div>
          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Remover?")) onDel(r.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
    </div>
  );
}
