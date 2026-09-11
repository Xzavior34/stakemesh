"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/primitives";
import { DataSourceIndicator } from "@/components/ui/data-source-indicator";
import { useValidatorData } from "@/components/app/data-context";
import { useAllocation } from "@/components/app/use-allocation";
import { GuidedDemo } from "@/components/app/guided-demo";
import { DataStateFallback } from "@/components/app/data-state-fallback";
import { formatPercent, formatSol } from "@/lib/utils";

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-display text-2xl font-semibold tabular-nums text-sm-text">{value}</div>
        {sub && <div className="mt-1 text-xs text-sm-text-faint">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const { snapshot, loading, error, refresh } = useValidatorData();
  const { result } = useAllocation();

  if (loading || error || !snapshot || !result) {
    return <DataStateFallback loading={loading} error={error} onRetry={refresh} />;
  }

  const healthy = result.constraintViolations.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-sm-text">Overview</h1>
          <p className="mt-1 text-sm text-sm-text-muted">{snapshot.epochLabel}</p>
        </div>
        <DataSourceIndicator source={snapshot.source} />
      </div>

      <GuidedDemo />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard label="Total managed stake" value={`${formatSol(result.totalAllocatedLamports, 2)} SOL`} sub={`of ${formatSol(result.requestedLamports, 2)} SOL requested`} />
        <MetricCard label="Validators" value={String(result.legs.length)} sub={`target ${result.legs.length > 0 ? result.legs.length : "—"}`} />
        <MetricCard label="Estimated APY" value={formatPercent(result.aggregate.weightedApy, 2)} />
        <MetricCard label="Average commission" value={`${result.aggregate.weightedCommission.toFixed(1)}%`} />
        <MetricCard label="ASN concentration" value={formatPercent(result.concentration.maxAsnConcentration)} sub="largest single ASN share" />
        <MetricCard label="Datacenter concentration" value={formatPercent(result.concentration.maxDatacenterConcentration)} sub="largest single datacenter share" />
        <MetricCard label="Voting performance" value={formatPercent(result.aggregate.weightedVotePerformance)} sub="stake-weighted average" />
        <Card>
          <CardHeader>
            <CardTitle>Strategy health</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge tone={healthy ? "good" : "danger"} className="text-sm">
              {healthy ? "Healthy" : "Constraint violated"}
            </Badge>
            <div className="mt-2 text-xs text-sm-text-faint">
              {healthy
                ? "Allocation satisfies every configured hard constraint."
                : `${result.constraintViolations.length} violation(s) detected.`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>StakeMesh Distribution Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3">
            <div className="font-display text-3xl font-semibold text-sm-accent">{result.distributionScore}</div>
            <div className="text-sm text-sm-text-muted">/ 100 — not an official Solana Foundation metric. See /docs/validator-metrics.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
