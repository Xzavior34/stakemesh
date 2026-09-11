"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getValidatorDataProvider } from "@/lib/data";
import type { ValidatorDataSnapshot } from "@/lib/types";

interface DataState {
  snapshot: ValidatorDataSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const DataContext = createContext<DataState>({
  snapshot: null,
  loading: true,
  error: null,
  refresh: () => {},
});

export function ValidatorDataProviderContext({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<ValidatorDataSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Kicking off an async fetch from an external system (the validator data
    // provider) on mount/dependency change — the loading/error resets here
    // are part of that fetch lifecycle, not derived UI state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    // getValidatorDataProvider() itself can throw synchronously (e.g. live
    // mode selected without NEXT_PUBLIC_SOLANA_RPC_URL configured) rather
    // than rejecting a promise, so it has to be inside this try/catch too —
    // otherwise a misconfigured live mode would throw an uncaught exception
    // out of the effect instead of surfacing as a normal error state.
    try {
      getValidatorDataProvider()
        .getSnapshot()
        .then((snap) => {
          if (!cancelled) {
            setSnapshot(snap);
            setLoading(false);
          }
        })
        .catch((err: Error) => {
          if (!cancelled) {
            setError(err.message);
            setLoading(false);
          }
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize the validator data provider.");
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <DataContext.Provider value={{ snapshot, loading, error, refresh: () => setTick((t) => t + 1) }}>
      {children}
    </DataContext.Provider>
  );
}

export function useValidatorData() {
  return useContext(DataContext);
}
