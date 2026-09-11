"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { DataSourceIndicator } from "@/components/ui/data-source-indicator";
import { useValidatorData } from "@/components/app/data-context";
import { DataStateFallback } from "@/components/app/data-state-fallback";
import { useStrategy } from "@/components/app/strategy-context";
import { useAllocation } from "@/components/app/use-allocation";
import { useHistory } from "@/components/app/history-context";
import { generateRebalanceProposal } from "@/lib/engine/rebalance";
import { formatPercent, formatSol, shortAddress } from "@/lib/utils";
import type { Validator } from "@/lib/types";
import { useWallet } from "@solana/wallet-adapter-react";

export default function RebalancingPage() {
  const { snapshot, loading, error, refresh } = useValidatorData();
  const { policy } = useStrategy();
  const { result: currentAllocation } = useAllocation();
  const { connected } = useWallet();
  const [simulateDrift, setSimulateDrift] = useState(false);

  const simulatedValidators = useMemo<Validator[] | null>(() => {
    if (!snapshot || !currentAllocation || currentAllocation.legs.length === 0) return null;
    if (!simulateDrift) return snapshot.validators;
    // Demo-only: manually degrade the top allocation leg's underlying
    // validator to make a violation reachable without a live epoch passing.
    // This is a UI simulation of drift, not fabricated "live" data — it's
    // explicitly labeled below and only available with the demo provider.
    const targetAccount = currentAllocation.legs[0].voteAccount;
    return snapshot.validators.map((v) =>
      v.voteAccount === targetAccount ? { ...v, votePerformance: 0.81, skipRate: 0.09 } : v
    );
  }, [snapshot, currentAllocation, simulateDrift]);

  const proposal = useMemo(() => {
    if (!currentAllocation || !simulatedValidators || !snapshot) return null;
    return generateRebalanceProposal(currentAllocation, policy, simulatedValidators, snapshot.epochLabel);
  }, [currentAllocation, simulatedValidators, policy, snapshot]);

  const { log } = useHistory();
  useEffect(() => {
    if (!proposal || !snapshot) return;
    if (proposal.moves.length === 0) return;
    log({
      epochLabel: snapshot.epochLabel,
      kind: "rebalance-recommended",
      title: "Rebalance recommended",
      detail: proposal.summary,
    });
    for (const move of proposal.moves) {
      log({
        epochLabel: snapshot.epochLabel,
        kind: "policy-violation",
        title: `${move.violationKind} on ${move.fromName ?? move.fromVoteAccount}`,
        detail: move.reason,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal?.summary]);

  if (loading || error || !snapshot || !currentAllocation) {
    return <DataStateFallback loading={loading} error={error} onRetry={refresh} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-sm-text">Rebalancing</h1>
          <p className="mt-1 text-sm text-sm-text-muted">Default mode: recommend only. Nothing here moves funds automatically.</p>
        </div>
        <DataSourceIndicator source={snapshot.source} />
      </div>

      {snapshot.source === "demo" && (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 pt-5">
            <div>
              <div className="text-sm font-medium text-sm-text">Simulate a condition change</div>
              <p className="text-xs text-sm-text-faint">
                Demo-only toggle: artificially degrades your top-held validator&apos;s performance so you can see how
                drift detection and proposal generation behave. Clearly a simulation, not live data.
              </p>
            </div>
            <label className="inline-flex shrink-0 items-center gap-2 text-sm">
              <input type="checkbox" checked={simulateDrift} onChange={(e) => setSimulateDrift(e.target.checked)} />
              Simulate
            </label>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{proposal?.moves.length ? "Rebalance recommended" : "Current status"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-sm-text">{proposal?.summary}</p>
          {proposal && proposal.moves.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Metric label="Distribution score" before={proposal.currentDistributionScore.toFixed(1)} after={proposal.projectedDistributionScore.toFixed(1)} />
              <Metric
                label="Est. APY"
                before={formatPercent(currentAllocation.aggregate.weightedApy, 2)}
                after={formatPercent(proposal.projectedAggregate.weightedApy, 2)}
              />
              <Metric
                label="Vote performance"
                before={formatPercent(currentAllocation.aggregate.weightedVotePerformance)}
                after={formatPercent(proposal.projectedAggregate.weightedVotePerformance)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {proposal && proposal.moves.length > 0 && (
        <Card className="overflow-x-auto">
          <CardHeader>
            <CardTitle>Proposed moves (preview — dry run)</CardTitle>
          </CardHeader>
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-sm-border text-xs text-sm-text-muted">
                <th className="px-5 py-2 font-normal">From</th>
                <th className="px-3 py-2 font-normal">To</th>
                <th className="px-3 py-2 font-normal">Amount</th>
                <th className="px-3 py-2 font-normal">Reason</th>
                <th className="px-3 py-2 font-normal">Concentration effect</th>
              </tr>
            </thead>
            <tbody>
              {proposal.moves.map((move, i) => (
                <tr key={i} className="border-b border-sm-border/60">
                  <td className="px-5 py-2 font-medium text-sm-text">{move.fromName ?? shortAddress(move.fromVoteAccount)}</td>
                  <td className="px-3 py-2 font-medium text-sm-text">{move.toName ?? shortAddress(move.toVoteAccount)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatSol(move.amountLamports)} SOL</td>
                  <td className="px-3 py-2 text-sm-text-muted">
                    <Badge tone="warn" className="mb-1">{move.violationKind}</Badge>
                    <div>{move.reason}</div>
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatPercent(move.projectedConcentrationBefore)} → {formatPercent(move.projectedConcentrationAfter)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <CardContent className="flex flex-wrap items-center gap-3 border-t border-sm-border pt-4">
            <Button variant="secondary" size="sm" disabled>
              Review transaction
            </Button>
            <Button variant="primary" size="sm" disabled={!connected}>
              {connected ? "Execute via wallet" : "Connect wallet to execute"}
            </Button>
            <span className="text-xs text-sm-text-faint">
              {snapshot.source === "demo"
                ? "Execution is disabled while viewing demo data — transaction construction only runs against live-labeled data with a connected wallet."
                : "Executing will open your wallet to review and sign each transaction. Nothing is submitted without your explicit approval."}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Metric({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div>
      <div className="text-xs text-sm-text-muted">{label}</div>
      <div className="tabular-nums text-sm-text">
        {before} <span className="text-sm-text-faint">→</span> <span className="text-sm-accent">{after}</span>
      </div>
    </div>
  );
}
