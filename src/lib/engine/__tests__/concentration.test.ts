import { describe, expect, it } from "vitest";
import { computeConcentration, projectedConcentrationIfAdded } from "../concentration";
import { makeValidator } from "./fixtures";

describe("computeConcentration", () => {
  it("returns all zeros for an empty leg set", () => {
    const result = computeConcentration([], new Map());
    expect(result.maxValidatorConcentration).toBe(0);
    expect(result.maxAsnConcentration).toBe(0);
    expect(result.maxDatacenterConcentration).toBe(0);
  });

  it("computes exact fractions for a two-validator, two-ASN split", () => {
    const v1 = makeValidator({ voteAccount: "v1", asn: 1, datacenter: "dc1" });
    const v2 = makeValidator({ voteAccount: "v2", asn: 2, datacenter: "dc2" });
    const byAccount = new Map([
      ["v1", v1],
      ["v2", v2],
    ]);
    const result = computeConcentration(
      [
        { voteAccount: "v1", stakeLamports: 300n },
        { voteAccount: "v2", stakeLamports: 700n },
      ],
      byAccount
    );
    expect(result.byAsn[1]).toBeCloseTo(0.3);
    expect(result.byAsn[2]).toBeCloseTo(0.7);
    expect(result.maxValidatorConcentration).toBeCloseTo(0.7);
    expect(result.maxAsnConcentration).toBeCloseTo(0.7);
  });

  it("aggregates multiple validators sharing one ASN", () => {
    const v1 = makeValidator({ voteAccount: "v1", asn: 1, datacenter: "dc1" });
    const v2 = makeValidator({ voteAccount: "v2", asn: 1, datacenter: "dc2" });
    const v3 = makeValidator({ voteAccount: "v3", asn: 2, datacenter: "dc3" });
    const byAccount = new Map([
      ["v1", v1],
      ["v2", v2],
      ["v3", v3],
    ]);
    const result = computeConcentration(
      [
        { voteAccount: "v1", stakeLamports: 200n },
        { voteAccount: "v2", stakeLamports: 200n },
        { voteAccount: "v3", stakeLamports: 600n },
      ],
      byAccount
    );
    // v1 + v2 share ASN 1 => 40% combined, even though no single validator exceeds 40%.
    expect(result.byAsn[1]).toBeCloseTo(0.4);
    expect(result.maxAsnConcentration).toBeCloseTo(0.6); // ASN 2 (v3 alone) is larger
    expect(result.maxValidatorConcentration).toBeCloseTo(0.6);
  });
});

describe("projectedConcentrationIfAdded", () => {
  it("projects correctly when adding to a brand-new candidate", () => {
    const v1 = makeValidator({ voteAccount: "v1", asn: 1, datacenter: "dc1" });
    const candidate = makeValidator({ voteAccount: "v2", asn: 2, datacenter: "dc2" });
    const byAccount = new Map([
      ["v1", v1],
      ["v2", candidate],
    ]);
    const projected = projectedConcentrationIfAdded(
      [{ voteAccount: "v1", stakeLamports: 900n }],
      candidate,
      100n,
      byAccount
    );
    expect(projected.validatorFraction).toBeCloseTo(0.1);
    expect(projected.asnFraction).toBeCloseTo(0.1);
  });

  it("projects correctly when adding more to an existing ASN peer", () => {
    const v1 = makeValidator({ voteAccount: "v1", asn: 1, datacenter: "dc1" });
    const candidate = makeValidator({ voteAccount: "v2", asn: 1, datacenter: "dc2" });
    const byAccount = new Map([
      ["v1", v1],
      ["v2", candidate],
    ]);
    const projected = projectedConcentrationIfAdded(
      [{ voteAccount: "v1", stakeLamports: 500n }],
      candidate,
      500n,
      byAccount
    );
    // Both validators share ASN 1, so adding 500 to v2 puts 100% of the new total on ASN 1.
    expect(projected.asnFraction).toBeCloseTo(1.0);
    expect(projected.validatorFraction).toBeCloseTo(0.5);
  });
});
