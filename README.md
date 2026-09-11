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

- **Validator explorer** — filterable, sortable table of commission, vote performance, skip rate, active stake, ASN,
  datacenter, software version, and delinquency, with a per-validator detail panel and strategy-compatibility reasons.
- **Strategy builder** — five deterministic presets (Conservative, Balanced, Decentralization First, Performance
  First, Yield Optimized), full manual constraint/weight editing, and a deterministic (non-AI) natural-language
  strategy parser with a mandatory "interpreted strategy" review step.
- **Allocation engine** — a documented, deterministic greedy allocator that never claims mathematical optimality,
  enforces every hard constraint at the portfolio level (not just per-validator), and gives a plain-language reason
  for every inclusion and exclusion.
- **StakeMesh Distribution Score** — a transparent, documented concentration heuristic. Explicitly *not* an official
  Solana Foundation metric.
- **Rebalancing engine** — drift detection against your policy (performance, skip rate, commission, delinquency,
  software version, ASN/datacenter concentration) and conservative proposal generation. Recommend-only by default;
  nothing executes without your explicit action through your wallet.
- **Stake accounts** — real on-chain stake account lookups for the connected wallet via RPC, not fixture data.
- **Real transaction construction** — an actual `StakeProgram` split → deactivate → delegate flow for moving stake
  between validators, with a genuine (decoded, not hand-written) instruction preview and a mainnet-safety warning,
  wired to wallet-signed submission. Offline-tested; not yet verified end-to-end against live RPC — see
  [Known limitations](#known-limitations).
- **Non-custodial by construction** — no private key, seed phrase, or secret key is ever requested.

## Architecture

```
UI (Next.js / React)
  ↓
Strategy Engine        (src/lib/engine/presets.ts, nlParser.ts)
  ↓
Validator Data Layer   (src/lib/data — ValidatorDataProvider: demo | live)
  ↓
Allocation Engine      (src/lib/engine/allocate.ts, scoring.ts, concentration.ts)
  ↓
Rebalancing Engine     (src/lib/engine/rebalance.ts)
  ↓
Solana Transaction Layer (wallet-adapter, @solana/web3.js)
```

Everything under `src/lib/engine` is framework-independent TypeScript with no React/Next.js imports, so it can be
tested and reasoned about without a UI. See [`/docs`](src/app/docs) for the full technical writeup.

## Local setup

Requirements: Node.js 20+, npm.

```bash
git clone https://github.com/Xzavior34/stakemesh.git
cd stakemesh
npm install
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
npm test          # runs the full engine test suite once (vitest run)
npm run test:watch
```

67 unit tests cover scoring/normalization, hard-constraint enforcement, the allocation algorithm (including
zero-validator, insufficient-eligible-validator, exact-boundary, rounding, very-small-stake, very-large-stake,
duplicate-validator, and missing-metric edge cases), concentration math, the StakeMesh Distribution Score, the
rebalancing/drift-detection engine (including an invariant that a proposed move never worsens the concentration
constraint it's correcting), strategy presets, the natural-language parser, and real Solana stake-transaction
construction (split/deactivate/delegate instructions are built and decoded offline, verifying their contents match
what was requested before any of this code is trusted to touch a live wallet).

## Development

```bash
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript
npm run build      # production build
```

## Deployment

Optimized for Vercel:

```bash
vercel
```

Set `NEXT_PUBLIC_DATA_MODE` and `NEXT_PUBLIC_SOLANA_RPC_URL` in the Vercel project's environment variables if you want
live mode; otherwise the app runs entirely on demo data with no configuration.

## Security

See [`SECURITY.md`](SECURITY.md) and [`/docs/security`](src/app/docs/security/page.tsx). Short version: no private
keys are ever requested, every transaction is signed through your own wallet, and the allocation/rebalancing engines
have no network access of their own.

## Known limitations

- **ASN/datacenter/geo data in live mode**: standard Solana RPC does not expose a validator's hosting ASN, datacenter,
  or geographic location. `LiveValidatorDataProvider` honestly reports these as unknown rather than guessing — see the
  doc comment in [`src/lib/data/liveProvider.ts`](src/lib/data/liveProvider.ts) for what a production deployment needs
  to add (an IP-to-ASN/geo resolution service or third-party validator-analytics API).
- **Skip rate and estimated APY in live mode**: not derivable from `getVoteAccounts` alone; reported as `0` rather
  than fabricated.
- **Rebalancing execution**: the recommendation flow (detection → proposal → preview) is complete. Real stake
  transaction construction (split/deactivate/delegate) now exists and is wired to wallet-signed submission on the
  Stake Accounts page's manual "Redelegate" flow — but it is not yet connected to the Rebalancing page's proposals
  (a recommendation still has to be re-created manually today), and it has not been tested end-to-end against a live
  wallet/RPC from this development environment. Test on devnet before trusting it with mainnet funds.
- **History**: session-scoped in this reference build (resets on reload). A production deployment should persist it
  server-side per wallet.

## Grant / RFP alignment

An honest, line-by-line mapping of implemented functionality against the Solana Foundation's automated stake
delegation & rebalancing UI requirements belongs in `docs/foundation-rfp-alignment.md` in a full submission — add it
before submitting, marking anything not yet implemented as such rather than implying completeness.

## Roadmap

- Connect Rebalancing-page proposals to the real transaction construction layer (`src/lib/solana/stakeTransactions.ts`) so "Execute via wallet" there is live, not just the Stake Accounts page's manual redelegate flow.
- Verify the redelegate flow end-to-end against devnet, then mainnet, with a real wallet.
- Integrate a real ASN/geo resolution service for live mode.
- Persist history server-side, scoped per wallet.
- WebSocket-based live updates for validator conditions.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE).
