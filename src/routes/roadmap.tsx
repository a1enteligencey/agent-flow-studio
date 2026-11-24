import { createFileRoute } from "@tanstack/react-router";
import { Check, Flag } from "lucide-react";
import { toast } from "sonner";
import { EntityManager, type FieldDef } from "@/components/ayra/EntityManager";
import { PageHeader } from "@/components/ayra/PageHeader";
import { HudPanel } from "@/components/ayra/HudPanel";
import { LAYERS, PHASES, currentPhase, phaseProgress } from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";
import type { RoadmapTask } from "@/lib/ayra/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — AYRA Agent OS" },
      { name: "description", content: "Track AYRA's Phase 0 to Phase 5 tasks and tick them off as you finish." },
      { property: "og:title", content: "Roadmap — AYRA Agent OS" },
      { property: "og:description", content: "Track AYRA's Phase 0 to Phase 5 tasks and tick them off as you finish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoadmapPage,
});

const PHASE_OPTIONS = PHASES.map((p) => ({ value: p.id, label: `Phase ${p.id} · ${p.name}` }));
const LAYER_OPTIONS = [
  { value: "—", label: "No specific layer" },
  ...LAYERS.map((l) => ({ value: l.id, label: `${l.id} · ${l.name}` })),
];

const FIELDS: FieldDef<RoadmapTask>[] = [
  { key: "title", label: "Task", type: "text", required: true, wide: true, placeholder: "e.g. Install Docker on the VPS" },
  { key: "phase", label: "Phase", type: "select", options: PHASE_OPTIONS },
  { key: "layer", label: "Layer", type: "select", options: LAYER_OPTIONS },
  { key: "done", label: "Done?", type: "boolean" },
  { key: "notes", label: "Notes", type: "textarea", placeholder: "Anything to remember" },
];

function RoadmapPage() {
  const { state, saveItem, deleteItem } = useAyra();
  const tasks = state.tasks;
  const now = currentPhase(tasks);
  const doneAll = tasks.filter((t) => t.done).length;

  const toggle = (t: RoadmapTask) => {
    saveItem("tasks", { ...t, done: !t.done });
    if (!t.done) toast.success("Task done", { description: t.title });
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        kicker="Phased readiness"
        title="Build"
        highlight="Roadmap"
        description="Phase 0 to Phase 5 from your AYRA spec. Tick a task when it's finished — progress updates instantly. Add, edit or remove any task."
      />

      <HudPanel
        kicker="Overview"
        title={`${doneAll} of ${tasks.length} tasks done`}
        className="mb-8"
        action={
          now !== null ? (
            <span className="font-mono text-[11px] uppercase tracking-widest text-primary">You are in Phase {now}</span>
          ) : tasks.length > 0 ? (
            <span className="font-mono text-[11px] uppercase tracking-widest text-success">All phases complete</span>
          ) : undefined
        }
      >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {PHASES.map((p) => {
            const pct = phaseProgress(tasks, p.id);
            const count = tasks.filter((t) => t.phase === p.id).length;
            const isNow = now === p.id;
            const complete = count > 0 && pct === 100;
            return (
              <li
                key={p.id}
                className={cn(
                  "relative flex flex-col rounded-md border p-4 transition-all",
                  isNow && "border-primary bg-primary/10 glow-sm",
                  complete && "border-success/50 bg-success/5",
                  !isNow && !complete && "border-border bg-background/40",
                )}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <span className="font-display text-2xl font-bold text-primary">P{p.id}</span>
                  {complete ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : isNow ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold">{p.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.when}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full transition-all duration-500", complete ? "bg-success" : "bg-primary")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {pct}% · {tasks.filter((t) => t.phase === p.id && t.done).length}/{count}
                </p>
                <p className="mt-3 flex gap-1.5 text-xs text-muted-foreground">
                  <Flag className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span>{p.exit}</span>
                </p>
              </li>
            );
          })}
        </ol>
      </HudPanel>

      <EntityManager<RoadmapTask>
        itemLabel="Task"
        items={tasks}
        fields={FIELDS}
        createEmpty={() => ({ title: "", phase: now ?? "0", layer: "—", done: false, notes: "" })}
        getTitle={(t) => t.title}
        searchKeys={["title", "notes", "layer"]}
        filter={{ key: "phase", label: "phase", options: PHASE_OPTIONS }}
        sort={(a, b) => Number(a.phase) - Number(b.phase)}
        wrapTitle
        onSave={(t) => saveItem("tasks", t)}
        onDelete={(id) => deleteItem("tasks", id)}
        renderCard={(t) => (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-primary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground">
                PHASE {t.phase}
              </span>
              {t.layer !== "—" && <span className="font-mono text-[11px] text-primary">{t.layer}</span>}
            </div>
            {t.notes && <p className="text-muted-foreground">{t.notes}</p>}
            <button
              type="button"
              role="checkbox"
              aria-checked={t.done}
              aria-label={`Mark "${t.title}" as ${t.done ? "not done" : "done"}`}
              onClick={() => toggle(t)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-all",
                t.done
                  ? "border-success/50 bg-success/10 text-success"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-sm border",
                  t.done ? "border-success bg-success text-primary-foreground" : "border-primary/50",
                )}
              >
                {t.done && <Check className="h-3.5 w-3.5" />}
              </span>
              {t.done ? "Done" : "Tick when finished"}
            </button>
          </div>
        )}
      />
    </div>
  );
}
