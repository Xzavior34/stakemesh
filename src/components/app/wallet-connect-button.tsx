"use client";

import dynamic from "next/dynamic";

// wallet-adapter-react-ui's button touches `window` at module init, so it
// must be loaded client-side only.
const WalletMultiButtonDynamic = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function WalletConnectButton() {
  return (
    <div className="stakemesh-wallet-button">
      <WalletMultiButtonDynamic />
    </div>
  );
}
