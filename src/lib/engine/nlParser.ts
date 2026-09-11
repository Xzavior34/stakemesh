import type { HardConstraints, ObjectiveWeights } from "@/lib/types";
import { STRATEGY_PRESETS } from "./presets";

/**
 * Parses a free-text staking description into structured constraints using
 * deterministic pattern matching — NOT a call to an external AI API. This is
 * intentional: an opaque model call here would mean the "interpreted
 * strategy" the user reviews couldn't be explained or unit tested, and per
 * the product's safety principles, no parser (deterministic or AI) is ever
 * allowed to directly control a transaction. The user always reviews the
 * structured result below before it becomes a real policy.
 */
export interface ParsedStrategyPatch {
  stakeAmountSol: number | null;
  targetValidatorCount: number | null;
  maxCommission: number | null;
  maxAsnConcentration: number | null;
  maxDatacenterConcentration: number | null;
  minVotePerformance: number | null;
  matchedPresetId: string | null;
  /** Human-readable notes about what was and wasn't understood, shown to the user. */
  notes: string[];
}

const SOL_AMOUNT_RE = /(\d+(?:\.\d+)?)\s*(?:sol\b)/i;
const VALIDATOR_COUNT_RE = /(?:across|over|among)\s*(\d+)\s*validators/i;
const MAX_COMMISSION_RE = /commission\s*(?:below|under|less than|<)\s*(\d+(?:\.\d+)?)\s*%/i;
// Matches either ordering: "ASN ... 10%" or "10% ... ASN" (people naturally
// write "no more than 10% behind one ASN" as often as "ASN below 10%").
// The "%[^.%]*?keyword" branch excludes any other '%' from the gap so a
// nearer, unrelated percentage (e.g. a commission cap) earlier in the
// sentence can't bridge across to a keyword much further along.
const MAX_ASN_RE = /(?:(?:asn|autonomous system)[^%\d]*?(\d+(?:\.\d+)?)\s*%)|(?:(\d+(?:\.\d+)?)\s*%[^.%]*?(?:asn|autonomous system))/i;
const MAX_DATACENTER_RE = /(?:datacenter[^%\d]*?(\d+(?:\.\d+)?)\s*%)|(?:(\d+(?:\.\d+)?)\s*%[^.%]*?datacenter)/i;
const MIN_PERFORMANCE_RE = /(?:performance|uptime)[^%]*?(?:above|over|at least|>)\s*(\d+(?:\.\d+)?)\s*%/i;

export function parseNaturalLanguageStrategy(input: string): ParsedStrategyPatch {
  const notes: string[] = [];
  const text = input.trim();

  const solMatch = text.match(SOL_AMOUNT_RE);
  const stakeAmountSol = solMatch ? parseFloat(solMatch[1]) : null;

  const countMatch = text.match(VALIDATOR_COUNT_RE);
  const targetValidatorCount = countMatch ? parseInt(countMatch[1], 10) : null;

  const commissionMatch = text.match(MAX_COMMISSION_RE);
  const maxCommission = commissionMatch ? parseFloat(commissionMatch[1]) : null;

  const asnMatch = text.match(MAX_ASN_RE);
  const maxAsnConcentration = asnMatch ? parseFloat(asnMatch[1] ?? asnMatch[2]) / 100 : null;

  const dcMatch = text.match(MAX_DATACENTER_RE);
  const maxDatacenterConcentration = dcMatch ? parseFloat(dcMatch[1] ?? dcMatch[2]) / 100 : null;

  const perfMatch = text.match(MIN_PERFORMANCE_RE);
  const minVotePerformance = perfMatch ? parseFloat(perfMatch[1]) / 100 : null;

  // Keyword-match against preset intent as a starting point for weights/preference.
  let matchedPresetId: string | null = null;
  const lower = text.toLowerCase();
  if (/decentraliz/.test(lower)) matchedPresetId = "decentralization-first";
  else if (/yield|apy|return/.test(lower)) matchedPresetId = "yield-optimized";
  else if (/performance|reliab|uptime/.test(lower)) matchedPresetId = "performance-first";
  else if (/conservative|safe|safety/.test(lower)) matchedPresetId = "conservative";

  if (stakeAmountSol === null) notes.push("Could not identify a stake amount — enter it manually below.");
  if (targetValidatorCount === null) notes.push("Could not identify a target validator count — using the preset default.");
  if (maxCommission === null && maxAsnConcentration === null && maxDatacenterConcentration === null) {
    notes.push("No explicit numeric constraints were recognized beyond amount/count — review defaults below.");
  }
  if (matchedPresetId) {
    const preset = STRATEGY_PRESETS.find((p) => p.id === matchedPresetId);
    notes.push(`Matched the intent of the "${preset?.label}" preset based on your wording.`);
  }

  return {
    stakeAmountSol,
    targetValidatorCount,
    maxCommission,
    maxAsnConcentration,
    maxDatacenterConcentration,
    minVotePerformance,
    matchedPresetId,
    notes,
  };
}

/** Apply a parsed patch on top of a base preset's constraints/weights, returning a full structured policy fragment for the review step. */
export function applyPatchToConstraints(
  base: HardConstraints,
  patch: ParsedStrategyPatch
): HardConstraints {
  return {
    ...base,
    maxCommission: patch.maxCommission ?? base.maxCommission,
    maxAsnConcentration: patch.maxAsnConcentration ?? base.maxAsnConcentration,
    maxDatacenterConcentration: patch.maxDatacenterConcentration ?? base.maxDatacenterConcentration,
    minVotePerformance: patch.minVotePerformance ?? base.minVotePerformance,
  };
}

export function defaultWeightsForPreset(id: string | null): ObjectiveWeights {
  const preset = STRATEGY_PRESETS.find((p) => p.id === id);
  return preset?.weights ?? { yield: 1, performance: 1, reliability: 1, decentralization: 1 };
}
