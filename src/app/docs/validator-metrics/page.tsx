import { ProseShell } from "@/components/marketing/chrome";

export default function ValidatorMetricsDocsPage() {
  return (
    <ProseShell>
      <h1 className="font-display text-3xl font-semibold text-sm-text">Validator metrics</h1>

      <table className="mt-6 w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-sm-border text-xs text-sm-text-muted">
            <th className="py-2 pr-4 font-normal">Metric</th>
            <th className="py-2 font-normal">Meaning</th>
          </tr>
        </thead>
        <tbody className="text-sm-text-muted">
          {[
            ["Commission", "Percentage of staking rewards the validator keeps."],
            ["Vote performance", "Fraction of expected votes successfully landed — a proxy for uptime and responsiveness."],
            ["Skip rate", "Fraction of assigned leader slots the validator failed to produce a block for."],
            ["Active stake", "Total SOL currently delegated to the validator, network-wide."],
            ["ASN", "Autonomous System Number hosting the validator's network endpoint — a proxy for infrastructure independence."],
            ["Datacenter", "Best-effort hosting/datacenter identifier."],
            ["Software version", "Reported agave/solana-labs validator client version."],
            ["Delinquency", "Whether the validator is currently failing to vote."],
            ["Estimated APY", "Approximate annualized yield after commission, based on recent performance."],
          ].map(([term, def]) => (
            <tr key={term} className="border-b border-sm-border/60">
              <td className="py-2 pr-4 font-medium text-sm-text">{term}</td>
              <td className="py-2">{def}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-10 font-display text-xl font-semibold text-sm-text">StakeMesh Distribution Score</h2>
      <p className="mt-3 text-sm-text-muted">
        <strong className="text-sm-text">Not an official Solana Foundation score.</strong> It is a transparent,
        StakeMesh-specific heuristic (0–100, higher is better) for how well a given allocation spreads stake across
        independent infrastructure. The literal implementation lives in{" "}
        <code className="font-mono text-sm-accent">src/lib/engine/distributionScore.ts</code> and must stay in sync
        with this description.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-sm-border bg-sm-bg-elevated p-4 font-mono text-xs text-sm-text">
{`score = 0.30 * validatorSpread    (100 − largest single-validator share)
      + 0.30 * asnSpread           (100 − largest single-ASN share)
      + 0.25 * datacenterSpread    (100 − largest single-datacenter share)
      + 0.15 * breadth             (log-scaled reward for more distinct
                                     validators/ASNs/datacenters used,
                                     diminishing returns above ~20)`}
      </pre>
      <p className="mt-3 text-sm-text-muted">
        This score only evaluates concentration structure — it does not factor in yield, performance, or commission.
        A high Distribution Score describes a well-spread allocation, not necessarily the &quot;best&quot; one for
        your goals.
      </p>
    </ProseShell>
  );
}
