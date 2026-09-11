import { describe, expect, it } from "vitest";
import { computeDistributionScore } from "../distributionScore";
import type { ConcentrationMetrics } from "@/lib/types";

describe("computeDistributionScore", () => {
  it("returns 0-100 score range across various scenarios", () => {
    const perfectConcentration: ConcentrationMetrics = {
      byAsn: { 1: 0.1, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.1, 6: 0.1, 7: 0.1, 8: 0.1, 9: 0.1, 10: 0.1 },
      byDatacenter: { dc1: 0.2, dc2: 0.2, dc3: 0.2, dc4: 0.2, dc5: 0.2 },
      maxValidatorConcentration: 0.05,
      maxAsnConcentration: 0.1,
      maxDatacenterConcentration: 0.2,
    };
    const score = computeDistributionScore(perfectConcentration, 20);
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("penalizes highly concentrated single-validator distributions", () => {
    const concentrated: ConcentrationMetrics = {
      byAsn: { 1: 0.9, 2: 0.1 },
      byDatacenter: { dc1: 0.9, dc2: 0.1 },
      maxValidatorConcentration: 0.9,
      maxAsnConcentration: 0.9,
      maxDatacenterConcentration: 0.9,
    };
    const score = computeDistributionScore(concentrated, 2);
    expect(score).toBeLessThan(30);
  });

  it("handles zero stake / zero validators gracefully without NaN", () => {
    const empty: ConcentrationMetrics = {
      byAsn: {},
      byDatacenter: {},
      maxValidatorConcentration: 0,
      maxAsnConcentration: 0,
      maxDatacenterConcentration: 0,
    };
    const score = computeDistributionScore(empty, 0);
    expect(Number.isNaN(score)).toBe(false);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("handles single validator portfolio", () => {
    const single: ConcentrationMetrics = {
      byAsn: { 100: 1.0 },
      byDatacenter: { dc1: 1.0 },
      maxValidatorConcentration: 1.0,
      maxAsnConcentration: 1.0,
      maxDatacenterConcentration: 1.0,
    };
    const score = computeDistributionScore(single, 1);
    expect(score).toBeLessThanOrEqual(5);
  });
});
