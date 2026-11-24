import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  highlight,
  description,
  action,
}: {
  kicker: string;
  title: string;
  highlight?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">{kicker}</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-tight tracking-wide md:text-4xl">
          {title} {highlight && <span className="text-primary text-glow">{highlight}</span>}
        </h1>
        <span aria-hidden className="mt-3 block h-0.5 w-12 bg-primary" />
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
