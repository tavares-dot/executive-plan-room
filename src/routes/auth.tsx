import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo-legacy.svg";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar · Legacy Sales Ops" }] }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { nome } },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já está autenticado.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) {
      toast.error("Falha no login com Google.");
      setBusy(false);
    }
  }

  return (
    <html lang="pt-BR">
      <head><title>Entrar · Legacy Sales Ops</title></head>
      <body className="min-h-screen bg-background">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center mb-8">
              <img src={logo} alt="Legacy" className="h-10 mb-4" />
              <h1 className="text-2xl font-semibold">Sales Ops Hub 2.0</h1>
              <p className="text-sm text-muted-foreground mt-1">Central de Comando Comercial</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex gap-2 mb-6 bg-muted rounded-md p-1">
                <button onClick={() => setMode("signin")} className={`flex-1 text-sm py-1.5 rounded ${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Entrar</button>
                <button onClick={() => setMode("signup")} className={`flex-1 text-sm py-1.5 rounded ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Criar conta</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </div>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Aguarde..." : mode === "signup" ? "Criar conta" : "Entrar"}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button variant="outline" onClick={handleGoogle} disabled={busy} className="w-full">
                Continuar com Google
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              O primeiro usuário a se cadastrar vira <strong>Administrador</strong> automaticamente.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
