import type { ReactNode } from "react";

export function PageHeader({
  eyebrow, title, subtitle, actions,
}: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6 pb-8 border-b border-border mb-8 fade-in">
      <div>
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary font-medium mb-2">{eyebrow}</p>
        )}
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground max-w-xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mb-10 fade-in">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/70">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
