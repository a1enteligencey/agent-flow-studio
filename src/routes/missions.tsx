import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HudPanel } from "@/components/ayra/HudPanel";
import { PageHeader } from "@/components/ayra/PageHeader";
import { MissionLauncher } from "@/components/ayra/MissionLauncher";
import { WorkflowPipeline } from "@/components/ayra/WorkflowPipeline";
import { StatusBadge } from "@/components/ayra/StatusBadge";
import { LiveFeed } from "@/components/ayra/LiveFeed";
import { ACTION_LABELS } from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Missions — AYRA Agent OS" },
      { name: "description", content: "Launch new missions and review every past mission with its trace and cost." },
      { property: "og:title", content: "Missions — AYRA Agent OS" },
      { property: "og:description", content: "Launch new missions and review every past mission with its trace and cost." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionsPage,
});

function MissionsPage() {
  const { state, deleteMission, clearHistory } = useAyra();
  const [open, setOpen] = useState<string | null>(null);
  const finished = state.missions.filter((m) => m.finishedAt !== null).length;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        kicker="Operate"
        title="Mission"
        highlight="Control"
        description="Give AYRA a task here. Every mission goes Classify → Route → Plan → Owner Gate → Execute → Verify → Report → Learn."
      />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <HudPanel kicker="New" title="Launch mission" className="xl:sticky xl:top-20 xl:self-start">
          <MissionLauncher />
        </HudPanel>

        <HudPanel
          kicker="History"
          title={`All missions (${state.missions.length})`}
          action={
            finished > 0 ? (
              <Button size="sm" variant="outline" onClick={clearHistory}>
                Clear finished
              </Button>
            ) : undefined
          }
        >
          {state.missions.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No missions yet — launch your first one.</p>
          ) : (
            <ul className="space-y-3">
              {state.missions.map((m) => {
                const expanded = open === m.id;
                const logs = state.logs.filter((l) => l.missionId === m.id);
                return (
                  <li key={m.id} className="rounded-md border border-border bg-background/40">
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : m.id)}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-primary">{m.code}</span>
                          <StatusBadge status={m.status} />
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {m.intent} · ${m.cost.toFixed(2)}
                          </span>
                        </div>
                        <p className="mt-1.5 truncate text-sm">{m.prompt}</p>
                        <div className="mt-3">
                          <WorkflowPipeline mission={m} compact />
                        </div>
                      </div>
                      <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                    </button>
                    {expanded && (
                      <div className="space-y-3 border-t border-border p-4 text-sm">
                        <dl className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs text-muted-foreground">Trace ID</dt>
                            <dd className="font-mono">{m.traceId}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Model</dt>
                            <dd>{m.model}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Layers</dt>
                            <dd className="font-mono">{m.layers.join(" · ")}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Sensitive actions</dt>
                            <dd>{m.actions.length ? m.actions.map((a) => ACTION_LABELS[a]).join(", ") : "None"}</dd>
                          </div>
                        </dl>
                        {m.gateReasons.length > 0 && (
                          <p className="text-xs text-warning">Gate: {m.gateReasons.join(" · ")}</p>
                        )}
                        <LiveFeed logs={logs} height="h-48" empty="Log is kept only for this session." />
                        <div className="flex justify-end">
                          <Button size="sm" variant="ghost" className="hover:text-destructive" onClick={() => deleteMission(m.id)}>
                            <Trash2 /> Delete mission
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </HudPanel>
      </div>
    </div>
  );
}
