import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HudPanelProps {
  title?: string;
  kicker?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Glass panel with the teal corner blocks from the AYRA reference design. */
export function HudPanel({ title, kicker, action, children, className, bodyClassName }: HudPanelProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card/70 shadow-[var(--shadow-panel)] backdrop-blur-md",
        className,
      )}
    >
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 bg-primary" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 bg-primary/70" />
      {(title || action) && (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            {kicker && (
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">{kicker}</p>
            )}
            {title && (
              <h2 className="truncate font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
