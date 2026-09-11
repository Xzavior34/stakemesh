"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { HardConstraints, ObjectiveWeights, OptimizationPreference, StrategyPolicy } from "@/lib/types";
import { getPreset } from "@/lib/engine/presets";
import { useHistory } from "./history-context";

interface StrategyState {
  policy: StrategyPolicy;
  presetId: string;
  setPresetId: (id: string) => void;
  setStakeAmountSol: (sol: number) => void;
  setTargetValidatorCount: (n: number) => void;
  setConstraints: (c: HardConstraints) => void;
  setWeights: (w: ObjectiveWeights) => void;
  setPreference: (p: OptimizationPreference) => void;
}

const balanced = getPreset("balanced")!;

const initialPolicy: StrategyPolicy = {
  id: "balanced",
  name: "Balanced",
  stakeAmountLamports: 10_000_000_000n, // 10 SOL
  targetValidatorCount: balanced.targetValidatorCount,
  constraints: balanced.constraints,
  weights: balanced.weights,
  preference: balanced.preference,
};

const StrategyContext = createContext<StrategyState | null>(null);

export function StrategyProvider({ children }: { children: React.ReactNode }) {
  const [policy, setPolicy] = useState<StrategyPolicy>(initialPolicy);
  const [presetId, setPresetIdState] = useState("balanced");
  const { log } = useHistory();

  const value = useMemo<StrategyState>(
    () => ({
      policy,
      presetId,
      setPresetId: (id: string) => {
        const preset = getPreset(id);
        if (!preset) return;
        setPresetIdState(id);
        setPolicy((prev) => ({
          ...prev,
          id,
          name: preset.label,
          targetValidatorCount: preset.targetValidatorCount,
          constraints: preset.constraints,
          weights: preset.weights,
          preference: preset.preference,
        }));
        log({
          epochLabel: "session",
          kind: "strategy-updated",
          title: "Strategy preset changed",
          detail: `Switched to the "${preset.label}" preset.`,
        });
      },
      setStakeAmountSol: (sol: number) =>
        setPolicy((prev) => ({ ...prev, stakeAmountLamports: BigInt(Math.max(0, Math.round(sol * 1_000_000_000))) })),
      setTargetValidatorCount: (n: number) =>
        setPolicy((prev) => ({ ...prev, targetValidatorCount: Math.max(1, Math.round(n)) })),
      setConstraints: (c: HardConstraints) => {
        setPolicy((prev) => {
          const changedKeys = (Object.keys(c) as (keyof HardConstraints)[]).filter((k) => prev.constraints[k] !== c[k]);
          if (changedKeys.length > 0) {
            log({
              epochLabel: "session",
              kind: "strategy-updated",
              title: "Constraint updated",
              detail: `Changed: ${changedKeys.join(", ")}.`,
            });
          }
          return { ...prev, constraints: c };
        });
      },
      setWeights: (w: ObjectiveWeights) => setPolicy((prev) => ({ ...prev, weights: w })),
      setPreference: (p: OptimizationPreference) => setPolicy((prev) => ({ ...prev, preference: p })),
    }),
    [policy, presetId, log]
  );

  return <StrategyContext.Provider value={value}>{children}</StrategyContext.Provider>;
}

export function useStrategy() {
  const ctx = useContext(StrategyContext);
  if (!ctx) throw new Error("useStrategy must be used within StrategyProvider");
  return ctx;
}
