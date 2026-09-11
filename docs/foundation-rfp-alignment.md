# Foundation RFP Alignment

An honest mapping of StakeMesh's current implementation against the Solana Foundation's Automated Stake Delegation &
Rebalancing UI requirements, as understood from the product brief this repository was built against. This document is
maintained alongside the code — if a status below is wrong, that's a bug in the docs and should be fixed in the same
PR as whatever changed the underlying behavior.

Status values used throughout this document: **IMPLEMENTED**, **PARTIAL**, **NOT IMPLEMENTED**. A status is never
upgraded to IMPLEMENTED until the underlying behavior is actually complete and tested — a partial capability stays
PARTIAL for as long as it is one.

## Multi-validator staking — IMPLEMENTED

The allocation engine spreads a requested stake amount across multiple validators according to policy, with a
configurable target validator count. Covered by unit tests in `src/lib/engine/__tests__/allocate.test.ts`.

## Custom delegation criteria — IMPLEMENTED

Hard constraints (minimum vote performance, maximum skip rate, maximum commission, maximum ASN/datacenter/
per-validator concentration, minimum software version, active-only, delinquency exclusion) and soft objective weights
(yield, performance, reliability, decentralization) are both fully user-configurable via the Strategy page.

## Automatic / recommended rebalancing — PARTIAL

Drift detection and rebalance **proposal generation** are implemented and tested, including an invariant that a
proposed move never worsens the concentration constraint it's correcting. Proposals are recommend-only by design (see
[`/docs/rebalancing`](../src/app/docs/rebalancing/page.tsx)) — this is a deliberate safety choice, not a gap.
Real transaction construction for stake operations now exists (see Transaction construction, below) and is used by
the Stake Accounts page's manual redelegate flow, but it is not yet connected to the Rebalancing page's proposals —
a rebalance recommendation still has to be re-created manually as a redelegation today, and there is no automatic
execution path. Status is PARTIAL, not IMPLEMENTED, on both counts.

## Validator filtering — IMPLEMENTED

The Validators page supports search, minimum performance, and maximum commission filters, plus full sortability on
every numeric column, against the same eligibility logic the allocation engine uses.

## Transaction construction — PARTIAL

Real read-side transaction data exists (stake account lookups via `getParsedProgramAccounts`, tested against a real
Solana RPC connection object). Real write-side construction now exists too: `src/lib/solana/stakeTransactions.ts`
builds actual `StakeProgram` Split, Deactivate, and Delegate transactions and decodes them back into a
human-readable instruction preview from the real serialized instruction data (not a hand-written description). The
Stake Accounts page wires this into a three-step, wallet-signed "Redelegate" flow with a mainnet-safety warning.
This is exercised by 14 offline unit tests that construct and decode real transaction objects (see
`src/lib/solana/__tests__`), but it has **not been executed end-to-end against a live wallet and RPC endpoint** from
this development environment — see [Known limitations](../README.md#known-limitations). Status remains PARTIAL, not
IMPLEMENTED, until that live verification happens. Separately, the Rebalancing page's "Execute via wallet" button is
still disabled by design: rebalance proposals are computed against the abstract policy/allocation model, not yet
matched to a specific owned stake account, so that integration remains future work.

## WebSocket updates — NOT IMPLEMENTED

The current data layer is request/response (`getSnapshot()`); a subscription-based live update path is listed in the
README roadmap.

## Stake dashboard — IMPLEMENTED

The Overview page surfaces total managed stake, validator count, estimated APY, average commission, ASN/datacenter
concentration, voting performance, and strategy health, computed from the live allocation result.

## Validator metrics — PARTIAL

Commission, vote performance, skip rate, active stake, ASN, datacenter, software version, and delinquency are all
surfaced and explained in [`/docs/validator-metrics`](../src/app/docs/validator-metrics/page.tsx), and all of them are
populated in demo mode. Status is PARTIAL rather than IMPLEMENTED because in **live** mode, ASN, datacenter, skip
rate, and estimated APY are not derivable from a standard Solana RPC call and are honestly reported as
unavailable/zero rather than guessed — see [Known limitations](../README.md#known-limitations).

## Reason for stake changes — IMPLEMENTED

Every allocation leg carries plain-language inclusion reasons; every excluded validator carries specific exclusion
reasons (which hard constraint it failed, or which concentration ceiling it would have breached). Every rebalance
move carries the specific violation it's correcting and the before/after concentration effect.

## Open-source reference implementation — IMPLEMENTED

MIT-licensed, with a documented architecture, a real test suite (67 tests), and this alignment document.

## Summary

| Requirement | Status |
| --- | --- |
| Multi-validator staking | IMPLEMENTED |
| Custom delegation criteria | IMPLEMENTED |
| Automatic/recommended rebalancing | PARTIAL — recommendation complete, not connected to execution |
| Validator filtering | IMPLEMENTED |
| Transaction construction | PARTIAL — real split/deactivate/delegate construction, tested offline, not yet verified live |
| WebSocket updates | NOT IMPLEMENTED |
| Stake dashboard | IMPLEMENTED |
| Validator metrics | PARTIAL — full in demo mode, gaps in live mode honestly labeled |
| Reason for stake changes | IMPLEMENTED |
| Open-source reference implementation | IMPLEMENTED |
