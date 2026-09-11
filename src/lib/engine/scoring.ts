import type {
  HardConstraints,
  ObjectiveWeights,
  OptimizationPreference,
  Validator,
  ValidatorScore,
} from "@/lib/types";

/** Clamp a number into [0, 1]. */
export function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Min-max normalize a value against the min/max observed across a cohort.
 * If min === max (no variance), every candidate is treated as neutral (0.5)
 * rather than 0, so a flat cohort doesn't unfairly zero out every score.
 */
export function minMaxNormalize(value: number, min: number, max: number): number {
  if (max - min <= 1e-12) return 0.5;
  return clamp01((value - min) / (max - min));
}

/**
 * Preset weight vectors for each optimization preference. `balanced` and any
 * explicit custom weights from the UI take precedence over these; this table
 * exists so presets are deterministic and documented rather than hardcoded
 * inline in multiple places.
 */
export const PREFERENCE_WEIGHTS: Record<OptimizationPreference, ObjectiveWeights> = {
  balanced: { yield: 1, performance: 1, reliability: 1, decentralization: 1 },
  "max-yield": { yield: 2.5, performance: 1, reliability: 0.75, decentralization: 0.5 },
  "max-decentralization": { yield: 0.5, performance: 0.75, reliability: 1, decentralization: 2.5 },
  "max-reliability": { yield: 0.5, performance: 1.5, reliability: 2.5, decentralization: 0.75 },
};

export function normalizeWeights(weights: ObjectiveWeights): ObjectiveWeights {
  const total = weights.yield + weights.performance + weights.reliability + weights.decentralization;
  if (total <= 0) {
    // Degenerate input: fall back to equal weighting rather than dividing by zero.
    return { yield: 0.25, performance: 0.25, reliability: 0.25, decentralization: 0.25 };
  }
  return {
    yield: weights.yield / total,
    performance: weights.performance / total,
    reliability: weights.reliability / total,
    decentralization: weights.decentralization / total,
  };
}

/** Returns true if a validator satisfies every hard constraint on its own (ignoring portfolio-level concentration, which is enforced during allocation). */
export function passesIndividualConstraints(
  v: Validator,
  constraints: HardConstraints
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (v.votePerformance < constraints.minVotePerformance) {
    reasons.push(
      `Vote performance ${(v.votePerformance * 100).toFixed(1)}% is below the ${(
        constraints.minVotePerformance * 100
      ).toFixed(1)}% minimum.`
    );
  }
  if (v.skipRate > constraints.maxSkipRate) {
    reasons.push(
      `Skip rate ${(v.skipRate * 100).toFixed(2)}% exceeds the ${(constraints.maxSkipRate * 100).toFixed(2)}% maximum.`
    );
  }
  if (v.commission > constraints.maxCommission) {
    reasons.push(`Commission ${v.commission}% exceeds the ${constraints.maxCommission}% maximum.`);
  }
  if (constraints.excludeDelinquent && v.delinquent) {
    reasons.push("Validator is currently delinquent.");
  }
  if (constraints.requireActive && !v.active) {
    reasons.push("Validator is not currently active.");
  }
  if (constraints.minSoftwareVersion && v.version) {
    if (compareVersions(v.version, constraints.minSoftwareVersion) < 0) {
      reasons.push(`Software version ${v.version} is below the required ${constraints.minSoftwareVersion}.`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}

/** Minimal semver-ish comparator: compares dot-separated numeric segments left to right. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da - db;
  }
  return 0;
}

/**
 * Score a cohort of validators that have already passed individual hard
 * constraints. Scoring is relative to the cohort (min-max normalized), so
 * scores are only meaningful when comparing validators within the same
 * scoring run.
 */
export function scoreValidatorCohort(
  validators: Validator[],
  weights: ObjectiveWeights
): Map<string, ValidatorScore> {
  const w = normalizeWeights(weights);
  const scores = new Map<string, ValidatorScore>();
  if (validators.length === 0) return scores;

  const apys = validators.map((v) => v.estimatedApy);
  const perf = validators.map((v) => v.votePerformance);
  const skip = validators.map((v) => v.skipRate);
  const commission = validators.map((v) => v.commission);
  const stake = validators.map((v) => Number(v.activeStakeLamports));

  const apyMin = Math.min(...apys),
    apyMax = Math.max(...apys);
  const perfMin = Math.min(...perf),
    perfMax = Math.max(...perf);
  const skipMin = Math.min(...skip),
    skipMax = Math.max(...skip);
  const commissionMin = Math.min(...commission),
    commissionMax = Math.max(...commission);
  const stakeMin = Math.min(...stake),
    stakeMax = Math.max(...stake);

  for (const v of validators) {
    const yieldScore = minMaxNormalize(v.estimatedApy, apyMin, apyMax);
    const performanceScore = minMaxNormalize(v.votePerformance, perfMin, perfMax);
    // Reliability blends inverted skip rate with inverted commission (both "lower is better").
    const skipComponent = 1 - minMaxNormalize(v.skipRate, skipMin, skipMax);
    const commissionComponent = 1 - minMaxNormalize(v.commission, commissionMin, commissionMax);
    const reliabilityScore = clamp01(0.6 * skipComponent + 0.4 * commissionComponent);
    // Decentralization: smaller existing active stake share is rewarded, since
    // directing new stake toward smaller validators improves network
    // distribution. This is a per-validator proxy; portfolio-level ASN /
    // datacenter concentration is enforced separately during allocation.
    const decentralizationScore = 1 - minMaxNormalize(Number(v.activeStakeLamports), stakeMin, stakeMax);
    // Placeholder concentration penalty at the scoring stage — the allocation
    // loop applies the real, portfolio-aware penalty as stake is assigned.
    const concentrationPenalty = 0;

    const compositeScore = clamp01(
      w.yield * yieldScore +
        w.performance * performanceScore +
        w.reliability * reliabilityScore +
        w.decentralization * decentralizationScore -
        concentrationPenalty
    );

    scores.set(v.voteAccount, {
      voteAccount: v.voteAccount,
      yieldScore,
      performanceScore,
      reliabilityScore,
      decentralizationScore,
      concentrationPenalty,
      compositeScore,
    });
  }

  // Silence unused-var lint for stake bounds captured above via closures.
  void stakeMax;

  return scores;
}
