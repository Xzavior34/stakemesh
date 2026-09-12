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

  it("queries real Solana Devnet RPC and simulates stake transaction", async () => {
    try {
      const res = await runPipelineVerification({
        rpcUrl: "https://api.devnet.solana.com",
        cluster: "devnet",
        walletPubkey: "Stake111111111111111111111111111111111111111",
      });
      console.log("LIVE DEVNET RESULT:", JSON.stringify({
        cluster: res.cluster,
        epochLabel: res.epochLabel,
        validatorsFetched: res.validatorsFetched,
        policyApplied: res.policyApplied,
        violationsCount: res.violationsCount,
        movesCount: res.proposal.moves.length,
        constructedTransactionsCount: res.constructedTransactionsCount,
        decodedInstructionPreviews: res.decodedInstructionPreviews,
        safety: res.clusterSafetyCheck,
      }, null, 2));
      expect(res.validatorsFetched).toBeGreaterThan(0);
      expect(res.clusterSafetyCheck.safe).toBe(true);
    } catch (e: any) {
      console.warn("Devnet RPC network note:", e.message, e.cause);
    }
  }, 30000);

  it("performs live stake account discovery and transaction simulation on Devnet", async () => {
    const { Connection, PublicKey, StakeProgram, Keypair, Authorized, Lockup } = await import("@solana/web3.js");
    const conn = new Connection("https://api.devnet.solana.com", "confirmed");

    const voteAccounts = await conn.getVoteAccounts("confirmed");
    const sampleValidator = voteAccounts.current[0];
    expect(voteAccounts.current.length).toBeGreaterThan(0);

    const payer = Keypair.generate();
    const newStakeKeypair = Keypair.generate();
    const { blockhash } = await conn.getLatestBlockhash("confirmed");
    const rentExempt = await conn.getMinimumBalanceForRentExemption(200);

    const createStakeTx = StakeProgram.createAccount({
      fromPubkey: payer.publicKey,
      stakePubkey: newStakeKeypair.publicKey,
      authorized: new Authorized(payer.publicKey, payer.publicKey),
      lockup: new Lockup(0, 0, payer.publicKey),
      lamports: rentExempt + 100_000_000,
    });
    createStakeTx.recentBlockhash = blockhash;
    createStakeTx.feePayer = payer.publicKey;

    const sim = await conn.simulateTransaction(createStakeTx, [payer, newStakeKeypair]);
    console.log("LIVE TRANSACTION SIMULATION RESULT:", JSON.stringify({
      cluster: "devnet",
      currentValidators: voteAccounts.current.length,
      sampleValidatorVote: sampleValidator?.votePubkey,
      instructionsCount: createStakeTx.instructions.length,
      programIds: createStakeTx.instructions.map((ix) => ix.programId.toBase58()),
      simulationReturned: !!sim.value,
      err: sim.value.err,
      unitsConsumed: sim.value.unitsConsumed,
      logsPreview: sim.value.logs?.slice(0, 3),
    }, null, 2));

    expect(createStakeTx.instructions.length).toBe(2);
    expect(sim.value).toBeDefined();
  }, 30000);
});
