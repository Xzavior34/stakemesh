import { Connection, PublicKey } from "@solana/web3.js";
import { allocate } from "@/lib/engine/allocate";
import { detectViolations, generateRebalanceProposal } from "@/lib/engine/rebalance";
import { getPreset } from "@/lib/engine/presets";
import {
  buildDeactivateTransaction,
  buildDelegateTransaction,
  buildSplitTransaction,
  checkClusterSafety,
  describeTransaction,
  generateSplitStakeAccount,
} from "./stakeTransactions";
import type { AllocationResult, RebalanceHistoryRecord, RebalanceProposal, Validator } from "@/lib/types";

export interface DevnetPipelineOptions {
  rpcUrl: string;
  cluster: "devnet" | "testnet" | "mainnet-beta" | "demo";
  walletPubkey?: string;
}

export interface PipelineVerificationResult {
  cluster: string;
  epochLabel: string;
  validatorsFetched: number;
  policyApplied: string;
  allocationResult: AllocationResult;
  violationsCount: number;
  proposal: RebalanceProposal;
  constructedTransactionsCount: number;
  decodedInstructionPreviews: Array<{ type: string; detail: string }>;
  clusterSafetyCheck: { safe: boolean; warning?: string };
  historyRecord: RebalanceHistoryRecord;
}

/**
 * Executes a non-destructive verification of the 16-step execution pipeline
 * against a Solana RPC endpoint. Explicitly guards against mainnet execution.
 */
export async function runPipelineVerification(
  options: DevnetPipelineOptions
): Promise<PipelineVerificationResult> {
  // Environment Guard: Never spend real funds or attempt write transactions on mainnet in automated pipeline
  const safety = checkClusterSafety(options.cluster, "devnet");
  if (options.cluster === "mainnet-beta") {
    return {
      cluster: options.cluster,
      epochLabel: "Mainnet Blocked",
      validatorsFetched: 0,
      policyApplied: "None",
      allocationResult: {} as AllocationResult,
      violationsCount: 0,
      proposal: {} as RebalanceProposal,
      constructedTransactionsCount: 0,
      decodedInstructionPreviews: [],
      clusterSafetyCheck: {
        safe: false,
        warning: "Mainnet execution guard active. Automated verification pipeline will not operate against mainnet-beta.",
      },
      historyRecord: {} as RebalanceHistoryRecord,
    };
  }

  const connection = new Connection(options.rpcUrl, "confirmed");
  
  // Step 1: Read Solana RPC data
  const [voteAccounts, epochInfo, version] = await Promise.all([
    connection.getVoteAccounts("confirmed"),
    connection.getEpochInfo("confirmed"),
    connection.getVersion(),
  ]);

  const epochLabel = `Epoch ${epochInfo.epoch} (agave/solana-labs ${version["solana-core"]})`;
  const allVotes = [...voteAccounts.current, ...voteAccounts.delinquent];

  // Map RPC vote accounts into Validator domain models
  const validators: Validator[] = allVotes.map((va) => ({
    voteAccount: va.votePubkey,
    identity: va.nodePubkey,
    name: null,
    commission: va.commission,
    votePerformance: 0.98,
    skipRate: 0.02,
    activeStakeLamports: BigInt(va.activatedStake),
    asn: 100,
    asnOrg: null,
    datacenter: "rpc-datacenter",
    country: null,
    version: null,
    delinquent: voteAccounts.delinquent.some((d) => d.votePubkey === va.votePubkey),
    estimatedApy: 0.07,
    active: true,
  }));

  // Step 2: Apply Foundation-Aligned Preset
  const preset = getPreset("foundation-decentralization")!;
  const policy = {
    id: preset.id,
    name: preset.label,
    stakeAmountLamports: 100_000_000_000n, // 100 SOL
    targetValidatorCount: preset.targetValidatorCount,
    constraints: preset.constraints,
    weights: preset.weights,
    preference: preset.preference,
  };

  // Step 3: Compute Allocation
  const allocation = allocate(policy, validators, epochLabel);

  // Step 4: Detect Drift & Generate Rebalance Proposal
  const validatorsByAccount = new Map(validators.map((v) => [v.voteAccount, v]));
  const violations = detectViolations(allocation, policy, validatorsByAccount);
  const proposal = generateRebalanceProposal(allocation, policy, validators, epochLabel);

  // Step 5: Construct & Decode Transactions for Proposal Moves
  const decodedPreviews: Array<{ type: string; detail: string }> = [];
  let constructedTxCount = 0;

  if (proposal.moves.length > 0 && options.walletPubkey) {
    const walletPk = new PublicKey(options.walletPubkey);
    const mockSourceStake = new PublicKey("Stake111111111111111111111111111111111111111");
    const mockNewStake = generateSplitStakeAccount();

    const move = proposal.moves[0];
    const splitTx = buildSplitTransaction({
      sourceStakePubkey: mockSourceStake,
      authorizedPubkey: walletPk,
      newStakeAccount: mockNewStake,
      lamports: Number(move.amountLamports),
      rentExemptReserve: 2_282_880,
    });
    constructedTxCount++;
    decodedPreviews.push(...describeTransaction(splitTx));

    const deactTx = buildDeactivateTransaction({
      stakePubkey: mockNewStake.publicKey,
      authorizedPubkey: walletPk,
    });
    constructedTxCount++;
    decodedPreviews.push(...describeTransaction(deactTx));

    const delegateTx = buildDelegateTransaction({
      stakePubkey: mockNewStake.publicKey,
      authorizedPubkey: walletPk,
      votePubkey: new PublicKey(move.toVoteAccount),
    });
    constructedTxCount++;
    decodedPreviews.push(...describeTransaction(delegateTx));
  }

  // Step 6: Record History
  const historyRecord: RebalanceHistoryRecord = {
    id: `rebalance-${Date.now()}`,
    timestamp: new Date().toISOString(),
    cluster: options.cluster,
    status: "RECOMMENDED",
    policyId: policy.id,
    policyName: policy.name,
    beforeDistributionScore: allocation.distributionScore,
    afterDistributionScore: proposal.projectedDistributionScore,
    moves: proposal.moves,
  };

  return {
    cluster: options.cluster,
    epochLabel,
    validatorsFetched: validators.length,
    policyApplied: policy.name,
    allocationResult: allocation,
    violationsCount: violations.length,
    proposal,
    constructedTransactionsCount: constructedTxCount,
    decodedInstructionPreviews: decodedPreviews,
    clusterSafetyCheck: safety,
    historyRecord,
  };
}
