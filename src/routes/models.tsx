import { createFileRoute } from "@tanstack/react-router";
import { EntityManager, type FieldDef } from "@/components/ayra/EntityManager";
import { PageHeader } from "@/components/ayra/PageHeader";
import { useAyra } from "@/lib/ayra/store";
import type { ModelRoute } from "@/lib/ayra/types";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Model Router — AYRA Agent OS" },
      { name: "description", content: "Choose which AI models AYRA can use and in what order." },
      { property: "og:title", content: "Model Router — AYRA Agent OS" },
      { property: "og:description", content: "Choose which AI models AYRA can use and in what order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ModelsPage,
});

const FIELDS: FieldDef<ModelRoute>[] = [
  { key: "name", label: "Model name", type: "text", required: true, placeholder: "e.g. Claude" },
  { key: "provider", label: "Provider", type: "text", required: true, placeholder: "e.g. Anthropic, Local" },
  {
    key: "tier",
    label: "Tier",
    type: "select",
    options: [
      { value: "SLM", label: "Small (cheap, simple tasks)" },
      { value: "Mid", label: "Mid (research, booking)" },
      { value: "Frontier", label: "Frontier (coding, hard tasks)" },
    ],
  },
  {
    key: "runsOn",
    label: "Runs on",
    type: "select",
    options: [
      { value: "CPU", label: "Your VPS CPU" },
      { value: "API", label: "Cloud API" },
      { value: "GPU", label: "Rented GPU" },
    ],
  },
  { key: "priority", label: "Priority", type: "number", help: "Lower number is tried first." },
  { key: "costPer1k", label: "Cost per 1k tokens ($)", type: "number", step: 0.0001 },
  { key: "enabled", label: "Allowed", type: "boolean", help: "Turned-off models are never used." },
];

function ModelsPage() {
  const { state, saveItem, deleteItem } = useAyra();
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        kicker="L1 · Reasoning"
        title="Model"
        highlight="Router"
        description="AYRA is model-agnostic. Add any provider, set its tier and priority, or switch it off. Missions pick the first allowed model of the right tier."
      />
      <EntityManager<ModelRoute>
        itemLabel="Model"
        items={state.models}
        fields={FIELDS}
        createEmpty={() => ({ name: "", provider: "", tier: "Mid", runsOn: "API", priority: state.models.length + 1, costPer1k: 0, enabled: true })}
        getTitle={(m) => m.name}
        searchKeys={["name", "provider", "tier"]}
        filter={{
          key: "tier",
          label: "tier",
          options: [
            { value: "SLM", label: "Small" },
            { value: "Mid", label: "Mid" },
            { value: "Frontier", label: "Frontier" },
          ],
        }}
        sort={(a, b) => a.priority - b.priority}
        onSave={(m) => saveItem("models", m)}
        onDelete={(id) => deleteItem("models", id)}
        renderCard={(m) => (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-6 min-w-6 place-items-center rounded-sm border border-primary/50 px-1 font-mono text-[11px] text-primary">
                #{m.priority}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">{m.tier}</span>
              <span className="font-mono text-[10px] text-muted-foreground">· {m.runsOn}</span>
              <span className={m.enabled ? "font-mono text-[10px] text-success" : "font-mono text-[10px] text-destructive"}>
                · {m.enabled ? "ALLOWED" : "OFF"}
              </span>
            </div>
            <p className="text-muted-foreground">{m.provider}</p>
            <p className="font-mono text-xs">{m.costPer1k === 0 ? "Free (local)" : `$${m.costPer1k} / 1k tokens`}</p>
          </div>
        )}
      />
    </div>
  );
}
