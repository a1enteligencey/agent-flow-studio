import {
  Brain,
  CheckCheck,
  ClipboardList,
  FileText,
  GitBranch,
  ScanSearch,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { STAGES } from "@/lib/ayra/engine";
import type { Mission, StageId } from "@/lib/ayra/types";
import { cn } from "@/lib/utils";

const ICONS: Record<StageId, typeof Brain> = {
  classify: ScanSearch,
  route: GitBranch,
  plan: ClipboardList,
  gate: ShieldCheck,
  execute: Zap,
  verify: CheckCheck,
  report: FileText,
  learn: Brain,
};

type NodeState = "done" | "active" | "waiting" | "failed" | "todo";

function nodeState(m: Mission | undefined, index: number): NodeState {
  if (!m) return "todo";
  if (m.status === "completed") return "done";
  if (index < m.stageIndex) return "done";
  if (index > m.stageIndex) return "todo";
  if (m.status === "awaiting_approval") return "waiting";
  if (m.status === "blocked" || m.status === "rejected") return "failed";
  return "active";
}

/** The live 8-step mission flow: Classify → … → Learn. */
export function WorkflowPipeline({ mission, compact = false }: { mission?: Mission; compact?: boolean }) {
  return (
    <div className="overflow-x-auto pb-1">
      <ol className={cn("flex min-w-[480px] items-start", compact && "min-w-[400px]")}>
        {STAGES.map((stage, i) => {
          const state = nodeState(mission, i);
          const Icon = ICONS[stage.id];
          const lineDone = state === "done";
          const lineFlowing = state === "active";
          return (
            <li key={stage.id} className="relative flex flex-1 flex-col items-center">
              {i < STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-1/2 top-[17px] h-0.5 w-full",
                    compact && "top-3",
                    lineDone ? "bg-primary glow-sm" : lineFlowing ? "flow-line animate-flow opacity-80" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 grid place-items-center rounded-md border transition-colors duration-500",
                  compact ? "h-6 w-6" : "h-9 w-9",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "active" && "border-primary bg-background text-primary glow",
                  state === "waiting" && "border-warning bg-background text-warning",
                  state === "failed" && "border-destructive bg-background text-destructive",
                  state === "todo" && "border-border bg-background text-muted-foreground",
                )}
              >
                {(state === "active" || state === "waiting") && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 rounded-md border animate-pulse-ring",
                      state === "active" ? "border-primary" : "border-warning",
                    )}
                  />
                )}
                <Icon className={compact ? "h-3 w-3" : "h-4 w-4"} />
              </span>
              {!compact && (
                <span
                  className={cn(
                    "mt-2 px-0.5 text-center font-mono text-[10px] uppercase leading-tight tracking-wider",
                    state === "todo" ? "text-muted-foreground" : "text-foreground",
                    state === "active" && "text-primary",
                    state === "waiting" && "text-warning",
                    state === "failed" && "text-destructive",
                  )}
                >
                  {stage.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
