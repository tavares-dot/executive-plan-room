import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { kanbanQuery } from "@/lib/queries";
import { toast } from "sonner";

const COLUNAS = [
  { id: "inbox", label: "Inbox" },
  { id: "prioridade", label: "Prioridade" },
  { id: "andamento", label: "Em andamento" },
  { id: "aguardando", label: "Aguardando" },
  { id: "bloqueado", label: "Bloqueado" },
  { id: "revisar", label: "Revisar" },
  { id: "validado", label: "Validado" },
  { id: "concluido", label: "Concluído" },
] as const;

export const Route = createFileRoute("/_authenticated/kanban")({
  head: () => ({ meta: [{ title: "Kanban · Legacy" }] }),
  component: KanbanPage,
});

function KanbanPage() {
  const qc = useQueryClient();
  const { data: cards = [] } = useQuery(kanbanQuery);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ titulo: "", descricao: "", coluna: "inbox", prioridade: "media", area: "" });

  const save = useMutation({
    mutationFn: async (e: any) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("kanban_cards").insert({ ...e, created_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kanban_cards"] }); setOpen(false); toast.success("Card criado."); },
    onError: (e: any) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, coluna }: { id: string; coluna: string }) => {
      const { error } = await supabase.from("kanban_cards").update({ coluna }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban_cards"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("kanban_cards").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban_cards"] }),
  });

  return (
    <>
      <PageHeader eyebrow="Execução" title="Kanban Operacional" subtitle="Quadro completo com 8 colunas, prioridade e checklist."
        actions={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo card</Button>} />

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {COLUNAS.map((col) => {
            const items = cards.filter((c: any) => c.coluna === col.id);
            return (
              <div key={col.id} className="w-72 shrink-0 rounded-lg bg-muted/30 border border-border p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-foreground/70">{col.label}</h3>
                  <span className="text-xs text-muted-foreground num-tabular">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((c: any) => (
                    <div key={c.id} className="rounded-md bg-card border border-border p-3 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{c.titulo}</p>
                        <Button size="icon" variant="ghost" className="h-6 w-6 -mt-1 -mr-1" onClick={() => del.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      {c.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.descricao}</p>}
                      <div className="flex items-center justify-between mt-3 gap-2">
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${c.prioridade === "critica" ? "bg-rose-500/15 text-rose-500" : c.prioridade === "alta" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"}`}>{c.prioridade}</span>
                        <Select value={c.coluna} onValueChange={(v) => move.mutate({ id: c.id, coluna: v })}>
                          <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>{COLUNAS.map((co) => <SelectItem key={co.id} value={co.id}>{co.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo card</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(draft); }} className="space-y-3">
            <div><Label className="text-xs">Título</Label><Input value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} required /></div>
            <div><Label className="text-xs">Descrição</Label><Textarea value={draft.descricao} onChange={(e) => setDraft({ ...draft, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Coluna</Label>
                <Select value={draft.coluna} onValueChange={(v) => setDraft({ ...draft, coluna: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COLUNAS.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Prioridade</Label>
                <Select value={draft.prioridade} onValueChange={(v) => setDraft({ ...draft, prioridade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Área</Label><Input value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} placeholder="Marketing, Vendas..." /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Criar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
