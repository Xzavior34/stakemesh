"use client";

import { useMemo } from "react";
import { useValidatorData } from "./data-context";
import { useStrategy } from "./strategy-context";
import { allocate } from "@/lib/engine/allocate";
import type { AllocationResult } from "@/lib/types";

export function useAllocation(): { result: AllocationResult | null; loading: boolean; error: string | null } {
  const { snapshot, loading, error } = useValidatorData();
  const { policy } = useStrategy();

  const result = useMemo<AllocationResult | null>(() => {
    if (!snapshot) return null;
    return allocate(policy, snapshot.validators, snapshot.epochLabel);
  }, [snapshot, policy]);

  return { result, loading, error };
}
