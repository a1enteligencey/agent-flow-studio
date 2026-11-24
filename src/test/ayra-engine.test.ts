import { describe, expect, it } from "vitest";
import { classifyIntent, detectActions, evaluateGate } from "@/lib/ayra/engine";
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
