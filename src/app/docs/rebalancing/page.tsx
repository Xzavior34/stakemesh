import { ProseShell } from "@/components/marketing/chrome";

export default function RebalancingDocsPage() {
  return (
    <ProseShell>
      <h1 className="font-display text-3xl font-semibold text-sm-text">Rebalancing</h1>

      <h2 className="mt-6 font-display text-xl font-semibold text-sm-text">Monitoring &amp; drift detection</h2>
      <p className="mt-3 text-sm-text-muted">
        <code className="font-mono text-sm-accent">detectViolations</code> (in{" "}
        <code className="font-mono">src/lib/engine/rebalance.ts</code>) compares each currently-held validator against
        the active policy&apos;s hard constraints and flags: performance degradation, skip-rate violations, commission
        increases, software-version violations, delinquency, and portfolio-level ASN/datacenter concentration
        breaches. Delinquency is always treated as highest severity.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Proposal generation</h2>
      <p className="mt-3 text-sm-text-muted">
        For each detected violation, the engine looks for the best-available eligible destination validator that
        would <em>not</em> itself breach a concentration ceiling, and proposes moving half of the affected stake to
        it — a conservative default rather than draining a position in one step. Every proposed move records the
        concentration metric before and after, so you can verify the move actually improves (or at least does not
        worsen) the constraint it&apos;s correcting. This is enforced as a test invariant, not just a docs claim — see{" "}
        <code className="font-mono">rebalance.test.ts</code>.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Execution safety</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm-text-muted">
        <li>Default mode is <strong className="text-sm-text">recommend</strong> — proposals are never auto-executed.</li>
        <li>Every proposal is a dry run / preview until you explicitly choose to act on it.</li>
        <li>Execution always goes through your connected wallet&apos;s own review-and-sign flow.</li>
        <li>Funds are never moved silently.</li>
      </ul>
      <p className="mt-3 text-sm-text-muted">
        The reference UI ships the recommendation flow end-to-end. Real stake-account transaction construction
        (split/deactivate/delegate) now exists in <code className="font-mono">src/lib/solana/stakeTransactions.ts</code>,
        offline-tested and wired to wallet-signed submission through the Stake Accounts page&apos;s manual
        &quot;Redelegate&quot; flow — but connecting that directly to a Rebalancing-page proposal (so &quot;Execute
        via wallet&quot; there does something) is still the highest-value area for a follow-up contribution, since
        proposals are currently computed against an abstract policy/allocation model rather than a specific owned
        stake account.
      </p>
    </ProseShell>
  );
}
