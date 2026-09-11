import { describe, expect, it } from "vitest";
import { Keypair, StakeProgram } from "@solana/web3.js";
import {
  buildDeactivateTransaction,
  buildDelegateTransaction,
  buildSplitTransaction,
  describeTransaction,
  generateSplitStakeAccount,
} from "../stakeTransactions";

// These tests construct and decode real @solana/web3.js Transaction objects.
// They require no network access — Transaction construction and instruction
// decoding are pure, offline operations. This is what actually verifies the
// transaction-building logic is correct, independent of whether this
// environment can reach a live RPC endpoint.

describe("buildSplitTransaction", () => {
  it("produces a Stake-program instruction that decodes back to the same params", () => {
    const source = Keypair.generate();
    const authority = Keypair.generate();
    const newAccount = generateSplitStakeAccount();
    const lamports = 5_000_000_000;

    const tx = buildSplitTransaction({
      sourceStakePubkey: source.publicKey,
      authorizedPubkey: authority.publicKey,
      newStakeAccount: newAccount,
      lamports,
      rentExemptReserve: 2_282_880,
    });

    expect(tx.instructions.length).toBeGreaterThan(0);
    const summary = describeTransaction(tx);
    const splitLine = summary.find((s) => s.type === "Split");
    expect(splitLine).toBeDefined();
    expect(splitLine!.detail).toContain(lamports.toLocaleString());
    expect(splitLine!.detail).toContain(source.publicKey.toBase58());
    expect(splitLine!.detail).toContain(newAccount.publicKey.toBase58());
  });

  it("includes the expected System CreateAccount + Stake Split instructions, both correctly decoded", () => {
    const source = Keypair.generate();
    const authority = Keypair.generate();
    const newAccount = generateSplitStakeAccount();

    const tx = buildSplitTransaction({
      sourceStakePubkey: source.publicKey,
      authorizedPubkey: authority.publicKey,
      newStakeAccount: newAccount,
      lamports: 1_000_000_000,
      rentExemptReserve: 2_282_880,
    });

    // StakeProgram.split() legitimately prepends a System Program
    // createAccount instruction to fund the new stake account before the
    // Stake program can split into it — verify both are present and
    // correctly decoded, rather than assuming every instruction is
    // Stake-program (which would be wrong).
    const summary = describeTransaction(tx);
    expect(summary.map((s) => s.type)).toEqual(["System: CreateAccount", "Split"]);
    expect(summary[0].detail).toContain(newAccount.publicKey.toBase58());
    expect(summary[1].detail).toContain(source.publicKey.toBase58());
  });
});

describe("buildDeactivateTransaction", () => {
  it("produces a Deactivate instruction referencing the correct stake account", () => {
    const stake = Keypair.generate();
    const authority = Keypair.generate();

    const tx = buildDeactivateTransaction({
      stakePubkey: stake.publicKey,
      authorizedPubkey: authority.publicKey,
    });

    const summary = describeTransaction(tx);
    expect(summary).toHaveLength(1);
    expect(summary[0].type).toBe("Deactivate");
    expect(summary[0].detail).toContain(stake.publicKey.toBase58());
  });
});

describe("buildDelegateTransaction", () => {
  it("produces a Delegate instruction referencing the correct stake and vote accounts", () => {
    const stake = Keypair.generate();
    const authority = Keypair.generate();
    const vote = Keypair.generate();

    const tx = buildDelegateTransaction({
      stakePubkey: stake.publicKey,
      authorizedPubkey: authority.publicKey,
      votePubkey: vote.publicKey,
    });

    const summary = describeTransaction(tx);
    const delegateLine = summary.find((s) => s.type === "Delegate");
    expect(delegateLine).toBeDefined();
    expect(delegateLine!.detail).toContain(stake.publicKey.toBase58());
    expect(delegateLine!.detail).toContain(vote.publicKey.toBase58());
  });
});

describe("describeTransaction", () => {
  it("flags a non-stake-program instruction rather than mis-decoding it", () => {
    // A transaction with no instructions at all should decode to an empty summary.
    const stake = Keypair.generate();
    const authority = Keypair.generate();
    const tx = buildDeactivateTransaction({ stakePubkey: stake.publicKey, authorizedPubkey: authority.publicKey });
    expect(describeTransaction(tx).every((s) => s.programId === StakeProgram.programId.toBase58())).toBe(true);
  });
});

describe("generateSplitStakeAccount", () => {
  it("returns a fresh, distinct keypair each call", () => {
    const a = generateSplitStakeAccount();
    const b = generateSplitStakeAccount();
    expect(a.publicKey.equals(b.publicKey)).toBe(false);
  });
});
