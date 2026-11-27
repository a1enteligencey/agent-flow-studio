import { createFileRoute } from "@tanstack/react-router";
import { EntityManager, type FieldDef } from "@/components/ayra/EntityManager";
import { PageHeader } from "@/components/ayra/PageHeader";
import { StatusBadge } from "@/components/ayra/StatusBadge";
import { LAYERS } from "@/lib/ayra/engine";
import { useAyra } from "@/lib/ayra/store";
import type { Agent } from "@/lib/ayra/types";
import { FactoryIdentity } from "@/components/ayra/FactoryIdentity";
import { FACTORY_CAPACITY, FACTORY_GROUPS, agentFactoryGroup, assignedTools, factoryGroup, validateFactoryAgent, type FactoryGroupId } from "@/lib/ayra/factory";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Software Factory Agents — AYRA Agent OS" },
      { name: "description", content: "Manage AYRA agents across 20 software factory departments with group identities, roles and assigned tools." },
      { property: "og:title", content: "Software Factory Agents — AYRA Agent OS" },
      { property: "og:description", content: "Manage AYRA agents across 20 software factory departments with group identities, roles and assigned tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentsPage,
});

const LAYER_OPTIONS = LAYERS.map((l) => ({ value: l.id, label: `${l.id} · ${l.name}` }));
const GROUP_OPTIONS = FACTORY_GROUPS.map(group => ({ value: group.id, label: group.name, identity: <FactoryIdentity group={group.id} small /> }));

const FIELDS: FieldDef<Agent>[] = [
  { key: "name", label: "Agent name", type: "text", required: true, placeholder: "e.g. Researcher" },
  { key: "role", label: "What it does", type: "text", required: true, placeholder: "e.g. Finds and reads sources" },
  { key: "factoryGroup", label: "Factory group", type: "select", options: GROUP_OPTIONS },
  { key: "tools", label: "Assigned tools", type: "text", placeholder: "e.g. GitHub, Playwright", wide: true },
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
  // Project into the existing editor; persisted records and execution layers stay intact.
  const agents = state.agents.map(agent => ({ ...agent, factoryGroup: agentFactoryGroup(agent), tools: agent.tools ?? "" }));
  const groupOptions = GROUP_OPTIONS.map(option => ({ ...option, label: `${option.label} · ${agents.filter(agent => agent.factoryGroup === option.value).length}/${FACTORY_CAPACITY}` }));
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        kicker="AYRA Software Factory"
        title="Agent"
        highlight="Roster"
        description={`${state.agents.length} agents · 20 factory groups · 50 agents per group`}
      />
      <EntityManager<Agent>
        itemLabel="Agent"
        items={agents}
        fields={FIELDS}
        createEmpty={() => ({ name: "", role: "", layer: "L6", model: "", status: "idle", currentAction: "Standing by", factoryGroup: "operations", tools: "" })}
        getTitle={(a) => a.name}
        searchKeys={["name", "role", "model", "tools"]}
        filter={{ key: "factoryGroup", label: "factory group", options: groupOptions }}
        sort={(a, b) => FACTORY_GROUPS.findIndex(group => group.id === agentFactoryGroup(a)) - FACTORY_GROUPS.findIndex(group => group.id === agentFactoryGroup(b))}
        groupBy={agentFactoryGroup}
        wrapTitle
        renderIdentity={agent => <FactoryIdentity group={agentFactoryGroup(agent)} />}
        cardClassName={agent => `factory-agent factory-${agentFactoryGroup(agent)}`}
        validate={agent => validateFactoryAgent(agent, state.agents)}
        renderGroupHeader={(id, members) => {
          const group = factoryGroup(id as FactoryGroupId);
          const online = members.filter(agent => agent.status !== "offline").length;
          return <div data-factory={group.id} className="factory-heading mt-2 flex flex-wrap items-center gap-3 border-b pb-3">
            <FactoryIdentity group={group.id} />
            <h2 className="min-w-0 flex-1 font-sans text-base font-semibold">{group.name}</h2>
            <span className="font-mono text-[11px] text-muted-foreground">{online} online · {members.length}/{FACTORY_CAPACITY} agents</span>
          </div>;
        }}
        onSave={(a) => saveItem("agents", a)}
        onDelete={(id) => deleteItem("agents", id)}
        renderCard={(a) => (
          <div className="space-y-3">
            <p className="factory-label flex items-center gap-1.5 text-xs font-semibold"><span className="factory-dot h-2 w-2 shrink-0 rounded-full border" />{factoryGroup(agentFactoryGroup(a)).name}</p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={a.status} />
              <span className="font-mono text-[11px] text-primary">{a.layer}</span>
              <span className="text-xs text-muted-foreground">· {a.model || "no model"}</span>
            </div>
            <p className="text-muted-foreground">{a.role}</p>
            <div className="space-y-1.5">
              <p className="factory-label text-[10px] font-semibold uppercase">Assigned tools</p>
              <div className="flex flex-wrap gap-1.5">{assignedTools(a).length ? assignedTools(a).map(tool => <span key={tool} className="factory-tool max-w-full break-words rounded-sm border px-2 py-1 font-mono text-[10px]">{tool}</span>) : <span className="text-xs text-muted-foreground">Not assigned</span>}</div>
            </div>
            <p className="rounded-sm border border-border bg-background/50 px-2.5 py-1.5 font-mono text-[11px] text-foreground/80">
              <span className="text-primary">›</span> {a.currentAction}
            </p>
          </div>
        )}
      />
    </div>
  );
}
