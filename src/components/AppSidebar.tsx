import { Link, useRouterState } from "@tanstack/react-router";
import logo from "@/assets/logo-legacy.svg";
import {
  LayoutDashboard, Table2, CalendarRange, CalendarDays, Filter, LineChart,
  Users, Briefcase, Video, KanbanSquare, Database, Shield, LayoutGrid,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; group?: string };
const nav: NavItem[] = [
  { to: "/", label: "Cockpit Executivo", icon: LayoutDashboard, exact: true, group: "Visão" },
  { to: "/funil", label: "Funil Comercial", icon: Filter, group: "Visão" },
  { to: "/forecast", label: "Forecast", icon: LineChart, group: "Visão" },

  { to: "/operacao", label: "Operação Diária", icon: Table2, group: "Operação" },
  { to: "/semanal", label: "Controle Semanal", icon: CalendarRange, group: "Operação" },
  { to: "/mensal", label: "Controle Mensal", icon: CalendarDays, group: "Operação" },
  { to: "/reunioes", label: "Reuniões Closers", icon: Video, group: "Operação" },

  { to: "/sdrs", label: "SDR Ops", icon: Users, group: "Time" },
  { to: "/closers", label: "Closer Ops", icon: Briefcase, group: "Time" },
  { to: "/sprints", label: "Sprints", icon: LayoutGrid, group: "Time" },

  { to: "/kanban", label: "Kanban", icon: KanbanSquare, group: "Execução" },
  { to: "/crm", label: "CRM", icon: Database, group: "Execução" },

  { to: "/governanca", label: "Governança", icon: Shield, group: "Admin" },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  const groups = nav.reduce<Record<string, NavItem[]>>((acc, item) => {
    const g = item.group || "Outros";
    (acc[g] ||= []).push(item);
    return acc;
  }, {});

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border z-20">
      <div className="px-6 py-7 border-b border-sidebar-border">
        <img src={logo} alt="Legacy Executoria" className="h-8 w-auto" />
        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
          Sales Ops Hub · v2.0
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="space-y-0.5">
            <p className="px-3 pb-1 text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/40">{groupName}</p>
            {items.map((item) => {
              const active = item.exact ? path === item.to : path === item.to || path.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="truncate">{item.label}</span>
                  {active && <span className="ml-auto w-1 h-4 bg-sidebar-primary rounded-sm" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-sidebar-border text-[10px] text-sidebar-foreground/50 tracking-wider uppercase">
        Central de Comando Comercial
      </div>
    </aside>
  );
}
