import type { Agent } from "./types";

/** Presentation metadata only; factory membership never changes execution layers. */
export const FACTORY_GROUPS = [
  { id: "development", name: "Development", icon: "Code2" },
  { id: "qa", name: "QA & Testing", icon: "Bug" },
  { id: "devops", name: "DevOps & Infrastructure", icon: "Server" },
  { id: "security", name: "Security", icon: "ShieldCheck" },
  { id: "ai", name: "AI & Agent Engineering", icon: "BrainCircuit" },
  { id: "seo", name: "SEO", icon: "Search" },
  { id: "leads", name: "Lead Generation", icon: "Target" },
  { id: "sales", name: "Sales", icon: "Handshake" },
  { id: "support", name: "Customer Support", icon: "Headset" },
  { id: "hr", name: "HR & Recruitment", icon: "Users" },
  { id: "finance", name: "Finance & Accounting", icon: "Wallet" },
  { id: "marketing", name: "Marketing", icon: "Megaphone" },
  { id: "product", name: "Product & Project Management", icon: "Layers" },
  { id: "data", name: "Data & Analytics", icon: "Database" },
  { id: "operations", name: "Business Operations", icon: "Workflow" },
  { id: "success", name: "Customer Success", icon: "HeartHandshake" },
  { id: "legal", name: "Legal & Compliance", icon: "Scale" },
  { id: "research", name: "Research & Innovation", icon: "Microscope" },
  { id: "content", name: "Content & Documentation", icon: "FileText" },
  { id: "governance", name: "Executive Control & Governance", icon: "Gauge" },
] as const;

export type FactoryGroupId = (typeof FACTORY_GROUPS)[number]["id"];
export const FACTORY_CAPACITY = 50;

const EXISTING_MEMBERSHIP: Record<string, FactoryGroupId> = {
  kernel: "devops", router: "ai", "memory keeper": "data", "tool bus": "ai",
  operator: "operations", architect: "development", developer: "development",
  tester: "qa", orchestrator: "governance", evolver: "ai", voice: "support",
  broker: "finance", sentinel: "security",
};

const ROLE_MATCHES: [FactoryGroupId, RegExp][] = [
  ["qa", /\b(test|tester|testing|qa|quality)\b/i],
  ["security", /\b(security|sentinel|cyber|guards|threat)\b/i],
  ["devops", /\b(devops|infrastructure|deployment|sre|scheduler)\b/i],
  ["seo", /\b(seo|search engine)\b/i],
  ["leads", /\b(lead generation|prospecting|leads)\b/i],
  ["success", /\b(customer success|retention|onboarding)\b/i],
  ["sales", /\b(sales|account executive|closer)\b/i],
  ["support", /\b(support|helpdesk|talks|listens)\b/i],
  ["hr", /\b(hr|recruitment|recruiter|hiring|human resources)\b/i],
  ["finance", /\b(finance|accounting|payments|bookkeeping|payroll)\b/i],
  ["marketing", /\b(marketing|campaign|social media|advertising)\b/i],
  ["product", /\b(product|project|scrum|ux|ui design)\b/i],
  ["data", /\b(data|analytics|database|memory)\b/i],
  ["legal", /\b(legal|compliance|contract|privacy)\b/i],
  ["research", /\b(research|innovation|scientist)\b/i],
  ["content", /\b(content|documentation|technical writer|copywriter)\b/i],
  ["governance", /\b(executive|governance|orchestrator|chief|approval)\b/i],
  ["ai", /\b(ai|model|prompt|agent engineering|mcp)\b/i],
  ["development", /\b(developer|development|architect|code|coding|frontend|backend|engineer)\b/i],
];

export function agentFactoryGroup(agent: Agent): FactoryGroupId {
  if (FACTORY_GROUPS.some(group => group.id === agent.factoryGroup)) return agent.factoryGroup as FactoryGroupId;
  const existing = EXISTING_MEMBERSHIP[agent.name.trim().toLowerCase()];
  if (existing) return existing;
  const match = ROLE_MATCHES.find(([, pattern]) => pattern.test(`${agent.name} ${agent.role}`));
  if (match) return match[0];
  return agent.layer === "L5" ? "development" : agent.layer === "L10" ? "security" : "operations";
}

export function factoryGroup(id: FactoryGroupId) {
  return FACTORY_GROUPS.find(group => group.id === id) ?? FACTORY_GROUPS[14];
}

export function assignedTools(agent: Agent): string[] {
  return [...new Set((agent.tools ?? "").split(",").map(tool => tool.trim()).filter(Boolean))];
}

/** Applies only to manual roster edits, not mission or agent workflow updates. */
export function validateFactoryAgent(agent: Agent, agents: Agent[]): string | null {
  if (agents.some(existing => existing.id !== agent.id && existing.name.trim().toLowerCase() === agent.name.trim().toLowerCase())) {
    return "An agent with this name already exists. Edit that agent instead.";
  }
  const group = agentFactoryGroup(agent);
  if (agents.filter(existing => existing.id !== agent.id && agentFactoryGroup(existing) === group).length >= FACTORY_CAPACITY) {
    return `${factoryGroup(group).name} already has 50 agents. Choose another group.`;
  }
  return null;
}