"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { StakeProgram } from "@solana/web3.js";
import { Card, CardContent, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { RedelegatePanel } from "@/components/app/redelegate-panel";
import { formatSol, shortAddress } from "@/lib/utils";

interface StakeAccountRow {
  pubkey: string;
  balanceLamports: bigint;
  delegatedVoteAccount: string | null;
  authorizedStaker: string | null;
  activationEpoch: string | null;
  deactivationEpoch: string | null;
}

export default function StakeAccountsPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [rows, setRows] = useState<StakeAccountRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redelegating, setRedelegating] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    connection
      .getParsedProgramAccounts(StakeProgram.programId, {
        filters: [
          { dataSize: 200 },
          { memcmp: { offset: 44, bytes: publicKey.toBase58() } }, // authorized staker offset within Stake state
        ],
      })
      .then((accounts) => {
        if (cancelled) return;
        const parsed: StakeAccountRow[] = accounts.map((acc) => {
          const info = (acc.account.data as { parsed?: { info?: Record<string, unknown> } }).parsed?.info;
          const stake = info?.stake as
            | { delegation?: { voter?: string; activationEpoch?: string; deactivationEpoch?: string }; }
            | undefined;
          const meta = info?.meta as { authorized?: { staker?: string } } | undefined;
          return {
            pubkey: acc.pubkey.toBase58(),
            balanceLamports: BigInt(acc.account.lamports),
            delegatedVoteAccount: stake?.delegation?.voter ?? null,
            authorizedStaker: meta?.authorized?.staker ?? null,
            activationEpoch: stake?.delegation?.activationEpoch ?? null,
            deactivationEpoch: stake?.delegation?.deactivationEpoch ?? null,
          };
        });
        setRows(parsed);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, connection]);

  if (!connected) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-sm-text-muted">
          Connect wallet to view your stake accounts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-sm-text">Stake accounts</h1>
        <p className="mt-1 text-sm text-sm-text-muted">
          Real on-chain stake accounts for {shortAddress(publicKey!.toBase58())}, queried directly via RPC — not fixture data.
          Active accounts can be redelegated to a different validator through a real, wallet-signed split →
          deactivate → delegate flow.
        </p>
      </div>

      {loading && <p className="text-sm text-sm-text-muted">Loading stake accounts from RPC…</p>}
      {error && (
        <Card className="border-sm-danger/40 bg-sm-danger/5">
          <CardContent className="pt-5 text-sm text-sm-danger">Failed to load stake accounts: {error}</CardContent>
        </Card>
      )}

      {rows && rows.length === 0 && !loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-sm-text-muted">
            No stake accounts found for this wallet.
          </CardContent>
        </Card>
      )}

      {rows && rows.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-sm-border text-xs text-sm-text-muted">
                <th className="px-5 py-2 font-normal">Stake account</th>
                <th className="px-3 py-2 font-normal">Balance</th>
                <th className="px-3 py-2 font-normal">Delegated validator</th>
                <th className="px-3 py-2 font-normal">Activation epoch</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.pubkey} className="border-b border-sm-border/60">
                  <td className="px-5 py-2 font-mono text-xs text-sm-text">{shortAddress(r.pubkey, 6)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatSol(r.balanceLamports)} SOL</td>
                  <td className="px-3 py-2 font-mono text-xs text-sm-text-muted">
                    {r.delegatedVoteAccount ? shortAddress(r.delegatedVoteAccount, 6) : "Undelegated"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{r.activationEpoch ?? "—"}</td>
                  <td className="px-3 py-2">
                    {r.deactivationEpoch && r.deactivationEpoch !== "18446744073709551615" ? (
                      <Badge tone="warn">Deactivating</Badge>
                    ) : r.delegatedVoteAccount ? (
                      <Badge tone="good">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Undelegated</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.delegatedVoteAccount && (!r.deactivationEpoch || r.deactivationEpoch === "18446744073709551615") && (
                      <Button size="sm" variant="secondary" onClick={() => setRedelegating(r.pubkey)}>
                        Redelegate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {redelegating && (
        <RedelegatePanel
          stakePubkey={redelegating}
          balanceLamports={rows?.find((r) => r.pubkey === redelegating)?.balanceLamports ?? 0n}
          onClose={() => setRedelegating(null)}
        />
      )}
    </div>
  );
}
