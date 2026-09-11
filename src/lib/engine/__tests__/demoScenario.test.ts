import { describe, expect, it } from "vitest";
import { detectViolations, generateRebalanceProposal } from "../rebalance";
import { computeConcentration } from "../concentration";
import type { AllocationResult, StrategyPolicy, Validator } from "@/lib/types";

describe("Reproducible 100 SOL Portfolio Demo Scenario", () => {
  it("detects ASN/datacenter concentration violation and generates valid rebalance moves", () => {
    // 100 SOL total stake
    const totalStake = 100_000_000_000n;

    // Current portfolio holders (over-concentrated in ASN 100 and dc-east)
    const valA: Validator = {
      voteAccount: "vote-validator-A",
      identity: "id-A",
      name: "Validator A",
      commission: 3,
      votePerformance: 0.99,
      skipRate: 0.01,
      activeStakeLamports: 50_000_000_000_000n,
      asn: 100,
      asnOrg: "Concentrated Host Inc",
      datacenter: "dc-east",
      country: "US",
      version: "1.18.2",
      delinquent: false,
      estimatedApy: 0.072,
      active: true,
    };

    const valB: Validator = {
      voteAccount: "vote-validator-B",
      identity: "id-B",
      name: "Validator B",
      commission: 4,
      votePerformance: 0.98,
      skipRate: 0.02,
      activeStakeLamports: 40_000_000_000_000n,
      asn: 100,
      asnOrg: "Concentrated Host Inc",
      datacenter: "dc-east",
      country: "US",
      version: "1.18.2",
      delinquent: false,
      estimatedApy: 0.071,
      active: true,
    };

    const valC: Validator = {
      voteAccount: "vote-validator-C",
      identity: "id-C",
      name: "Validator C",
      commission: 2,
      votePerformance: 0.99,
      skipRate: 0.01,
      activeStakeLamports: 30_000_000_000_000n,
      asn: 200,
      asnOrg: "Independent Host",
      datacenter: "dc-west",
      country: "DE",
      version: "1.18.2",
      delinquent: false,
      estimatedApy: 0.074,
      active: true,
    };

    // Candidates for rebalance destination
    const candidateD: Validator = {
      voteAccount: "vote-validator-D",
      identity: "id-D",
      name: "Validator D",
      commission: 1,
      votePerformance: 0.99,
      skipRate: 0.01,
      activeStakeLamports: 10_000_000_000_000n,
      asn: 300,
      asnOrg: "Nordic Node Ltd",
      datacenter: "dc-nordic-1",
      country: "FI",
      version: "1.18.2",
      delinquent: false,
      estimatedApy: 0.075,
      active: true,
    };

    const candidateE: Validator = {
      voteAccount: "vote-validator-E",
      identity: "id-E",
      name: "Validator E",
      commission: 2,
      votePerformance: 0.98,
      skipRate: 0.01,
      activeStakeLamports: 12_000_000_000_000n,
      asn: 400,
      asnOrg: "Alpine Infra",
      datacenter: "dc-alpine-2",
      country: "CH",
      version: "1.18.2",
      delinquent: false,
      estimatedApy: 0.073,
      active: true,
    };

    const allValidators = [valA, valB, valC, candidateD, candidateE];
    const validatorsByAccount = new Map(allValidators.map((v) => [v.voteAccount, v]));

    // Current portfolio allocation: A (40 SOL), B (35 SOL), C (25 SOL)
    const initialAllocation: AllocationResult = {
      policyId: "demo-policy",
      requestedLamports: totalStake,
      totalAllocatedLamports: totalStake,
      fullyAllocated: true,
      computedAtEpochLabel: "Epoch 650",
      constraintViolations: [],
      distributionScore: 25.0,
      aggregate: { weightedApy: 0.072, weightedCommission: 3.1, weightedVotePerformance: 0.986 },
      legs: [
        {
          voteAccount: valA.voteAccount,
          name: valA.name,
          stakeLamports: 40_000_000_000n, // 40 SOL
          fractionOfTotal: 0.4,
          score: { voteAccount: valA.voteAccount, yieldScore: 0.8, performanceScore: 0.9, reliabilityScore: 0.9, decentralizationScore: 0.3, concentrationPenalty: 0, compositeScore: 0.7 },
          inclusionReasons: ["High performance"],
        },
        {
          voteAccount: valB.voteAccount,
          name: valB.name,
          stakeLamports: 35_000_000_000n, // 35 SOL
          fractionOfTotal: 0.35,
          score: { voteAccount: valB.voteAccount, yieldScore: 0.7, performanceScore: 0.8, reliabilityScore: 0.8, decentralizationScore: 0.4, concentrationPenalty: 0, compositeScore: 0.65 },
          inclusionReasons: ["High performance"],
        },
        {
          voteAccount: valC.voteAccount,
          name: valC.name,
          stakeLamports: 25_000_000_000n, // 25 SOL
          fractionOfTotal: 0.25,
          score: { voteAccount: valC.voteAccount, yieldScore: 0.9, performanceScore: 0.9, reliabilityScore: 0.9, decentralizationScore: 0.8, concentrationPenalty: 0, compositeScore: 0.85 },
          inclusionReasons: ["Independent ASN"],
        },
      ],
      excluded: [],
      concentration: computeConcentration(
        [
          { voteAccount: valA.voteAccount, stakeLamports: 40_000_000_000n },
          { voteAccount: valB.voteAccount, stakeLamports: 35_000_000_000n },
          { voteAccount: valC.voteAccount, stakeLamports: 25_000_000_000n },
        ],
        validatorsByAccount
      ),
    };

    // Calculate BEFORE concentration metrics: ASN 100 has (40 + 35) / 100 = 75%
    expect(initialAllocation.concentration.maxAsnConcentration).toBeCloseTo(0.75);
    expect(initialAllocation.concentration.maxDatacenterConcentration).toBeCloseTo(0.75);

    // Foundation-aligned Policy: max ASN 25%, max Datacenter 25%, max per validator 20%
    const policy: StrategyPolicy = {
      id: "foundation-policy",
      name: "Foundation-Aligned Strategy",
      stakeAmountLamports: totalStake,
      targetValidatorCount: 5,
      constraints: {
        minVotePerformance: 0.97,
        maxSkipRate: 0.05,
        maxCommission: 5,
        maxAsnConcentration: 0.25,
        maxDatacenterConcentration: 0.25,
        maxStakePerValidator: 0.2,
        minSoftwareVersion: "1.18.0",
        requireActive: true,
        excludeDelinquent: true,
      },
      weights: { yield: 0.5, performance: 1.5, reliability: 1.5, decentralization: 2.5 },
      preference: "max-decentralization",
    };

    // Step 1: Detect Violations
    const violations = detectViolations(initialAllocation, policy, validatorsByAccount);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.kind === "asn-concentration" || v.kind === "datacenter-concentration")).toBe(true);

    // Step 2: Generate Rebalance Proposal
    const proposal = generateRebalanceProposal(initialAllocation, policy, allValidators, "Epoch 651");

    expect(proposal.moves.length).toBeGreaterThan(0);
    const firstMove = proposal.moves[0];
    expect(firstMove.fromVoteAccount).toBe(valA.voteAccount);
    expect(firstMove.toVoteAccount).toBe(candidateD.voteAccount);
    expect(firstMove.amountLamports).toBe(20_000_000_000n); // Moves half of valA's 40 SOL position

    // Numerical Verification: verify move reduces targeted ASN concentration
    expect(firstMove.projectedConcentrationAfter).toBeLessThan(firstMove.projectedConcentrationBefore);
  });
});
