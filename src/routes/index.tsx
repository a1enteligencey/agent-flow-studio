import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Bot, CircleDollarSign, Play, ShieldAlert } from "lucide-react";
import bannerAsset from "@/assets/ayra_core_banner.jpg.asset.json";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HudPanel } from "@/components/ayra/HudPanel";
import { WorkflowPipeline } from "@/components/ayra/WorkflowPipeline";
import { AgentOrbit } from "@/components/ayra/AgentOrbit";
import { LiveFeed } from "@/components/ayra/LiveFeed";
import { ApprovalQueue } from "@/components/ayra/ApprovalQueue";
import { MissionLauncher } from "@/components/ayra/MissionLauncher";
import { StatusBadge } from "@/components/ayra/StatusBadge";
import { LAYERS, STAGES } from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";
import type { Mission } from "@/lib/ayra/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — AYRA Agent OS" },
      { name: "description", content: "Watch every AYRA agent work live: mission flow, approvals and system layers." },
      { property: "og:title", content: "Command Center — AYRA Agent OS" },
      { property: "og:description", content: "Watch every AYRA agent work live: mission flow, approvals and system layers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenter,
});

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "primary",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sub: string;
  tone?: "primary" | "warning";
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card/70 p-4 backdrop-blur">
      <span aria-hidden className={cn("absolute left-0 top-0 h-full w-0.5", tone === "warning" ? "bg-warning" : "bg-primary")} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <Icon className={cn("h-4 w-4 shrink-0", tone === "warning" ? "text-warning" : "text-primary")} />
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums md:text-3xl">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function MissionTabs({
  missions,
  selected,
  onSelect,
}: {
  missions: Mission[];
  selected: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {missions.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onSelect(m.id)}
          className={cn(
            "flex items-center gap-2 rounded-sm border px-2.5 py-1 font-mono text-[11px] transition-colors",
            m.id === selected ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:border-primary/50",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              m.status === "running" && "animate-pulse bg-primary",
              m.status === "awaiting_approval" && "bg-warning",
              m.status === "completed" && "bg-success",
              (m.status === "blocked" || m.status === "rejected") && "bg-destructive",
            )}
          />
          {m.code}
        </button>
      ))}
    </div>
  );
}

function CommandCenter() {
  const { state } = useAyra();
  const [picked, setPicked] = useState<string | undefined>();
  const [launchOpen, setLaunchOpen] = useState(false);

  const active = state.missions.filter((m) => m.status === "running" || m.status === "awaiting_approval");
  const recent = state.missions.slice(0, 6);
  const tabs = active.length > 0 ? active : recent.slice(0, 3);
  const focus = tabs.find((m) => m.id === picked) ?? tabs[0];
  const stage = focus ? STAGES[focus.stageIndex] : undefined;
  const focusLogs = focus ? state.logs.filter((l) => l.missionId === focus.id) : [];
  const team = focus ? state.agents.filter((a) => focus.agentIds.includes(a.id)) : [];

  const working = state.agents.filter((a) => a.status === "working").length;
  const online = state.agents.filter((a) => a.status !== "offline").length;
  const spent = state.missions.reduce((sum, m) => sum + m.cost, 0);
  const pending = state.missions.filter((m) => m.status === "awaiting_approval").length;
  const done = state.missions.filter((m) => m.status === "completed").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-xl border border-border">
        <img
          src={bannerAsset.url}
          alt="Holographic AI core above a futuristic city"
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div aria-hidden className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
        <span aria-hidden className="absolute left-0 top-0 h-6 w-6 bg-primary md:h-12 md:w-12" />
        <span aria-hidden className="absolute bottom-0 right-0 h-6 w-6 bg-primary/80 md:h-10 md:w-10" />
        <div className="relative max-w-xl px-6 py-10 md:px-12 md:py-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
            Owner console · L0 – L10
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-wide md:text-5xl">
            Command
            <br />
            <span className="text-primary text-glow">Center</span>
          </h1>
          <span aria-hidden className="mt-4 block h-0.5 w-14 bg-primary" />
          <p className="mt-4 max-w-md text-sm text-foreground/80 md:text-base">
            Every agent, every step, live. Give AYRA a mission and watch it think, plan, ask you and act.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setLaunchOpen(true)}>
              <Play className="fill-current" /> Launch mission
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/modules">Manage modules</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Activity} label="Live missions" value={String(active.length)} sub={`${done} completed so far`} />
        <StatCard icon={Bot} label="Agents working" value={`${working}/${online}`} sub="online agents right now" />
        <StatCard
          icon={CircleDollarSign}
          label="Spent"
          value={`$${spent.toFixed(2)}`}
          sub={`of $${state.settings.dailyBudget.toFixed(2)} budget`}
        />
        <StatCard
          icon={ShieldAlert}
          label="Needs you"
          value={String(pending)}
          sub={pending ? "missions waiting for approval" : "nothing waiting"}
          tone={pending ? "warning" : "primary"}
        />
      </div>

      {/* Live flow + orbit */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <HudPanel
          kicker="Live"
          title="Mission flow"
          action={focus ? <StatusBadge status={focus.status} /> : undefined}
        >
          {focus ? (
            <div className="space-y-5">
              <MissionTabs missions={tabs} selected={focus.id} onSelect={setPicked} />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {focus.code} · {focus.intent} · {focus.model}
                </p>
                <p className="mt-1 text-lg text-foreground">{focus.prompt}</p>
              </div>
              <WorkflowPipeline mission={focus} />
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-md border border-primary/25 bg-primary/5 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
                    {focus.status === "completed" ? "Done" : `Now · ${stage?.label ?? ""}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {focus.status === "completed"
                      ? `Finished · cost $${focus.cost.toFixed(2)} · trace ${focus.traceId}`
                      : focus.status === "awaiting_approval"
                        ? "Paused — waiting for your approval below"
                        : focus.status === "blocked"
                          ? "Refused by a safety gate"
                          : focus.status === "rejected"
                            ? "You rejected this mission"
                            : stage?.hint}
                  </p>
                  <p className="mt-3 font-mono text-sm text-foreground">
                    <span className="text-primary">›</span> {focusLogs[0]?.text ?? "Starting…"}
                    {focus.status === "running" && (
                      <span className="ml-1 inline-block h-3.5 w-1.5 bg-primary align-middle animate-blink" />
                    )}
                  </p>
                </div>
                <div className="rounded-md border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Team</p>
                  <ul className="mt-2 space-y-1.5">
                    {team.length === 0 && <li className="text-xs text-muted-foreground">Assigning…</li>}
                    {team.map((a) => (
                      <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm">
                        <span className="truncate">{a.name}</span>
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            a.status === "working" ? "animate-pulse bg-primary" : a.status === "waiting" ? "bg-warning" : "bg-muted-foreground",
                          )}
                        />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 font-mono text-xs text-muted-foreground">
                    ${focus.cost.toFixed(2)} / ${focus.estCost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <WorkflowPipeline />
                <p className="mt-6 text-sm text-muted-foreground">No mission yet. Launch one to see the live flow.</p>
                <Button className="mt-4" onClick={() => setLaunchOpen(true)}>
                  <Play className="fill-current" /> Launch mission
                </Button>
              </div>
            </div>
          )}
        </HudPanel>

        <HudPanel kicker="Swarm" title="Agent core">
          <AgentOrbit agents={state.agents} />
          <ul className="mt-4 max-h-40 space-y-2 overflow-y-auto">
            {state.agents
              .filter((a) => a.status === "working" || a.status === "waiting")
              .map((a) => (
                <li key={a.id} className="text-xs">
                  <span className={a.status === "waiting" ? "text-warning" : "text-primary"}>{a.name}</span>
                  <span className="text-muted-foreground"> — {a.currentAction}</span>
                </li>
              ))}
            {working === 0 && <li className="text-xs text-muted-foreground">All agents standing by.</li>}
          </ul>
        </HudPanel>
      </div>

      {/* Feed + approvals */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <HudPanel kicker="Trace" title="Live activity" action={<Link to="/missions" className="font-mono text-[11px] uppercase tracking-widest text-primary hover:underline">All missions</Link>}>
          <LiveFeed logs={state.logs} height="h-96" />
        </HudPanel>
        <HudPanel kicker="Human gate" title="Waiting for you">
          <ApprovalQueue />
        </HudPanel>
      </div>

      {/* Layers */}
      <HudPanel
        kicker="Architecture"
        title="System layers"
        action={<Link to="/modules" className="font-mono text-[11px] uppercase tracking-widest text-primary hover:underline">Edit modules</Link>}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {LAYERS.map((layer) => {
            const mods = state.modules.filter((m) => m.layer === layer.id);
            const activeMods = mods.filter((m) => m.status === "active").length;
            const busy = active.some((m) => m.layers.includes(layer.id) && m.status === "running");
            return (
              <div
                key={layer.id}
                className={cn(
                  "rounded-md border p-3 transition-all duration-500",
                  busy ? "border-primary/60 bg-primary/10 glow-sm" : "border-border bg-background/40",
                )}
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{layer.id}</span>
                  <span className="truncate text-sm font-medium">{layer.name}</span>
                  {busy && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{layer.hint}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${mods.length ? (activeMods / mods.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {activeMods}/{mods.length} modules active
                </p>
              </div>
            );
          })}
        </div>
      </HudPanel>

      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-primary/30 bg-popover sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-[0.14em]">Launch a mission</DialogTitle>
            <DialogDescription>Tell AYRA what to do. It plans, asks you if needed, then acts.</DialogDescription>
          </DialogHeader>
          <MissionLauncher onLaunched={() => setLaunchOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
