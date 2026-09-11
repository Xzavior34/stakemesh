import { ProseShell } from "@/components/marketing/chrome";

export default function StrategyEngineDocsPage() {
  return (
    <ProseShell>
      <h1 className="font-display text-3xl font-semibold text-sm-text">Strategy engine</h1>

      <h2 className="mt-6 font-display text-xl font-semibold text-sm-text">Hard constraints</h2>
      <p className="mt-3 text-sm-text-muted">
        A validator that fails any hard constraint is excluded before scoring — it can never be selected regardless
        of how well it scores on everything else. Hard constraints: minimum vote performance, maximum skip rate,
        maximum commission, maximum ASN concentration, maximum datacenter concentration, maximum stake per validator,
        minimum software version, active-only, and delinquency exclusion. See{" "}
        <code className="font-mono text-sm-accent">passesIndividualConstraints</code> in{" "}
        <code className="font-mono">src/lib/engine/scoring.ts</code> for the per-validator checks, and{" "}
        <code className="font-mono">allocate.ts</code> for the portfolio-level concentration checks applied as stake
        is assigned.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Soft objectives &amp; scoring</h2>
      <p className="mt-3 text-sm-text-muted">
        Eligible validators are scored on four normalized sub-scores, each min-max normalized against the eligible
        cohort (not a fixed global range, since &quot;good&quot; is relative to what&apos;s actually available):
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-sm-border bg-sm-bg-elevated p-4 font-mono text-xs text-sm-text">
{`composite = yield_weight        * yield_score
          + performance_weight   * performance_score
          + reliability_weight   * reliability_score
          + decentralization_weight * decentralization_score
          - concentration_penalty`}
      </pre>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm-text-muted">
        <li><strong className="text-sm-text">yield_score</strong> — normalized estimated APY.</li>
        <li><strong className="text-sm-text">performance_score</strong> — normalized vote performance.</li>
        <li><strong className="text-sm-text">reliability_score</strong> — 60% inverted skip rate + 40% inverted commission.</li>
        <li><strong className="text-sm-text">decentralization_score</strong> — inverted existing active stake share (a per-validator proxy; portfolio-level ASN/datacenter limits are enforced separately, not through this score).</li>
      </ul>
      <p className="mt-3 text-sm-text-muted">
        Weights are normalized to sum to 1 automatically, so they don&apos;t need to add up to any particular total in
        the UI.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Allocation algorithm</h2>
      <p className="mt-3 text-sm-text-muted">
        StakeMesh does <strong className="text-sm-text">not</strong> claim mathematical optimality. The allocator is a
        documented greedy heuristic: rank eligible validators by composite score, then walk down the ranking
        assigning an equal base share of the requested stake to each validator that fits without breaching a
        portfolio-level constraint (max stake per validator, max ASN concentration, max datacenter concentration).
        Any remainder is distributed across already-selected validators in a second pass, subject to the same
        ceilings. Every validator that could have been picked but wasn&apos;t carries a specific reason — either a
        hard-constraint failure or the exact concentration ceiling it would have breached.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Presets</h2>
      <p className="mt-3 text-sm-text-muted">
        Conservative, Balanced, Decentralization First, Performance First, and Yield Optimized are fixed constraint +
        weight bundles defined in <code className="font-mono">src/lib/engine/presets.ts</code>. They are data, not
        behavior — the same allocation function runs regardless of which preset produced the policy.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Natural-language input</h2>
      <p className="mt-3 text-sm-text-muted">
        The &quot;describe your strategy&quot; box is parsed with deterministic regular expressions (
        <code className="font-mono">src/lib/engine/nlParser.ts</code>), not a call to an external AI model. This is a
        safety choice, not a cost-cutting one: the parser never touches a transaction, its output is always shown to
        you as an &quot;interpreted strategy&quot; before it becomes a real policy, and its behavior is unit tested
        and fully explainable.
      </p>
    </ProseShell>
  );
}
