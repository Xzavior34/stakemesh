# Solana Foundation RFP Alignment & Capability Matrix

An honest mapping of StakeMesh's current implementation against the Solana Foundation's Automated Stake Delegation & Rebalancing UI requirements. This document strictly uses three statuses: **IMPLEMENTED**, **PARTIAL**, and **PLANNED**.

A capability is marked **IMPLEMENTED** only when fully functional and tested. Capabilities that exist as abstractions, offline builders, or partial RPC integrations are marked **PARTIAL**. Autonomous features or external indexers are marked **PLANNED**.

---

## Detailed Requirement Breakdown

### 1. Allocation Engine — IMPLEMENTED
Deterministic greedy allocator (`allocate.ts`) spreading requested stake across multiple validators according to policy constraints. Enforces 10 core policy engine invariants (lamport conservation, non-negative legs, hard constraint preservation, non-worsening rebalance). Covered by 22 unit & invariant tests.

### 2. Validator Filtering — IMPLEMENTED
Filterable, sortable validator directory supported on the Validators page, filtering by commission, minimum vote performance, maximum skip rate, software version, and delinquency status.

### 3. Policy Constraints & Foundation Preset — IMPLEMENTED
User-configurable hard constraints and soft objective weights. Includes a first-class **Foundation-aligned preset** based on published Solana Foundation delegation criteria (Commission <= 5%, ASN concentration <= 25%, Datacenter concentration <= 15%, Vote Performance >= 97%, Skip Rate <= 5%, Software Version >= 1.18.0). Exposes policy source metadata, retrieval date, and criteria version.

### 4. Concentration Enforcement — IMPLEMENTED
Portfolio-level ASN, datacenter, and single-validator concentration ceilings enforced in both allocation and rebalancing drift detection.

### 5. Stake-Account Discovery — IMPLEMENTED
Read-side on-chain stake account lookups via Solana RPC `getParsedProgramAccounts(StakeProgram.programId)`.

### 6. Transaction Construction & Decoding — PARTIAL
Real `StakeProgram` transaction construction for Split, Deactivate, Delegate, Merge, and Authorize operations in `src/lib/solana/stakeTransactions.ts`. Decodes raw serialized instruction buffers into human-readable summaries (`describeTransaction`) and enforces cluster safety (`checkClusterSafety`). Status is PARTIAL because while instruction construction is verified offline against `@solana/web3.js`, live submission requires wallet interaction.

### 7. Wallet Signing — IMPLEMENTED
Standard Wallet Standard / `@solana/wallet-adapter` integration on the Stake Accounts page requiring explicit user wallet authorization for all transaction signatures.

### 8. Transaction Submission — PARTIAL
Manual wallet-signed submission flow implemented on the Stake Accounts page. Status is PARTIAL until automated end-to-end devnet test execution is run with active devnet RPC and funded test wallet.

### 9. Transaction Confirmation — PARTIAL
Signature status polling and confirmation verification scaffolded via Solana RPC.

### 10. Automatic Monitoring — PARTIAL
Polling-based snapshots via `getSnapshot()` and drift detection engine (`detectViolations()`). Status is PARTIAL because polling is request-driven rather than continuous background streaming.

### 11. WebSockets — PLANNED
Subscription-based live update path (`provider.ts` interface) planned for Milestone 2.

### 12. ASN / Datacenter Intelligence — PARTIAL
Full infrastructure metadata (ASN, datacenter, country) populated in demo mode. Standard Solana RPC does not expose gossip IP geolocation, so live mode honestly surfaces these as unknown rather than fabricating values. Production indexer planned for Milestone 1.

### 13. Automatic Rebalancing — PLANNED
Auto-execution without human authorization is intentionally omitted for non-custodial security. Recommend-only proposal generation is IMPLEMENTED; autonomous execution is PLANNED as opt-in grant work.

---

## Alignment Summary Matrix

| Capability | Status | Evidence / Location |
| --- | --- | --- |
| **Allocation Engine** | **IMPLEMENTED** | `src/lib/engine/allocate.ts`, `allocate.test.ts` |
| **Validator Filtering** | **IMPLEMENTED** | `src/lib/engine/scoring.ts`, `src/app/app/validators/page.tsx` |
| **Policy Constraints & Presets** | **IMPLEMENTED** | `src/lib/engine/presets.ts`, `presets.test.ts` |
| **Concentration Enforcement** | **IMPLEMENTED** | `src/lib/engine/concentration.ts`, `concentration.test.ts` |
| **Stake-Account Discovery** | **IMPLEMENTED** | `src/lib/solana/stakeTransactions.ts` |
| **Transaction Construction & Decoding** | **PARTIAL** | `src/lib/solana/stakeTransactions.ts`, `stakeTransactions.test.ts` |
| **Wallet Signing** | **IMPLEMENTED** | `src/app/app/stake-accounts/page.tsx`, `@solana/wallet-adapter` |
| **Transaction Submission** | **PARTIAL** | Devnet verification pipeline helper (`devnetVerification.ts`) |
| **Transaction Confirmation** | **PARTIAL** | Signature status verification scaffolding |
| **Automatic Monitoring** | **PARTIAL** | `detectViolations()` drift detection in `rebalance.ts` |
| **WebSockets** | **PLANNED** | Milestone 2 Roadmap (`provider.ts` abstraction) |
| **ASN/Datacenter Intelligence** | **PARTIAL** | `liveProvider.ts` (honest unknown reporting in RPC mode) |
| **Automatic Rebalancing** | **PLANNED** | Non-custodial recommend-only design; auto-execution planned opt-in |
