import { LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export function TopBar() {
  const { user } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex items-center justify-between px-6 md:px-10 py-3 border-b border-border bg-background">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Sales Ops Hub · Legacy Executoria
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <span className="hidden sm:inline-flex items-center gap-2 text-xs text-muted-foreground">
            <UserIcon className="h-3.5 w-3.5" />
            {user.email}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border border-border hover:bg-accent text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </div>
  );
}
