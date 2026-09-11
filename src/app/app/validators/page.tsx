"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, StatusDot } from "@/components/ui/primitives";
import { DataSourceIndicator } from "@/components/ui/data-source-indicator";
import { useValidatorData } from "@/components/app/data-context";
import { DataStateFallback } from "@/components/app/data-state-fallback";
import { useStrategy } from "@/components/app/strategy-context";
import { passesIndividualConstraints, scoreValidatorCohort } from "@/lib/engine/scoring";
import { cn, formatPercent, formatSol, shortAddress } from "@/lib/utils";
import type { HardConstraints, Validator } from "@/lib/types";

type SortKey =
  | "name"
  | "commission"
  | "apy"
  | "votePerformance"
  | "skipRate"
  | "activeStake"
  | "asn"
  | "score";

export default function ValidatorsPage() {
  const { snapshot, loading, error, refresh } = useValidatorData();
  const { policy } = useStrategy();

  const [search, setSearch] = useState("");
  const [minPerformance, setMinPerformance] = useState(0);
  const [maxCommission, setMaxCommission] = useState(100);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<Validator | null>(null);

  const evaluated = useMemo(() => {
    if (!snapshot) return [];
    const eligible: Validator[] = [];
    const evalMap = new Map<string, { ok: boolean; reasons: string[] }>();
    for (const v of snapshot.validators) {
      const result = passesIndividualConstraints(v, policy.constraints);
      evalMap.set(v.voteAccount, result);
      if (result.ok) eligible.push(v);
    }
    const scores = scoreValidatorCohort(eligible, policy.weights);
    return snapshot.validators.map((v) => ({
      validator: v,
      eligibility: evalMap.get(v.voteAccount)!,
      score: scores.get(v.voteAccount)?.compositeScore ?? null,
    }));
  }, [snapshot, policy]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return evaluated
      .filter(({ validator: v }) => {
        if (term && !(v.name?.toLowerCase().includes(term) || v.identity.toLowerCase().includes(term))) return false;
        if (v.votePerformance * 100 < minPerformance) return false;
        if (v.commission > maxCommission) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = sortDesc ? -1 : 1;
        const av = sortValue(a, sortKey);
        const bv = sortValue(b, sortKey);
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
  }, [evaluated, search, minPerformance, maxCommission, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  if (loading || error || !snapshot) {
    return <DataStateFallback loading={loading} error={error} onRetry={refresh} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-sm-text">Validators</h1>
          <p className="mt-1 text-sm text-sm-text-muted">{filtered.length} of {snapshot.validators.length} validators shown</p>
        </div>
        <DataSourceIndicator source={snapshot.source} />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs text-sm-text-muted">
              Search
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Validator name or identity"
                className="rounded-md border border-sm-border-strong bg-sm-bg-elevated px-3 py-1.5 text-sm text-sm-text outline-none focus-visible:border-sm-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-sm-text-muted">
              Minimum performance: {minPerformance}%
              <input
                type="range"
                min={0}
                max={100}
                value={minPerformance}
                onChange={(e) => setMinPerformance(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-sm-text-muted">
              Maximum commission: {maxCommission}%
              <input
                type="range"
                min={0}
                max={100}
                value={maxCommission}
                onChange={(e) => setMaxCommission(Number(e.target.value))}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-sm-border text-xs text-sm-text-muted">
                <Th onClick={() => toggleSort("name")} active={sortKey === "name"} desc={sortDesc}>Validator</Th>
                <th className="px-3 py-2 font-normal">Identity</th>
                <Th onClick={() => toggleSort("commission")} active={sortKey === "commission"} desc={sortDesc}>Commission</Th>
                <Th onClick={() => toggleSort("apy")} active={sortKey === "apy"} desc={sortDesc}>APY</Th>
                <Th onClick={() => toggleSort("votePerformance")} active={sortKey === "votePerformance"} desc={sortDesc}>Vote perf.</Th>
                <Th onClick={() => toggleSort("skipRate")} active={sortKey === "skipRate"} desc={sortDesc}>Skip rate</Th>
                <Th onClick={() => toggleSort("activeStake")} active={sortKey === "activeStake"} desc={sortDesc}>Active stake</Th>
                <Th onClick={() => toggleSort("asn")} active={sortKey === "asn"} desc={sortDesc}>ASN</Th>
                <th className="px-3 py-2 font-normal">Datacenter</th>
                <th className="px-3 py-2 font-normal">Version</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <Th onClick={() => toggleSort("score")} active={sortKey === "score"} desc={sortDesc}>Score</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ validator: v, eligibility, score }) => (
                <tr
                  key={v.voteAccount}
                  onClick={() => setSelected(v)}
                  className={cn(
                    "cursor-pointer border-b border-sm-border/60 hover:bg-sm-surface-hover",
                    selected?.voteAccount === v.voteAccount && "bg-sm-surface-hover"
                  )}
                >
                  <td className="px-3 py-2 font-medium text-sm-text">{v.name ?? "Unnamed validator"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-sm-text-muted">{shortAddress(v.identity)}</td>
                  <td className="px-3 py-2 tabular-nums">{v.commission}%</td>
                  <td className="px-3 py-2 tabular-nums">{formatPercent(v.estimatedApy, 2)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatPercent(v.votePerformance)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatPercent(v.skipRate, 2)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatSol(v.activeStakeLamports, 0)}</td>
                  <td className="px-3 py-2 tabular-nums">{v.asn}</td>
                  <td className="px-3 py-2 text-sm-text-muted">{v.datacenter}</td>
                  <td className="px-3 py-2 font-mono text-xs text-sm-text-muted">{v.version ?? "—"}</td>
                  <td className="px-3 py-2">
                    {v.delinquent ? (
                      <Badge tone="danger"><StatusDot tone="danger" />Delinquent</Badge>
                    ) : eligibility.ok ? (
                      <Badge tone="good"><StatusDot tone="good" />Eligible</Badge>
                    ) : (
                      <Badge tone="warn"><StatusDot tone="warn" />Excluded</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{score !== null ? score.toFixed(2) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Validator detail</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-sm-text-faint">Select a validator to see selection reasons and detail.</p>
            ) : (
              <ValidatorDetail validator={selected} constraints={policy.constraints} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  desc,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  desc: boolean;
}) {
  return (
    <th className="px-3 py-2 font-normal">
      <button onClick={onClick} className="flex items-center gap-1 hover:text-sm-text">
        {children}
        {active && <span aria-hidden>{desc ? "↓" : "↑"}</span>}
      </button>
    </th>
  );
}

function ValidatorDetail({ validator: v, constraints }: { validator: Validator; constraints: HardConstraints }) {
  const { ok, reasons } = passesIndividualConstraints(v, constraints);
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <div className="font-display font-semibold text-sm-text">{v.name ?? "Unnamed validator"}</div>
        <div className="font-mono text-xs text-sm-text-faint">{v.voteAccount}</div>
      </div>
      <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
        <dt className="text-sm-text-muted">Commission</dt>
        <dd className="text-right tabular-nums">{v.commission}%</dd>
        <dt className="text-sm-text-muted">Vote performance</dt>
        <dd className="text-right tabular-nums">{formatPercent(v.votePerformance)}</dd>
        <dt className="text-sm-text-muted">Skip rate</dt>
        <dd className="text-right tabular-nums">{formatPercent(v.skipRate, 2)}</dd>
        <dt className="text-sm-text-muted">Active stake</dt>
        <dd className="text-right tabular-nums">{formatSol(v.activeStakeLamports, 0)} SOL</dd>
        <dt className="text-sm-text-muted">ASN</dt>
        <dd className="text-right">{v.asn} {v.asnOrg ? `(${v.asnOrg})` : ""}</dd>
        <dt className="text-sm-text-muted">Datacenter</dt>
        <dd className="text-right">{v.datacenter}</dd>
        <dt className="text-sm-text-muted">Software</dt>
        <dd className="text-right font-mono">{v.version ?? "unknown"}</dd>
      </dl>
      <div>
        <div className="mb-1 text-xs font-medium text-sm-text-muted">Strategy compatibility</div>
        {ok ? (
          <Badge tone="good">Compatible with current strategy</Badge>
        ) : (
          <div className="flex flex-col gap-1">
            <Badge tone="danger">Not compatible</Badge>
            <ul className="mt-1 list-disc pl-4 text-xs text-sm-text-muted">
              {reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function sortValue(row: { validator: Validator; score: number | null }, key: SortKey): number | string {
  const v = row.validator;
  switch (key) {
    case "name":
      return v.name ?? v.identity;
    case "commission":
      return v.commission;
    case "apy":
      return v.estimatedApy;
    case "votePerformance":
      return v.votePerformance;
    case "skipRate":
      return v.skipRate;
    case "activeStake":
      return Number(v.activeStakeLamports);
    case "asn":
      return v.asn;
    case "score":
      return row.score ?? -1;
    default:
      return 0;
  }
}
