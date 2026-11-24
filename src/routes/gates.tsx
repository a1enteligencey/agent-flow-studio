import { createFileRoute } from "@tanstack/react-router";
import { EntityManager, type FieldDef } from "@/components/ayra/EntityManager";
import { PageHeader } from "@/components/ayra/PageHeader";
import { StatusBadge } from "@/components/ayra/StatusBadge";
import { ACTION_LABELS } from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";
import type { ActionKind, Gate } from "@/lib/ayra/types";

export const Route = createFileRoute("/gates")({
  head: () => ({
    meta: [
      { title: "Safety Gates — AYRA Agent OS" },
      { name: "description", content: "Decide which actions AYRA must ask you about, refuse, or just report." },
      { property: "og:title", content: "Safety Gates — AYRA Agent OS" },
      { property: "og:description", content: "Decide which actions AYRA must ask you about, refuse, or just report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GatesPage,
});

const ACTION_OPTIONS = (Object.keys(ACTION_LABELS) as ActionKind[]).map((a) => ({ value: a, label: ACTION_LABELS[a] }));
const MODE_OPTIONS = [
  { value: "confirm", label: "Ask me first" },
  { value: "block", label: "Always refuse" },
  { value: "alert", label: "Do it, then alert me" },
];

const FIELDS: FieldDef<Gate>[] = [
  { key: "name", label: "Rule name", type: "text", required: true, wide: true },
  { key: "action", label: "When the task includes", type: "select", options: ACTION_OPTIONS },
  { key: "mode", label: "Then AYRA should", type: "select", options: MODE_OPTIONS },
  { key: "description", label: "Details", type: "textarea" },
  { key: "enabled", label: "Rule is on", type: "boolean" },
];

function GatesPage() {
  const { state, saveItem, deleteItem } = useAyra();
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        kicker="Human gate"
        title="Safety"
        highlight="Gates"
        description={`You stay in control. These rules decide when AYRA pauses for you. Any mission above $${state.settings.approvalCostLimit.toFixed(2)} also asks first (change it in Settings).`}
      />
      <EntityManager<Gate>
        itemLabel="Rule"
        items={state.gates}
        fields={FIELDS}
        createEmpty={() => ({ name: "", action: "payment", mode: "confirm", description: "", enabled: true })}
        getTitle={(g) => g.name}
        searchKeys={["name", "description"]}
        filter={{ key: "mode", label: "rule type", options: MODE_OPTIONS }}
        onSave={(g) => saveItem("gates", g)}
        onDelete={(id) => deleteItem("gates", id)}
        renderCard={(g) => (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={g.mode} />
              <span className={g.enabled ? "font-mono text-[10px] text-success" : "font-mono text-[10px] text-muted-foreground"}>
                {g.enabled ? "● ON" : "○ OFF"}
              </span>
            </div>
            <p className="text-xs text-foreground/80">When: {ACTION_LABELS[g.action]}</p>
            {g.description && <p className="text-muted-foreground">{g.description}</p>}
          </div>
        )}
      />
    </div>
  );
}
