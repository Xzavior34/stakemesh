"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";

const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

/**
 * Wraps the /app section with wallet connectivity.
 *
 * StakeMesh never requests a private key or seed phrase: `wallets={[]}`
 * relies entirely on Wallet Standard auto-detection, so connection happens
 * through whatever wallet extension the user already has installed and
 * approves through its own UI.
 */
export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? DEFAULT_RPC;
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
