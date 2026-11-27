import { describe, expect, it } from "vitest";
import { FACTORY_GROUPS, agentFactoryGroup, assignedTools, validateFactoryAgent } from "@/lib/ayra/factory";
import { SEED_AGENTS } from "@/lib/ayra/seed";
import type { Agent } from "@/lib/ayra/types";

const makeAgent = (id: string, factoryGroup = "development"): Agent => ({ id, name: `Agent ${id}`, role: "Software engineer", layer: "L5", model: "Claude", status: "idle", currentAction: "Standing by", factoryGroup });

describe("Factory roster organization", () => {
  it("provides all 20 requested factory groups with unique icons", () => {
    expect(FACTORY_GROUPS.map(group => group.name)).toEqual([
      "Development", "QA & Testing", "DevOps & Infrastructure", "Security", "AI & Agent Engineering", "SEO", "Lead Generation", "Sales", "Customer Support", "HR & Recruitment", "Finance & Accounting", "Marketing", "Product & Project Management", "Data & Analytics", "Business Operations", "Customer Success", "Legal & Compliance", "Research & Innovation", "Content & Documentation", "Executive Control & Governance",
    ]);
    expect(new Set(FACTORY_GROUPS.map(group => group.icon)).size).toBe(20);
  });
  it("reuses every existing agent once without changing IDs or execution layers", () => {
    const before = structuredClone(SEED_AGENTS);
    const grouped = FACTORY_GROUPS.flatMap(group => SEED_AGENTS.filter(agent => agentFactoryGroup(agent) === group.id));
    expect(grouped).toHaveLength(13);
    expect(new Set(grouped.map(agent => agent.id)).size).toBe(13);
    expect(SEED_AGENTS).toEqual(before);
    expect(grouped.find(agent => agent.name === "Tester")?.id).toBe("agt-8");
    expect(agentFactoryGroup({ ...makeAgent("tester"), name: "Tester", factoryGroup: "" })).toBe("qa");
  });
  it("supports 50 agents in a group but rejects a 51st manual addition", () => {
    const roster = Array.from({ length: 49 }, (_, i) => makeAgent(String(i)));
    const fiftieth = makeAgent("50");
    expect(validateFactoryAgent(fiftieth, roster)).toBeNull();
    expect(validateFactoryAgent(makeAgent("51"), [...roster, fiftieth])).toContain("50 agents");
    expect(validateFactoryAgent(fiftieth, [...roster, fiftieth])).toBeNull();
    expect(validateFactoryAgent(makeAgent("51", "qa"), [...roster, fiftieth])).toBeNull();
  });
  it("rejects duplicate names regardless of case or group", () => {
    expect(validateFactoryAgent({ ...makeAgent("new", "qa"), name: " agent existing " }, [makeAgent("existing")])).toContain("already exists");
    expect(validateFactoryAgent(makeAgent("existing"), [makeAgent("existing")])).toBeNull();
  });
  it("respects a manually assigned factory group without changing its layer", () => {
    const agent = makeAgent("qa", "qa");
    expect(agentFactoryGroup(agent)).toBe("qa");
    expect(agent.layer).toBe("L5");
  });
  it("does not invent tool assignments and deduplicates entered tools", () => {
    expect(assignedTools(makeAgent("empty"))).toEqual([]);
    expect(assignedTools({ ...makeAgent("tools"), tools: "GitHub, Playwright, GitHub, " })).toEqual(["GitHub", "Playwright"]);
  });
});