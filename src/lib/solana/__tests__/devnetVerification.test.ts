import { describe, expect, it } from "vitest";
import { runPipelineVerification } from "../devnetVerification";
import { checkClusterSafety } from "../stakeTransactions";

describe("Execution Pipeline Verification & Safety Guards", () => {
  it("blocks mainnet execution automatically via mainnet safety guard", async () => {
    const res = await runPipelineVerification({
      rpcUrl: "https://api.mainnet-beta.solana.com",
      cluster: "mainnet-beta",
    });

    expect(res.clusterSafetyCheck.safe).toBe(false);
    expect(res.clusterSafetyCheck.warning).toContain("Mainnet execution guard active");
    expect(res.constructedTransactionsCount).toBe(0);
  });

  it("checkClusterSafety detects cluster mismatches correctly", () => {
    const pass = checkClusterSafety("devnet", "devnet");
    expect(pass.safe).toBe(true);

    const fail = checkClusterSafety("mainnet-beta", "devnet");
    expect(fail.safe).toBe(false);
    expect(fail.warning).toContain("Cluster mismatch");
  });
});
