import Link from "next/link";
import { ProseShell } from "@/components/marketing/chrome";

const DOCS = [
  { href: "/docs/architecture", title: "Architecture", body: "How the UI, strategy engine, data layer, and Solana transaction layer fit together." },
  { href: "/docs/strategy-engine", title: "Strategy engine", body: "Hard constraints, soft objectives, scoring, and normalization." },
  { href: "/docs/rebalancing", title: "Rebalancing", body: "Drift detection, thresholding, proposal generation, and execution safety." },
  { href: "/docs/security", title: "Security", body: "Non-custodial design, wallet signing, authority boundaries, and known limitations." },
  { href: "/docs/validator-metrics", title: "Validator metrics", body: "Every metric StakeMesh surfaces, explained, including the StakeMesh Distribution Score methodology." },
];

export default function DocsIndexPage() {
  return (
    <ProseShell>
      <h1 className="font-display text-3xl font-semibold text-sm-text">Documentation</h1>
      <p className="mt-4 text-sm-text-muted">Technical reference for how StakeMesh works, written for reviewers and contributors.</p>
      <div className="mt-8 flex flex-col gap-4">
        {DOCS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="rounded-lg border border-sm-border bg-sm-surface p-4 transition-colors hover:bg-sm-surface-hover"
          >
            <div className="font-medium text-sm-text">{d.title}</div>
            <div className="mt-1 text-sm text-sm-text-muted">{d.body}</div>
          </Link>
        ))}
        <a
          href="https://github.com/stakemesh/stakemesh/blob/main/docs/foundation-rfp-alignment.md"
          className="rounded-lg border border-sm-border bg-sm-surface p-4 transition-colors hover:bg-sm-surface-hover"
        >
          <div className="font-medium text-sm-text">Foundation RFP alignment</div>
          <div className="mt-1 text-sm text-sm-text-muted">
            An honest mapping of what&apos;s implemented against the Solana Foundation&apos;s automated stake delegation
            &amp; rebalancing UI requirements. Ships as a repository doc rather than a page here.
          </div>
        </a>
      </div>
    </ProseShell>
  );
}
