import { useMeetingMode } from "@/lib/meeting-mode";
import { Presentation, X } from "lucide-react";

export function TopBar() {
  const { meeting, toggle } = useMeetingMode();
  return (
    <div className="flex items-center justify-between px-6 md:px-10 py-3 border-b border-border bg-background">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Central de Comando · Legacy Executoria
      </div>
      <button
        onClick={toggle}
        className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
          meeting
            ? "bg-primary text-primary-foreground border-primary"
            : "border-border hover:bg-accent text-foreground"
        }`}
      >
        {meeting ? <X className="h-3.5 w-3.5" /> : <Presentation className="h-3.5 w-3.5" />}
        {meeting ? "Sair do Modo Reunião" : "Modo Reunião"}
      </button>
    </div>
  );
}
