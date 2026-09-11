/**
 * Best-effort, string-based guess at which Solana cluster an RPC URL points
 * to, purely to power a "you're about to move real funds on mainnet"
 * warning in the transaction-signing UI. This is NOT authoritative — a
 * private or proxied RPC URL won't contain any of these substrings — so
 * callers should treat "mainnet" as the safe-default assumption whenever
 * detection is inconclusive, rather than silently skipping the warning.
 */
export type SolanaClusterGuess = "mainnet" | "devnet" | "testnet" | "localnet" | "unknown";

export function guessClusterFromRpcUrl(url: string): SolanaClusterGuess {
  const lower = url.toLowerCase();
  if (lower.includes("devnet")) return "devnet";
  if (lower.includes("testnet")) return "testnet";
  if (lower.includes("localhost") || lower.includes("127.0.0.1")) return "localnet";
  if (lower.includes("mainnet")) return "mainnet";
  return "unknown";
}

/** Whether this guess should trigger the strongest "real funds" warning. */
export function isLikelyMainnet(guess: SolanaClusterGuess): boolean {
  return guess === "mainnet" || guess === "unknown";
}
