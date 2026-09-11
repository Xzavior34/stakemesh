import { DemoValidatorDataProvider } from "./demoProvider";
import { LiveValidatorDataProvider } from "./liveProvider";
import type { ValidatorDataProvider } from "./provider";

export type { ValidatorDataProvider } from "./provider";
export { DemoValidatorDataProvider } from "./demoProvider";
export { LiveValidatorDataProvider } from "./liveProvider";

/**
 * Single entry point the UI uses to get validator data. Controlled by
 * NEXT_PUBLIC_DATA_MODE ("demo" | "live"), defaulting to "demo" so the app
 * never silently presents live-looking data without an explicit RPC
 * configured. See /docs/architecture for the full data-flow diagram.
 */
export function getValidatorDataProvider(): ValidatorDataProvider {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE ?? "demo";
  if (mode === "live") {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error(
        "NEXT_PUBLIC_DATA_MODE=live requires NEXT_PUBLIC_SOLANA_RPC_URL to be set. Falling back is intentionally not automatic — silently switching to demo data under a 'live' request would defeat the point of labeling the data source."
      );
    }
    return new LiveValidatorDataProvider(rpcUrl);
  }
  return new DemoValidatorDataProvider();
}
