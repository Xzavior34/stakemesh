import { ProseShell } from "@/components/marketing/chrome";

export default function AboutPage() {
  return (
    <ProseShell>
      <h1 className="font-display text-3xl font-semibold text-sm-text">About StakeMesh</h1>
      <p className="mt-5 text-sm-text-muted">
        StakeMesh is an open-source stake allocation and rebalancing engine for Solana. It lets stakers
        define explicit validator-selection and decentralization policies, calculates an allocation against those
        policies, monitors validator conditions over time, and recommends rebalancing when conditions drift — with
        every decision explained in plain language. Rebalancing is recommend-only: StakeMesh never moves stake
        without your explicit, wallet-signed approval.
      </p>
      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Why it exists</h2>
      <p className="mt-3 text-sm-text-muted">
        Most staking interfaces optimize for the fewest clicks to the highest advertised APY. That&apos;s a reasonable
        goal for an individual staker and a bad outcome for the network: stake concentrates on whichever validators
        are easiest to find, which tends to mean the largest validators on the largest cloud providers. StakeMesh
        treats validator diversity — across ASNs, datacenters, and individual operators — as a constraint you can set
        and enforce, not a footnote.
      </p>
      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">What it is not</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm-text-muted">
        <li>Not a custodial staking service — StakeMesh never takes possession of your SOL.</li>
        <li>Not an official Solana Foundation product or metric provider.</li>
        <li>
          Not a guarantee of any particular yield, uptime, or decentralization outcome — see{" "}
          <a href="/docs/security" className="text-sm-accent underline underline-offset-2">
            /docs/security
          </a>{" "}
          for the full set of limitations.
        </li>
      </ul>
      <h2 className="mt-8 font-display text-xl font-semibold text-sm-text">Project status</h2>
      <p className="mt-3 text-sm-text-muted">
        StakeMesh is an early-stage open-source reference implementation. The allocation and rebalancing engines are
        real and unit-tested; live validator infrastructure metadata (ASN/datacenter resolution) requires
        infrastructure this reference deployment does not operate — see{" "}
        <a href="/docs/architecture" className="text-sm-accent underline underline-offset-2">
          /docs/architecture
        </a>{" "}
        for exactly where that gap is and how to close it.
      </p>
    </ProseShell>
  );
}
