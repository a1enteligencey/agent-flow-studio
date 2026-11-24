import type {
  ActionKind,
  Agent,
  Gate,
  Intent,
  LayerId,
  LogLevel,
  Mission,
  ModelRoute,
  PhaseId,
  StageId,
} from "./types";

export const LAYERS: { id: LayerId; name: string; hint: string }[] = [
  { id: "L0", name: "Kernel", hint: "Scheduling, checkpoints, audit trail" },
  { id: "L1", name: "Model Router", hint: "Picks the right AI model per task" },
  { id: "L2", name: "Memory", hint: "Working, episodic and knowledge memory" },
  { id: "L3", name: "Tool Bus", hint: "All tools connected over MCP" },
  { id: "L4", name: "Computer Use", hint: "Sees the screen, clicks and types" },
  { id: "L5", name: "Software Factory", hint: "Writes, tests and ships code" },
  { id: "L6", name: "Orchestration", hint: "Teams of agents working together" },
  { id: "L7", name: "Self-Improvement", hint: "Gets better every week" },
  { id: "L8", name: "Voice", hint: "Talk and listen in real time" },
  { id: "L9", name: "Marketplace", hint: "Sell agent skills, get paid" },
  { id: "L10", name: "Observability & Security", hint: "Tracing, tests, defence" },
];

export const STAGES: { id: StageId; label: string; hint: string }[] = [
  { id: "classify", label: "Classify", hint: "Understanding what you asked for" },
  { id: "route", label: "Route", hint: "Picking the right layers, model and agents" },
  { id: "plan", label: "Plan", hint: "Writing a step-by-step plan" },
  { id: "gate", label: "Owner Gate", hint: "Checking if your approval is needed" },
  { id: "execute", label: "Execute", hint: "Agents are doing the work" },
  { id: "verify", label: "Verify", hint: "Testing and double-checking the result" },
  { id: "report", label: "Report", hint: "Summary, cost and trace ready" },
  { id: "learn", label: "Learn", hint: "Saving lessons to memory" },
];

export const INTENTS: Intent[] = [
  "CODING",
  "RESEARCH",
  "BOOKING",
  "MARKETPLACE",
  "SECURITY",
  "VOICE",
  "GENERAL",
];

export const ACTION_LABELS: Record<ActionKind, string> = {
  payment: "Payment",
  form_submit: "Submit form on external site",
  file_delete: "Delete files",
  deploy: "Deploy to production",
  external_message: "Message an outside person",
  publish: "Publish to marketplace",
  self_modify: "Change its own code",
  external_scan: "Scan a system you don't own",
  unconfigured_llm: "Send data to unknown AI provider",
};

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  CODING: ["build", "code", "fix", "bug", "app", "website", "landing", "api", "refactor", "feature", "deploy"],
  RESEARCH: ["research", "find", "compare", "summarize", "summarise", "analyze", "analyse", "search", "study", "report"],
  BOOKING: ["book", "ticket", "form", "fill", "reserve", "appointment", "flight", "train", "hotel"],
  MARKETPLACE: ["sell", "marketplace", "hire", "publish", "listing", "pay", "invoice", "customer"],
  SECURITY: ["security", "firewall", "brute", "attack", "intrusion", "wazuh", "crowdsec", "vulnerability", "logs"],
  VOICE: ["voice", "call", "speak", "listen", "talk"],
  GENERAL: [],
};

const ACTION_KEYWORDS: Record<ActionKind, string[]> = {
  payment: ["pay", "payment", "buy", "purchase", "usdc", "invoice"],
  form_submit: ["book", "submit", "fill", "register", "reserve"],
  file_delete: ["delete", "wipe", "erase"],
  deploy: ["deploy", "production", "release", "ship"],
  external_message: ["email", "whatsapp", "telegram", "send message", "message to", "notify"],
  publish: ["publish", "go live"],
  self_modify: ["self-improve", "modify yourself", "rewrite yourself", "evolve"],
  external_scan: ["pentest", "hack", "ddos", "probe", "attack their", "scan their"],
  unconfigured_llm: [],
};

function words(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function hasKeyword(text: string, keyword: string) {
  if (keyword.includes(" ")) return text.includes(keyword);
  return new RegExp(`\\b${keyword}`).test(text);
}

export function classifyIntent(prompt: string): Intent {
  const text = words(prompt);
  let best: Intent = "GENERAL";
  let bestScore = 0;
  for (const intent of INTENTS) {
    const score = INTENT_KEYWORDS[intent].filter((k) => hasKeyword(text, k)).length;
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  return best;
}

export function detectActions(prompt: string): ActionKind[] {
  const text = words(prompt);
  return (Object.keys(ACTION_KEYWORDS) as ActionKind[]).filter((a) =>
    ACTION_KEYWORDS[a].some((k) => hasKeyword(text, k)),
  );
}

export const INTENT_LAYERS: Record<Intent, LayerId[]> = {
  CODING: ["L1", "L5", "L6", "L10"],
  RESEARCH: ["L1", "L2", "L3", "L6"],
  BOOKING: ["L4", "L3", "L6"],
  MARKETPLACE: ["L9", "L6", "L3"],
  SECURITY: ["L10", "L0"],
  VOICE: ["L8", "L1"],
  GENERAL: ["L1", "L2"],
};

const INTENT_BASE_COST: Record<Intent, number> = {
  CODING: 0.42,
  RESEARCH: 0.18,
  BOOKING: 0.12,
  MARKETPLACE: 0.09,
  SECURITY: 0.05,
  VOICE: 0.07,
  GENERAL: 0.02,
};

export function estimateCost(intent: Intent, prompt: string): number {
  const extra = (Math.min(prompt.length, 400) / 400) * 0.2;
  return Math.round((INTENT_BASE_COST[intent] + extra) * 100) / 100;
}

export type GateDecision = "auto" | "approval" | "blocked";
export interface GateResult {
  decision: GateDecision;
  reasons: string[];
  alerts: string[];
}

/**
 * Owner gate (spec §3 + §6): any enabled "block" gate that matches refuses the mission,
 * otherwise an enabled "confirm" gate or a cost above the limit needs Owner approval.
 */
export function evaluateGate(
  actions: ActionKind[],
  estCost: number,
  gates: Gate[],
  costLimit: number,
): GateResult {
  const active = gates.filter((g) => g.enabled && actions.includes(g.action));
  const alerts = active.filter((g) => g.mode === "alert").map((g) => g.name);
  const blocked = active.filter((g) => g.mode === "block").map((g) => g.name);
  if (blocked.length > 0) return { decision: "blocked", reasons: blocked, alerts };
  const reasons = active.filter((g) => g.mode === "confirm").map((g) => g.name);
  if (estCost > costLimit) {
    reasons.unshift(
      `Estimated cost $${estCost.toFixed(2)} is above your $${costLimit.toFixed(2)} limit`,
    );
  }
  return { decision: reasons.length > 0 ? "approval" : "auto", reasons, alerts };
}

export function pickModel(models: ModelRoute[], intent: Intent): ModelRoute | undefined {
  const enabled = models.filter((m) => m.enabled).sort((a, b) => a.priority - b.priority);
  const want =
    intent === "CODING" || intent === "MARKETPLACE"
      ? "Frontier"
      : intent === "GENERAL" || intent === "SECURITY"
        ? "SLM"
        : "Mid";
  return enabled.find((m) => m.tier === want) ?? enabled[0];
}

export function pickAgents(agents: Agent[], layers: LayerId[]): Agent[] {
  const usable = agents.filter((a) => a.status !== "offline");
  const picked = usable.filter((a) => layers.includes(a.layer)).slice(0, 4);
  const orchestrator = usable.find((a) => a.layer === "L6");
  if (orchestrator && !picked.some((a) => a.id === orchestrator.id)) picked.unshift(orchestrator);
  return picked.slice(0, 4);
}

export interface StageLine {
  level: LogLevel;
  text: string;
  agent: string;
}

const EXECUTE_LINES: Record<Intent, string[]> = {
  CODING: [
    "Spinning up isolated sandbox (Firecracker microVM)",
    "Architect drafted file structure — 9 files",
    "Developer writing code… 412 lines added",
    "Build passed in sandbox",
  ],
  RESEARCH: [
    "Searching 14 sources across web and documents",
    "Reading and extracting key facts",
    "Linking facts into knowledge graph",
  ],
  BOOKING: [
    "Opening browser in isolated session",
    "Reading the page from screenshot",
    "Filling in the form fields",
  ],
  MARKETPLACE: [
    "Wrapping agent as an MCP server listing",
    "Setting per-call price and budget limit",
    "Preparing x402 payment channel",
  ],
  SECURITY: [
    "Reading Wazuh and Fail2ban logs on your VPS",
    "Checking CrowdSec blocklist",
    "No active threats on Owner systems",
  ],
  VOICE: ["Opening voice channel", "Listening and transcribing", "Generating spoken reply"],
  GENERAL: ["Looking up memory for context", "Writing the answer"],
};

const VERIFY_LINES: Record<Intent, string[]> = {
  CODING: ["Holdout tests: 48 / 48 passed", "Trivy security scan: 0 critical issues"],
  RESEARCH: ["Cross-checking facts with a second model", "All claims have a source"],
  BOOKING: ["Dry-run screenshot captured for your review"],
  MARKETPLACE: ["Listing price and recipient double-checked"],
  SECURITY: ["Findings confirmed only on your own VPS"],
  VOICE: ["Latency check: 280 ms"],
  GENERAL: ["Answer checked against memory"],
};

function agentName(agents: Agent[], index: number, fallback: string) {
  if (agents.length === 0) return fallback;
  return agents[index % agents.length]?.name ?? fallback;
}

export function stageLines(stage: StageId, m: Mission, team: Agent[]): StageLine[] {
  const short = m.prompt.length > 70 ? `${m.prompt.slice(0, 70)}…` : m.prompt;
  switch (stage) {
    case "classify":
      return [
        { level: "think", agent: "AYRA Core", text: `Reading request: “${short}”` },
        { level: "success", agent: "AYRA Core", text: `Intent detected → ${m.intent}` },
      ];
    case "route":
      return [
        { level: "info", agent: "Model Router", text: `Routing to layers ${m.layers.join(" · ")}` },
        { level: "info", agent: "Model Router", text: `Model selected → ${m.model}` },
        {
          level: "success",
          agent: "Orchestrator",
          text: team.length
            ? `Team assigned: ${team.map((a) => a.name).join(", ")}`
            : "No agents available — running with core only",
        },
      ];
    case "plan":
      return [
        { level: "think", agent: agentName(team, 0, "AYRA Core"), text: "Drafting execution plan…" },
        {
          level: "info",
          agent: agentName(team, 0, "AYRA Core"),
          text: `Plan ready: ${EXECUTE_LINES[m.intent].length + 2} steps · est. cost $${m.estCost.toFixed(2)}`,
        },
      ];
    case "gate":
      return [];
    case "execute":
      return EXECUTE_LINES[m.intent].map((text, i) => ({
        level: "info" as const,
        agent: agentName(team, i + 1, "AYRA Core"),
        text,
      }));
    case "verify":
      return VERIFY_LINES[m.intent].map((text, i) => ({
        level: "success" as const,
        agent: agentName(team, i + 2, "Verifier"),
        text,
      }));
    case "report":
      return [
        {
          level: "success",
          agent: "AYRA Core",
          text: `Report ready · trace ${m.traceId} · cost $${m.estCost.toFixed(2)}`,
        },
      ];
    case "learn":
      return [
        { level: "info", agent: "Memory Keeper", text: "Mission saved to episodic memory" },
        { level: "info", agent: "Memory Keeper", text: "Queued for weekly prompt optimization" },
      ];
  }
}

export const SAMPLE_PROMPTS = [
  "Research the cheapest GPU rental options under $1 per hour",
  "Check my VPS logs for brute-force attempts",
  "Fix the login bug in the dashboard app and run tests",
  "Book a train ticket from Delhi to Mumbai for Friday",
  "Summarize this week's mission traces",
  "Publish the research agent to the marketplace",
  "Build a landing page for the AYRA marketplace and deploy it",
  "Compare Letta and Agent-OS-Kernel for tiered memory",
];

export const PHASES: { id: PhaseId; name: string; when: string; exit: string }[] = [
  { id: "0", name: "Base", when: "Weeks 1–2", exit: "AYRA can run a simple end-to-end task on its own" },
  { id: "1", name: "Foundation Workers", when: "Weeks 3–8", exit: "3 tools registered via MCP, memory persists across sessions" },
  { id: "2", name: "Factory v1", when: "Weeks 9–16", exit: "AYRA builds and verifies a small project autonomously" },
  { id: "3", name: "Frontier Additions", when: "Months 5–12", exit: "Booking works end-to-end; 10 roles RL-trained" },
  { id: "4", name: "Commerce", when: "Months 13–24", exit: "First paid transaction completed" },
  { id: "5", name: "Autonomy", when: "Months 25–48", exit: "AYRA ships improvements weekly with Owner approval" },
];

/** Share of ticked tasks in a phase, 0–100, rounded. Empty phase counts as 0. */
export function phaseProgress(tasks: { phase: PhaseId; done: boolean }[], phase: PhaseId): number {
  const inPhase = tasks.filter((t) => t.phase === phase);
  if (inPhase.length === 0) return 0;
  return Math.round((inPhase.filter((t) => t.done).length / inPhase.length) * 100);
}

/** The first phase that still has unticked tasks — where the Owner is now. */
export function currentPhase(tasks: { phase: PhaseId; done: boolean }[]): PhaseId | null {
  return PHASES.find((p) => tasks.some((t) => t.phase === p.id && !t.done))?.id ?? null;
}

/** How far a mission is through the 8-step flow, 0–100. linesInStage = lines the current step has. */
export function missionProgress(m: Pick<Mission, "status" | "stageIndex" | "step">, linesInStage: number): number {
  if (m.status === "completed") return 100;
  const within = linesInStage > 0 ? Math.min(m.step / linesInStage, 1) : 0;
  return Math.round(((m.stageIndex + within) / STAGES.length) * 100);
}
