import { describe, expect, it } from "vitest";
import { allocate } from "../allocate";
import { STRATEGY_PRESETS, getPreset } from "../presets";
import { makeCohort, makePolicy } from "./fixtures";

describe("STRATEGY_PRESETS", () => {
  it("has exactly the five documented presets", () => {
    const ids = STRATEGY_PRESETS.map((p) => p.id).sort();
    expect(ids).toEqual(
      ["balanced", "conservative", "decentralization-first", "performance-first", "yield-optimized"].sort()
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

  it("decentralization-first never produces a looser ASN ceiling than balanced", () => {
    const d = getPreset("decentralization-first")!;
    const b = getPreset("balanced")!;
    expect(d.constraints.maxAsnConcentration).toBeLessThanOrEqual(b.constraints.maxAsnConcentration);
  });
});
