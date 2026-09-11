"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, StakeProgram } from "@solana/web3.js";
import { Card, CardContent, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useValidatorData } from "@/components/app/data-context";
import { shortAddress } from "@/lib/utils";
import { guessClusterFromRpcUrl, isLikelyMainnet } from "@/lib/solana/cluster";
import {
  buildDeactivateTransaction,
  buildDelegateTransaction,
  buildSplitTransaction,
  describeTransaction,
  generateSplitStakeAccount,
  type InstructionSummary,
} from "@/lib/solana/stakeTransactions";
import type { Keypair } from "@solana/web3.js";

type Step = "configure" | "reviewSplit" | "splitDone" | "reviewDeactivate" | "deactivateDone" | "reviewDelegate" | "done" | "error";

export function RedelegatePanel({
  stakePubkey,
  balanceLamports,
  onClose,
}: {
  stakePubkey: string;
  balanceLamports: bigint;
  onClose: () => void;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { snapshot } = useValidatorData();

  const [step, setStep] = useState<Step>("configure");
  const [amountSol, setAmountSol] = useState(Number(balanceLamports) / 1_000_000_000);
  const [destinationVote, setDestinationVote] = useState("");
  const [newAccount, setNewAccount] = useState<Keypair | null>(null);
  const [signatures, setSignatures] = useState<{ split?: string; deactivate?: string; delegate?: string }>({});
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<InstructionSummary[] | null>(null);

  const cluster = guessClusterFromRpcUrl(connection.rpcEndpoint);
  const mainnetWarning = isLikelyMainnet(cluster);

  const destinationOptions = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.validators
      .filter((v) => !v.delinquent && v.active)
      .sort((a, b) => b.votePerformance - a.votePerformance)
      .slice(0, 25);
  }, [snapshot]);

  if (!publicKey) return null;

  async function handlePrepareSplit() {
    if (!publicKey) return;
    setErrorMessage(null);
    try {
      const rentExemptReserve = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
      const lamports = Math.round(amountSol * 1_000_000_000);
      if (lamports <= 0) throw new Error("Enter an amount greater than zero.");
      if (BigInt(lamports) >= balanceLamports) {
        throw new Error("Amount must leave the source account above the rent-exempt minimum — reduce it slightly.");
      }
      const kp = generateSplitStakeAccount();
      const tx = buildSplitTransaction({
        sourceStakePubkey: new PublicKey(stakePubkey),
        authorizedPubkey: publicKey,
        newStakeAccount: kp,
        lamports,
        rentExemptReserve,
      });
      setNewAccount(kp);
      setPreview(describeTransaction(tx));
      setStep("reviewSplit");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to prepare the split transaction.");
    }
  }

  async function handleSubmitSplit() {
    if (!newAccount || !publicKey) return;
    setPending(true);
    setErrorMessage(null);
    try {
      const rentExemptReserve = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
      const lamports = Math.round(amountSol * 1_000_000_000);
      const tx = buildSplitTransaction({
        sourceStakePubkey: new PublicKey(stakePubkey),
        authorizedPubkey: publicKey,
        newStakeAccount: newAccount,
        lamports,
        rentExemptReserve,
      });
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection, { signers: [newAccount] });
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      setSignatures((s) => ({ ...s, split: sig }));
      setStep("splitDone");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "The split transaction failed.");
      setStep("error");
    } finally {
      setPending(false);
    }
  }

  async function handlePrepareDeactivate() {
    if (!newAccount || !publicKey) return;
    const tx = buildDeactivateTransaction({ stakePubkey: newAccount.publicKey, authorizedPubkey: publicKey });
    setPreview(describeTransaction(tx));
    setStep("reviewDeactivate");
  }

  async function handleSubmitDeactivate() {
    if (!newAccount || !publicKey) return;
    setPending(true);
    setErrorMessage(null);
    try {
      const tx = buildDeactivateTransaction({ stakePubkey: newAccount.publicKey, authorizedPubkey: publicKey });
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      setSignatures((s) => ({ ...s, deactivate: sig }));
      setStep("deactivateDone");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "The deactivate transaction failed.");
      setStep("error");
    } finally {
      setPending(false);
    }
  }

  function handlePrepareDelegate() {
    if (!newAccount || !publicKey || !destinationVote) return;
    const tx = buildDelegateTransaction({
      stakePubkey: newAccount.publicKey,
      authorizedPubkey: publicKey,
      votePubkey: new PublicKey(destinationVote),
    });
    setPreview(describeTransaction(tx));
    setStep("reviewDelegate");
  }

  async function handleSubmitDelegate() {
    if (!newAccount || !publicKey || !destinationVote) return;
    setPending(true);
    setErrorMessage(null);
    try {
      const tx = buildDelegateTransaction({
        stakePubkey: newAccount.publicKey,
        authorizedPubkey: publicKey,
        votePubkey: new PublicKey(destinationVote),
      });
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      setSignatures((s) => ({ ...s, delegate: sig }));
      setStep("done");
    } catch (err) {
      // A too-early delegate (before deactivation has fully cooled down over
      // an epoch boundary) will be rejected on-chain — surface that
      // honestly instead of retrying silently or pretending it worked.
      setErrorMessage(
        (err instanceof Error ? err.message : "The delegate transaction failed.") +
          " If this happened right after deactivating, the account may not have finished cooling down yet — it typically needs to wait for the next epoch boundary."
      );
      setStep("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-sm-accent/40 bg-sm-bg-elevated">
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-sm-text">Redelegate stake account</div>
            <p className="mt-1 font-mono text-xs text-sm-text-faint">{shortAddress(stakePubkey, 8)}</p>
          </div>
          <button onClick={onClose} className="text-xs text-sm-text-faint hover:text-sm-text-muted">
            Close
          </button>
        </div>

        {mainnetWarning && (
          <div className="rounded-md border border-sm-danger/40 bg-sm-danger/5 p-3 text-xs text-sm-danger">
            {cluster === "mainnet"
              ? "This wallet is connected to mainnet-beta — these transactions will move real SOL. Consider testing on devnet first."
              : "Could not confirm this RPC endpoint is a test cluster — treating it as mainnet for safety. Real SOL may be at risk."}
          </div>
        )}

        <p className="text-xs text-sm-text-faint">
          Moving stake between validators takes three separate, wallet-signed transactions: split off the amount into
          a new account, deactivate it, then — once it has cooled down over an epoch boundary — delegate it to the
          destination validator. Nothing is submitted without your explicit approval at each step.
        </p>

        {step === "configure" && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-sm-text-muted">Amount to move (SOL)</span>
              <input
                type="number"
                value={amountSol}
                min={0}
                max={Number(balanceLamports) / 1_000_000_000}
                step={0.1}
                onChange={(e) => setAmountSol(Number(e.target.value))}
                className="rounded-md border border-sm-border-strong bg-sm-bg px-3 py-1.5 text-sm tabular-nums outline-none focus-visible:border-sm-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-sm-text-muted">Destination validator</span>
              <select
                value={destinationVote}
                onChange={(e) => setDestinationVote(e.target.value)}
                className="rounded-md border border-sm-border-strong bg-sm-bg px-3 py-1.5 text-sm outline-none focus-visible:border-sm-accent"
              >
                <option value="">Select a validator…</option>
                {destinationOptions.map((v) => (
                  <option key={v.voteAccount} value={v.voteAccount}>
                    {v.name ?? shortAddress(v.voteAccount)} — {(v.votePerformance * 100).toFixed(1)}% perf, {v.commission}% commission
                  </option>
                ))}
              </select>
              {snapshot?.source === "demo" && (
                <span className="text-xs text-sm-text-faint">
                  Destination list is from demo validator data — in live mode this uses real validators from RPC.
                </span>
              )}
            </label>
            <Button size="sm" onClick={handlePrepareSplit} disabled={!destinationVote || amountSol <= 0}>
              Review split transaction
            </Button>
          </div>
        )}

        {(step === "reviewSplit" || step === "reviewDeactivate" || step === "reviewDelegate") && preview && (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-sm-border bg-sm-bg p-3">
              <div className="text-xs font-medium text-sm-text-muted">
                Instructions in this transaction (decoded from what will actually be sent):
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {preview.map((ix, i) => (
                  <li key={i} className="text-xs text-sm-text">
                    <Badge tone="accent" className="mb-1">
                      {ix.type}
                    </Badge>
                    <div className="text-sm-text-muted">{ix.detail}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={
                  step === "reviewSplit" ? handleSubmitSplit : step === "reviewDeactivate" ? handleSubmitDeactivate : handleSubmitDelegate
                }
              >
                {pending ? "Waiting for wallet…" : "Sign & submit"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setStep("configure")} disabled={pending}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "splitDone" && (
          <div className="flex flex-col gap-2 text-sm">
            <Badge tone="good">Split confirmed</Badge>
            <p className="text-xs text-sm-text-muted">
              Signature: <span className="font-mono">{shortAddress(signatures.split ?? "", 8)}</span>. New stake
              account: <span className="font-mono">{shortAddress(newAccount?.publicKey.toBase58() ?? "", 8)}</span>.
              Next, deactivate it so it can be redelegated.
            </p>
            <Button size="sm" onClick={handlePrepareDeactivate}>
              Review deactivate transaction
            </Button>
          </div>
        )}

        {step === "deactivateDone" && (
          <div className="flex flex-col gap-2 text-sm">
            <Badge tone="good">Deactivation submitted</Badge>
            <p className="text-xs text-sm-text-muted">
              Signature: <span className="font-mono">{shortAddress(signatures.deactivate ?? "", 8)}</span>. This
              account needs to fully cool down (typically until the next epoch boundary) before it can be delegated
              to a new validator. You can attempt the delegate step now — the network will reject it if the cooldown
              hasn&apos;t finished yet, and you can simply retry later.
            </p>
            <Button size="sm" onClick={handlePrepareDelegate}>
              Review delegate transaction
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-2 text-sm">
            <Badge tone="good">Redelegation complete</Badge>
            <p className="text-xs text-sm-text-muted">
              Signature: <span className="font-mono">{shortAddress(signatures.delegate ?? "", 8)}</span>. Refresh the
              stake accounts table to see the new delegation.
            </p>
            <Button size="sm" variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        {step === "error" && errorMessage && (
          <div className="flex flex-col gap-2">
            <Badge tone="danger">Transaction failed</Badge>
            <p className="text-xs text-sm-danger">{errorMessage}</p>
            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
