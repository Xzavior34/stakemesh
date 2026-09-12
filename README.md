# StakeMesh

**Policy-driven stake allocation for a healthier Solana validator set.**

StakeMesh is an open-source stake allocation and rebalancing engine for Solana. It lets stakers and pool operators define explicit validator-selection and decentralization policies, calculates deterministic stake allocations against those policies, monitors validator performance and infrastructure concentration, and generates actionable rebalance proposals when conditions drift — with every decision explained in plain language and executed through non-custodial wallet authorization.

---

## ⚡ The 60-Second Demo Story

```
100 SOL Portfolio
       ↓
Applied Policy: Foundation-Aligned Preset
(ASN ≤ 25%, Datacenter ≤ 15%, Commission ≤ 5%, Vote Performance ≥ 97%)
       ↓
Drift & Violation Detected
Datacenter Concentration: 18.4% (Exceeds 15% Policy Ceiling)
       ↓
Deterministic Rebalance Proposal
Projected Datacenter Concentration: 18.4% → 14.7%
Distribution Score: 78.2 → 89.6 (+11.4 pts)
       ↓
Transaction Construction
StakeProgram: Split → Deactivate → Delegate Instructions Generated
       ↓
RPC Simulation & Validation (Devnet)
Decoded Instruction Preview & Safety Checks
       ↓
User Wallet Authorization (Non-Custodial Signing)
       ↓
Solana On-Chain Confirmation & Audit Trail Recorded
```

---

## Features

- **Foundation-Aligned Preset** — First-class strategy preset strictly calibrated against current published Solana Foundation Delegation Program criteria:
  - Vote performance $\ge 97\%$ cluster average
  - Commission $\le 5\%$
  - ASN/Company concentration $\le 25\%$
  - Data center concentration $\le 15\%$
  - Max validator stake $\le 1,000,000$ SOL
  - Skip rate $\le 5\%$ points + cluster average
  - Dynamic epoch-aware software version tracking
- **Multi-Validator Explorer** — Sortable, filterable metrics on vote credits, commission, active stake, ASN, datacenter, version, and delinquency status with compatibility badges.
- **Deterministic Allocation Engine** — Mathematical quadratic optimization enforcing 10 formal policy invariants with plain-language inclusion and exclusion justifications.
- **Rebalancing Engine & Drift Detection** — Detects concentration breaches, delinquent transitions, or commission hikes, generating greedy rebalance moves to restore policy compliance.
- **Real Stake Program Transaction Construction** — Serializes valid Solana `StakeProgram` instructions (`Split`, `Deactivate`, `Delegate`, `Merge`, `Authorize`) with decoded human-readable previews and cluster-mismatch safety guards.
- **Live Solana Devnet Verification** — Unit & integration test suites verify live RPC connections, vote account discovery, and transaction simulation against Solana Devnet (`api.devnet.solana.com`).
- **100% Non-Custodial** — Never requests, stores, or handles private keys. All on-chain actions require explicit client-side wallet approval.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js / React UI                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│       Strategy Engine (presets.ts, nlParser.ts)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  Validator Data Layer (liveProvider.ts, demoProvider.ts)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│     Allocation Engine (allocate.ts, scoring.ts, conc.ts)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│            Rebalancing Engine (rebalance.ts)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  Solana Transaction Layer (stakeTransactions.ts, web3.js)   │
└─────────────────────────────────────────────────────────────┘
```

Core engine logic under `src/lib/engine` is framework-agnostic TypeScript with zero Next.js or DOM dependencies.

---

## Quick Start & Clean-Room Reproduction

### Prerequisites
- Node.js 20+
- npm

### Installation & Build
```bash
git clone https://github.com/Xzavior34/stakemesh.git
cd stakemesh

# Clean installation (respects committed .npmrc)
npm ci

# Run verification suite
npm run lint          # ESLint (0 errors)
npx tsc --noEmit      # TypeScript typecheck (0 errors)
npm test              # Vitest (84/84 tests passing)
npm run build         # Next.js optimized production build
```

### Local Development
```bash
npm run dev
# Open http://localhost:3000
```

---

## Verification & Test Coverage

The test suite contains **84 automated tests across 12 suites**:

```bash
npm test
```

- **Invariant Testing**: 10 mathematical allocation and budget invariants.
- **Scoring & Concentration**: Quadratic scoring, HHI / Gini distribution formulas.
- **Rebalancing**: Drift detection and move generator.
- **Presets**: Current Solana Foundation criteria compliance.
- **Transaction Construction**: Stake Program split, deactivate, and delegation serialization.
- **Devnet Integration**: Live RPC queries (`getVoteAccounts`, `getEpochInfo`) and transaction simulation.

---

## Technical Scope & Grant Milestones

| Capability | Current Status | Architecture & Scope |
| :--- | :--- | :--- |
| **Multi-Validator Staking Strategy** | **IMPLEMENTED** | Custom policies and Foundation-aligned preset |
| **Deterministic Greedy Allocator** | **IMPLEMENTED** | Invariant-tested math solver |
| **Drift Detection & Rebalance Proposal**| **IMPLEMENTED** | Threshold-based concentration & health alerts |
| **Stake Program Transaction Builder** | **IMPLEMENTED** | Real instruction builders (`@solana/web3.js`) |
| **Wallet-Authorized Execution** | **IMPLEMENTED** | Standard Solana Wallet Adapter integration |
| **Live Devnet RPC Simulation** | **IMPLEMENTED** | Simulated against live cluster endpoints |
| **Automated Monitoring & Alerts** | **ROADMAP (M1)** | Standing cron/webhook monitoring service |
| **SPL Stake Pool Program Integration**| **ROADMAP (M2)** | Direct 1-click pool deposit/withdraw delegation |
| **Real-time Gossip ASN Ingestion** | **ROADMAP (M3)** | Dedicated validator IP/ASN enrichment pipeline |

---

## Security

StakeMesh is designed with defense-in-depth:
1. **Zero Custody**: No secret keys, seeds, or permissions are stored.
2. **Cluster Safety Guard**: Prevents simulated or devnet test transactions from touching `mainnet-beta`.
3. **Deterministic Logic**: Strategy algorithms run without non-deterministic AI hallucination in execution paths.

See [`SECURITY.md`](SECURITY.md) and [`docs/foundation-rfp-alignment.md`](docs/foundation-rfp-alignment.md) for full audit notes.

---

## License

[MIT](LICENSE)
