import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";

import {
  INTENT_LAYERS,
  SAMPLE_PROMPTS,
  STAGES,
  classifyIntent,
  detectActions,
  estimateCost,
  evaluateGate,
  pickAgents,
  pickModel,
  stageLines,
} from "./engine";
import { SEED_AGENTS, SEED_GATES, SEED_MODELS, SEED_MODULES, SEED_SETTINGS, SEED_TASKS } from "./seed";
import type {
  ActionKind,
  Agent,
  Gate,
  RoadmapTask,
  Intent,
  LogLine,
  Mission,
  ModelRoute,
  Module,
  Settings,
} from "./types";

export interface Collections {
  modules: Module;
  agents: Agent;
  models: ModelRoute;
  gates: Gate;
  tasks: RoadmapTask;
}
export type CollectionKey = keyof Collections;

export interface AyraState {
  modules: Module[];
  agents: Agent[];
  models: ModelRoute[];
  gates: Gate[];
  tasks: RoadmapTask[];
  settings: Settings;
  missions: Mission[];
  logs: LogLine[];
  logSeq: number;
}

const STORAGE_KEY = "ayra.state.v1";
const MAX_LOGS = 250;
const MAX_MISSIONS = 60;

export const initialState: AyraState = {
  modules: SEED_MODULES,
  agents: SEED_AGENTS,
  models: SEED_MODELS,
  gates: SEED_GATES,
  tasks: SEED_TASKS,
  settings: SEED_SETTINGS,
  missions: [],
  logs: [],
  logSeq: 0,
};

export interface LaunchInput {
  id: string;
  code: string;
  traceId: string;
  prompt: string;
  intent: Intent;
  actions: ActionKind[];
  now: number;
}

type Action =
  | { type: "hydrate"; state: Partial<AyraState> }
  | { type: "save"; key: CollectionKey; item: Collections[CollectionKey] }
  | { type: "delete"; key: CollectionKey; id: string }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "launch"; input: LaunchInput }
  | { type: "approve"; id: string; now: number }
  | { type: "reject"; id: string; now: number }
  | { type: "deleteMission"; id: string }
  | { type: "clearHistory" }
  | { type: "reset" }
  | { type: "tick"; now: number };

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const exists = list.some((x) => x.id === item.id);
  return exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

const ACTIVE: Mission["status"][] = ["running", "awaiting_approval"];

/** Frees agents that are no longer on an active mission. */
function releaseAgents(agents: Agent[], missions: Mission[]): Agent[] {
  const busy = new Set(missions.filter((m) => ACTIVE.includes(m.status)).flatMap((m) => m.agentIds));
  return agents.map((a) =>
    (a.status === "working" || a.status === "waiting") && !busy.has(a.id)
      ? { ...a, status: "idle", currentAction: "Standing by" }
      : a,
  );
}

export function tick(state: AyraState, now: number): AyraState {
  let seq = state.logSeq;
  const newLogs: LogLine[] = [];
  const agentMap = new Map(state.agents.map((a) => [a.id, { ...a }]));

  const log = (m: Mission, level: LogLine["level"], agent: string, text: string) => {
    seq += 1;
    const stage = STAGES[m.stageIndex]?.id ?? "learn";
    newLogs.push({ id: `log-${seq}`, ts: now, missionId: m.id, missionCode: m.code, stage, agent, level, text });
  };

  const missions = state.missions.map((original) => {
    if (original.status !== "running") return original;
    const m: Mission = { ...original };
    const stage = STAGES[m.stageIndex];
    if (!stage) return { ...m, status: "completed" as const, finishedAt: now };

    if (stage.id === "route" && m.step === 0 && m.agentIds.length === 0) {
      m.agentIds = pickAgents([...agentMap.values()], m.layers).map((a) => a.id);
    }
    const team = m.agentIds.flatMap((id) => {
      const a = agentMap.get(id);
      return a ? [a] : [];
    });

    if (stage.id === "gate") {
      if (m.approval === "approved") {
        log(m, "success", "Owner", "Approved by Owner — continuing");
      } else {
        const result = evaluateGate(m.actions, m.estCost, state.gates, state.settings.approvalCostLimit);
        for (const alert of result.alerts) log(m, "warn", "Sentinel", `Alert: ${alert}`);
        if (result.decision === "blocked") {
          log(m, "error", "Sentinel", `AUTO-BLOCKED: ${result.reasons.join(", ")}`);
          return { ...m, status: "blocked" as const, gateReasons: result.reasons, finishedAt: now };
        }
        if (result.decision === "approval") {
          log(m, "warn", "Owner Gate", `Your approval needed: ${result.reasons.join(" · ")}`);
          for (const a of team) {
            a.status = "waiting";
            a.currentAction = `Waiting for your approval on ${m.code}`;
          }
          return { ...m, status: "awaiting_approval" as const, approval: "pending" as const, gateReasons: result.reasons };
        }
        log(m, "success", "Owner Gate", "Safe and under budget — cleared automatically");
      }
      return { ...m, stageIndex: m.stageIndex + 1, step: 0 };
    }

    const lines = stageLines(stage.id, m, team);
    const line = lines[m.step];
    if (line) {
      log(m, line.level, line.agent, line.text);
      const actor = team.find((a) => a.name === line.agent) ?? team[m.step % Math.max(team.length, 1)];
      for (const a of team) {
        a.status = "working";
        if (a === actor || a.currentAction === "Standing by") a.currentAction = `${stage.label}: ${line.text}`;
      }
      if (stage.id === "execute" || stage.id === "verify") {
        m.cost = Math.min(m.estCost, Math.round((m.cost + m.estCost / 5) * 100) / 100);
      }
    }
    const nextStep = m.step + 1;
    if (nextStep >= lines.length) {
      const nextStage = m.stageIndex + 1;
      if (nextStage >= STAGES.length) {
        return { ...m, cost: m.estCost, stageIndex: STAGES.length - 1, step: 0, status: "completed" as const, finishedAt: now };
      }
      return { ...m, stageIndex: nextStage, step: 0 };
    }
    return { ...m, step: nextStep };
  });

  if (newLogs.length === 0 && missions.every((m, i) => m === state.missions[i])) return state;

  return {
    ...state,
    missions,
    agents: releaseAgents([...agentMap.values()], missions),
    logs: [...newLogs.reverse(), ...state.logs].slice(0, MAX_LOGS),
    logSeq: seq,
  };
}

function reducer(state: AyraState, action: Action): AyraState {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state, logs: [], logSeq: 0 };
    case "save":
      return { ...state, [action.key]: upsert(state[action.key] as { id: string }[], action.item) };
    case "delete":
      return {
        ...state,
        [action.key]: (state[action.key] as { id: string }[]).filter((x) => x.id !== action.id),
      };
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "launch": {
      const { input } = action;
      const model = pickModel(state.models, input.intent);
      const mission: Mission = {
        id: input.id,
        code: input.code,
        traceId: input.traceId,
        prompt: input.prompt,
        intent: input.intent,
        layers: INTENT_LAYERS[input.intent],
        actions: input.actions,
        estCost: estimateCost(input.intent, input.prompt),
        cost: 0,
        model: model ? `${model.name} (${model.tier})` : "No model enabled",
        stageIndex: 0,
        step: 0,
        status: "running",
        approval: "none",
        gateReasons: [],
        agentIds: [],
        createdAt: input.now,
        finishedAt: null,
      };
      return { ...state, missions: [mission, ...state.missions].slice(0, MAX_MISSIONS) };
    }
    case "approve":
      return {
        ...state,
        missions: state.missions.map((m) =>
          m.id === action.id && m.status === "awaiting_approval"
            ? { ...m, status: "running", approval: "approved" }
            : m,
        ),
      };
    case "reject": {
      const missions = state.missions.map((m) =>
        m.id === action.id && m.status === "awaiting_approval"
          ? { ...m, status: "rejected" as const, approval: "rejected" as const, finishedAt: action.now }
          : m,
      );
      return { ...state, missions, agents: releaseAgents(state.agents, missions) };
    }
    case "deleteMission": {
      const missions = state.missions.filter((m) => m.id !== action.id);
      return { ...state, missions, agents: releaseAgents(state.agents, missions) };
    }
    case "clearHistory":
      return { ...state, missions: state.missions.filter((m) => ACTIVE.includes(m.status)) };
    case "reset":
      return { ...initialState, logs: [], logSeq: state.logSeq };
    case "tick":
      return tick(state, action.now);
  }
}

function randomCode(prefix: string, len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)] ?? "X";
  return `${prefix}${out}`;
}

interface AyraContextValue {
  state: AyraState;
  hydrated: boolean;
  saveItem: <K extends CollectionKey>(key: K, item: Collections[K]) => void;
  deleteItem: (key: CollectionKey, id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  launch: (prompt: string, intent?: Intent, actions?: ActionKind[]) => Mission["code"];
  approve: (id: string) => void;
  reject: (id: string) => void;
  deleteMission: (id: string) => void;
  clearHistory: () => void;
  resetAll: () => void;
}

const AyraContext = createContext<AyraContextValue | null>(null);

export function AyraProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydratedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load saved data once in the browser.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) as Partial<AyraState> });
    } catch {
      // ignore broken storage
    }
    hydratedRef.current = true;
  }, []);

  // Save everything except the live log.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const { logs: _logs, logSeq: _seq, ...rest } = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {
      // storage full or blocked
    }
  }, [state]);

  const launch = useCallback((prompt: string, intent?: Intent, actions?: ActionKind[]) => {
    const code = randomCode("MSN-", 4);
    const chosen = intent ?? classifyIntent(prompt);
    dispatch({
      type: "launch",
      input: {
        id: crypto.randomUUID(),
        code,
        traceId: randomCode("tr_", 8).toLowerCase(),
        prompt,
        intent: chosen,
        actions: actions ?? detectActions(prompt),
        now: Date.now(),
      },
    });
    return code;
  }, []);

  // Live engine: advance every mission and run autopilot demo missions.
  useEffect(() => {
    let ticks = 0;
    const timer = window.setInterval(() => {
      ticks += 1;
      dispatch({ type: "tick", now: Date.now() });
      const s = stateRef.current;
      const running = s.missions.filter((m) => m.status === "running").length;
      if (s.settings.autopilot && running < 2 && (ticks === 2 || ticks % 14 === 0)) {
        const prompt = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)] ?? "Summarize today";
        launch(prompt);
      }
    }, 1100);
    return () => window.clearInterval(timer);
  }, [launch]);

  const value = useMemo<AyraContextValue>(
    () => ({
      state,
      hydrated: hydratedRef.current,
      saveItem: (key, item) => dispatch({ type: "save", key, item }),
      deleteItem: (key, id) => dispatch({ type: "delete", key, id }),
      updateSettings: (patch) => dispatch({ type: "settings", patch }),
      launch,
      approve: (id) => dispatch({ type: "approve", id, now: Date.now() }),
      reject: (id) => dispatch({ type: "reject", id, now: Date.now() }),
      deleteMission: (id) => dispatch({ type: "deleteMission", id }),
      clearHistory: () => dispatch({ type: "clearHistory" }),
      resetAll: () => dispatch({ type: "reset" }),
    }),
    [state, launch],
  );

  return <AyraContext.Provider value={value}>{children}</AyraContext.Provider>;
}

export function useAyra() {
  const ctx = useContext(AyraContext);
  if (!ctx) throw new Error("useAyra must be used inside AyraProvider");
  return ctx;
}

export function newId() {
  return crypto.randomUUID();
}
