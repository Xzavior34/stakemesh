import { describe, expect, it } from "vitest";
import { clamp01, compareVersions, minMaxNormalize, normalizeWeights, passesIndividualConstraints } from "../scoring";
import { defaultConstraints, makeValidator } from "./fixtures";

describe("clamp01", () => {
  it("clamps values into [0,1]", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
  });
  it("treats NaN as 0", () => {
    expect(clamp01(NaN)).toBe(0);
  });
});

describe("minMaxNormalize", () => {
  it("returns 0.5 when there is no variance in the cohort", () => {
    expect(minMaxNormalize(5, 5, 5)).toBe(0.5);
  });
  it("normalizes proportionally within range", () => {
    expect(minMaxNormalize(5, 0, 10)).toBe(0.5);
    expect(minMaxNormalize(0, 0, 10)).toBe(0);
    expect(minMaxNormalize(10, 0, 10)).toBe(1);
  });
});

describe("normalizeWeights", () => {
  it("sums to 1", () => {
    const w = normalizeWeights({ yield: 2, performance: 1, reliability: 1, decentralization: 0 });
    const total = w.yield + w.performance + w.reliability + w.decentralization;
    expect(total).toBeCloseTo(1);
  });
  it("falls back to equal weighting when all weights are zero", () => {
    const w = normalizeWeights({ yield: 0, performance: 0, reliability: 0, decentralization: 0 });
    expect(w.yield).toBeCloseTo(0.25);
  });
});

describe("compareVersions", () => {
  it("orders semver-ish strings correctly", () => {
    expect(compareVersions("1.18.0", "1.17.9")).toBeGreaterThan(0);
    expect(compareVersions("1.18.0", "1.18.0")).toBe(0);
    expect(compareVersions("1.18.0", "1.18.1")).toBeLessThan(0);
    expect(compareVersions("2.0", "1.99.99")).toBeGreaterThan(0);
  });
});

describe("passesIndividualConstraints", () => {
  it("passes a clean validator", () => {
    const v = makeValidator({ voteAccount: "v1" });
    const result = passesIndividualConstraints(v, defaultConstraints);
    expect(result.ok).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("fails on low vote performance with a specific reason", () => {
    const v = makeValidator({ voteAccount: "v1", votePerformance: 0.5 });
    const result = passesIndividualConstraints(v, defaultConstraints);
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes("Vote performance"))).toBe(true);
  });

  it("fails on excessive skip rate", () => {
    const v = makeValidator({ voteAccount: "v1", skipRate: 0.5 });
    const result = passesIndividualConstraints(v, defaultConstraints);
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes("Skip rate"))).toBe(true);
  });

  it("fails on excessive commission", () => {
    const v = makeValidator({ voteAccount: "v1", commission: 50 });
    const result = passesIndividualConstraints(v, defaultConstraints);
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes("Commission"))).toBe(true);
  });

  it("fails delinquent validators when excludeDelinquent is set", () => {
    const v = makeValidator({ voteAccount: "v1", delinquent: true });
    const result = passesIndividualConstraints(v, defaultConstraints);
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes("delinquent"))).toBe(true);
  });

  it("fails inactive validators when requireActive is set", () => {
    const v = makeValidator({ voteAccount: "v1", active: false });
    const result = passesIndividualConstraints(v, defaultConstraints);
    expect(result.ok).toBe(false);
  });

  it("fails validators below the minimum software version", () => {
    const v = makeValidator({ voteAccount: "v1", version: "1.16.0" });
    const result = passesIndividualConstraints(v, { ...defaultConstraints, minSoftwareVersion: "1.17.0" });
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes("Software version"))).toBe(true);
  });

  it("is a boundary-exact check at the exact threshold", () => {
    const v = makeValidator({ voteAccount: "v1", commission: defaultConstraints.maxCommission });
    const result = passesIndividualConstraints(v, defaultConstraints);
    expect(result.ok).toBe(true);
  });
});
