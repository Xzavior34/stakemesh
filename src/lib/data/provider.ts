import type { ValidatorDataSnapshot } from "@/lib/types";

/**
 * ValidatorDataProvider is the single seam between StakeMesh's UI/engine and
 * "where validator data comes from." Swap the implementation returned by
 * `getValidatorDataProvider()` to point the whole app at a real production
 * validator analytics source (e.g. a Solana RPC + a stake-weighted-quality
 * scoring service) without touching any UI or engine code.
 *
 * The demo provider (demoProvider.ts) is the only implementation shipped
 * today. It returns clearly-labeled, deterministic fixture data — see
 * /docs/architecture for why StakeMesh does not ship a "live" implementation
 * out of the box (it requires infrastructure — an indexed validator metrics
 * service — that this open-source reference app does not operate).
 */
export interface ValidatorDataProvider {
  readonly kind: "live" | "demo";
  getSnapshot(): Promise<ValidatorDataSnapshot>;
}
