import { describe, expect, it } from "vitest";
import { classifyIntent, currentPhase, detectActions, evaluateGate, phaseProgress } from "@/lib/ayra/engine";
import { SEED_GATES } from "@/lib/ayra/seed";

describe("Owner gate", () => {
  it("runs on its own when safe and cost is at or under the $0.50 limit", () => {
    expect(evaluateGate([], 0.5, SEED_GATES, 0.5).decision).toBe("auto");
  });

  it("asks the Owner when estimated cost is above $0.50", () => {
    expect(evaluateGate([], 0.51, SEED_GATES, 0.5).decision).toBe("approval");
  });

  it("asks the Owner before any irreversible action like a payment or deploy", () => {
    expect(evaluateGate(["payment"], 0.01, SEED_GATES, 0.5).decision).toBe("approval");
    expect(evaluateGate(["deploy"], 0.01, SEED_GATES, 0.5).decision).toBe("approval");
  });

  it("refuses scanning systems the Owner does not own, even when cheap", () => {
    expect(evaluateGate(["external_scan", "payment"], 0, SEED_GATES, 0.5).decision).toBe("blocked");
  });

  it("ignores a rule the Owner switched off", () => {
    const gates = SEED_GATES.map((g) => (g.action === "deploy" ? { ...g, enabled: false } : g));
    expect(evaluateGate(["deploy"], 0.01, gates, 0.5).decision).toBe("auto");
  });
});

describe("Classify", () => {
  it("detects booking and its form submit", () => {
    const prompt = "Book a train ticket from Delhi to Mumbai";
    expect(classifyIntent(prompt)).toBe("BOOKING");
    expect(detectActions(prompt)).toContain("form_submit");
  });

  it("falls back to GENERAL", () => {
    expect(classifyIntent("hello there")).toBe("GENERAL");
  });
});

describe("Roadmap progress", () => {
  const tasks = [
    { phase: "0" as const, done: true },
    { phase: "0" as const, done: false },
    { phase: "1" as const, done: false },
  ];

  it("shows the share of ticked tasks in a phase", () => {
    expect(phaseProgress(tasks, "0")).toBe(50);
    expect(phaseProgress(tasks, "2")).toBe(0);
  });

  it("puts the Owner in the first phase with unfinished work", () => {
    expect(currentPhase(tasks)).toBe("0");
    expect(currentPhase(tasks.map((t) => (t.phase === "0" ? { ...t, done: true } : t)))).toBe("1");
    expect(currentPhase(tasks.map((t) => ({ ...t, done: true })))).toBeNull();
  });
});
