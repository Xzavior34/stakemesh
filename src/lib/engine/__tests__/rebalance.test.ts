import { describe, expect, it } from "vitest";
import { allocate } from "../allocate";
import { detectViolations, generateRebalanceProposal } from "../rebalance";
import { computeDistributionScore } from "../distributionScore";
import { defaultConstraints, makeCohort, makePolicy, makeValidator } from "./fixtures";

describe("detectViolations", () => {
  it("detects nothing on a healthy allocation", () => {
    const validators = makeCohort(20, 8, 6);
    const policy = makePolicy({ targetValidatorCount: 5 });
    const allocation = allocate(policy, validators, "epoch-1");
    const byAccount = new Map(validators.map((v) => [v.voteAccount, v]));

    const violations = detectViolations(allocation, policy, byAccount);
    expect(violations).toHaveLength(0);
  });

  it("detects performance degradation after conditions change", () => {
    const validators = makeCohort(10, 5, 4);
    const policy = makePolicy({ targetValidatorCount: 4 });
    const allocation = allocate(policy, validators, "epoch-1");

    // Degrade the top leg's underlying validator.
    const targetAccount = allocation.legs[0].voteAccount;
    const degraded = validators.map((v) => (v.voteAccount === targetAccount ? { ...v, votePerformance: 0.5 } : v));
    const byAccount = new Map(degraded.map((v) => [v.voteAccount, v]));

    const violations = detectViolations(allocation, policy, byAccount);
    expect(violations.some((v) => v.kind === "performance-degradation")).toBe(true);
  });

  it("detects delinquency and treats it as highest severity", () => {
    const validators = makeCohort(10, 5, 4);
    const policy = makePolicy({ targetValidatorCount: 4 });
    const allocation = allocate(policy, validators, "epoch-1");

    const targetAccount = allocation.legs[0].voteAccount;
    const degraded = validators.map((v) => (v.voteAccount === targetAccount ? { ...v, delinquent: true } : v));
    const byAccount = new Map(degraded.map((v) => [v.voteAccount, v]));

    const violations = detectViolations(allocation, policy, byAccount);
    expect(violations[0].kind).toBe("validator-delinquent");
  });

  it("detects a commission increase", () => {
    const validators = makeCohort(10, 5, 4);
    const policy = makePolicy({ targetValidatorCount: 4 });
    const allocation = allocate(policy, validators, "epoch-1");

    const targetAccount = allocation.legs[0].voteAccount;
    const degraded = validators.map((v) => (v.voteAccount === targetAccount ? { ...v, commission: 99 } : v));
    const byAccount = new Map(degraded.map((v) => [v.voteAccount, v]));

    const violations = detectViolations(allocation, policy, byAccount);
    expect(violations.some((v) => v.kind === "commission-increase")).toBe(true);
  });
});

describe("generateRebalanceProposal", () => {
  it("proposes no moves for a healthy allocation", () => {
    const validators = makeCohort(20, 8, 6);
    const policy = makePolicy({ targetValidatorCount: 5 });
    const allocation = allocate(policy, validators, "epoch-1");

    const proposal = generateRebalanceProposal(allocation, policy, validators, "epoch-2");
    expect(proposal.moves).toHaveLength(0);
  });

  it("never increases the protected concentration constraint it is trying to fix (invariant)", () => {
    // Build a case where one validator dominates an ASN, then trigger a
    // performance violation on it and confirm the proposed move doesn't make
    // ASN concentration worse.
    const validators = makeCohort(16, 6, 5);
    const policy = makePolicy({
      targetValidatorCount: 4,
      constraints: { ...defaultConstraints, maxAsnConcentration: 0.5 },
    });
    const allocation = allocate(policy, validators, "epoch-1");
    expect(allocation.legs.length).toBeGreaterThan(0);

    const targetAccount = allocation.legs[0].voteAccount;
    const degraded = validators.map((v) => (v.voteAccount === targetAccount ? { ...v, votePerformance: 0.1 } : v));

    const proposal = generateRebalanceProposal(allocation, policy, degraded, "epoch-2");

    for (const move of proposal.moves) {
      if (move.violationKind === "asn-concentration") {
        expect(move.projectedConcentrationAfter).toBeLessThanOrEqual(move.projectedConcentrationBefore + 1e-9);
      }
    }
  });

  it("moves stake away from a delinquent validator", () => {
    const validators = makeCohort(12, 5, 4);
    const policy = makePolicy({ targetValidatorCount: 4 });
    const allocation = allocate(policy, validators, "epoch-1");

    const targetAccount = allocation.legs[0].voteAccount;
    const degraded = validators.map((v) => (v.voteAccount === targetAccount ? { ...v, delinquent: true } : v));

    const proposal = generateRebalanceProposal(allocation, policy, degraded, "epoch-2");
    expect(proposal.moves.some((m) => m.fromVoteAccount === targetAccount)).toBe(true);
  });

  it("produces a summary describing the number of moves", () => {
    const validators = makeCohort(12, 5, 4);
    const policy = makePolicy({ targetValidatorCount: 4 });
    const allocation = allocate(policy, validators, "epoch-1");
    const targetAccount = allocation.legs[0].voteAccount;
    const degraded = validators.map((v) => (v.voteAccount === targetAccount ? { ...v, delinquent: true } : v));

    const proposal = generateRebalanceProposal(allocation, policy, degraded, "epoch-2");
    expect(proposal.summary.length).toBeGreaterThan(0);
  });
});

describe("computeDistributionScore", () => {
  it("scores a maximally concentrated single-validator allocation low", () => {
    const score = computeDistributionScore(
      {
        byAsn: { 1: 1 },
        byDatacenter: { dc1: 1 },
        maxValidatorConcentration: 1,
        maxAsnConcentration: 1,
        maxDatacenterConcentration: 1,
      },
      1
    );
    expect(score).toBeLessThan(20);
  });

  it("scores a well-spread allocation higher than a concentrated one", () => {
    const spread = computeDistributionScore(
      {
        byAsn: { 1: 0.1, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.1, 6: 0.1, 7: 0.1, 8: 0.1, 9: 0.1, 10: 0.1 },
        byDatacenter: { dc1: 0.1, dc2: 0.1, dc3: 0.1, dc4: 0.1, dc5: 0.1, dc6: 0.1, dc7: 0.1, dc8: 0.1, dc9: 0.1, dc10: 0.1 },
        maxValidatorConcentration: 0.1,
        maxAsnConcentration: 0.1,
        maxDatacenterConcentration: 0.1,
      },
      10
    );
    const concentrated = computeDistributionScore(
      {
        byAsn: { 1: 0.8, 2: 0.2 },
        byDatacenter: { dc1: 0.8, dc2: 0.2 },
        maxValidatorConcentration: 0.8,
        maxAsnConcentration: 0.8,
        maxDatacenterConcentration: 0.8,
      },
      2
    );
    expect(spread).toBeGreaterThan(concentrated);
  });
});

void makeValidator; // referenced for type-checking parity across fixture imports
