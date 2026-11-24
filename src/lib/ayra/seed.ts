import type { Agent, Gate, ModelRoute, Module, PhaseId, RoadmapTask, Settings } from "./types";

type M = Omit<Module, "id">;
const mods: M[] = [
  { name: "Agent OS Kernel", layer: "L0", repo: "bit-cook/Agent-OS-Kernel", language: "Python", isolation: "Docker", gpu: false, status: "installing", phase: 1, notes: "Fallback: Letta as kernel" },
  { name: "Test-time Reasoning", layer: "L1", repo: "s1 + Quiet-STaR techniques", language: "—", isolation: "—", gpu: false, status: "planned", phase: 1, notes: "3–5 parallel reasoning paths for hard tasks" },
  { name: "Letta Memory", layer: "L2", repo: "letta-ai/letta", language: "Python", isolation: "Docker", gpu: false, status: "active", phase: 1, notes: "Tiered paging, PostgreSQL + pgvector" },
  { name: "Graphiti", layer: "L2", repo: "getzep/graphiti", language: "Python", isolation: "Docker", gpu: false, status: "planned", phase: 1, notes: "Temporal knowledge graph" },
  { name: "MCP Gateway", layer: "L3", repo: "NASA-IMPACT/mcp-gateway-registry", language: "TypeScript", isolation: "Docker", gpu: false, status: "active", phase: 1, notes: "OAuth, discovery, audit, rate-limit" },
  { name: "UI-TARS", layer: "L4", repo: "ByteDance-Seed/UI-TARS", language: "Python", isolation: "Firecracker", gpu: true, status: "planned", phase: 3, notes: "GPU required — cloud fallback" },
  { name: "browser-use", layer: "L4", repo: "browser-use/browser-use", language: "Python", isolation: "Docker", gpu: false, status: "active", phase: 3, notes: "CPU-friendly fallback with Playwright" },
  { name: "OpenHands", layer: "L5", repo: "OpenHands/OpenHands", language: "Python", isolation: "Firecracker", gpu: false, status: "installing", phase: 2, notes: "Sandboxed coding agent" },
  { name: "Software Factory Team", layer: "L5", repo: "achisolomon/software-factory", language: "Plugin", isolation: "Docker", gpu: false, status: "planned", phase: 2, notes: "Architect / Dev / Test / Security / UX" },
  { name: "Lean 4 Verify", layer: "L5", repo: "leanprover/lean4", language: "Lean", isolation: "Docker", gpu: false, status: "planned", phase: 2, notes: "Payment / auth critical paths only" },
  { name: "LangGraph", layer: "L6", repo: "langchain-ai/langgraph", language: "TypeScript", isolation: "—", gpu: false, status: "active", phase: 1, notes: "Stateful, checkpointed graphs" },
  { name: "Paperclip", layer: "L6", repo: "paperclipai/paperclip", language: "TypeScript", isolation: "Docker", gpu: false, status: "installing", phase: 1, notes: "Org chart, budgets, approvals" },
  { name: "RAGEN Policies", layer: "L6", repo: "RAGEN-AI/RAGEN", language: "Python", isolation: "GPU cluster", gpu: true, status: "planned", phase: 3, notes: "RL-trained agent policies" },
  { name: "DSPy", layer: "L7", repo: "stanfordnlp/dspy", language: "Python", isolation: "Docker", gpu: false, status: "planned", phase: 3, notes: "Weekly prompt optimization" },
  { name: "Moshi Voice", layer: "L8", repo: "kyutai-labs/moshi", language: "Python", isolation: "Firecracker", gpu: true, status: "planned", phase: 5, notes: "Fallback: Whisper + TTS on CPU" },
  { name: "Sokosumi Marketplace", layer: "L9", repo: "masumi-network/sokosumi", language: "TypeScript", isolation: "Docker", gpu: false, status: "planned", phase: 4, notes: "Marketplace frontend" },
  { name: "AgentPayy", layer: "L9", repo: "AgentPayy/agentpayy-platform", language: "TypeScript", isolation: "Docker", gpu: false, status: "planned", phase: 4, notes: "x402 payments, USDC on Base" },
  { name: "Langfuse", layer: "L10", repo: "langfuse/langfuse", language: "TypeScript", isolation: "Docker", gpu: false, status: "active", phase: 3, notes: "Every LLM and tool call traced" },
  { name: "Wazuh + CrowdSec + Fail2ban", layer: "L10", repo: "wazuh / crowdsec / fail2ban", language: "Mixed", isolation: "Docker", gpu: false, status: "active", phase: 0, notes: "Owner VPS only — never external" },
];

type A = Omit<Agent, "id" | "status" | "currentAction">;
const agents: A[] = [
  { name: "Kernel", role: "Scheduler & checkpoints", layer: "L0", model: "Local SLM" },
  { name: "Router", role: "Picks model per task", layer: "L1", model: "Phi-3-mini" },
  { name: "Memory Keeper", role: "Saves and recalls memory", layer: "L2", model: "Qwen-1.5B" },
  { name: "Tool Bus", role: "Calls MCP tools", layer: "L3", model: "—" },
  { name: "Operator", role: "Uses browser & screen", layer: "L4", model: "GPT Vision" },
  { name: "Architect", role: "Designs code structure", layer: "L5", model: "Claude" },
  { name: "Developer", role: "Writes code", layer: "L5", model: "Claude" },
  { name: "Tester", role: "Runs holdout tests", layer: "L5", model: "DeepSeek" },
  { name: "Orchestrator", role: "Leads agent teams", layer: "L6", model: "GPT" },
  { name: "Evolver", role: "Improves prompts weekly", layer: "L7", model: "DSPy" },
  { name: "Voice", role: "Talks and listens", layer: "L8", model: "Whisper + TTS" },
  { name: "Broker", role: "Marketplace & payments", layer: "L9", model: "GPT" },
  { name: "Sentinel", role: "Guards your VPS", layer: "L10", model: "Local SLM" },
];

const models: Omit<ModelRoute, "id">[] = [
  { name: "Phi-3-mini (q4)", provider: "Local", tier: "SLM", runsOn: "CPU", priority: 1, costPer1k: 0, enabled: true },
  { name: "Qwen-1.5B (q4)", provider: "Local", tier: "SLM", runsOn: "CPU", priority: 2, costPer1k: 0, enabled: true },
  { name: "Groq Llama", provider: "Groq", tier: "Mid", runsOn: "API", priority: 3, costPer1k: 0.0006, enabled: true },
  { name: "DeepSeek", provider: "DeepSeek", tier: "Mid", runsOn: "API", priority: 4, costPer1k: 0.001, enabled: true },
  { name: "Gemini", provider: "Google", tier: "Mid", runsOn: "API", priority: 5, costPer1k: 0.002, enabled: true },
  { name: "Claude", provider: "Anthropic", tier: "Frontier", runsOn: "API", priority: 6, costPer1k: 0.015, enabled: true },
  { name: "GPT", provider: "OpenAI", tier: "Frontier", runsOn: "API", priority: 7, costPer1k: 0.012, enabled: true },
];

const gates: Omit<Gate, "id">[] = [
  { name: "Any payment above $0.01", action: "payment", mode: "confirm", description: "Amount and recipient shown before paying.", enabled: true },
  { name: "Form submit on outside website", action: "form_submit", mode: "confirm", description: "Dry-run screenshot first, then you confirm.", enabled: true },
  { name: "File delete", action: "file_delete", mode: "confirm", description: "Except AYRA's own temp and cache.", enabled: true },
  { name: "Deploy to production", action: "deploy", mode: "confirm", description: "Canary first, then you approve.", enabled: true },
  { name: "Message to an outside person", action: "external_message", mode: "confirm", description: "Email, WhatsApp, Telegram to anyone except you.", enabled: true },
  { name: "Publish to marketplace", action: "publish", mode: "confirm", description: "New or changed listing.", enabled: true },
  { name: "Self-modification of production code", action: "self_modify", mode: "confirm", description: "Only after frozen benchmark passes.", enabled: true },
  { name: "Scan or attack non-Owner systems", action: "external_scan", mode: "block", description: "Defensive only. Always refused.", enabled: true },
  { name: "Data to unconfigured AI provider", action: "unconfigured_llm", mode: "block", description: "Only providers in Model Router allowed.", enabled: true },
];

function withIds<T>(prefix: string, list: T[]) {
  return list.map((item, i) => ({ ...item, id: `${prefix}-${i + 1}` }));
}

export const SEED_MODULES: Module[] = withIds("mod", mods);
export const SEED_AGENTS: Agent[] = withIds("agt", agents).map((a) => ({
  ...a,
  status: "idle" as const,
  currentAction: "Standing by",
}));
export const SEED_MODELS: ModelRoute[] = withIds("mdl", models);
export const SEED_GATES: Gate[] = withIds("gate", gates);
export const SEED_SETTINGS: Settings = { approvalCostLimit: 0.5, dailyBudget: 10, autopilot: true };

const tasks: [PhaseId, string, string][] = [
  ["0", "Install Docker on the VPS", "L0"],
  ["0", "Set up PostgreSQL + pgvector", "L2"],
  ["0", "Install Node.js runtime", "L0"],
  ["0", "Add DATABASE_URL and LLM keys", "L1"],
  ["0", "Worker executes a task", "L0"],
  ["0", "Verify all 23 routes", "L10"],
  ["1", "L0 Kernel running", "L0"],
  ["1", "L2 basic memory (persists across sessions)", "L2"],
  ["1", "L3 Tool Bus — register 3 tools via MCP", "L3"],
  ["1", "L6 LangGraph workflows", "L6"],
  ["2", "L5 OpenHands coding agent", "L5"],
  ["2", "Firecracker microVM isolation", "L5"],
  ["2", "Holdout test verification", "L5"],
  ["3", "L4 UI-TARS booking (cloud fallback)", "L4"],
  ["3", "L7 DSPy weekly prompt optimization", "L7"],
  ["3", "L10 Langfuse full tracing", "L10"],
  ["3", "L6 RAGEN RL policies for top 10 roles", "L6"],
  ["4", "L9 Marketplace live", "L9"],
  ["4", "x402 payments working", "L9"],
  ["4", "First external customer", "L9"],
  ["5", "L7 full self-improvement", "L7"],
  ["5", "L8 voice", "L8"],
  ["5", "L6 RL across 300 roles", "L6"],
];

export const SEED_TASKS: RoadmapTask[] = tasks.map(([phase, title, layer], i) => ({
  id: `task-${i + 1}`,
  title,
  phase,
  layer,
  done: false,
  notes: "",
}));
