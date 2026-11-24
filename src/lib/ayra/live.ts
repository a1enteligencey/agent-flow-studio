import type { LogLevel, StageId } from "./types";

/** One activity line coming from an outside workflow tool (Agent Flow Studio etc). */
export interface LiveEvent {
  id: string;
  ts: number;
  workflow: string;
  agent: string;
  stage: StageId;
  level: LogLevel;
  text: string;
}

const LIST_KEYS = ["events", "logs", "activity", "items", "data", "results", "runs"];

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function asText(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const inner = pick(o, ["name", "title", "label", "id"]);
    if (inner !== undefined && typeof inner !== "object") return String(inner);
  }
  return "";
}

export function toTimestamp(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v < 1e12 ? Math.round(v * 1000) : Math.round(v);
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return toTimestamp(n, fallback);
    const parsed = Date.parse(v);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function toLevel(v: unknown): LogLevel {
  const s = asText(v).toLowerCase();
  if (!s) return "info";
  if (/(error|fail|crash|exception|block|reject|denied)/.test(s)) return "error";
  if (/(success|done|complete|finish|ok\b|passed|succeeded)/.test(s)) return "success";
  if (/(warn|wait|pending|approval|paused|retry)/.test(s)) return "warn";
  if (/(think|reason|plan)/.test(s)) return "think";
  return "info";
}

export function toStage(v: unknown): StageId {
  const s = asText(v).toLowerCase();
  if (/(classif|intent|trigger|start|input)/.test(s)) return "classify";
  if (/(route|router|select|dispatch)/.test(s)) return "route";
  if (/(plan|think|reason)/.test(s)) return "plan";
  if (/(gate|approv|confirm|human)/.test(s)) return "gate";
  if (/(verif|check|test|validat|review)/.test(s)) return "verify";
  if (/(report|output|respon|notify|result)/.test(s)) return "report";
  if (/(learn|memory|store|save)/.test(s)) return "learn";
  return "execute";
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Finds the list of events in whatever shape the feed returns. */
function findList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    for (const k of LIST_KEYS) {
      const v = o[k];
      if (Array.isArray(v)) return v;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const nested = findList(v);
        if (nested.length) return nested;
      }
    }
    // A single event object.
    if (pick(o, ["message", "text", "msg", "description", "event"]) !== undefined) return [o];
  }
  return [];
}

/**
 * Turns any reasonable JSON activity feed into LiveEvents.
 * Accepts an array, or an object holding one under events/logs/activity/items/data.
 */
export function normalizeLiveEvents(payload: unknown, now: number, max = 100): LiveEvent[] {
  const out: LiveEvent[] = [];
  for (const raw of findList(payload)) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const text = asText(pick(o, ["message", "text", "msg", "description", "output", "summary", "title", "body", "event", "type", "action"]));
    if (!text) continue;
    const ts = toTimestamp(pick(o, ["timestamp", "time", "ts", "created_at", "createdAt", "startedAt", "date"]), now);
    const workflow =
      asText(pick(o, ["workflow", "workflowName", "workflow_name", "flow", "flowName", "mission", "run", "runId", "run_id", "execution"])) ||
      "LIVE";
    const agent = asText(pick(o, ["agent", "agentName", "agent_name", "node", "nodeName", "actor", "source", "tool"])) || "Studio";
    const stage = toStage(pick(o, ["stage", "step", "phase", "node", "nodeName", "type"]) ?? text);
    const level = toLevel(pick(o, ["level", "status", "severity", "state", "type"]));
    const idRaw = asText(pick(o, ["id", "event_id", "eventId", "_id", "uuid"]));
    const id = idRaw || hash(`${ts}|${workflow}|${agent}|${text}`);
    out.push({ id, ts, workflow: workflow.slice(0, 40), agent: agent.slice(0, 40), stage, level, text: text.slice(0, 500) });
  }
  return out.sort((a, b) => a.ts - b.ts).slice(-max);
}

const PRIVATE_HOST = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i;

/** Only public http(s) addresses can be used as a live feed. */
export function checkFeedUrl(input: string): { ok: true; url: string } | { ok: false; reason: string } {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return { ok: false, reason: "That doesn't look like a web address." };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { ok: false, reason: "Address must start with https://" };
  if (PRIVATE_HOST.test(u.hostname)) return { ok: false, reason: "Use a public address — local or private ones can't be reached." };
  return { ok: true, url: u.toString() };
}
