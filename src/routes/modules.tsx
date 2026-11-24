import { createFileRoute } from "@tanstack/react-router";
import { EntityManager, type FieldDef } from "@/components/ayra/EntityManager";
import { PageHeader } from "@/components/ayra/PageHeader";
import { StatusBadge } from "@/components/ayra/StatusBadge";
import { LAYERS } from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";
import { LAYER_IDS, type Module } from "@/lib/ayra/types";

export const Route = createFileRoute("/modules")({
  head: () => ({
    meta: [
      { title: "Modules — AYRA Agent OS" },
      { name: "description", content: "Every AYRA building block across 11 layers — add, edit and track status." },
      { property: "og:title", content: "Modules — AYRA Agent OS" },
      { property: "og:description", content: "Every AYRA building block across 11 layers — add, edit and track status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ModulesPage,
});

const LAYER_OPTIONS = LAYERS.map((l) => ({ value: l.id, label: `${l.id} · ${l.name}` }));

const FIELDS: FieldDef<Module>[] = [
  { key: "name", label: "Module name", type: "text", required: true, placeholder: "e.g. Langfuse" },
  { key: "layer", label: "Layer", type: "select", options: LAYER_OPTIONS },
  { key: "repo", label: "Repository / source", type: "text", placeholder: "owner/repo" },
  { key: "language", label: "Language", type: "text", placeholder: "Python, TypeScript…" },
  { key: "isolation", label: "Runs in", type: "text", placeholder: "Docker, Firecracker…" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "planned", label: "Planned" },
      { value: "installing", label: "Installing" },
      { value: "active", label: "Active" },
      { value: "degraded", label: "Degraded" },
      { value: "offline", label: "Offline" },
    ],
  },
  { key: "phase", label: "Phase (0–5)", type: "number", help: "Which roadmap phase it belongs to." },
  { key: "gpu", label: "Needs GPU?", type: "boolean", help: "GPU modules need a cloud fallback on your VPS." },
  { key: "notes", label: "Notes", type: "textarea", placeholder: "Anything to remember about this module" },
];

const layerOrder = (id: string) => LAYER_IDS.indexOf(id as (typeof LAYER_IDS)[number]);

function ModulesPage() {
  const { state, saveItem, deleteItem } = useAyra();
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        kicker="Architecture"
        title="System"
        highlight="Modules"
        description="All the building blocks of AYRA, grouped by layer L0 to L10. Add a new tool, change its status as you install it, or remove it."
      />
      <EntityManager<Module>
        itemLabel="Module"
        items={state.modules}
        fields={FIELDS}
        createEmpty={() => ({
          name: "",
          layer: "L3",
          repo: "",
          language: "",
          isolation: "Docker",
          gpu: false,
          status: "planned",
          phase: 1,
          notes: "",
        })}
        getTitle={(m) => m.name}
        searchKeys={["name", "repo", "language", "notes"]}
        filter={{ key: "layer", label: "layer", options: LAYER_OPTIONS }}
        sort={(a, b) => layerOrder(a.layer) - layerOrder(b.layer)}
        onSave={(m) => saveItem("modules", m)}
        onDelete={(id) => deleteItem("modules", id)}
        renderCard={(m) => (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-primary px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground">
                {m.layer}
              </span>
              <StatusBadge status={m.status} />
              {m.gpu && (
                <span className="rounded-sm border border-warning/50 px-1.5 py-0.5 font-mono text-[10px] text-warning">GPU</span>
              )}
              <span className="font-mono text-[10px] text-muted-foreground">PHASE {m.phase}</span>
            </div>
            <p className="truncate font-mono text-xs text-primary/90">{m.repo || "—"}</p>
            <p className="text-xs text-muted-foreground">
              {[m.language, m.isolation].filter((v) => v && v !== "—").join(" · ") || "—"}
            </p>
            {m.notes && <p className="text-muted-foreground">{m.notes}</p>}
          </div>
        )}
      />
    </div>
  );
}
