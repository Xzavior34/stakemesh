"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { STRATEGY_PRESETS } from "@/lib/engine/presets";
import { useStrategy } from "@/components/app/strategy-context";
import { parseNaturalLanguageStrategy, applyPatchToConstraints, type ParsedStrategyPatch } from "@/lib/engine/nlParser";
import { cn, formatSol } from "@/lib/utils";
import type { OptimizationPreference } from "@/lib/types";

const PREFERENCES: { id: OptimizationPreference; label: string }[] = [
  { id: "balanced", label: "Balanced" },
  { id: "max-yield", label: "Maximum yield" },
  { id: "max-decentralization", label: "Maximum decentralization" },
  { id: "max-reliability", label: "Maximum reliability" },
];

export default function StrategyPage() {
  const { policy, presetId, setPresetId, setStakeAmountSol, setTargetValidatorCount, setConstraints, setWeights, setPreference } =
    useStrategy();
  const [nlInput, setNlInput] = useState("");
  const [parsed, setParsed] = useState<ParsedStrategyPatch | null>(null);

  function handleParse() {
    setParsed(parseNaturalLanguageStrategy(nlInput));
  }

  function applyParsed() {
    if (!parsed) return;
    if (parsed.stakeAmountSol !== null) setStakeAmountSol(parsed.stakeAmountSol);
    if (parsed.targetValidatorCount !== null) setTargetValidatorCount(parsed.targetValidatorCount);
    if (parsed.matchedPresetId) setPresetId(parsed.matchedPresetId);
    setConstraints(applyPatchToConstraints(policy.constraints, parsed));
    setParsed(null);
    setNlInput("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-sm-text">Stake strategy</h1>
        <p className="mt-1 text-sm text-sm-text-muted">Every change here updates the allocation preview immediately.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Describe your staking strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-sm-text-faint">
            Parsed deterministically in your browser — not sent to an external AI API. Review the interpreted strategy before applying it.
          </p>
          <textarea
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
            placeholder="I want to stake 10 SOL across 15 validators, keep commission below 5%, and avoid putting more than 10% of my stake behind one ASN."
            className="h-20 w-full rounded-md border border-sm-border-strong bg-sm-bg-elevated px-3 py-2 text-sm text-sm-text outline-none focus-visible:border-sm-accent"
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={handleParse} disabled={!nlInput.trim()}>
              Interpret strategy
            </Button>
            {parsed && (
              <Button size="sm" variant="secondary" onClick={applyParsed}>
                Apply interpreted strategy
              </Button>
            )}
          </div>
          {parsed && (
            <div className="mt-3 rounded-md border border-sm-border bg-sm-bg-elevated p-3 text-sm">
              <div className="mb-1 text-xs font-medium text-sm-text-muted">Interpreted strategy</div>
              <ul className="flex flex-col gap-1 text-sm">
                <li>Stake amount: {parsed.stakeAmountSol !== null ? `${parsed.stakeAmountSol} SOL` : "unchanged"}</li>
                <li>Target validators: {parsed.targetValidatorCount ?? "unchanged"}</li>
                <li>Max commission: {parsed.maxCommission !== null ? `${parsed.maxCommission}%` : "unchanged"}</li>
                <li>Max ASN concentration: {parsed.maxAsnConcentration !== null ? `${(parsed.maxAsnConcentration * 100).toFixed(0)}%` : "unchanged"}</li>
              </ul>
              <ul className="mt-2 flex flex-col gap-1 text-xs text-sm-text-faint">
                {parsed.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STRATEGY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPresetId(preset.id)}
                className={cn(
                  "rounded-md border p-3 text-left transition-colors",
                  presetId === preset.id
                    ? "border-sm-accent bg-sm-accent/5"
                    : "border-sm-border bg-sm-bg-elevated hover:bg-sm-surface-hover"
                )}
              >
                <div className="font-medium text-sm-text">{preset.label}</div>
                <div className="mt-1 text-xs text-sm-text-muted">{preset.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stake amount &amp; target</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NumberField
              label="Stake amount (SOL)"
              value={Number(policy.stakeAmountLamports) / 1_000_000_000}
              onChange={setStakeAmountSol}
              step={1}
              min={0}
            />
            <NumberField
              label="Target validators"
              value={policy.targetValidatorCount}
              onChange={setTargetValidatorCount}
              step={1}
              min={1}
              max={100}
            />
            <div>
              <div className="mb-2 text-xs text-sm-text-muted">Optimization preference</div>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreference(p.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      policy.preference === p.id
                        ? "border-sm-accent text-sm-accent bg-sm-accent/10"
                        : "border-sm-border text-sm-text-muted hover:text-sm-text"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance &amp; commission</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SliderField
              label="Minimum voting performance"
              value={policy.constraints.minVotePerformance * 100}
              onChange={(v) => setConstraints({ ...policy.constraints, minVotePerformance: v / 100 })}
              min={50}
              max={100}
              suffix="%"
            />
            <SliderField
              label="Maximum skip rate"
              value={policy.constraints.maxSkipRate * 100}
              onChange={(v) => setConstraints({ ...policy.constraints, maxSkipRate: v / 100 })}
              min={0}
              max={20}
              step={0.5}
              suffix="%"
            />
            <SliderField
              label="Maximum commission"
              value={policy.constraints.maxCommission}
              onChange={(v) => setConstraints({ ...policy.constraints, maxCommission: v })}
              min={0}
              max={100}
              suffix="%"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decentralization</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SliderField
              label="Maximum ASN concentration"
              value={policy.constraints.maxAsnConcentration * 100}
              onChange={(v) => setConstraints({ ...policy.constraints, maxAsnConcentration: v / 100 })}
              min={1}
              max={100}
              suffix="%"
            />
            <SliderField
              label="Maximum datacenter concentration"
              value={policy.constraints.maxDatacenterConcentration * 100}
              onChange={(v) => setConstraints({ ...policy.constraints, maxDatacenterConcentration: v / 100 })}
              min={1}
              max={100}
              suffix="%"
            />
            <SliderField
              label="Maximum stake per validator"
              value={policy.constraints.maxStakePerValidator * 100}
              onChange={(v) => setConstraints({ ...policy.constraints, maxStakePerValidator: v / 100 })}
              min={1}
              max={100}
              suffix="%"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validator requirements</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className="flex items-center justify-between text-sm">
              <span className="text-sm-text-muted">Require active validator</span>
              <input
                type="checkbox"
                checked={policy.constraints.requireActive}
                onChange={(e) => setConstraints({ ...policy.constraints, requireActive: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span className="text-sm-text-muted">Exclude delinquent validators</span>
              <input
                type="checkbox"
                checked={policy.constraints.excludeDelinquent}
                onChange={(e) => setConstraints({ ...policy.constraints, excludeDelinquent: e.target.checked })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-sm-text-muted">Minimum software version (optional)</span>
              <input
                value={policy.constraints.minSoftwareVersion ?? ""}
                onChange={(e) =>
                  setConstraints({ ...policy.constraints, minSoftwareVersion: e.target.value.trim() || null })
                }
                placeholder="e.g. 1.18.0"
                className="rounded-md border border-sm-border-strong bg-sm-bg-elevated px-3 py-1.5 font-mono text-sm outline-none focus-visible:border-sm-accent"
              />
            </label>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advanced weighting</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-sm-text-faint">
            Relative importance used to rank eligible validators. Weights are normalized automatically and don&apos;t need to sum to any particular value.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SliderField label="Yield" value={policy.weights.yield} onChange={(v) => setWeights({ ...policy.weights, yield: v })} min={0} max={5} step={0.1} />
            <SliderField label="Performance" value={policy.weights.performance} onChange={(v) => setWeights({ ...policy.weights, performance: v })} min={0} max={5} step={0.1} />
            <SliderField label="Reliability" value={policy.weights.reliability} onChange={(v) => setWeights({ ...policy.weights, reliability: v })} min={0} max={5} step={0.1} />
            <SliderField label="Decentralization" value={policy.weights.decentralization} onChange={(v) => setWeights({ ...policy.weights, decentralization: v })} min={0} max={5} step={0.1} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-sm-text-faint">
        <Badge tone="accent">{formatSol(policy.stakeAmountLamports)} SOL</Badge>
        configured — see the Allocation tab for the resulting portfolio.
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-sm-text-muted">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-sm-border-strong bg-sm-bg-elevated px-3 py-1.5 text-sm tabular-nums outline-none focus-visible:border-sm-accent"
      />
    </label>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex justify-between text-sm-text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-sm-text">
          {value.toFixed(step < 1 ? 1 : 0)}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
