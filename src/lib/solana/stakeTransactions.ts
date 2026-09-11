import { Keypair, PublicKey, StakeInstruction, StakeProgram, SystemInstruction, SystemProgram, Transaction } from "@solana/web3.js";

/**
 * Real Solana stake-management transaction construction.
 *
 * This file builds actual `StakeProgram` transactions — not simulated or
 * fabricated ones. It does not submit anything on its own; callers sign and
 * send these through the connected wallet, which shows its own review UI
 * before the user approves.
 *
 * REDELEGATION MODEL: moving stake from validator A to validator B is not a
 * single instruction. This implementation uses the conservative, universally
 * supported three-step path rather than any single-instruction "redelegate"
 * that may only be available on some stake-program versions:
 *
 *   1. Split the amount to move into a new stake account (still delegated to A).
 *   2. Deactivate that new account (it cools down over the current epoch).
 *   3. Once fully deactivated (next epoch or later), delegate it to B.
 *
 * Step 3 will be rejected on-chain if attempted before deactivation
 * completes — this module does not hide that, callers should surface the
 * on-chain error as-is rather than retrying silently.
 *
 * NOT YET VERIFIED END-TO-END: the instruction construction below is
 * exercised by offline unit tests (src/lib/solana/__tests__) that decode the
 * built transactions and assert their contents are correct. Signing and
 * submitting through a live wallet against a live RPC endpoint has not been
 * tested from this development environment — see /docs/security. Test on
 * devnet before trusting this against mainnet funds.
 */

export function generateSplitStakeAccount(): Keypair {
  return Keypair.generate();
}

export interface SplitStakeArgs {
  /** The existing, currently-delegated stake account to split from. */
  sourceStakePubkey: PublicKey;
  /** The wallet authorized to manage the source stake account (staker authority). */
  authorizedPubkey: PublicKey;
  /** A freshly generated keypair for the new stake account created by the split. */
  newStakeAccount: Keypair;
  /** Amount to move, in lamports. Must leave the source account at or above the rent-exempt minimum. */
  lamports: number;
  /** Rent-exempt minimum for a stake account, from `connection.getMinimumBalanceForRentExemption(StakeProgram.space)`. */
  rentExemptReserve: number;
}

/** Step 1: split `lamports` off the source stake account into a brand-new account. */
export function buildSplitTransaction(args: SplitStakeArgs): Transaction {
  return StakeProgram.split(
    {
      stakePubkey: args.sourceStakePubkey,
      authorizedPubkey: args.authorizedPubkey,
      splitStakePubkey: args.newStakeAccount.publicKey,
      lamports: args.lamports,
    },
    args.rentExemptReserve
  );
}

export interface DeactivateStakeArgs {
  stakePubkey: PublicKey;
  authorizedPubkey: PublicKey;
}

/** Step 2: begin deactivating a stake account so it can be redelegated once cooled down. */
export function buildDeactivateTransaction(args: DeactivateStakeArgs): Transaction {
  return StakeProgram.deactivate({
    stakePubkey: args.stakePubkey,
    authorizedPubkey: args.authorizedPubkey,
  });
}

export interface DelegateStakeArgs {
  stakePubkey: PublicKey;
  authorizedPubkey: PublicKey;
  votePubkey: PublicKey;
}

/** Step 3: delegate a (by now deactivated) stake account to the destination validator. */
export function buildDelegateTransaction(args: DelegateStakeArgs): Transaction {
  return StakeProgram.delegate({
    stakePubkey: args.stakePubkey,
    authorizedPubkey: args.authorizedPubkey,
    votePubkey: args.votePubkey,
  });
}

export interface InstructionSummary {
  programId: string;
  type: string;
  detail: string;
}

/**
 * Decode a constructed transaction back into a human-readable summary for
 * the "review transaction" UI, using the same decoders the transaction was
 * built from — this is a real decode of the actual instruction data, not a
 * hand-written description that could drift from what will actually execute
 * on-chain.
 */
export function describeTransaction(tx: Transaction): InstructionSummary[] {
  return tx.instructions.map((ix) => {
    const programId = ix.programId.toBase58();

    // StakeProgram.split() legitimately prepends a System Program
    // createAccount instruction to fund/create the new stake account before
    // the Stake program can split into it — this is a real, expected part
    // of the transaction, not a foreign instruction to flag as suspicious.
    if (ix.programId.equals(SystemProgram.programId)) {
      try {
        const kind = SystemInstruction.decodeInstructionType(ix);
        if (kind === "Create") {
          const d = SystemInstruction.decodeCreateAccount(ix);
          return {
            programId,
            type: "System: CreateAccount",
            detail: `Create account ${d.newAccountPubkey.toBase58()} funded with ${d.lamports.toLocaleString()} lamports, owned by ${d.programId.toBase58()}`,
          };
        }
        return { programId, type: `System: ${kind}`, detail: "System program instruction." };
      } catch (err) {
        return { programId, type: "System: undecodable", detail: err instanceof Error ? err.message : "Failed to decode." };
      }
    }

    if (!ix.programId.equals(StakeProgram.programId)) {
      return { programId, type: "unknown", detail: `Instruction from an unexpected program (${programId}) — review carefully before signing.` };
    }
    try {
      const kind = StakeInstruction.decodeInstructionType(ix);
      switch (kind) {
        case "Split": {
          const d = StakeInstruction.decodeSplit(ix);
          return {
            programId,
            type: "Split",
            detail: `Move ${d.lamports.toLocaleString()} lamports from ${d.stakePubkey.toBase58()} into new account ${d.splitStakePubkey.toBase58()}`,
          };
        }
        case "Deactivate": {
          const d = StakeInstruction.decodeDeactivate(ix);
          return { programId, type: "Deactivate", detail: `Begin deactivating ${d.stakePubkey.toBase58()}` };
        }
        case "Delegate": {
          const d = StakeInstruction.decodeDelegate(ix);
          return {
            programId,
            type: "Delegate",
            detail: `Delegate ${d.stakePubkey.toBase58()} to validator vote account ${d.votePubkey.toBase58()}`,
          };
        }
        default:
          return { programId, type: kind, detail: "Stake program instruction (no detailed decoder wired up for this type)." };
      }
    } catch (err) {
      return { programId, type: "undecodable", detail: err instanceof Error ? err.message : "Failed to decode instruction." };
    }
  });
}
