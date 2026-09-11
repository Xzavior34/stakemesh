import { describe, expect, it } from "vitest";
import { allocate } from "../allocate";
import { STRATEGY_PRESETS, getPreset } from "../presets";
import { makeCohort, makePolicy } from "./fixtures";

describe("STRATEGY_PRESETS", () => {
  it("has documented presets including foundation-decentralization", () => {
    const ids = STRATEGY_PRESETS.map((p) => p.id).sort();
    expect(ids).toEqual(
      [
        "foundation-decentralization",
        "balanced",
        "conservative",
        "decentralization-first",
        "performance-first",
        "yield-optimized",
      ].sort()
    );
  });

  it("getPreset resolves by id and returns undefined for unknown ids", () => {
    expect(getPreset("balanced")?.label).toBe("Balanced");
    expect(getPreset("nonexistent")).toBeUndefined();
  });

  it("every preset produces a deterministic, repeatable allocation on the same validator set", () => {
    const validators = makeCohort(40, 10, 8);
    for (const preset of STRATEGY_PRESETS) {
      const policy = makePolicy({
        id: preset.id,
        constraints: preset.constraints,
        weights: preset.weights,
        preference: preset.preference,
        targetValidatorCount: preset.targetValidatorCount,
      });
      const r1 = allocate(policy, validators, "epoch-1");
      const r2 = allocate(policy, validators, "epoch-1");
      expect(r1.legs.map((l) => l.voteAccount)).toEqual(r2.legs.map((l) => l.voteAccount));
    }
  });

  it("foundation-decentralization preset exposes metadata and exact published criteria thresholds", () => {
    const f = getPreset("foundation-decentralization")!;
    expect(f.label).toBe("Foundation-Aligned Preset");
    expect(f.metadata).toBeDefined();
    expect(f.metadata?.policySource).toContain("Solana Foundation");
    expect(f.constraints.maxCommission).toBe(5);
    expect(f.constraints.maxAsnConcentration).toBe(0.25);
    expect(f.constraints.maxDatacenterConcentration).toBe(0.15);
    expect(f.constraints.minVotePerformance).toBe(0.97);
    expect(f.constraints.maxSkipRate).toBe(0.05);
    expect(f.constraints.minSoftwareVersion).toBe("1.18.0");
  });
});
