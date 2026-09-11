import { describe, expect, it } from "vitest";
import { guessClusterFromRpcUrl, isLikelyMainnet } from "../cluster";

describe("guessClusterFromRpcUrl", () => {
  it("detects devnet", () => {
    expect(guessClusterFromRpcUrl("https://api.devnet.solana.com")).toBe("devnet");
  });
  it("detects testnet", () => {
    expect(guessClusterFromRpcUrl("https://api.testnet.solana.com")).toBe("testnet");
  });
  it("detects localnet", () => {
    expect(guessClusterFromRpcUrl("http://127.0.0.1:8899")).toBe("localnet");
    expect(guessClusterFromRpcUrl("http://localhost:8899")).toBe("localnet");
  });
  it("detects mainnet", () => {
    expect(guessClusterFromRpcUrl("https://api.mainnet-beta.solana.com")).toBe("mainnet");
  });
  it("falls back to unknown for an opaque RPC URL", () => {
    expect(guessClusterFromRpcUrl("https://my-private-rpc.example.com/abc123")).toBe("unknown");
  });
});

describe("isLikelyMainnet", () => {
  it("treats unknown as requiring the mainnet warning (safe default)", () => {
    expect(isLikelyMainnet("unknown")).toBe(true);
  });
  it("treats mainnet as requiring the warning", () => {
    expect(isLikelyMainnet("mainnet")).toBe(true);
  });
  it("does not warn for devnet/testnet/localnet", () => {
    expect(isLikelyMainnet("devnet")).toBe(false);
    expect(isLikelyMainnet("testnet")).toBe(false);
    expect(isLikelyMainnet("localnet")).toBe(false);
  });
});
