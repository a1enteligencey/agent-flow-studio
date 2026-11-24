export const LAYER_IDS = ["L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10"] as const;
export type LayerId = (typeof LAYER_IDS)[number];

export type Intent =
  | "CODING"
  | "RESEARCH"
  | "BOOKING"
  | "MARKETPLACE"
  | "SECURITY"
  | "VOICE"
  | "GENERAL";

export type ActionKind =
  | "payment"
  | "form_submit"
  | "file_delete"
  | "deploy"
  | "external_message"
  | "publish"
  | "self_modify"
  | "external_scan"
  | "unconfigured_llm";

export type ModuleStatus = "planned" | "installing" | "active" | "degraded" | "offline";
export interface Module {
  id: string;
  name: string;
  layer: LayerId;
  repo: string;
  language: string;
  isolation: string;
  gpu: boolean;
  status: ModuleStatus;
  phase: number;
  notes: string;
}

export type AgentStatus = "idle" | "working" | "waiting" | "offline";
export interface Agent {
  id: string;
  name: string;
  role: string;
  layer: LayerId;
  model: string;
  status: AgentStatus;
  currentAction: string;
}

export type ModelTier = "SLM" | "Mid" | "Frontier";
export interface ModelRoute {
  id: string;
  name: string;
  provider: string;
  tier: ModelTier;
  runsOn: "CPU" | "API" | "GPU";
  priority: number;
  costPer1k: number;
  enabled: boolean;
}

export type GateMode = "confirm" | "block" | "alert";
export interface Gate {
  id: string;
  name: string;
  action: ActionKind;
  mode: GateMode;
  description: string;
  enabled: boolean;
}

export interface Settings {
  approvalCostLimit: number;
  dailyBudget: number;
  autopilot: boolean;
}

export type StageId =
  | "classify"
  | "route"
  | "plan"
  | "gate"
  | "execute"
  | "verify"
  | "report"
  | "learn";

export type MissionStatus = "running" | "awaiting_approval" | "blocked" | "completed" | "rejected";

export interface Mission {
  id: string;
  code: string;
  traceId: string;
  prompt: string;
  intent: Intent;
  layers: LayerId[];
  actions: ActionKind[];
  estCost: number;
  cost: number;
  model: string;
  stageIndex: number;
  step: number;
  status: MissionStatus;
  approval: "none" | "pending" | "approved" | "rejected";
  gateReasons: string[];
  agentIds: string[];
  createdAt: number;
  finishedAt: number | null;
}

export type LogLevel = "info" | "success" | "warn" | "error" | "think";
export interface LogLine {
  id: string;
  ts: number;
  missionId: string;
  missionCode: string;
  stage: StageId;
  agent: string;
  level: LogLevel;
  text: string;
}
