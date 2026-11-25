import { describe, expect, it } from "vitest";
import { missionProgress } from "@/lib/ayra/engine";
import { initialState, reducer } from "@/lib/ayra/store";

describe("Workspace execution", () => {
  it("shows 0% at start and 100% on completion", () => {
    expect(missionProgress({ status: "running", stageIndex: 0, step: 0 }, 3)).toBe(0);
    expect(missionProgress({ status: "completed", stageIndex: 7, step: 0 }, 2)).toBe(100);
  });
  it("shows progress within the current stage", () => {
    expect(missionProgress({ status: "running", stageIndex: 4, step: 1 }, 2)).toBe(56);
  });
  it("stops a running task without deleting its history", () => {
    const launched = reducer(initialState, { type: "launch", input: { id: "test-mission", code: "MSN-TEST", traceId: "trace-test", prompt: "Summarize today", intent: "GENERAL", actions: [], now: 1000 } });
    const stopped = reducer(launched, { type: "stop", id: "test-mission", now: 2000 });
    expect(stopped.missions).toHaveLength(1);
    expect(stopped.missions[0]?.status).toBe("rejected");
    expect(stopped.missions[0]?.finishedAt).toBe(2000);
    expect(stopped.logs[0]?.text).toBe("Stopped by Owner");
    expect(reducer(stopped, { type: "tick", now: 3000 }).missions[0]?.stageIndex).toBe(0);
  });
});
