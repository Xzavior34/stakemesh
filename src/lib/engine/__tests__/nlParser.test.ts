import { describe, expect, it } from "vitest";
import { parseNaturalLanguageStrategy } from "../nlParser";

describe("parseNaturalLanguageStrategy", () => {
  it("parses stake amount, validator count, commission, and ASN cap from the documented example", () => {
    const result = parseNaturalLanguageStrategy(
      "I want to stake 10 SOL across 15 validators, keep commission below 5%, and avoid putting more than 10% of my stake behind one ASN."
    );
    expect(result.stakeAmountSol).toBe(10);
    expect(result.targetValidatorCount).toBe(15);
    expect(result.maxCommission).toBe(5);
    expect(result.maxAsnConcentration).toBeCloseTo(0.1);
  });

  it("is deterministic — same input always produces the same output", () => {
    const input = "Stake 25 SOL across 8 validators with commission under 3%";
    const a = parseNaturalLanguageStrategy(input);
    const b = parseNaturalLanguageStrategy(input);
    expect(a).toEqual(b);
  });

  it("returns nulls and a note when it cannot find a stake amount", () => {
    const result = parseNaturalLanguageStrategy("I care a lot about decentralization");
    expect(result.stakeAmountSol).toBeNull();
    expect(result.notes.some((n) => n.includes("stake amount"))).toBe(true);
  });

  it("matches decentralization intent to the decentralization-first preset", () => {
    const result = parseNaturalLanguageStrategy("Maximize decentralization for my stake");
    expect(result.matchedPresetId).toBe("decentralization-first");
  });

  it("matches yield intent to the yield-optimized preset", () => {
    const result = parseNaturalLanguageStrategy("I want the best possible yield and APY");
    expect(result.matchedPresetId).toBe("yield-optimized");
  });

  it("does not guess a preset when there is no matching intent keyword", () => {
    const result = parseNaturalLanguageStrategy("Stake 5 SOL across 3 validators");
    expect(result.matchedPresetId).toBeNull();
  });
});
