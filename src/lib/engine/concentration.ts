import type { AllocationLeg, ConcentrationMetrics, Validator } from "@/lib/types";

/**
 * Compute ASN / datacenter / per-validator concentration for a set of
 * allocation legs against the validator directory used to place them.
 *
 * All fractions are relative to the *sum of the legs' stake*, not the
 * requested total — callers that care about drift from the requested amount
 * should compare totalAllocatedLamports to requestedLamports separately.
 */
export function computeConcentration(
  legs: Pick<AllocationLeg, "voteAccount" | "stakeLamports">[],
  validatorsByAccount: Map<string, Validator>
): ConcentrationMetrics {
  const total = legs.reduce((sum, l) => sum + l.stakeLamports, 0n);

  const byAsn: Record<number, number> = {};
  const byDatacenter: Record<string, number> = {};
  let maxValidatorConcentration = 0;

  if (total === 0n) {
    return { byAsn, byDatacenter, maxValidatorConcentration: 0, maxAsnConcentration: 0, maxDatacenterConcentration: 0 };
  }

  for (const leg of legs) {
    const v = validatorsByAccount.get(leg.voteAccount);
    const fraction = Number(leg.stakeLamports) / Number(total);
    maxValidatorConcentration = Math.max(maxValidatorConcentration, fraction);

    if (v) {
      byAsn[v.asn] = (byAsn[v.asn] ?? 0) + fraction;
      byDatacenter[v.datacenter] = (byDatacenter[v.datacenter] ?? 0) + fraction;
    }
  }

  const maxAsnConcentration = Object.values(byAsn).reduce((m, f) => Math.max(m, f), 0);
  const maxDatacenterConcentration = Object.values(byDatacenter).reduce((m, f) => Math.max(m, f), 0);

  return { byAsn, byDatacenter, maxValidatorConcentration, maxAsnConcentration, maxDatacenterConcentration };
}

/**
 * The projected ASN/datacenter fraction if `additionalLamports` were added to
 * `candidate` on top of the current legs. Used by the allocator to test
 * whether adding stake to a validator would breach a concentration
 * constraint *before* committing the stake.
 */
export function projectedConcentrationIfAdded(
  legs: Pick<AllocationLeg, "voteAccount" | "stakeLamports">[],
  candidate: Validator,
  additionalLamports: bigint,
  validatorsByAccount: Map<string, Validator>,
  /**
   * When allocating incrementally toward a known final target (e.g. the
   * allocator is still filling its first few slots), concentration should be
   * judged against the *final* portfolio size, not the partial sum assigned
   * so far — otherwise the very first leg always looks like 100% of the
   * portfolio. Pass the requested total here during incremental filling;
   * omit it (or pass the legs' own sum) when legs already represents the
   * complete, settled portfolio, as rebalancing does.
   */
  explicitTargetTotal?: bigint
): { asnFraction: number; datacenterFraction: number; validatorFraction: number } {
  const currentTotal = legs.reduce((sum, l) => sum + l.stakeLamports, 0n);
  const projectedTotal =
    explicitTargetTotal !== undefined && explicitTargetTotal > currentTotal + additionalLamports
      ? explicitTargetTotal
      : currentTotal + additionalLamports;
  if (projectedTotal === 0n) return { asnFraction: 0, datacenterFraction: 0, validatorFraction: 0 };

  let asnLamports = additionalLamports;
  let dcLamports = additionalLamports;
  let candidateLamports = additionalLamports;

  for (const leg of legs) {
    const v = validatorsByAccount.get(leg.voteAccount);
    if (!v) continue;
    if (v.asn === candidate.asn) asnLamports += leg.stakeLamports;
    if (v.datacenter === candidate.datacenter) dcLamports += leg.stakeLamports;
    if (leg.voteAccount === candidate.voteAccount) candidateLamports += leg.stakeLamports;
  }

  return {
    asnFraction: Number(asnLamports) / Number(projectedTotal),
    datacenterFraction: Number(dcLamports) / Number(projectedTotal),
    validatorFraction: Number(candidateLamports) / Number(projectedTotal),
  };
}
