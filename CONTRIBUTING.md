# Contributing to StakeMesh

Thanks for considering a contribution. StakeMesh is an early-stage reference implementation, and there's real,
high-value work available — see the README's "Roadmap" and "Known limitations" sections for the biggest gaps.

## Getting started

```bash
git clone https://github.com/Xzavior34/stakemesh.git
cd stakemesh
npm install
cp .env.example .env.local
npm run dev
```

## Before opening a PR

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

All four must pass. CI will run the same checks.

## Code organization

- `src/lib/engine/` — the allocation and rebalancing engine. Framework-independent TypeScript, no React/Next.js
  imports. If you change scoring, allocation, concentration, or rebalancing logic, add or update tests in
  `src/lib/engine/__tests__/` in the same PR — untested changes to this directory will not be merged.
- `src/lib/data/` — the `ValidatorDataProvider` abstraction (demo and live implementations).
- `src/app/app/` — the dashboard UI.
- `src/app/docs/` — documentation pages. If your change affects behavior described in a docs page, update the docs
  page in the same PR.

## Principles that PRs are reviewed against

These come directly from the product's non-negotiables (see the README and `/docs/security`):

- No fake functionality: don't add a button that pretends to execute a transaction, don't fabricate validator
  statistics, don't invent transaction signatures, don't claim a transaction succeeded without an actual on-chain
  confirmation.
- No fabricated live data: if a metric can't reliably be sourced in live mode, report it as unknown rather than
  guessing — see `src/lib/data/liveProvider.ts` for the existing pattern.
- No private keys, seed phrases, or secret keys are ever requested, logged, or transmitted.
- Every constraint claimed to be "hard" must actually be enforced — add a test proving it, ideally an invariant test
  (see `src/lib/engine/__tests__/allocate.test.ts` and `rebalance.test.ts` for examples).
- Default to recommend-only for anything that could move funds. Any auto-execution path requires explicit, clearly
  labeled opt-in and cannot be added to the default flow.

## Commit style

Clear, imperative commit messages (`Fix ASN concentration rounding in allocate()`, not `updates`). Keep unrelated
changes in separate PRs.

## Reporting bugs / requesting features

Open a GitHub issue. For security vulnerabilities, see [`SECURITY.md`](SECURITY.md) instead — do not open a public
issue.

## Code of Conduct

See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
