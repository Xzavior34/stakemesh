"use client";

import * as React from "react";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/primitives";
import { DataSourceIndicator } from "@/components/ui/data-source-indicator";
import { useValidatorData } from "@/components/app/data-context";
import { DataStateFallback } from "@/components/app/data-state-fallback";
import { useAllocation } from "@/components/app/use-allocation";
import { cn, formatPercent, formatSol, shortAddress } from "@/lib/utils";

const PALETTE = ["#4fd1c5", "#5b8def", "#f0b429", "#9b8afb", "#f2685c", "#4ade80", "#e07be0", "#7ce0d6", "#8a93a8", "#d68c45"];

export default function AllocationPage() {
  const { snapshot, loading, error, refresh } = useValidatorData();
  const { result } = useAllocation();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading || error || !snapshot || !result) {
    return <DataStateFallback loading={loading} error={error} onRetry={refresh} />;
  }

  const legPieData = result.legs.map((leg, i) => ({
    name: leg.name ?? shortAddress(leg.voteAccount),
    value: Number(leg.stakeLamports),
    color: PALETTE[i % PALETTE.length],
  }));

  const asnPieData = Object.entries(result.concentration.byAsn).map(([asn, frac], i) => ({
    name: `ASN ${asn}`,
    value: frac,
    color: PALETTE[i % PALETTE.length],
  }));

  const dcPieData = Object.entries(result.concentration.byDatacenter).map(([dc, frac], i) => ({
    name: dc,
    value: frac,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-sm-text">Allocation</h1>
          <p className="mt-1 text-sm text-sm-text-muted">
            {formatSol(result.totalAllocatedLamports)} SOL allocated across {result.legs.length} validators
            {!result.fullyAllocated && " — not fully allocated, see notes below"}
          </p>
        </div>
        <DataSourceIndicator source={snapshot.source} />
      </div>

      {result.constraintViolations.length > 0 && (
        <Card className="border-sm-danger/40 bg-sm-danger/5">
          <CardContent className="pt-5 text-sm text-sm-danger">
            {result.constraintViolations.map((v) => (
              <div key={v}>{v}</div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DonutCard title="Allocation by validator" data={legPieData} formatValue={(v) => `${(v / 1_000_000_000).toFixed(2)} SOL`} />
        <DonutCard title="ASN distribution" data={asnPieData} formatValue={(v) => formatPercent(v)} />
        <DonutCard title="Datacenter distribution" data={dcPieData} formatValue={(v) => formatPercent(v)} />
      </div>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Validator breakdown</CardTitle>
        </CardHeader>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-sm-border text-xs text-sm-text-muted">
              <th className="px-5 py-2 font-normal">Validator</th>
              <th className="px-3 py-2 font-normal">Stake</th>
              <th className="px-3 py-2 font-normal">%</th>
              <th className="px-3 py-2 font-normal">Commission</th>
              <th className="px-3 py-2 font-normal">Vote perf.</th>
              <th className="px-3 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {result.legs.map((leg) => {
              const v = snapshot.validators.find((x) => x.voteAccount === leg.voteAccount);
              const isOpen = expanded === leg.voteAccount;
              return (
                <React.Fragment key={leg.voteAccount}>
                  <tr
                    className="cursor-pointer border-b border-sm-border/60 hover:bg-sm-surface-hover"
                    onClick={() => setExpanded(isOpen ? null : leg.voteAccount)}
                  >
                    <td className="px-5 py-2 font-medium text-sm-text">{leg.name ?? shortAddress(leg.voteAccount)}</td>
                    <td className="px-3 py-2 tabular-nums">{formatSol(leg.stakeLamports)} SOL</td>
                    <td className="px-3 py-2 tabular-nums">{formatPercent(leg.fractionOfTotal)}</td>
                    <td className="px-3 py-2 tabular-nums">{v?.commission ?? "—"}%</td>
                    <td className="px-3 py-2 tabular-nums">{v ? formatPercent(v.votePerformance) : "—"}</td>
                    <td className="px-3 py-2 text-sm-text-faint">{isOpen ? "Hide reasons ▲" : "Why? ▼"}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-sm-border/60 bg-sm-bg-elevated">
                      <td colSpan={6} className="px-5 py-3">
                        <div className="text-xs font-medium text-sm-text-muted">Selected because:</div>
                        <ul className="mt-1 list-disc pl-4 text-xs text-sm-text">
                          {leg.inclusionReasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Excluded validators</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {result.excluded.length === 0 && <p className="text-sm text-sm-text-faint">No validators were excluded.</p>}
          {result.excluded.slice(0, 25).map((ex) => (
            <div key={ex.voteAccount} className="rounded-md border border-sm-border bg-sm-bg-elevated p-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge tone="warn">Excluded</Badge>
                <span className="font-medium text-sm-text">{ex.name ?? shortAddress(ex.voteAccount)}</span>
              </div>
              <ul className="mt-1 list-disc pl-4 text-xs text-sm-text-muted">
                {ex.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
          {result.excluded.length > 25 && (
            <p className="text-xs text-sm-text-faint">+{result.excluded.length - 25} more, see the Validators tab.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DonutCard({
  title,
  data,
  formatValue,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  formatValue: (v: number) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-sm-text-faint">No data.</p>
        ) : (
          <div className={cn("h-56")}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="var(--sm-bg)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [formatValue(Number(v)), String(n)]}
                  contentStyle={{ background: "var(--sm-surface)", border: "1px solid var(--sm-border)", borderRadius: 6, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
