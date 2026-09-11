import { ProseShell } from "@/components/marketing/chrome";

export default function ArchitectureDocsPage() {
  return (
    <ProseShell>
      <h1 className="font-display text-3xl font-semibold text-sm-text">Architecture</h1>
      <p className="mt-4 text-sm-text-muted">StakeMesh is organized as five layers, each independently testable:</p>
      <pre className="mt-4 overflow-x-auto rounded-lg border border-sm-border bg-sm-bg-elevated p-4 font-mono text-xs text-sm-text">
{`UI (Next.js / React)
  ↓
Strategy Engine        (src/lib/engine/presets.ts, nlParser.ts)
  ↓
Validator Data Layer   (src/lib/data — ValidatorDataProvider)
  ↓
Allocation Engine      (src/lib/engine/allocate.ts, scoring.ts, concentration.ts)
  ↓
Rebalancing Engine     (src/lib/engine/rebalance.ts)
  ↓
Solana Transaction Layer (wallet-adapter, @solana/web3.js — stake accounts page)`}
      </pre>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Data layer and the live/demo boundary</h2>
      <p className="mt-3 text-sm-text-muted">
        Every screen reads validator data through a single <code className="font-mono text-sm-accent">ValidatorDataProvider</code>{" "}
        interface (<code className="font-mono">src/lib/data/provider.ts</code>). Two implementations exist today:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm-text-muted">
        <li>
          <strong className="text-sm-text">DemoValidatorDataProvider</strong> — deterministic, clearly-fake fixture
          data (validator identities are literally prefixed <code className="font-mono">Demo</code>). Used by default.
        </li>
        <li>
          <strong className="text-sm-text">LiveValidatorDataProvider</strong> — queries a real Solana RPC endpoint via{" "}
          <code className="font-mono">getVoteAccounts</code>. Commission, activated stake, and delinquency are real.
          Vote performance is an approximation from epoch credits. ASN, datacenter, country, per-node software
          version, skip rate, and estimated APY are <strong className="text-sm-text">not derivable from a standard RPC
          call</strong> and are honestly reported as unknown/zero rather than fabricated — see the doc comment in{" "}
          <code className="font-mono">liveProvider.ts</code> for exactly what a production deployment would need to
          add (an IP-to-ASN/geo resolution service and a validator-info indexer).
        </li>
      </ul>
      <p className="mt-3 text-sm-text-muted">
        The UI always shows a data-source badge (&quot;Live Solana data&quot; or &quot;Demo dataset&quot;) so it&apos;s
        never ambiguous which one is on screen. Switch providers with{" "}
        <code className="font-mono">NEXT_PUBLIC_DATA_MODE=live</code> and{" "}
        <code className="font-mono">NEXT_PUBLIC_SOLANA_RPC_URL</code>.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Why the engine is framework-independent</h2>
      <p className="mt-3 text-sm-text-muted">
        Everything under <code className="font-mono">src/lib/engine</code> is plain TypeScript with no React or
        Next.js imports. It can run in a browser, a Node script, or a future backend service unchanged, and it is
        covered by unit tests that run outside of any UI (<code className="font-mono">npm test</code>).
      </p>
    </ProseShell>
  );
}
