import React from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, AlertTriangle, Layers, Cpu, Code2, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Solana Foundation Grant & RFP Review | StakeMesh Docs",
  description: "Technical architecture, public-good thesis, security model, and implementation matrix for Solana Foundation grant evaluation.",
};

export default function SolanaFoundationDocPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-purple-950/60 text-purple-400 border border-purple-800/50 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          SOLANA FOUNDATION RFP EVALUATION SUITE
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 font-mono">
          Solana Foundation Grant & RFP Alignment
        </h1>
        <p className="text-base text-slate-400 max-w-3xl leading-relaxed">
          A comprehensive technical submission document mapping StakeMesh&apos;s architecture, non-custodial security guarantees, policy engine implementation, and ecosystem value against the Solana Foundation&apos;s Automated Stake Delegation & Rebalancing requirements.
        </p>
      </div>

      {/* Public Good Thesis */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold text-lg">
          <CheckCircle2 className="w-5 h-5" />
          Public-Good Thesis & Ecosystem Value
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Stake delegation on Solana is heavily concentrated among top-tier validators, increasing ASN and datacenter vulnerability. Existing staking interfaces often present yield as the primary metric, ignoring network health constraints.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed font-semibold">
          StakeMesh converts measurable Solana network-health constraints into user-controlled, non-custodial staking policies.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            <h4 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">Decentralization</h4>
            <p className="text-xs text-slate-400">Strict ASN & datacenter concentration ceilings prevent co-location cluster risks.</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">Non-Custodial</h4>
            <p className="text-xs text-slate-400">No private keys ever leave the user wallet. All rebalances require explicit human approval.</p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">Open Reference</h4>
            <p className="text-xs text-slate-400">Framework-independent TypeScript engine (<code className="text-purple-300">src/lib/engine/</code>) reusable by any Solana builder.</p>
          </div>
        </div>
      </section>

      {/* Security Architecture */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          Security Model & Non-Custodial Architecture
        </h2>
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
          <div className="text-emerald-400 font-bold">AUTONOMOUS DECISION + EXPLICIT WALLET AUTHORIZATION + AUDITABLE PREVIEW</div>
          <div className="text-slate-400">
            1. User defines policy constraints (ASN cap, datacenter cap, min performance, max commission).<br />
            2. StakeMesh engine computes optimal allocation and identifies drift pure-functionally.<br />
            3. Solana transaction builder decodes instructions into a human-readable preview.<br />
            4. User signs transaction using standard Wallet Standard adapter.<br />
            5. On-chain confirmation is verified via RPC signature commitment checks.
          </div>
        </div>
      </section>

      {/* Foundation Requirement Matrix */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          Foundation RFP Requirement Implementation Matrix
        </h2>
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 font-semibold">Requirement</th>
                <th className="py-3 px-4 font-semibold">StakeMesh Implementation</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-bold text-white">Multi-Validator Staking</td>
                <td className="py-3 px-4">Greedy allocation heuristic spreading stake across target count</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">IMPLEMENTED</td>
                <td className="py-3 px-4"><code className="text-purple-300">src/lib/engine/allocate.ts</code></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Custom Criteria & Policy Presets</td>
                <td className="py-3 px-4">Foundation-aligned decentralization strategy preset & UI controls</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">IMPLEMENTED</td>
                <td className="py-3 px-4"><code className="text-purple-300">src/lib/engine/presets.ts</code></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Recommended Rebalancing</td>
                <td className="py-3 px-4">Pure drift detector producing explainable rebalance moves</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">IMPLEMENTED</td>
                <td className="py-3 px-4"><code className="text-purple-300">src/lib/engine/rebalance.ts</code></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Stake Account Discovery</td>
                <td className="py-3 px-4">Read-side on-chain lookups via <code className="text-slate-300">getParsedProgramAccounts</code></td>
                <td className="py-3 px-4 text-emerald-400 font-bold">IMPLEMENTED</td>
                <td className="py-3 px-4"><code className="text-purple-300">src/lib/solana/stakeTransactions.ts</code></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Real Solana Transaction Builder</td>
                <td className="py-3 px-4">Split, Deactivate, Delegate, Merge, Authorize builders & decoders</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">IMPLEMENTED</td>
                <td className="py-3 px-4"><code className="text-purple-300">src/lib/solana/stakeTransactions.ts</code></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Cluster Protection</td>
                <td className="py-3 px-4">Strict cluster mismatch detection before wallet submission</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">IMPLEMENTED</td>
                <td className="py-3 px-4"><code className="text-purple-300">checkClusterSafety()</code></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Live Solana RPC Integration</td>
                <td className="py-3 px-4">Live provider reading vote accounts, epoch info, and version</td>
                <td className="py-3 px-4 text-cyan-400 font-bold">PARTIAL</td>
                <td className="py-3 px-4"><code className="text-purple-300">src/lib/data/liveProvider.ts</code></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Real-Time Event Subscriptions</td>
                <td className="py-3 px-4">Provider interface abstraction prepared for WebSocket indexing</td>
                <td className="py-3 px-4 text-amber-400 font-bold">PARTIAL</td>
                <td className="py-3 px-4"><code className="text-purple-300">src/lib/data/provider.ts</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Grant Milestone Roadmap */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <Code2 className="w-5 h-5 text-emerald-400" />
          Grant-Funded Milestone Roadmap ($35,000 Total Proposal)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-purple-400 font-bold">MILESTONE 1: $10,000</span>
              <span className="text-slate-500">Duration: 4 Weeks</span>
            </div>
            <h3 className="text-sm font-bold text-white font-mono">Indexed Validator Intelligence Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Build a production indexer service resolving validator gossip IPs to real-time ASNs, datacenters, and historical skip-rate metrics.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-purple-400 font-bold">MILESTONE 2: $10,000</span>
              <span className="text-slate-500">Duration: 3 Weeks</span>
            </div>
            <h3 className="text-sm font-bold text-white font-mono">Real-Time WebSocket & State Subscription</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect live WebSocket account subscriptions to track stake account activation states and epoch boundaries in real-time.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-purple-400 font-bold">MILESTONE 3: $8,000</span>
              <span className="text-slate-500">Duration: 3 Weeks</span>
            </div>
            <h3 className="text-sm font-bold text-white font-mono">End-to-End Mainnet Execution & Security Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              End-to-end devnet/mainnet verification with hardware wallet support (Ledger) and external security audit report.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-purple-400 font-bold">MILESTONE 4: $7,000</span>
              <span className="text-slate-500">Duration: 2 Weeks</span>
            </div>
            <h3 className="text-sm font-bold text-white font-mono">Standalone SDK & Ecosystem Integration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Publish <code className="text-purple-300">@stakemesh/engine</code> npm package and developer documentation for third-party wallet integrations.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Reusability */}
      <section className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-3 font-mono">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-purple-400" />
          Developer Reusability Guide
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The allocation and rebalancing engine has zero React or Next.js dependencies. Solana builders can import the pure TypeScript engine directly:
        </p>
        <pre className="p-3 bg-slate-900 rounded-lg text-xs text-purple-300 overflow-x-auto">
{`import { allocate, generateRebalanceProposal, getPreset } from "@/lib/engine";

const policy = getPreset("foundation-decentralization");
const result = allocate(policy, validators, "epoch-580");
const proposal = generateRebalanceProposal(result, policy, validators, "epoch-580");`}
        </pre>
      </section>
    </div>
  );
}
