import type { ConcentrationMetrics } from "@/lib/types";
import { clamp01 } from "./scoring";

/**
 * The StakeMesh Distribution Score.
 *
 * This is NOT an official Solana Foundation metric. It is a transparent,
 * documented, StakeMesh-specific heuristic for how well a given allocation
 * spreads stake across independent infrastructure. See
 * /docs/validator-metrics for the written methodology — this function is the
 * literal implementation of that documentation and the two must stay in
 * sync.
 *
 * Components (each 0-100, higher is better), weighted and averaged:
 *  - validatorSpread:   inverse of the largest single-validator share
 *  - asnSpread:         inverse of the largest single-ASN share
 *  - datacenterSpread:  inverse of the largest single-datacenter share
 *  - breadth:           reward for using more distinct validators, ASNs,
 *                        and datacenters (diminishing returns above ~20)
 */
export function computeDistributionScore(
  concentration: ConcentrationMetrics,
  validatorCount: number
): number {
  const validatorSpread = 100 * (1 - clamp01(concentration.maxValidatorConcentration));
  const asnSpread = 100 * (1 - clamp01(concentration.maxAsnConcentration));
  const datacenterSpread = 100 * (1 - clamp01(concentration.maxDatacenterConcentration));

  const asnCount = Object.keys(concentration.byAsn).length;
  const dcCount = Object.keys(concentration.byDatacenter).length;
  // Diminishing-returns breadth term: log-scaled, capped at 100.
  const breadth = 100 * clamp01(Math.log2(1 + Math.min(validatorCount, asnCount, dcCount) || 0) / Math.log2(21));

  const score =
    0.3 * validatorSpread + 0.3 * asnSpread + 0.25 * datacenterSpread + 0.15 * breadth;

  return Math.round(clamp01(score / 100) * 1000) / 10; // one decimal place, 0-100
}
