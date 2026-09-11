/**
 * Core domain types for StakeMesh.
 *
 * These types are intentionally independent of any UI framework so that the
 * allocation and rebalancing engine can be used, tested, and reasoned about
 * without a React tree mounted.
 */

/** A snapshot of a single validator's on-chain / off-chain metrics. */
export interface Validator {
  /** Vote account address (base58). Used as the unique identifier. */
  voteAccount: string;
  /** Identity account address (base58). */
  identity: string;
  /** Human readable name, if known from validator-info. */
  name: string | null;
  /** Commission charged by the validator, 0-100 (percent). */
  commission: number;
  /** Trailing vote/credit performance, 0-1 (fraction, e.g. 0.982 = 98.2%). */
  votePerformance: number;
  /** Trailing skip rate, 0-1 (fraction). Lower is better. */
  skipRate: number;
  /** Total active stake delegated to this validator, in lamports. */
  activeStakeLamports: bigint;
  /** Autonomous System Number hosting this validator's gossip/TPU endpoint. */
  asn: number;
  /** ASN organization name, if resolvable. */
  asnOrg: string | null;
  /** Datacenter / hosting provider identifier (best-effort). */
  datacenter: string;
  /** Two-letter country code for the validator's inferred location. */
  country: string | null;
  /** Reported software (agave/solana-labs) version string. */
  version: string | null;
  /** Whether the validator is currently delinquent. */
  delinquent: boolean;
  /** Epoch credits based APY estimate, 0-1 (fraction). */
  estimatedApy: number;
  /** Whether this validator is on the network's current leader schedule (active). */
  active: boolean;
}

/** Hard constraints a valid allocation may never violate. */
export interface HardConstraints {
  minVotePerformance: number; // 0-1
  maxSkipRate: number; // 0-1
  maxCommission: number; // 0-100
  maxAsnConcentration: number; // 0-1, fraction of total stake behind one ASN
  maxDatacenterConcentration: number; // 0-1
  maxStakePerValidator: number; // 0-1, fraction of total stake in one validator
  minSoftwareVersion: string | null; // semver-ish string, null = no requirement
  requireActive: boolean;
  excludeDelinquent: boolean;
}

/** Relative importance of each soft objective, all >= 0. Need not sum to 1; normalized internally. */
export interface ObjectiveWeights {
  yield: number;
  performance: number;
  reliability: number;
  decentralization: number;
}

export type OptimizationPreference =
  | "balanced"
  | "max-yield"
  | "max-decentralization"
  | "max-reliability";

export interface StrategyPolicy {
  id: string;
  name: string;
  /** Total stake to allocate, in lamports. */
  stakeAmountLamports: bigint;
  /** Desired number of validators to spread stake across (soft target). */
  targetValidatorCount: number;
  constraints: HardConstraints;
  weights: ObjectiveWeights;
  preference: OptimizationPreference;
}

/** A single validator's normalized sub-scores and final composite score. */
export interface ValidatorScore {
  voteAccount: string;
  yieldScore: number;
  performanceScore: number;
  reliabilityScore: number;
  decentralizationScore: number;
  concentrationPenalty: number;
  compositeScore: number;
}

export interface ExclusionReason {
  voteAccount: string;
  name: string | null;
  reasons: string[];
}

export interface AllocationLeg {
  voteAccount: string;
  name: string | null;
  stakeLamports: bigint;
  fractionOfTotal: number;
  score: ValidatorScore;
  inclusionReasons: string[];
}

export interface ConcentrationMetrics {
  /** Map of ASN -> fraction of total stake behind it. */
  byAsn: Record<number, number>;
  /** Map of datacenter -> fraction of total stake. */
  byDatacenter: Record<string, number>;
  /** Largest single-validator fraction of total stake. */
  maxValidatorConcentration: number;
  /** Largest single-ASN fraction of total stake. */
  maxAsnConcentration: number;
  /** Largest single-datacenter fraction of total stake. */
  maxDatacenterConcentration: number;
}

export interface AllocationResult {
  policyId: string;
  legs: AllocationLeg[];
  excluded: ExclusionReason[];
  totalAllocatedLamports: bigint;
  requestedLamports: bigint;
  /** true only if totalAllocatedLamports === requestedLamports within rounding tolerance */
  fullyAllocated: boolean;
  concentration: ConcentrationMetrics;
  aggregate: {
    weightedApy: number;
    weightedCommission: number;
    weightedVotePerformance: number;
  };
  distributionScore: number; // StakeMesh Distribution Score, 0-100
  constraintViolations: string[]; // should always be empty for a valid result
  computedAtEpochLabel: string;
}

export type RebalanceViolationKind =
  | "performance-degradation"
  | "commission-increase"
  | "skip-rate-violation"
  | "asn-concentration"
  | "datacenter-concentration"
  | "validator-delinquent"
  | "software-version"
  | "allocation-drift";

export interface RebalanceMove {
  fromVoteAccount: string;
  fromName: string | null;
  toVoteAccount: string;
  toName: string | null;
  amountLamports: bigint;
  reason: string;
  violationKind: RebalanceViolationKind;
  projectedConcentrationBefore: number;
  projectedConcentrationAfter: number;
}

export interface RebalanceProposal {
  generatedAtEpochLabel: string;
  moves: RebalanceMove[];
  projectedAggregate: {
    weightedApy: number;
    weightedVotePerformance: number;
  };
  projectedDistributionScore: number;
  currentDistributionScore: number;
  summary: string;
}

export type DataSourceKind = "live" | "demo" | "indexed";

export type DataProvenanceTag = "REAL-TIME" | "PERIODIC" | "STATIC" | "UNAVAILABLE";

export interface MetricProvenance {
  metric: string;
  source: string;
  tag: DataProvenanceTag;
}

export interface ValidatorDataSnapshot {
  source: DataSourceKind;
  epochLabel: string;
  fetchedAt: string; // ISO timestamp
  validators: Validator[];
  provenance?: MetricProvenance[];
}

export type RebalanceStatus =
  | "RECOMMENDED"
  | "APPROVED"
  | "SUBMITTED"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED";

export interface RebalanceHistoryRecord {
  id: string;
  timestamp: string;
  cluster: string;
  status: RebalanceStatus;
  policyId: string;
  policyName: string;
  beforeDistributionScore: number;
  afterDistributionScore: number;
  moves: RebalanceMove[];
  txSignatures?: string[];
  errorMessage?: string;
}
