import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Bot, CircleDollarSign, Download, FileText, Folder, GitBranch, Maximize, Minimize, Play, ShieldAlert, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentCard } from "@/components/ayra/workspace/AgentCard";
import { HudFrame } from "@/components/ayra/workspace/HudFrame";
import { AyraLogo } from "@/components/ayra/AyraLogo";
import { HudPanel } from "@/components/ayra/HudPanel";
import { WorkflowPipeline } from "@/components/ayra/WorkflowPipeline";
import { LiveFeed } from "@/components/ayra/LiveFeed";
import { LiveBadge } from "@/components/ayra/LiveBadge";
import { ApprovalQueue } from "@/components/ayra/ApprovalQueue";
import { MissionLauncher } from "@/components/ayra/MissionLauncher";
import { StatusBadge } from "@/components/ayra/StatusBadge";
import { LAYERS, STAGES } from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Command Center — AYRA Agent Workspace" },
    { name: "description", content: "AYRA agent workspace with task execution, live mission flow, activity logs and Owner approvals." },
    { property: "og:title", content: "Command Center — AYRA Agent Workspace" },
    { property: "og:description", content: "AYRA agent workspace with task execution, live mission flow, activity logs and Owner approvals." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CommandCenter,
});

const VIEWS = [
  { id: "flow", label: "Task flow", icon: GitBranch },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "output", label: "Output", icon: Activity },
  { id: "files", label: "Files", icon: Folder },
] as const;
type View = (typeof VIEWS)[number]["id"];

function CommandCenter() {
  const { state, stop } = useAyra();
  const [picked, setPicked] = useState<string>();
  const [cleared, setCleared] = useState<string[]>([]);
  const [view, setView] = useState<View>("flow");
  const [launchOpen, setLaunchOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const workspace = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => setExpanded(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const active = state.missions.filter(m => m.status === "running" || m.status === "awaiting_approval");
  const visible = state.missions.filter(m => !cleared.includes(m.id));
  const focus = visible.find(m => m.id === picked) ?? visible.find(m => m.status === "running" || m.status === "awaiting_approval") ?? visible[0];
  const stage = focus ? STAGES[focus.stageIndex] : undefined;
  const logs = focus ? state.logs.filter(l => l.missionId === focus.id) : [];
  const team = focus ? state.agents.filter(a => focus.agentIds.includes(a.id)) : [];
  const last = logs[0];
  const online = state.agents.filter(a => a.status !== "offline").length;
  const working = state.agents.filter(a => a.status === "working").length;
  const spent = state.missions.reduce((sum, m) => sum + m.cost, 0);
  const pending = state.missions.filter(m => m.status === "awaiting_approval").length;
  const finished = state.missions.filter(m => m.status === "completed").length;
  const outputs = logs.filter(l => l.stage === "report");

  const fullScreen = async () => {
    if (document.fullscreenElement) { await document.exitFullscreen(); setExpanded(false); }
    else if (workspace.current) { await workspace.current.requestFullscreen(); setExpanded(true); }
  };
  const downloadTrace = () => {
    if (!focus) return;
    const blob = new Blob([JSON.stringify({ mission: focus, activity: [...logs].reverse() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${focus.code}-trace.json`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div ref={workspace} className="space-y-4 bg-background fullscreen:overflow-y-auto fullscreen:p-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/40 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <AyraLogo className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-foreground">AYRA <span className="text-primary">Command Center</span></h1>
              <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">AI agent workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" />{online} agents online</span>
            <LiveBadge />
            <Button variant="outline" size="icon" title={expanded ? "Exit fullscreen" : "Fullscreen workspace"} aria-label={expanded ? "Exit fullscreen" : "Fullscreen workspace"} onClick={() => void fullScreen()}>
              {expanded ? <Minimize /> : <Maximize />}
            </Button>
          </div>
        </header>

        <div className="grid items-stretch gap-4 md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)]">
          <AgentCard mission={focus} team={team} activity={last} onRun={() => setLaunchOpen(true)} onStop={() => { if (focus) stop(focus.id); }} onReset={() => { if (focus) setCleared(ids => [...ids, focus.id]); setPicked(undefined); setView("flow"); }} />
          <HudFrame accents innerClassName="flex min-h-[540px] flex-col" className="min-w-0">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/40 px-4 py-3">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase"><Terminal className="h-5 w-5 text-primary" /> Agent workspace</h2>
              <div role="tablist" aria-label="Workspace views" className="flex items-center gap-1">
                {VIEWS.map(v => <Button key={v.id} role="tab" aria-selected={view === v.id} aria-controls="workspace-view" id={`tab-${v.id}`} variant="ghost" size="sm" onClick={() => setView(v.id)} className={cn("gap-1.5 border-b-2 rounded-none px-2 text-xs", view === v.id ? "border-primary text-primary" : "border-transparent text-muted-foreground")}><v.icon className="h-4 w-4" /><span className="hidden lg:inline">{v.label}</span><span className="sr-only lg:hidden">{v.label}</span></Button>)}
              </div>
            </header>
            <div id="workspace-view" role="tabpanel" aria-labelledby={`tab-${view}`} className="relative flex flex-1 flex-col overflow-hidden bg-background/80">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-72 overflow-hidden"><div className="grid-floor animate-grid-move absolute -inset-x-1/2 -bottom-10 h-96" /></div>
              {view === "flow" && <>
                {!focus ? <div className="relative grid flex-1 place-items-center px-6 py-10 text-center">
                  <div className="w-full max-w-xl">
                    <div className="mb-7 text-primary/20"><AyraLogo className="mx-auto h-24 w-24" /><p className="font-display text-3xl font-bold">AYRA</p><p className="mt-3 text-sm uppercase">AI agent workspace</p></div>
                    <div className="inline-flex items-center gap-4 border-x-2 border-primary px-5 py-3"><Terminal className="h-7 w-7 text-foreground" /><h3 className="font-display text-lg font-medium uppercase text-primary sm:text-xl">Ready for task</h3></div>
                    <div className="mt-7"><Button variant="outline" onClick={() => setLaunchOpen(true)}><Play className="fill-current" /> Run task</Button></div>
                  </div>
                </div> : <div className="relative space-y-4 p-4 lg:p-5">
                  <div className="flex flex-wrap gap-2">{visible.slice(0, 5).map(m => <Button key={m.id} variant="outline" size="sm" onClick={() => setPicked(m.id)} className={cn("font-mono text-[10px]", focus.id === m.id && "border-primary bg-primary/10 text-primary")}>{m.code}</Button>)}</div>
                  <div className="space-y-3"><div className="flex flex-wrap items-center gap-3"><StatusBadge status={focus.status} /><span className="font-mono text-[10px] text-muted-foreground">{focus.code} · {focus.intent}</span></div><h3 className="break-words text-xl font-semibold">{focus.prompt}</h3><p className="font-mono text-xs text-muted-foreground">{focus.model}</p></div>
                  <WorkflowPipeline mission={focus} />
                  <div className="border-l-2 border-primary bg-primary/10 p-4 glow-sm">
                    <p className="font-mono text-xs uppercase text-primary">{focus.status === "completed" ? "Task complete" : focus.status === "rejected" ? "Stopped" : `Now · ${stage?.label ?? ""}`}</p>
                    <p className="mt-3 break-words font-mono text-sm"><span className="text-primary">› </span>{last?.text ?? stage?.hint}{focus.status === "running" && <span className="ml-1 inline-block h-3 w-1 bg-primary animate-blink" />}</p>
                    <p className="mt-4 text-xs text-muted-foreground">Cost ${focus.cost.toFixed(2)} · Trace {focus.traceId}</p>
                  </div>
                  {focus.status === "awaiting_approval" && <ApprovalQueue />}
                  <div className="flex flex-wrap gap-3">{team.map(a => <span key={a.id} className="flex items-center gap-2 text-xs text-muted-foreground"><Bot className="h-4 w-4 text-primary" />{a.name}</span>)}</div>
                </div>}
              </>}
              {view === "logs" && <div className="relative p-4"><LiveFeed logs={state.logs} height="h-[460px]" /></div>}
              {view === "output" && <div className="relative p-6">
                <h3 className="mb-5 flex items-center gap-2 font-display text-sm uppercase"><FileText className="h-5 w-5 text-primary" />Task output</h3>
                {outputs.length ? <ul className="space-y-4">{[...outputs].reverse().map(l => <li key={l.id} className="border-l-2 border-primary pl-4"><p className="text-sm">{l.text}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{l.agent}</p></li>)}</ul> : <div className="py-28 text-center text-sm text-muted-foreground">No output yet</div>}
              </div>}
              {view === "files" && <div className="relative p-6"><h3 className="mb-5 flex items-center gap-2 font-display text-sm uppercase"><Folder className="h-5 w-5 text-primary" />Task files</h3>{focus ? <div className="flex items-center justify-between gap-3 border-b border-border py-4"><div className="min-w-0"><p className="truncate text-sm">{focus.code}-trace.json</p><p className="mt-1 text-xs text-muted-foreground">Mission trace · {logs.length} activity lines</p></div><Button variant="outline" size="icon" title="Download mission trace" aria-label="Download mission trace" onClick={downloadTrace}><Download /></Button></div> : <div className="py-28 text-center text-sm text-muted-foreground">No task files yet</div>}</div>}
            </div>
            <footer className="relative flex flex-wrap justify-between gap-2 border-t border-border px-5 py-3 font-mono text-[10px] text-muted-foreground"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{focus?.code ?? "Awaiting task"}</span><span>{state.settings.liveEnabled ? "Studio activity" : "Simulation"} · Owner console</span></footer>
          </HudFrame>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
        { icon: Activity, label: "Live missions", value: String(active.length), sub: `${finished} completed` },
        { icon: Bot, label: "Agents working", value: `${working}/${online}`, sub: "Agents online" },
        { icon: CircleDollarSign, label: "Spent", value: `$${spent.toFixed(2)}`, sub: `of $${state.settings.dailyBudget.toFixed(2)} budget` },
        { icon: ShieldAlert, label: "Needs you", value: String(pending), sub: "Waiting for approval" },
      ].map(s => <div key={s.label} className="rounded-md border border-primary/25 bg-card/80 p-3"><div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] uppercase text-muted-foreground">{s.label}</span><s.icon className="h-4 w-4 text-primary" /></div><p className="mt-2 font-display text-2xl font-bold">{s.value}</p><p className="mt-2 text-xs text-muted-foreground">{s.sub}</p></div>)}</div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"><HudPanel title="Live activity" kicker="Trace" action={<LiveBadge />}><LiveFeed logs={state.logs} height="h-72" /></HudPanel><HudPanel title="Waiting for you" kicker="Owner gate"><ApprovalQueue /></HudPanel></div>
      <HudPanel title="System layers" kicker="Architecture" action={<Button variant="ghost" size="sm" asChild><Link to="/modules">Edit modules</Link></Button>}><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{LAYERS.map(layer => { const modules = state.modules.filter(m => m.layer === layer.id); return <div key={layer.id} className="rounded-md border border-border p-3"><p className="text-sm"><span className="mr-2 font-mono text-primary">{layer.id}</span>{layer.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{layer.hint}</p><p className="mt-3 font-mono text-[10px] text-muted-foreground">{modules.filter(m => m.status === "active").length}/{modules.length} modules active</p></div>; })}</div></HudPanel>
      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}><DialogContent className="max-h-[90vh] overflow-y-auto border-primary/30 bg-popover sm:max-w-2xl"><DialogHeader><DialogTitle className="font-display uppercase">Run a task</DialogTitle><DialogDescription>New AYRA mission</DialogDescription></DialogHeader><MissionLauncher onLaunched={() => { setLaunchOpen(false); setPicked(undefined); setView("flow"); }} /></DialogContent></Dialog>
    </div>
  );
}
