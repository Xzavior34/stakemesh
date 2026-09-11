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

Hard constraints (minimum vote performance, maximum skip rate, maximum commission, maximum ASN/datacenter/per-validator concentration, minimum software version, active-only, delinquency exclusion) and soft objective weights (yield, performance, reliability, decentralization) are fully configurable via the Strategy page. A first-class "Foundation Decentralization Strategy" preset based on published Foundation delegation criteria is now included out of the box.

## Transaction construction — IMPLEMENTED (OFFLINE VERIFIED)

Real read-side transaction data exists (stake account lookups via `getParsedProgramAccounts`, tested against a real Solana RPC connection object). Real write-side construction exists: `src/lib/solana/stakeTransactions.ts` builds actual `StakeProgram` Split, Deactivate, Delegate, Merge, and Authorize transactions and decodes them back into a human-readable instruction preview from real serialized instruction data, with cluster-mismatch safety checks (`checkClusterSafety`). Covered by 18 unit tests in `src/lib/solana/__tests__/stakeTransactions.test.ts`.

## Summary

| Requirement | Status |
| --- | --- |
| Multi-validator staking | IMPLEMENTED |
| Custom delegation criteria & Foundation Preset | IMPLEMENTED |
| Automatic/recommended rebalancing | IMPLEMENTED (Recommendation engine & transaction builder complete) |
| Validator filtering | IMPLEMENTED |
| Transaction construction & Decoding | IMPLEMENTED (Split, Deactivate, Delegate, Merge, Authorize, Cluster check) |
| Policy Invariants | IMPLEMENTED (10 core invariants tested) |
| WebSocket updates | PARTIAL (Provider abstraction ready for subscription layer) |
| Stake dashboard | IMPLEMENTED |
| Validator metrics | PARTIAL (Full in demo mode, provenance tagged in live mode) |
| Reason for stake changes | IMPLEMENTED |
| Open-source reference implementation | IMPLEMENTED |
