import { Check, Play, RotateCcw, Square, UserRoundCog } from "lucide-react";
import portraitAsset from "@/assets/ayra_agent_portrait.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { AyraLogo } from "@/components/ayra/AyraLogo";
import { STAGES, missionProgress, stageLines } from "@/lib/ayra/engine";
import type { Agent, Mission } from "@/lib/ayra/types";
import { cn } from "@/lib/utils";
import { HudFrame } from "./HudFrame";

type StepState = "done" | "active" | "waiting" | "failed" | "todo";

function stepState(m: Mission | undefined, i: number): StepState {
  if (!m) return "todo";
  if (m.status === "completed" || i < m.stageIndex) return "done";
  if (i > m.stageIndex) return "todo";
  if (m.status === "awaiting_approval") return "waiting";
  if (m.status === "blocked" || m.status === "rejected") return "failed";
  return "active";
}

function Dots({ total, filled, tone }: { total: number; filled: number; tone: "primary" | "muted" }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full border",
            i < filled ? "border-primary bg-primary" : tone === "primary" ? "border-primary/60" : "border-muted-foreground/50",
            i === filled && tone === "primary" && "animate-pulse bg-primary/40",
          )}
        />
      ))}
    </span>
  );
}

/** Left column: who is working, the step list, progress and Run / Stop / Reset. */
export function AgentCard({
  mission,
  team,
  onRun,
  onStop,
  onReset,
}: {
  mission: Mission | undefined;
  team: Agent[];
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const lead = team[0];
  const running = mission?.status === "running";
  const waiting = mission?.status === "awaiting_approval";
  const currentStage = mission ? STAGES[mission.stageIndex] : undefined;
  const lines = mission && currentStage ? stageLines(currentStage.id, mission, team).length : 0;
  const progress = mission ? missionProgress(mission, lines) : 0;
  const status = running ? "Active" : waiting ? "Waiting" : "Standby";

  return (
    <HudFrame accents className="h-full" innerClassName="flex flex-col">
      {/* Portrait */}
      <div className="relative h-64 overflow-hidden sm:h-72">
        <img
          src={portraitAsset.url}
          alt="AYRA, the AI agent"
          className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
        />
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-card via-card/10 to-transparent" />
        <span aria-hidden className="absolute right-6 top-3 h-1 w-10 bg-primary" />
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-4 pb-3">
          <AyraLogo className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-xl font-bold leading-none tracking-[0.2em]">AYRA</p>
            <p className="mt-1 truncate text-xs text-foreground/80">{lead ? lead.role : "AI Agent OS"}</p>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest",
              running && "border-success/60 bg-success/10 text-success",
              waiting && "border-warning/60 bg-warning/10 text-warning",
              !running && !waiting && "border-border text-muted-foreground",
            )}
          >
            {status}
            <span className={cn("h-1.5 w-1.5 rounded-full", running ? "animate-pulse bg-success" : waiting ? "bg-warning" : "bg-muted-foreground")} />
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
        <p className="flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.16em]">
          <UserRoundCog className="h-4 w-4 text-primary" /> Task execution
        </p>
        <ol className="mt-3 space-y-1">
          {STAGES.map((s, i) => {
            const st = stepState(mission, i);
            const isCurrent = st === "active" || st === "waiting" || st === "failed";
            return (
              <li
                key={s.id}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-sm border px-2 py-1 text-sm transition-colors",
                  isCurrent ? "border-primary/70 bg-primary/10" : "border-transparent",
                  st === "waiting" && "border-warning/70 bg-warning/10",
                  st === "failed" && "border-destructive/60 bg-destructive/10",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border font-mono text-[10px]",
                    st === "done" && "border-primary bg-primary/15 text-primary",
                    st === "active" && "border-primary text-primary",
                    st === "waiting" && "border-warning text-warning",
                    st === "failed" && "border-destructive text-destructive",
                    st === "todo" && "border-muted-foreground/50 text-muted-foreground",
                  )}
                >
                  {st === "active" ? <Play className="h-2.5 w-2.5 fill-current" /> : i + 1}
                </span>
                <span className={cn("min-w-0 truncate", st === "todo" ? "text-muted-foreground" : "text-foreground")}>{s.label}</span>
                {st === "done" ? (
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-success text-primary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : st === "active" ? (
                  <Dots total={Math.max(lines, 1)} filled={mission?.step ?? 0} tone="primary" />
                ) : st === "waiting" ? (
                  <span className="font-mono text-[10px] uppercase text-warning">You</span>
                ) : st === "failed" ? (
                  <span className="font-mono text-[10px] uppercase text-destructive">Stop</span>
                ) : (
                  <Dots total={4} filled={0} tone="muted" />
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center text-sm">
            <span className="font-display text-xs uppercase tracking-[0.14em]">Task progress</span>
            <span className="font-display font-semibold tabular-nums" data-testid="task-progress">
              {progress}%
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-700", running ? "progress-stripes animate-stripes" : "bg-primary")}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button size="sm" onClick={onRun} className="glow-sm gap-1 px-1 text-[10px]">
            <Play className="fill-current" /> Run task
          </Button>
          <Button size="sm" variant="outline" className="gap-1 px-1 text-[10px]" onClick={onStop} disabled={!running && !waiting}>
            <Square className="fill-current" /> Stop
          </Button>
          <Button size="sm" variant="outline" className="gap-1 px-1 text-[10px]" onClick={onReset}>
            <RotateCcw /> Reset
          </Button>
        </div>
      </div>
    </HudFrame>
  );
}
