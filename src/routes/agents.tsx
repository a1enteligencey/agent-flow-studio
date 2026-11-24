import { createFileRoute } from "@tanstack/react-router";
import { EntityManager, type FieldDef } from "@/components/ayra/EntityManager";
import { PageHeader } from "@/components/ayra/PageHeader";
import { StatusBadge } from "@/components/ayra/StatusBadge";
import { LAYERS } from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";
import type { Agent } from "@/lib/ayra/types";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agents — AYRA Agent OS" },
      { name: "description", content: "Add, edit and remove the AYRA agents that do the work." },
      { property: "og:title", content: "Agents — AYRA Agent OS" },
      { property: "og:description", content: "Add, edit and remove the AYRA agents that do the work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentsPage,
});

const LAYER_OPTIONS = LAYERS.map((l) => ({ value: l.id, label: `${l.id} · ${l.name}` }));

const FIELDS: FieldDef<Agent>[] = [
  { key: "name", label: "Agent name", type: "text", required: true, placeholder: "e.g. Researcher" },
  { key: "role", label: "What it does", type: "text", required: true, placeholder: "e.g. Finds and reads sources" },
  { key: "layer", label: "Layer", type: "select", options: LAYER_OPTIONS, help: "Missions on this layer will use this agent." },
  { key: "model", label: "AI model", type: "text", placeholder: "e.g. Claude" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "idle", label: "Ready" },
      { value: "offline", label: "Offline (don't use)" },
    ],
  },
];

function AgentsPage() {
  const { state, saveItem, deleteItem } = useAyra();
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        kicker="Workforce"
        title="Agent"
        highlight="Roster"
        description="Your team of agents. Add a new one, change its layer or model, or switch it offline. Live status updates as missions run."
      />
      <EntityManager<Agent>
        itemLabel="Agent"
        items={state.agents}
        fields={FIELDS}
        createEmpty={() => ({ name: "", role: "", layer: "L6", model: "", status: "idle", currentAction: "Standing by" })}
        getTitle={(a) => a.name}
        searchKeys={["name", "role", "model"]}
        filter={{ key: "layer", label: "layer", options: LAYER_OPTIONS }}
        onSave={(a) => saveItem("agents", a)}
        onDelete={(id) => deleteItem("agents", id)}
        renderCard={(a) => (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={a.status} />
              <span className="font-mono text-[11px] text-primary">{a.layer}</span>
              <span className="text-xs text-muted-foreground">· {a.model || "no model"}</span>
            </div>
            <p className="text-muted-foreground">{a.role}</p>
            <p className="rounded-sm border border-border bg-background/50 px-2.5 py-1.5 font-mono text-[11px] text-foreground/80">
              <span className="text-primary">›</span> {a.currentAction}
            </p>
          </div>
        )}
      />
    </div>
  );
}
