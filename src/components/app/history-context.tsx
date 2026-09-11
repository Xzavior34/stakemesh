"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type HistoryEventKind = "strategy-updated" | "rebalance-recommended" | "policy-violation";

export interface HistoryEvent {
  id: string;
  at: string; // ISO timestamp
  epochLabel: string;
  kind: HistoryEventKind;
  title: string;
  detail: string;
}

interface HistoryState {
  events: HistoryEvent[];
  log: (e: Omit<HistoryEvent, "id" | "at">) => void;
}

const HistoryContext = createContext<HistoryState>({ events: [], log: () => {} });

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);

  const log = useCallback((e: Omit<HistoryEvent, "id" | "at">) => {
    setEvents((prev) => {
      // Avoid flooding the log with duplicates of the same title in a row
      // (e.g. rapid slider drags), which is what a real audit trail would
      // also want to collapse.
      if (prev[0]?.title === e.title && prev[0]?.detail === e.detail) return prev;
      return [{ ...e, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: new Date().toISOString() }, ...prev].slice(0, 200);
    });
  }, []);

  return <HistoryContext.Provider value={{ events, log }}>{children}</HistoryContext.Provider>;
}

export function useHistory() {
  return useContext(HistoryContext);
}
