import { useEffect, useState } from "react";
import type { LogLine } from "@/lib/ayra/types";
import { cn } from "@/lib/utils";

const LEVEL: Record<LogLine["level"], string> = {
  info: "text-foreground/85",
  success: "text-success",
  warn: "text-warning",
  error: "text-destructive",
  think: "text-primary/80 italic",
};

const TAG: Record<LogLine["level"], string> = {
  info: "INFO",
  success: " OK ",
  warn: "WAIT",
  error: "STOP",
  think: "THNK",
};

function time(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour12: false });
}

/** Terminal-style live log of everything agents do; newest on top. */
export function LiveFeed({ logs, height = "h-80", empty = "Waiting for agent activity…" }: { logs: LogLine[]; height?: string; empty?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className={cn("relative overflow-hidden rounded-md border border-border bg-background/80", height)}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-primary/5 to-transparent animate-scan" />
      <div className="h-full overflow-y-auto p-3 font-mono text-xs leading-relaxed">
        {!mounted || logs.length === 0 ? (
          <p className="text-muted-foreground">
            <span className="text-primary">›</span> {empty}
            <span className="ml-1 inline-block h-3 w-1.5 bg-primary align-middle animate-blink" />
          </p>
        ) : (
          logs.map((l, i) => (
            <div
              key={l.id}
              className={cn(
                "grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-2 py-0.5",
                i === 0 && "animate-line-in",
              )}
            >
              <span className="text-muted-foreground">{time(l.ts)}</span>
              <span className={cn("font-semibold", LEVEL[l.level])}>[{TAG[l.level]}]</span>
              <span className="min-w-0 break-words">
                <span className="text-primary">{l.missionCode}</span>
                <span className="text-muted-foreground"> · {l.agent} › </span>
                <span className={LEVEL[l.level]}>{l.text}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
