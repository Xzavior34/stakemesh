# StakeMesh

**Policy-driven stake allocation for a healthier Solana validator set.**

StakeMesh is an open-source stake allocation and rebalancing engine for Solana. It lets stakers define explicit
validator-selection and decentralization policies, calculates an allocation against those policies, monitors
validator conditions over time, and recommends rebalancing when conditions drift — with every decision explained in
plain language.

It is not a staking dashboard with a yield number bolted on. Validator diversity — across ASNs, datacenters, and
individual operators — is a first-class, enforced constraint, not a footnote.

## Status

Early-stage open-source reference implementation. The allocation and rebalancing engines are real, deterministic, and
unit-tested (67 tests, see [Testing](#testing)). Live validator infrastructure metadata (ASN/datacenter resolution)
requires infrastructure this reference deployment doesn't operate — see [Known limitations](#known-limitations) and
[`/docs/architecture`](src/app/docs/architecture/page.tsx).

## Features

- **Foundation Decentralization Preset** — first-class strategy preset based on published Solana Foundation delegation criteria (strict ASN 15%, datacenter 20%, commission 5%, and performance thresholds), alongside Conservative, Balanced, Decentralization First, Performance First, and Yield Optimized presets.
- **Validator explorer** — filterable, sortable table of commission, vote performance, skip rate, active stake, ASN, datacenter, software version, and delinquency, with a per-validator detail panel and strategy-compatibility reasons.
- **Strategy builder** — full manual constraint/weight editing and a deterministic (non-AI) natural-language strategy parser with a mandatory "interpreted strategy" review step.
- **Allocation engine** — a documented, deterministic greedy allocator enforcing 10 core policy invariants, with plain-language inclusion and exclusion reasons.
- **StakeMesh Distribution Score** — a transparent, documented concentration heuristic. Explicitly *not* an official Solana Foundation metric.
- **Rebalancing engine** — drift detection against your policy (performance, skip rate, commission, delinquency, software version, ASN/datacenter concentration) and conservative proposal generation. Recommend-only by default; nothing executes without explicit wallet authorization.
- **Stake accounts & Real Transaction Construction** — real on-chain stake account lookups via RPC, with built-in transaction construction for `StakeProgram` Split, Deactivate, Delegate, Merge, and Authorize instructions, decoded instruction previews, and cluster-safety enforcement.
- **Non-custodial by construction** — no private key, seed phrase, or secret key is ever requested, stored, or processed.

## Architecture

```
UI (Next.js / React)
  ↓
Strategy Engine        (src/lib/engine/presets.ts, nlParser.ts)
  ↓
Validator Data Layer   (src/lib/data — ValidatorDataProvider: demo | live | indexed)
  ↓
Allocation Engine      (src/lib/engine/allocate.ts, scoring.ts, concentration.ts)
  ↓
Rebalancing Engine     (src/lib/engine/rebalance.ts)
  ↓
Solana Transaction Layer (wallet-adapter, @solana/web3.js)
```

Everything under `src/lib/engine` is framework-independent TypeScript with no React/Next.js imports, so it can be tested and imported standalone. See [`/docs/solana-foundation`](src/app/docs/solana-foundation/page.tsx) for the full technical writeup.

## Local setup

Requirements: Node.js 20+, npm.

```bash
git clone https://github.com/Xzavior34/stakemesh.git
cd stakemesh
npm install --legacy-peer-deps
cp .env.example .env.local   # defaults to demo data — no RPC required
npm run dev
```

Open http://localhost:3000.

## Environment variables

See [`.env.example`](.env.example).

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_DATA_MODE` | No (defaults to `demo`) | `demo` or `live` validator data source. |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Required for `live` mode; used for wallet/stake-account queries regardless | Solana RPC endpoint. |

## Testing

```bash
npx vitest run          # runs the full engine test suite once
```

Unit and invariant tests cover scoring/normalization, hard-constraint enforcement, 10 policy engine invariants, the greedy allocation algorithm, concentration math, the StakeMesh Distribution Score, the rebalancing/drift-detection engine, strategy presets, the natural-language parser, and real Solana stake-transaction construction (split, deactivate, delegate, merge, authorize instructions and cluster protection).

## Development

```bash
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript
npm run build      # production build
```

## Security

See [`SECURITY.md`](SECURITY.md), [`/docs/security`](src/app/docs/security/page.tsx), and [`/docs/solana-foundation`](src/app/docs/solana-foundation/page.tsx).

## Grant / RFP Alignment

For the complete Solana Foundation RFP alignment matrix, public-good thesis, and milestone roadmap, see [`/docs/solana-foundation`](src/app/docs/solana-foundation/page.tsx) and [`docs/foundation-rfp-alignment.md`](docs/foundation-rfp-alignment.md).

## Known Limitations

- **ASN/datacenter/geo data in live mode**: standard Solana RPC does not expose a validator's hosting ASN, datacenter, or geographic location. `LiveValidatorDataProvider` honestly reports these as unknown rather than guessing — see [`src/lib/data/liveProvider.ts`](src/lib/data/liveProvider.ts).
- **Skip rate and estimated APY in live mode**: not derivable from `getVoteAccounts` alone; tagged honestly in the data provenance layer.
- **Rebalancing execution**: proposal generation, instruction building, decoding, and cluster safety are complete. Live mainnet transaction execution requires explicit wallet signing by design.
- **History**: session-scoped audit trail in this reference build.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE).
