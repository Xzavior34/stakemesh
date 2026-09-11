# Security Policy

## Non-custodial design

StakeMesh never requests, stores, transmits, or has any code path capable of accepting a private key, seed phrase, or
secret key. Wallet connectivity uses the standard Wallet Standard / `@solana/wallet-adapter` flow: your wallet
extension retains sole custody of keys, and StakeMesh only ever receives a public key and transactions you have
already signed.

## Reporting a vulnerability

If you find a security issue — including but not limited to: a way to construct a transaction that moves funds
without explicit user approval, a way to make the app display a false transaction confirmation, an XSS/injection
vector, or a way to bypass a hard constraint in the allocation engine — please report it privately rather than
opening a public issue.

**Preferred: GitHub Security Advisories.** Once this repository is public, use GitHub's private vulnerability
reporting: open the repository's **Security** tab → **Report a vulnerability**. This reaches maintainers privately
without requiring a shared inbox and keeps the report out of public issue history until it's resolved.

**Alternative: email.** `<< add a real, monitored security contact address here before publishing — do not leave a
placeholder domain in a public repository >>`

- Please include: a description of the issue, reproduction steps, and the potential impact.
- We aim to acknowledge reports within 5 business days.

Please do not open a public GitHub issue for undisclosed vulnerabilities.

## Scope

In scope:

- The Next.js application in this repository (`src/`).
- The allocation and rebalancing engines (`src/lib/engine`).
- The Solana transaction construction and wallet integration code.

Out of scope:

- Third-party wallet extensions themselves.
- The Solana network/protocol.
- The demo dataset (`src/lib/data/demoProvider.ts`) — it is intentionally fake, clearly labeled, and contains no real
  validator identities.

## Threat Model & Security Controls

### 1. Cluster Mismatch Protection
StakeMesh explicitly compares the connected wallet's RPC cluster (Mainnet-Beta, Testnet, Devnet, Demo) against the transaction target. Execution is blocked if a mismatch occurs (`checkClusterSafety`), preventing accidental testnet transactions on mainnet or vice versa.

### 2. Transaction Instruction Decoding & Preview
Before presenting a transaction for signing, `describeTransaction()` decodes the raw serialized instruction data into a human-readable summary. If an instruction belongs to an unexpected program ID, it is explicitly flagged to the user.

### 3. Pure Deterministic Policy Engine
All allocation and drift detection algorithms inside `src/lib/engine/` are pure functions with zero network access and zero key handling. Inputs are sanitized and 10 core invariants (such as total lamport conservation and hard constraint enforcement) are verified via invariant test suites.

## Known, intentional limitations

These are documented in [`/docs/security`](src/app/docs/security/page.tsx) and the README's "Known limitations" section, not hidden gaps: live-mode ASN/datacenter/geo data is honestly reported as unknown rather than fabricated, and full rebalancing-transaction submission requires explicit user wallet authorization. Users should always inspect transaction details in their connected wallet before signing.
