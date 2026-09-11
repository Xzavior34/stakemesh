import type {
  AllocationLeg,
  AllocationResult,
  RebalanceMove,
  RebalanceProposal,
  RebalanceViolationKind,
  StrategyPolicy,
  Validator,
} from "@/lib/types";
import { computeConcentration, projectedConcentrationIfAdded } from "./concentration";
import { computeDistributionScore } from "./distributionScore";
import { compareVersions } from "./scoring";

interface DetectedViolation {
  leg: AllocationLeg;
  kind: RebalanceViolationKind;
  reason: string;
  /** How urgently this should be corrected — higher moves first. */
  severity: number;
}

/**
 * Compare a live allocation's legs against current validator conditions and
 * the governing policy, returning every detected drift / violation.
 *
 * This is pure detection — it does not decide *where* stake should move to;
 * `generateRebalanceProposal` does that using this list plus the current
 * eligible validator pool.
 */
export function detectViolations(
  current: AllocationResult,
  policy: StrategyPolicy,
  validatorsByAccount: Map<string, Validator>
): DetectedViolation[] {
  const violations: DetectedViolation[] = [];

  for (const leg of current.legs) {
    const v = validatorsByAccount.get(leg.voteAccount);
    if (!v) continue;

    if (v.delinquent) {
      violations.push({
        leg,
        kind: "validator-delinquent",
        reason: "Validator is currently delinquent.",
        severity: 100,
      });
      continue; // delinquency supersedes other checks for this leg
    }

    if (v.votePerformance < policy.constraints.minVotePerformance) {
      violations.push({
        leg,
        kind: "performance-degradation",
        reason: `Voting performance declined to ${(v.votePerformance * 100).toFixed(1)}%, below the ${(
          policy.constraints.minVotePerformance * 100
        ).toFixed(1)}% policy minimum.`,
        severity: 80,
      });
    }

    if (v.skipRate > policy.constraints.maxSkipRate) {
      violations.push({
        leg,
        kind: "skip-rate-violation",
        reason: `Skip rate rose to ${(v.skipRate * 100).toFixed(2)}%, above the ${(
          policy.constraints.maxSkipRate * 100
        ).toFixed(2)}% policy maximum.`,
        severity: 70,
      });
    }

    if (v.commission > policy.constraints.maxCommission) {
      violations.push({
        leg,
        kind: "commission-increase",
        reason: `Commission changed to ${v.commission}%, above the ${policy.constraints.maxCommission}% policy maximum.`,
        severity: 60,
      });
    }

    if (
      policy.constraints.minSoftwareVersion &&
      v.version &&
      compareVersions(v.version, policy.constraints.minSoftwareVersion) < 0
    ) {
      violations.push({
        leg,
        kind: "software-version",
        reason: `Software version ${v.version} is below the required ${policy.constraints.minSoftwareVersion}.`,
        severity: 40,
      });
    }
  }

  const concentration = computeConcentration(current.legs, validatorsByAccount);
  if (concentration.maxAsnConcentration > policy.constraints.maxAsnConcentration) {
    const worst = worstConcentrationLeg(current.legs, validatorsByAccount, "asn");
    if (worst) {
      violations.push({
        leg: worst,
        kind: "asn-concentration",
        reason: `ASN concentration reached ${(concentration.maxAsnConcentration * 100).toFixed(
          1
        )}%, above the ${(policy.constraints.maxAsnConcentration * 100).toFixed(1)}% policy maximum.`,
        severity: 65,
      });
    }
  }
  if (concentration.maxDatacenterConcentration > policy.constraints.maxDatacenterConcentration) {
    const worst = worstConcentrationLeg(current.legs, validatorsByAccount, "datacenter");
    if (worst) {
      violations.push({
        leg: worst,
        kind: "datacenter-concentration",
        reason: `Datacenter concentration reached ${(concentration.maxDatacenterConcentration * 100).toFixed(
          1
        )}%, above the ${(policy.constraints.maxDatacenterConcentration * 100).toFixed(1)}% policy maximum.`,
        severity: 55,
      });
    }
  }

  return violations.sort((a, b) => b.severity - a.severity);
}

function worstConcentrationLeg(
  legs: AllocationLeg[],
  validatorsByAccount: Map<string, Validator>,
  dimension: "asn" | "datacenter"
): AllocationLeg | null {
  const totals = new Map<string | number, bigint>();
  for (const leg of legs) {
    const v = validatorsByAccount.get(leg.voteAccount);
    if (!v) continue;
    const key = dimension === "asn" ? v.asn : v.datacenter;
    totals.set(key, (totals.get(key) ?? 0n) + leg.stakeLamports);
  }
  let worstKey: string | number | null = null;
  let worstAmount = -1n;
  for (const [key, amount] of totals) {
    if (amount > worstAmount) {
      worstAmount = amount;
      worstKey = key;
    }
  }
  if (worstKey === null) return null;
  // Return the largest leg contributing to that worst key.
  let candidate: AllocationLeg | null = null;
  for (const leg of legs) {
    const v = validatorsByAccount.get(leg.voteAccount);
    if (!v) continue;
    const key = dimension === "asn" ? v.asn : v.datacenter;
    if (key === worstKey && (!candidate || leg.stakeLamports > candidate.stakeLamports)) {
      candidate = leg;
    }
  }
  return candidate;
}

/**
 * Generate a rebalance proposal (RECOMMEND mode only — this never executes
 * anything). Each violated leg is matched against the best-scoring eligible
 * destination validator that is not already over-concentrated for the
 * relevant dimension.
 */
export function generateRebalanceProposal(
  current: AllocationResult,
  policy: StrategyPolicy,
  validators: Validator[],
  epochLabel: string
): RebalanceProposal {
  const validatorsByAccount = new Map(validators.map((v) => [v.voteAccount, v]));
  const violations = detectViolations(current, policy, validatorsByAccount);

  const legsCopy: AllocationLeg[] = current.legs.map((l) => ({ ...l }));
  const currentAccounts = new Set(current.legs.map((l) => l.voteAccount));

  // Candidate destinations: eligible validators not already held, sorted by
  // composite score if we have it, otherwise by vote performance as a proxy.
  const destinationPool = validators
    .filter((v) => !currentAccounts.has(v.voteAccount) && !v.delinquent && v.active)
    .filter((v) => v.votePerformance >= policy.constraints.minVotePerformance)
    .filter((v) => v.skipRate <= policy.constraints.maxSkipRate)
    .filter((v) => v.commission <= policy.constraints.maxCommission)
    .sort((a, b) => b.votePerformance - b.commission / 100 - (a.votePerformance - a.commission / 100));

  const moves: RebalanceMove[] = [];

  for (const violation of violations) {
    const sourceLeg = legsCopy.find((l) => l.voteAccount === violation.leg.voteAccount);
    if (!sourceLeg || sourceLeg.stakeLamports <= 0n) continue;

    // Move half the affected stake by default — conservative correction
    // rather than fully draining the position in one proposal.
    const moveAmount = sourceLeg.stakeLamports / 2n || sourceLeg.stakeLamports;
    if (moveAmount <= 0n) continue;

    const destination = destinationPool.find((v) => {
      const projected = projectedConcentrationIfAdded(legsCopy, v, moveAmount, validatorsByAccount);
      return (
        projected.asnFraction <= policy.constraints.maxAsnConcentration &&
        projected.datacenterFraction <= policy.constraints.maxDatacenterConcentration &&
        projected.validatorFraction <= policy.constraints.maxStakePerValidator
      );
    });

    if (!destination) continue;

    const beforeConcentration = computeConcentration(legsCopy, validatorsByAccount);
    sourceLeg.stakeLamports -= moveAmount;

    const existingDestLeg = legsCopy.find((l) => l.voteAccount === destination.voteAccount);
    if (existingDestLeg) {
      existingDestLeg.stakeLamports += moveAmount;
    } else {
      legsCopy.push({
        voteAccount: destination.voteAccount,
        name: destination.name,
        stakeLamports: moveAmount,
        fractionOfTotal: 0,
        score: {
          voteAccount: destination.voteAccount,
          yieldScore: 0,
          performanceScore: 0,
          reliabilityScore: 0,
          decentralizationScore: 0,
          concentrationPenalty: 0,
          compositeScore: 0,
        },
        inclusionReasons: ["Added by rebalance proposal to correct a policy violation."],
      });
    }

    const afterConcentration = computeConcentration(legsCopy, validatorsByAccount);

    moves.push({
      fromVoteAccount: sourceLeg.voteAccount,
      fromName: sourceLeg.name,
      toVoteAccount: destination.voteAccount,
      toName: destination.name,
      amountLamports: moveAmount,
      reason: violation.reason,
      violationKind: violation.kind,
      projectedConcentrationBefore:
        violation.kind === "asn-concentration"
          ? beforeConcentration.maxAsnConcentration
          : violation.kind === "datacenter-concentration"
          ? beforeConcentration.maxDatacenterConcentration
          : beforeConcentration.maxValidatorConcentration,
      projectedConcentrationAfter:
        violation.kind === "asn-concentration"
          ? afterConcentration.maxAsnConcentration
          : violation.kind === "datacenter-concentration"
          ? afterConcentration.maxDatacenterConcentration
          : afterConcentration.maxValidatorConcentration,
    });
  }

  const finalLegs = legsCopy.filter((l) => l.stakeLamports > 0n);
  const totalAfter = finalLegs.reduce((sum, l) => sum + l.stakeLamports, 0n);
  for (const leg of finalLegs) {
    leg.fractionOfTotal = totalAfter > 0n ? Number(leg.stakeLamports) / Number(totalAfter) : 0;
  }

  const finalConcentration = computeConcentration(finalLegs, validatorsByAccount);
  const projectedDistributionScore = computeDistributionScore(finalConcentration, finalLegs.length);

  let apy = 0;
  let votePerf = 0;
  if (totalAfter > 0n) {
    for (const leg of finalLegs) {
      const v = validatorsByAccount.get(leg.voteAccount);
      if (!v) continue;
      const w = Number(leg.stakeLamports) / Number(totalAfter);
      apy += w * v.estimatedApy;
      votePerf += w * v.votePerformance;
    }
  }

  const summary =
    moves.length === 0
      ? "No rebalancing needed — current allocation satisfies policy."
      : `${moves.length} move${moves.length === 1 ? "" : "s"} recommended to correct ${
          new Set(moves.map((m) => m.violationKind)).size
        } policy violation type(s).`;

  return {
    generatedAtEpochLabel: epochLabel,
    moves,
    projectedAggregate: { weightedApy: apy, weightedVotePerformance: votePerf },
    projectedDistributionScore,
    currentDistributionScore: current.distributionScore,
    summary,
  };
}
