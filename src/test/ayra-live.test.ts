import { describe, expect, it } from "vitest";
import { checkFeedUrl, normalizeLiveEvents } from "@/lib/ayra/live";
import { addLiveEvents, initialState } from "@/lib/ayra/store";

const NOW = 1_800_000_000_000;

describe("Live feed reading", () => {
  it("reads a plain list of studio events", () => {
    const events = normalizeLiveEvents(
      [{ id: "e1", time: "2026-11-24T07:10:00Z", workflow: "Lead finder", agent: "Researcher", status: "success", message: "Found 12 leads" }],
      NOW,
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: "e1", workflow: "Lead finder", agent: "Researcher", level: "success", text: "Found 12 leads" });
    expect(events[0]?.ts).toBe(Date.parse("2026-11-24T07:10:00Z"));
  });

  it("finds events wrapped inside an object", () => {
    const events = normalizeLiveEvents({ data: { events: [{ text: "Run started", level: "info" }] } }, NOW);
    expect(events.map((e) => e.text)).toEqual(["Run started"]);
  });

  it("marks failures as errors and waiting steps as warnings", () => {
    const events = normalizeLiveEvents(
      [
        { id: "a", message: "Deploy", status: "failed", ts: 1 },
        { id: "b", message: "Need OK", status: "waiting_approval", ts: 2 },
      ],
      NOW,
    );
    expect(events.map((e) => e.level)).toEqual(["error", "warn"]);
  });

  it("skips items with no message", () => {
    expect(normalizeLiveEvents([{ id: "x", status: "ok" }], NOW)).toEqual([]);
  });
});

describe("Live log", () => {
  it("shows each studio event only once, even when the feed repeats it", () => {
    const events = normalizeLiveEvents([{ id: "e1", message: "Hello", ts: NOW }], NOW);
    const once = addLiveEvents(initialState, events);
    const twice = addLiveEvents(once, events);
    expect(once.logs).toHaveLength(1);
    expect(twice).toBe(once);
  });
});

describe("Feed address check", () => {
  it("accepts a public https address", () => {
    expect(checkFeedUrl("https://studio.example.com/api/activity").ok).toBe(true);
  });
  it("refuses local or private addresses", () => {
    expect(checkFeedUrl("http://localhost:3000/feed").ok).toBe(false);
    expect(checkFeedUrl("http://192.168.1.5/feed").ok).toBe(false);
  });
  it("refuses text that is not an address", () => {
    expect(checkFeedUrl("my studio").ok).toBe(false);
  });
});
