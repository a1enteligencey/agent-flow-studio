import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkFeedUrl, normalizeLiveEvents } from "./live";
import type { LiveEvent } from "./live";

const MAX_BYTES = 1_000_000;

export interface LiveFeedResult {
  ok: boolean;
  events: LiveEvent[];
  error: string | null;
}

/** Reads the Owner's activity feed from their workflow tool and returns clean events. */
export const fetchLiveFeed = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ url: z.string().min(1).max(2000), key: z.string().max(4000) }).parse(d),
  )
  .handler(async ({ data }): Promise<LiveFeedResult> => {
    const checked = checkFeedUrl(data.url);
    if (!checked.ok) return { ok: false, events: [], error: checked.reason };
    const headers: Record<string, string> = { Accept: "application/json" };
    if (data.key.trim()) {
      headers["Authorization"] = `Bearer ${data.key.trim()}`;
      headers["X-API-Key"] = data.key.trim();
    }
    try {
      const res = await fetch(checked.url, { headers, redirect: "follow", signal: AbortSignal.timeout(8000) });
      if (res.status === 401 || res.status === 403) return { ok: false, events: [], error: "The studio refused the access key." };
      if (!res.ok) return { ok: false, events: [], error: `The studio answered with error ${res.status}.` };
      const text = await res.text();
      if (text.length > MAX_BYTES) return { ok: false, events: [], error: "The feed is too large — return only recent activity." };
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        return { ok: false, events: [], error: "The address didn't return activity data (JSON)." };
      }
      return { ok: true, events: normalizeLiveEvents(json, Date.now()), error: null };
    } catch (err) {
      console.error("live feed fetch failed", err);
      return { ok: false, events: [], error: "Couldn't reach the studio. Check the address and that it's online." };
    }
  });
