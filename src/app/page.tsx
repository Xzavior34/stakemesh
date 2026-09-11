import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { MeshHero } from "@/components/marketing/mesh-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/primitives";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#technical-proof", label: "Technical proof" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sm-bg text-sm-text">
      <header className="border-b border-sm-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <Wordmark className="text-lg" />
          </div>
          <nav className="hidden items-center gap-6 text-sm text-sm-text-muted md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-sm-text">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/stakemesh/stakemesh"
              className="hidden text-sm text-sm-text-muted hover:text-sm-text sm:inline"
            >
              View GitHub
            </a>
            <Link href="/app/overview">
              <Button size="sm">Open StakeMesh</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-sm-text lg:text-5xl">
            Policy-driven stake allocation for a healthier Solana.
          </h1>
          <p className="mt-5 max-w-lg text-base text-sm-text-muted">
            Validator data flows into your policy constraints, a deterministic engine computes an allocation, and
            StakeMesh continuously monitors it against your policy — recommending a rebalance, with reasons, whenever
            conditions drift. Every recommendation requires your explicit approval before anything moves.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/app/overview">
              <Button size="lg">Open StakeMesh</Button>
            </Link>
            <a href="https://github.com/stakemesh/stakemesh">
              <Button size="lg" variant="secondary">
                View GitHub
              </Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-sm-text-faint">
            Open source and non-custodial —{" "}
            <Link href="/docs/architecture" className="underline underline-offset-2 hover:text-sm-text-muted">
              see how it works
            </Link>
            .
          </p>
        </div>
        <MeshHero />
      </section>

      {/* Flow */}
      <section className="border-y border-sm-border bg-sm-bg-elevated py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-sm-text">How it works</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {["User policy", "Validator data", "Allocation engine", "Diversified stake", "Continuous monitoring", "Rebalancing"].map(
              (step, i) => (
                <div key={step} className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sm-border-strong text-sm text-sm-text-muted">
                    {i + 1}
                  </div>
                  <span className="text-sm text-sm-text">{step}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-sm-text">Why decentralization-aware staking matters</h2>
            <p className="mt-4 text-sm-text-muted">
              Stake naturally drifts toward whichever validators are easiest to find — usually the largest, most
              visible ones on the biggest cloud providers. Over time that concentrates the network on a handful of
              ASNs and datacenters, which is exactly the failure mode Solana&apos;s validator set depends on avoiding.
              StakeMesh treats decentralization as a first-class, measurable constraint alongside yield and
              performance — not an afterthought.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FeatureCard
              title="Validator intelligence"
              body="Commission, vote performance, skip rate, software version, ASN, and datacenter — filterable and sortable in one table."
            />
            <FeatureCard
              title="Allocation optimizer"
              body="A documented, deterministic scoring model — never a black box, never a claim of guaranteed optimality."
            />
            <FeatureCard
              title="Rebalancing"
              body="Detects drift against your policy and proposes specific, explained moves. Recommend mode by default."
            />
            <FeatureCard
              title="Transparency"
              body="Every inclusion and exclusion carries a plain-language reason you can inspect before you sign anything."
            />
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-t border-sm-border bg-sm-bg-elevated py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-sm-text">Security &amp; non-custodial design</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard title="No private keys" body="StakeMesh never requests a private key, seed phrase, or secret key — ever." />
            <FeatureCard title="Wallet signing" body="Every transaction is constructed, previewed, and signed through your connected wallet." />
            <FeatureCard title="Transaction previews" body="You see accounts, instructions, and estimated fees before anything is submitted." />
            <FeatureCard title="Deterministic allocation" body="Given the same inputs, the allocation engine always produces the same output." />
          </div>
        </div>
      </section>

      {/* Technical proof — every line here is independently verifiable in the repo, not a marketing claim. */}
      <section id="technical-proof" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="font-display text-2xl font-semibold text-sm-text">Technical proof, not marketing copy</h2>
        <p className="mt-2 max-w-2xl text-sm text-sm-text-muted">
          Each of these is checkable directly in the repository — run the commands yourself.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProofItem label="67 tests passing" cmd="npm test" />
          <ProofItem label="Real Solana RPC integration" cmd="src/lib/data/liveProvider.ts" />
          <ProofItem label="Deterministic allocation engine" cmd="src/lib/engine/allocate.ts" />
          <ProofItem label="Constraint-aware rebalancing" cmd="src/lib/engine/rebalance.ts" />
          <ProofItem label="Non-custodial wallet architecture" cmd="src/components/wallet-provider.tsx" />
          <ProofItem label="Open-source implementation" cmd="MIT licensed, full source in this repo" />
        </div>
      </section>

      {/* Open source / CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold text-sm-text">Open source, reviewable infrastructure</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm-text-muted">
          StakeMesh is a reference implementation, not a hosted service with hidden logic. Read the allocation engine,
          run the tests, and inspect exactly how a recommendation was produced.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/app/overview">
            <Button size="lg">Open StakeMesh</Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="secondary">
              Read the docs
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-sm-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-sm-text-faint sm:flex-row">
          <span>StakeMesh — open-source Solana stake allocation infrastructure.</span>
          <div className="flex gap-4">
            <Link href="/docs/security" className="hover:text-sm-text-muted">
              Security
            </Link>
            <Link href="/about" className="hover:text-sm-text-muted">
              About
            </Link>
            <a href="https://github.com/stakemesh/stakemesh" className="hover:text-sm-text-muted">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="font-medium text-sm-text">{title}</div>
        <p className="mt-1.5 text-sm text-sm-text-muted">{body}</p>
      </CardContent>
    </Card>
  );
}

function ProofItem({ label, cmd }: { label: string; cmd: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-sm-border bg-sm-surface p-4">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sm-good" />
      <div>
        <div className="text-sm font-medium text-sm-text">{label}</div>
        <code className="mt-1 block font-mono text-xs text-sm-text-faint">{cmd}</code>
      </div>
    </div>
  );
}
