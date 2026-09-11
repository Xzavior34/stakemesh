import type { HardConstraints, ObjectiveWeights, OptimizationPreference } from "@/lib/types";

export interface StrategyPresetMetadata {
  policySource: string;
  retrievalDate: string;
  criteriaVersion: string;
  lastVerifiedTimestamp: string;
}

export interface StrategyPreset {
  id: string;
  label: string;
  description: string;
  constraints: HardConstraints;
  weights: ObjectiveWeights;
  preference: OptimizationPreference;
  targetValidatorCount: number;
  metadata?: StrategyPresetMetadata;
}

const baseConstraints: HardConstraints = {
  minVotePerformance: 0.9,
  maxSkipRate: 0.05,
  maxCommission: 10,
  maxAsnConcentration: 0.2,
  maxDatacenterConcentration: 0.25,
  maxStakePerValidator: 0.15,
  minSoftwareVersion: null,
  requireActive: true,
  excludeDelinquent: true,
};

export const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: "foundation-decentralization",
    label: "Foundation-Aligned Preset",
    description:
      "Example policy based on published Solana Foundation delegation criteria. Enforces commission (<= 5%), ASN concentration (<= 25%), datacenter concentration (<= 15%), vote performance (>= 97%), skip rate (<= 5%), and minimum software version ('1.18.0').",
    constraints: {
      ...baseConstraints,
      minVotePerformance: 0.97,
      maxSkipRate: 0.05,
      maxCommission: 5,
      maxAsnConcentration: 0.25,
      maxDatacenterConcentration: 0.15,
      maxStakePerValidator: 0.1,
      minSoftwareVersion: "1.18.0",
    },
    weights: { yield: 0.5, performance: 1.5, reliability: 1.5, decentralization: 2.5 },
    preference: "max-decentralization",
    targetValidatorCount: 15,
    metadata: {
      policySource: "Solana Foundation Delegation Program Criteria (Published Guidelines)",
      retrievalDate: "2026-09-11",
      criteriaVersion: "Epoch 650+ Current Delegation Criteria",
      lastVerifiedTimestamp: "2026-09-11T17:40:00Z",
    },
  },
  {
    id: "conservative",
    label: "Conservative",
    description:
      "Prioritizes capital safety: strict performance and reliability minimums, tight per-validator caps, and low tolerance for concentration. Fewer surprises, more validators.",
    constraints: { ...baseConstraints, minVotePerformance: 0.95, maxSkipRate: 0.02, maxCommission: 7, maxStakePerValidator: 0.1 },
    weights: { yield: 0.5, performance: 1.5, reliability: 2, decentralization: 1 },
    preference: "max-reliability",
    targetValidatorCount: 15,
  },
  {
    id: "balanced",
    label: "Balanced",
    description:
      "Equal weight across yield, performance, reliability, and decentralization. A reasonable default for most stakers who don't have a strong preference.",
    constraints: baseConstraints,
    weights: { yield: 1, performance: 1, reliability: 1, decentralization: 1 },
    preference: "balanced",
    targetValidatorCount: 10,
  },
  {
    id: "decentralization-first",
    label: "Decentralization First",
    description:
      "Minimizes ASN and datacenter concentration above all else, even at some cost to yield. Directs stake toward independent, smaller-footprint infrastructure.",
    constraints: { ...baseConstraints, maxAsnConcentration: 0.1, maxDatacenterConcentration: 0.12, maxStakePerValidator: 0.08 },
    weights: { yield: 0.4, performance: 0.8, reliability: 0.8, decentralization: 3 },
    preference: "max-decentralization",
    targetValidatorCount: 20,
  },
  {
    id: "performance-first",
    label: "Performance First",
    description:
      "Weights voting performance and low skip rate most heavily. Decentralization constraints are still enforced, just not prioritized in scoring.",
    constraints: { ...baseConstraints, minVotePerformance: 0.97, maxSkipRate: 0.015 },
    weights: { yield: 0.6, performance: 2.5, reliability: 1.2, decentralization: 0.6 },
    preference: "max-reliability",
    targetValidatorCount: 10,
  },
  {
    id: "yield-optimized",
    label: "Yield Optimized",
    description:
      "Weights estimated APY most heavily within the same hard-constraint floor as Balanced. Still enforces decentralization ceilings — this changes ranking, not safety.",
    constraints: baseConstraints,
    weights: { yield: 3, performance: 0.7, reliability: 0.7, decentralization: 0.6 },
    preference: "max-yield",
    targetValidatorCount: 10,
  },
];

export function getPreset(id: string): StrategyPreset | undefined {
  return STRATEGY_PRESETS.find((p) => p.id === id);
}
