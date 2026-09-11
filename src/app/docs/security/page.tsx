import { ProseShell } from "@/components/marketing/chrome";

export default function SecurityDocsPage() {
  return (
    <ProseShell>
      <h1 className="font-display text-3xl font-semibold text-sm-text">Security</h1>

      <h2 className="mt-6 font-display text-xl font-semibold text-sm-text">Non-custodial design</h2>
      <p className="mt-3 text-sm-text-muted">
        StakeMesh never requests, stores, or transmits a private key, seed phrase, or secret key, in any form, at any
        point. Wallet connection uses the standard Wallet Standard / wallet-adapter flow: your wallet extension
        handles key custody entirely; StakeMesh only ever receives a public key and signed transactions you
        explicitly approve.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Authority boundaries</h2>
      <p className="mt-3 text-sm-text-muted">
        Allocation and rebalancing computations are pure, deterministic functions with no ability to touch the
        network. Nothing in <code className="font-mono">src/lib/engine</code> can submit a transaction — that
        capability exists only in explicit, user-initiated wallet flows. The natural-language strategy parser is
        deterministic pattern matching, not a model call, and its output is always surfaced as a reviewable
        &quot;interpreted strategy&quot; before it becomes policy — see{" "}
        <a href="/docs/strategy-engine" className="text-sm-accent underline underline-offset-2">
          /docs/strategy-engine
        </a>
        . If an AI system is ever integrated for a richer natural-language experience, it will be scoped the same way
        every other input source is scoped here: it can propose, never sign.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Transaction previews &amp; confirmation</h2>
      <p className="mt-3 text-sm-text-muted">
        Every rebalance proposal is explicitly labeled &quot;preview — dry run&quot; and requires an explicit,
        separate action to move toward execution. The Stake Accounts page&apos;s redelegate flow goes further: each
        step shows a preview decoded directly from the real transaction that will be sent — not a hand-written
        description — before you&apos;re asked to sign. Execution always routes through your wallet&apos;s own
        transaction review UI before anything is signed.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Real stake transactions: what&apos;s verified and what isn&apos;t</h2>
      <p className="mt-3 text-sm-text-muted">
        <code className="font-mono text-sm-accent">src/lib/solana/stakeTransactions.ts</code> builds real{" "}
        <code className="font-mono">StakeProgram</code> Split, Deactivate, and Delegate transactions, used by the
        Stake Accounts page&apos;s &quot;Redelegate&quot; flow. Offline unit tests construct these transactions and
        decode them back with the Solana SDK&apos;s own decoders, confirming the instructions contain exactly the
        accounts and amounts requested. What those tests <em>cannot</em> confirm is behavior against a live network —
        signature verification, blockhash expiry, rent-exemption edge cases, and the actual on-chain cooldown timing
        between deactivation and redelegation all require a real RPC endpoint and a real wallet to observe. This has
        not been done from the environment this code was developed in. Test against devnet before trusting this flow
        with mainnet funds — the UI shows a warning whenever it can&apos;t confirm you&apos;re on a test cluster.
      </p>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Known limitations</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm-text-muted">
        <li>ASN/datacenter/geo data requires infrastructure this reference deployment does not operate; live mode reports these as unknown rather than guessing (see /docs/architecture).</li>
        <li>Skip rate and estimated APY are not derivable from a standard RPC call in live mode and are reported as 0 rather than fabricated.</li>
        <li>Real stake-account transaction construction (split/deactivate/delegate) is implemented and offline-tested, and wired to wallet-signed submission on the Stake Accounts page&apos;s manual redelegate flow — but not yet connected to the Rebalancing page&apos;s proposals, and not yet verified end-to-end against a live wallet and RPC.</li>
        <li>History is session-scoped in this reference build; a production deployment should persist it server-side.</li>
      </ul>

      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Reporting a vulnerability</h2>
      <p className="mt-3 text-sm-text-muted">
        See <code className="font-mono">SECURITY.md</code> in the repository root.
      </p>
    </ProseShell>
  );
}
