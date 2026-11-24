import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  active: "text-success border-success/40 bg-success/10",
  completed: "text-success border-success/40 bg-success/10",
  working: "text-primary border-primary/50 bg-primary/10",
  running: "text-primary border-primary/50 bg-primary/10",
  installing: "text-primary border-primary/40 bg-primary/5",
  waiting: "text-warning border-warning/50 bg-warning/10",
  awaiting_approval: "text-warning border-warning/50 bg-warning/10",
  degraded: "text-warning border-warning/50 bg-warning/10",
  confirm: "text-warning border-warning/50 bg-warning/10",
  alert: "text-primary border-primary/40 bg-primary/5",
  blocked: "text-destructive border-destructive/50 bg-destructive/10",
  block: "text-destructive border-destructive/50 bg-destructive/10",
  rejected: "text-destructive border-destructive/50 bg-destructive/10",
  offline: "text-muted-foreground border-border bg-muted/40",
  idle: "text-muted-foreground border-border bg-muted/40",
  planned: "text-muted-foreground border-border bg-muted/40",
};

const LABEL: Record<string, string> = {
  awaiting_approval: "needs approval",
  confirm: "ask me first",
  block: "always refuse",
  alert: "do + alert me",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const live = status === "working" || status === "running";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        TONE[status] ?? TONE["idle"],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", live && "animate-pulse")} />
      {LABEL[status] ?? status}
    </span>
  );
}
