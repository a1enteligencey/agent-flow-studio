import type { Agent, Module, RoadmapTask } from "./types";
import type { Json } from "@/integrations/supabase/types";
export type SyncKey = "agents" | "modules" | "tasks";
export interface SyncData { agents: Agent[]; modules: Module[]; tasks: RoadmapTask[] }
export function isSyncKey(key: string): key is SyncKey { return key === "agents" || key === "modules" || key === "tasks"; }
export function syncRows(userId: string, state: SyncData) {
  return (["agents", "modules", "tasks"] as const).flatMap(collection => state[collection].map(item => ({ user_id: userId, collection, id: item.id, payload: JSON.parse(JSON.stringify(item)) as Json })));
}
export function readSyncRows(rows: { collection: string; id: string; payload: Json }[]): SyncData {
  const result: SyncData = { agents: [], modules: [], tasks: [] };
  for (const row of rows) {
    if (!isSyncKey(row.collection) || !row.payload || typeof row.payload !== "object" || Array.isArray(row.payload)) continue;
    if (row.payload['id'] !== row.id) continue;
    // Rows are produced by the typed collection forms; invalid externally written rows are skipped.
    if (row.collection === "tasks" && typeof row.payload['title'] === "string") result.tasks.push(row.payload as unknown as RoadmapTask);
    if (row.collection === "agents" && typeof row.payload['name'] === "string") result.agents.push(row.payload as unknown as Agent);
    if (row.collection === "modules" && typeof row.payload['name'] === "string") result.modules.push(row.payload as unknown as Module);
  }
  return result;
}
