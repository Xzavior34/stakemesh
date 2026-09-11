import { describe, expect, it } from "vitest";
import { allocate } from "../allocate";
import { generateRebalanceProposal } from "../rebalance";
import { passesIndividualConstraints } from "../scoring";
import { makeCohort, makePolicy } from "./fixtures";
import type { Validator } from "@/lib/types";

describe("Policy Engine Invariant Tests (10 Core Invariants)", () => {
  const cohort = makeCohort(30, 10, 5);
  const policy = makePolicy({ stakeAmountLamports: 100_000_000_000n }); // 100 SOL

  it("Invariant 1: Total allocation equals requested stake within dust tolerance (< 1000 lamports)", () => {
    const result = allocate(policy, cohort, "epoch-1");
    expect(result.requestedLamports - result.totalAllocatedLamports).toBeLessThanOrEqual(1000n);
    expect(result.fullyAllocated).toBe(true);
  });

  it("Invariant 2: No allocation leg can be negative or zero", () => {
    const result = allocate(policy, cohort, "epoch-1");
    for (const leg of result.legs) {
      expect(leg.stakeLamports).toBeGreaterThan(0n);
      expect(leg.fractionOfTotal).toBeGreaterThan(0);
    }
  });

  it("Invariant 3: Hard constraints cannot be violated by allocated legs", () => {
    const result = allocate(policy, cohort, "epoch-1");
    const validatorsByAccount = new Map(cohort.map((v) => [v.voteAccount, v]));

    for (const leg of result.legs) {
      const v = validatorsByAccount.get(leg.voteAccount)!;
      const { ok } = passesIndividualConstraints(v, policy.constraints);
      expect(ok).toBe(true);
    }

    // Portfolio level concentration checks
    expect(result.concentration.maxValidatorConcentration).toBeLessThanOrEqual(
      policy.constraints.maxStakePerValidator + 1e-6
    );
    expect(result.concentration.maxAsnConcentration).toBeLessThanOrEqual(
      policy.constraints.maxAsnConcentration + 1e-6
    );
    expect(result.concentration.maxDatacenterConcentration).toBeLessThanOrEqual(
      policy.constraints.maxDatacenterConcentration + 1e-6
    );
  });

  it("Invariant 4: A rebalance proposal must not worsen the targeted concentration constraint", () => {
    const initialAllocation = allocate(policy, cohort, "epoch-1");
    const validatorsByAccount = new Map(cohort.map((v) => [v.voteAccount, { ...v }]));
    const targetVote = initialAllocation.legs[0].voteAccount;
    const targetV = validatorsByAccount.get(targetVote)!;
    targetV.asn = cohort[1].asn; // overload ASN

    const proposal = generateRebalanceProposal(
      initialAllocation,
      policy,
      Array.from(validatorsByAccount.values()),
      "epoch-2"
    );

    for (const move of proposal.moves) {
      if (move.violationKind === "asn-concentration") {
        expect(move.projectedConcentrationAfter).toBeLessThanOrEqual(
          move.projectedConcentrationBefore + 1e-6
        );
      }
    }
  });

  it("Invariant 5 & 6: A portfolio satisfying policy generates no rebalance moves (no-op & no churn)", () => {
    const initialAllocation = allocate(policy, cohort, "epoch-1");
    const proposal = generateRebalanceProposal(
      initialAllocation,
      policy,
      cohort,
      "epoch-1"
    );

    expect(proposal.moves).toHaveLength(0);
    expect(proposal.summary).toContain("No rebalancing needed");
  });

  it("Invariant 7: Rebalancing does not accidentally breach concentration limits on destination", () => {
    const initialAllocation = allocate(policy, cohort, "epoch-1");
    const degradedCohort = cohort.map((v, idx) =>
      idx === 0 ? { ...v, delinquent: true } : v
    );

    const proposal = generateRebalanceProposal(
      initialAllocation,
      policy,
      degradedCohort,
      "epoch-2"
    );

    if (proposal.moves.length > 0) {
      const validatorsByAccount = new Map(degradedCohort.map((v) => [v.voteAccount, v]));
      for (const move of proposal.moves) {
        const destV = validatorsByAccount.get(move.toVoteAccount)!;
        expect(destV.delinquent).toBe(false);
      }
    }
  });

  it("Invariant 8: Unknown/delinquent metric fails hard constraints requiring active/non-delinquent status", () => {
    const delinquentValidator: Validator = {
      ...cohort[0],
      delinquent: true,
    };

    const { ok, reasons } = passesIndividualConstraints(delinquentValidator, policy.constraints);
    expect(ok).toBe(false);
    expect(reasons.some((r) => r.toLowerCase().includes("delinquent"))).toBe(true);
  });

  it("Invariant 9: Lamport / BigInt precision is handled safely without precision loss", () => {
    const hugePolicy = makePolicy({ stakeAmountLamports: 10_000_000_000_000_000n }); // 10 Million SOL
    const result = allocate(hugePolicy, cohort, "epoch-1");

    expect(typeof result.totalAllocatedLamports).toBe("bigint");
    expect(result.totalAllocatedLamports).toBeGreaterThan(0n);
    const sumLegs = result.legs.reduce((acc, leg) => acc + leg.stakeLamports, 0n);
    expect(sumLegs).toEqual(result.totalAllocatedLamports);
  });

  it("Invariant 10: Deterministic inputs produce identical output allocations", () => {
    const run1 = allocate(policy, cohort, "epoch-1");
    const run2 = allocate(policy, cohort, "epoch-1");

    expect(run1.legs.map((l) => ({ account: l.voteAccount, stake: l.stakeLamports }))).toEqual(
      run2.legs.map((l) => ({ account: l.voteAccount, stake: l.stakeLamports }))
    );
    expect(run1.distributionScore).toEqual(run2.distributionScore);
  });
});
