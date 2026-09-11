import type { HardConstraints, ObjectiveWeights, StrategyPolicy, Validator } from "@/lib/types";

export function makeValidator(overrides: Partial<Validator> & { voteAccount: string }): Validator {
  return {
    identity: `identity-${overrides.voteAccount}`,
    name: null,
    commission: 5,
    votePerformance: 0.97,
    skipRate: 0.02,
    activeStakeLamports: 100_000_000_000n,
    asn: 1000,
    asnOrg: "Test ASN",
    datacenter: "dc-a",
    country: "US",
    version: "1.18.0",
    delinquent: false,
    estimatedApy: 0.07,
    active: true,
    ...overrides,
  };
}

export const defaultConstraints: HardConstraints = {
  minVotePerformance: 0.9,
  maxSkipRate: 0.05,
  maxCommission: 10,
  maxAsnConcentration: 0.3,
  maxDatacenterConcentration: 0.4,
  maxStakePerValidator: 0.25,
  minSoftwareVersion: null,
  requireActive: true,
  excludeDelinquent: true,
};

export const defaultWeights: ObjectiveWeights = {
  yield: 1,
  performance: 1,
  reliability: 1,
  decentralization: 1,
};

export function makePolicy(overrides: Partial<StrategyPolicy> = {}): StrategyPolicy {
  return {
    id: "policy-1",
    name: "Test policy",
    stakeAmountLamports: 1_000_000_000_000n, // 1000 SOL
    targetValidatorCount: 5,
    constraints: defaultConstraints,
    weights: defaultWeights,
    preference: "balanced",
    ...overrides,
  };
}

/** Build N validators spread across a controllable number of ASNs / datacenters. */
export function makeCohort(count: number, asnCount = 4, dcCount = 3): Validator[] {
  return Array.from({ length: count }, (_, i) =>
    makeValidator({
      voteAccount: `vote-${i}`,
      identity: `identity-${i}`,
      name: `Validator ${i}`,
      commission: 3 + (i % 5),
      votePerformance: 0.9 + (i % 10) * 0.01,
      skipRate: 0.005 * (i % 6),
      activeStakeLamports: BigInt(10_000_000_000 * (1 + (i % 7))),
      asn: 1000 + (i % asnCount),
      datacenter: `dc-${i % dcCount}`,
      estimatedApy: 0.06 + (i % 5) * 0.002,
    })
  );
}
