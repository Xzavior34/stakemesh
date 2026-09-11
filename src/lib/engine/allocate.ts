import type {
  AllocationLeg,
  AllocationResult,
  ExclusionReason,
  StrategyPolicy,
  Validator,
  ValidatorScore,
} from "@/lib/types";
import { computeConcentration, projectedConcentrationIfAdded } from "./concentration";
import { computeDistributionScore } from "./distributionScore";
import { passesIndividualConstraints, scoreValidatorCohort } from "./scoring";

/**
 * Deterministically allocate `policy.stakeAmountLamports` across `validators`
 * according to `policy.constraints` and `policy.weights`.
 *
 * This is NOT a global optimizer — it does not claim mathematical
 * optimality. It is a documented greedy heuristic:
 *
 *   1. Drop validators that fail an individual hard constraint.
 *   2. Score the remaining cohort (see scoring.ts).
 *   3. Walk candidates in descending score order, assigning a base share of
 *      stake to each candidate that fits, skipping any candidate whose
 *      inclusion would breach a *portfolio-level* constraint (max stake per
 *      validator, max ASN concentration, max datacenter concentration).
 *   4. If stake remains once the target validator count is reached (or the
 *      candidate pool is exhausted), distribute the remainder across already
 *      selected legs in score order, respecting the same per-leg ceiling.
 *
 * The function never mutates its inputs and always returns a result whose
 * legs satisfy every hard constraint — if a constraint cannot be satisfied
 * (e.g. not enough eligible validators to hit the target count), the
 * shortfall is reflected honestly in `fullyAllocated` and
 * `constraintViolations` rather than being silently ignored.
 */
export function allocate(policy: StrategyPolicy, validators: Validator[], epochLabel: string): AllocationResult {
  const excluded: ExclusionReason[] = [];
  const eligible: Validator[] = [];

  for (const v of validators) {
    const { ok, reasons } = passesIndividualConstraints(v, policy.constraints);
    if (ok) {
      eligible.push(v);
    } else {
      excluded.push({ voteAccount: v.voteAccount, name: v.name, reasons });
    }
  }

  const scores = scoreValidatorCohort(eligible, policy.weights);
  const ranked = [...eligible].sort((a, b) => {
    const sa = scores.get(a.voteAccount)?.compositeScore ?? 0;
    const sb = scores.get(b.voteAccount)?.compositeScore ?? 0;
    return sb - sa;
  });

  const validatorsByAccount = new Map(validators.map((v) => [v.voteAccount, v]));
  const targetCount = Math.max(1, Math.min(policy.targetValidatorCount, ranked.length || 1));
  const total = policy.stakeAmountLamports;
  const baseShare = targetCount > 0 ? total / BigInt(targetCount) : 0n;

  const legs: AllocationLeg[] = [];
  const notSelectedReasons = new Map<string, string[]>();

  let remaining = total;

  // Pass 1: fill the target validator slots with the base share, honoring
  // per-validator and portfolio concentration ceilings.
  for (const v of ranked) {
    if (legs.length >= targetCount || remaining <= 0n) break;

    const attempt = remaining < baseShare && legs.length === targetCount - 1 ? remaining : baseShare;
    if (attempt <= 0n) continue;

    const projected = projectedConcentrationIfAdded(legs, v, attempt, validatorsByAccount, total);
    const violations: string[] = [];
    if (projected.validatorFraction > policy.constraints.maxStakePerValidator) {
      violations.push(
        `Allocating this share would put ${(projected.validatorFraction * 100).toFixed(1)}% of stake in one validator, exceeding the ${(
          policy.constraints.maxStakePerValidator * 100
        ).toFixed(1)}% maximum.`
      );
    }
    if (projected.asnFraction > policy.constraints.maxAsnConcentration) {
      violations.push(
        `ASN concentration would reach ${(projected.asnFraction * 100).toFixed(1)}%, exceeding the ${(
          policy.constraints.maxAsnConcentration * 100
        ).toFixed(1)}% maximum.`
      );
    }
    if (projected.datacenterFraction > policy.constraints.maxDatacenterConcentration) {
      violations.push(
        `Datacenter concentration would reach ${(projected.datacenterFraction * 100).toFixed(1)}%, exceeding the ${(
          policy.constraints.maxDatacenterConcentration * 100
        ).toFixed(1)}% maximum.`
      );
    }

    if (violations.length > 0) {
      notSelectedReasons.set(v.voteAccount, violations);
      continue;
    }

    legs.push(makeLeg(v, attempt, scores));
    remaining -= attempt;
  }

  // Pass 2: distribute any remainder (from rounding, or from skipped
  // candidates) across already-selected legs, respecting the same ceilings.
  if (remaining > 0n && legs.length > 0) {
    let progressed = true;
    while (remaining > 0n && progressed) {
      progressed = false;
      for (const leg of legs) {
        if (remaining <= 0n) break;
        const v = validatorsByAccount.get(leg.voteAccount);
        if (!v) continue;
        const drip = remaining < 1000n ? remaining : remaining / BigInt(legs.length) || 1n;
        const otherLegs = legs.filter((l) => l.voteAccount !== leg.voteAccount);
        const projected = projectedConcentrationIfAdded(
          [...otherLegs, { voteAccount: leg.voteAccount, stakeLamports: leg.stakeLamports }],
          v,
          drip,
          validatorsByAccount,
          total
        );
        if (
          projected.validatorFraction > policy.constraints.maxStakePerValidator ||
          projected.asnFraction > policy.constraints.maxAsnConcentration ||
          projected.datacenterFraction > policy.constraints.maxDatacenterConcentration
        ) {
          continue;
        }
        leg.stakeLamports += drip;
        remaining -= drip;
        progressed = true;
      }
    }
  }

  // Recompute fractions now that all stake has settled.
  const totalAllocated = legs.reduce((sum, l) => sum + l.stakeLamports, 0n);
  for (const leg of legs) {
    leg.fractionOfTotal = totalAllocated > 0n ? Number(leg.stakeLamports) / Number(totalAllocated) : 0;
  }

  // Anything eligible but never selected gets an honest reason.
  for (const v of ranked) {
    if (legs.some((l) => l.voteAccount === v.voteAccount)) continue;
    const reasons = notSelectedReasons.get(v.voteAccount) ?? [
      `Composite score ranked below the cutoff for a target of ${targetCount} validators.`,
    ];
    excluded.push({ voteAccount: v.voteAccount, name: v.name, reasons });
  }

  const concentration = computeConcentration(legs, validatorsByAccount);
  const distributionScore = computeDistributionScore(concentration, legs.length);

  const constraintViolations: string[] = [];
  if (concentration.maxValidatorConcentration > policy.constraints.maxStakePerValidator + 1e-9) {
    constraintViolations.push("Resulting max-per-validator concentration exceeds policy after settlement.");
  }
  if (concentration.maxAsnConcentration > policy.constraints.maxAsnConcentration + 1e-9) {
    constraintViolations.push("Resulting ASN concentration exceeds policy after settlement.");
  }
  if (concentration.maxDatacenterConcentration > policy.constraints.maxDatacenterConcentration + 1e-9) {
    constraintViolations.push("Resulting datacenter concentration exceeds policy after settlement.");
  }

  const aggregate = computeWeightedAggregate(legs, validatorsByAccount, totalAllocated);

  // Tolerance: dust below 1000 lamports (0.000001 SOL) counts as fully allocated.
  const fullyAllocated = total - totalAllocated <= 1000n;

  return {
    policyId: policy.id,
    legs,
    excluded,
    totalAllocatedLamports: totalAllocated,
    requestedLamports: total,
    fullyAllocated,
    concentration,
    aggregate,
    distributionScore,
    constraintViolations,
    computedAtEpochLabel: epochLabel,
  };
}

function makeLeg(v: Validator, stakeLamports: bigint, scores: Map<string, ValidatorScore>): AllocationLeg {
  const score = scores.get(v.voteAccount)!;
  const inclusionReasons: string[] = [
    `${(v.votePerformance * 100).toFixed(1)}% voting performance`,
    `${v.commission}% commission`,
    `${(v.skipRate * 100).toFixed(2)}% skip rate`,
  ];
  if (score.decentralizationScore > 0.6) {
    inclusionReasons.push("Below-median existing stake share strengthens network distribution.");
  }
  return {
    voteAccount: v.voteAccount,
    name: v.name,
    stakeLamports,
    fractionOfTotal: 0, // filled in after settlement
    score,
    inclusionReasons,
  };
}

function computeWeightedAggregate(
  legs: AllocationLeg[],
  validatorsByAccount: Map<string, Validator>,
  totalAllocated: bigint
) {
  if (totalAllocated === 0n || legs.length === 0) {
    return { weightedApy: 0, weightedCommission: 0, weightedVotePerformance: 0 };
  }
  let apy = 0;
  let commission = 0;
  let votePerf = 0;
  for (const leg of legs) {
    const v = validatorsByAccount.get(leg.voteAccount);
    if (!v) continue;
    const w = Number(leg.stakeLamports) / Number(totalAllocated);
    apy += w * v.estimatedApy;
    commission += w * v.commission;
    votePerf += w * v.votePerformance;
  }
  return { weightedApy: apy, weightedCommission: commission, weightedVotePerformance: votePerf };
}
