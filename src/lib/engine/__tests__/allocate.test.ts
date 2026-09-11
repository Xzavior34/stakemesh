import { describe, expect, it } from "vitest";
import { allocate } from "../allocate";
import { defaultConstraints, makeCohort, makePolicy, makeValidator } from "./fixtures";

describe("allocate", () => {
  it("allocates stake across the target validator count when enough eligible validators exist", () => {
    const validators = makeCohort(20, 8, 6);
    const policy = makePolicy({ targetValidatorCount: 5, stakeAmountLamports: 1_000_000_000_000n });
    const result = allocate(policy, validators, "epoch-500");

    expect(result.legs.length).toBe(5);
    expect(result.fullyAllocated).toBe(true);
    expect(result.constraintViolations).toHaveLength(0);
  });

  it("total allocated equals requested stake within rounding tolerance (invariant)", () => {
    const validators = makeCohort(30, 10, 8);
    const policy = makePolicy({ targetValidatorCount: 7, stakeAmountLamports: 777_777_777_777n });
    const result = allocate(policy, validators, "epoch-500");

    const diff =
      result.requestedLamports > result.totalAllocatedLamports
        ? result.requestedLamports - result.totalAllocatedLamports
        : result.totalAllocatedLamports - result.requestedLamports;
    expect(diff).toBeLessThanOrEqual(1000n);
  });

  it("never violates the max-stake-per-validator hard constraint", () => {
    const validators = makeCohort(20, 10, 10);
    const policy = makePolicy({
      targetValidatorCount: 3,
      stakeAmountLamports: 1_000_000_000_000n,
      constraints: { ...defaultConstraints, maxStakePerValidator: 0.4 },
    });
    const result = allocate(policy, validators, "epoch-1");

    for (const leg of result.legs) {
      expect(leg.fractionOfTotal).toBeLessThanOrEqual(0.4 + 1e-6);
    }
    expect(result.concentration.maxValidatorConcentration).toBeLessThanOrEqual(0.4 + 1e-6);
  });

  it("never exceeds max ASN concentration even when many validators share one ASN", () => {
    // 10 validators all on the same ASN, 10 on distinct ASNs.
    const sameAsn = Array.from({ length: 10 }, (_, i) =>
      makeValidator({ voteAccount: `same-${i}`, asn: 999, datacenter: `dc-same-${i}`, votePerformance: 0.99 })
    );
    const diverse = Array.from({ length: 10 }, (_, i) =>
      makeValidator({ voteAccount: `diverse-${i}`, asn: 2000 + i, datacenter: `dc-diverse-${i}`, votePerformance: 0.95 })
    );
    const validators = [...sameAsn, ...diverse];

    const policy = makePolicy({
      targetValidatorCount: 8,
      stakeAmountLamports: 1_000_000_000_000n,
      constraints: { ...defaultConstraints, maxAsnConcentration: 0.2 },
    });
    const result = allocate(policy, validators, "epoch-1");

    expect(result.concentration.maxAsnConcentration).toBeLessThanOrEqual(0.2 + 1e-6);
    expect(result.constraintViolations).toHaveLength(0);
  });

  it("never exceeds max datacenter concentration", () => {
    const validators = makeCohort(24, 12, 3); // only 3 datacenters, forces sharing
    const policy = makePolicy({
      targetValidatorCount: 9,
      stakeAmountLamports: 900_000_000_000n,
      constraints: { ...defaultConstraints, maxDatacenterConcentration: 0.35, maxAsnConcentration: 0.9 },
    });
    const result = allocate(policy, validators, "epoch-1");
    expect(result.concentration.maxDatacenterConcentration).toBeLessThanOrEqual(0.35 + 1e-6);
  });

  it("every selected leg carries inclusion reasons and every excluded validator carries exclusion reasons", () => {
    const validators = makeCohort(15, 5, 4);
    const policy = makePolicy({ targetValidatorCount: 4 });
    const result = allocate(policy, validators, "epoch-1");

    for (const leg of result.legs) {
      expect(leg.inclusionReasons.length).toBeGreaterThan(0);
    }
    for (const ex of result.excluded) {
      expect(ex.reasons.length).toBeGreaterThan(0);
    }
    // Every validator not selected must appear in exactly one of the two lists.
    const selectedAccounts = new Set(result.legs.map((l) => l.voteAccount));
    const excludedAccounts = new Set(result.excluded.map((e) => e.voteAccount));
    for (const v of validators) {
      const inSelected = selectedAccounts.has(v.voteAccount);
      const inExcluded = excludedAccounts.has(v.voteAccount);
      expect(inSelected !== inExcluded).toBe(true);
    }
  });

  it("handles zero eligible validators without throwing", () => {
    const validators = makeCohort(5).map((v) => ({ ...v, delinquent: true }));
    const policy = makePolicy({ targetValidatorCount: 5 });
    const result = allocate(policy, validators, "epoch-1");

    expect(result.legs).toHaveLength(0);
    expect(result.fullyAllocated).toBe(false);
    expect(result.excluded).toHaveLength(5);
  });

  it("handles fewer eligible validators than the target count honestly", () => {
    const validators = makeCohort(2, 2, 2);
    const policy = makePolicy({ targetValidatorCount: 5, stakeAmountLamports: 1_000_000_000_000n });
    const result = allocate(policy, validators, "epoch-1");

    expect(result.legs.length).toBeLessThanOrEqual(2);
  });

  it("handles a very small stake amount without throwing or misallocating", () => {
    const validators = makeCohort(5, 3, 3);
    const policy = makePolicy({ targetValidatorCount: 5, stakeAmountLamports: 500n });
    const result = allocate(policy, validators, "epoch-1");

    expect(result.totalAllocatedLamports).toBeLessThanOrEqual(500n);
    for (const leg of result.legs) {
      expect(leg.stakeLamports).toBeGreaterThanOrEqual(0n);
    }
  });

  it("handles a large stake amount deterministically (same input => same output)", () => {
    const validators = makeCohort(40, 12, 10);
    const policy = makePolicy({ targetValidatorCount: 15, stakeAmountLamports: 50_000_000_000_000n });
    const r1 = allocate(policy, validators, "epoch-1");
    const r2 = allocate(policy, validators, "epoch-1");

    expect(r1.legs.map((l) => [l.voteAccount, l.stakeLamports.toString()])).toEqual(
      r2.legs.map((l) => [l.voteAccount, l.stakeLamports.toString()])
    );
  });

  it("handles duplicate validator entries in the input list without double counting stake incorrectly", () => {
    const v = makeValidator({ voteAccount: "dup-1" });
    const validators = [v, { ...v }, { ...v }];
    const policy = makePolicy({ targetValidatorCount: 3, stakeAmountLamports: 300_000_000_000n });
    const result = allocate(policy, validators, "epoch-1");

    // Same voteAccount appears at most once as a leg since it's used as a Map key downstream.
    const uniqueAccounts = new Set(result.legs.map((l) => l.voteAccount));
    expect(uniqueAccounts.size).toBe(result.legs.length);
  });

  it("handles missing optional metrics (null name/version) gracefully", () => {
    const validators = [
      makeValidator({ voteAccount: "v1", name: null, version: null }),
      makeValidator({ voteAccount: "v2", name: null, version: null }),
    ];
    const policy = makePolicy({ targetValidatorCount: 2, stakeAmountLamports: 200_000_000_000n });
    expect(() => allocate(policy, validators, "epoch-1")).not.toThrow();
  });

  it("is exact at the constraint boundary (validator exactly at maxCommission is included)", () => {
    const validators = [
      makeValidator({ voteAccount: "v1", commission: defaultConstraints.maxCommission, asn: 1, datacenter: "dc-1" }),
      makeValidator({ voteAccount: "v2", commission: defaultConstraints.maxCommission, asn: 2, datacenter: "dc-2" }),
    ];
    const policy = makePolicy({
      targetValidatorCount: 2,
      stakeAmountLamports: 200_000_000_000n,
      // Two validators split 50/50 necessarily exceeds the default 0.25
      // per-validator ceiling, so this test widens it to isolate the
      // commission-boundary behavior it's actually checking.
      constraints: {
        ...defaultConstraints,
        maxStakePerValidator: 0.6,
        maxAsnConcentration: 0.6,
        maxDatacenterConcentration: 0.6,
      },
    });
    const result = allocate(policy, validators, "epoch-1");
    expect(result.legs.length).toBe(2);
  });
});
