"use client";

import { Card, CardContent, CardHeader, CardTitle, Badge, StatusDot } from "@/components/ui/primitives";
import { useHistory, type HistoryEventKind } from "@/components/app/history-context";

const KIND_TONE: Record<HistoryEventKind, "neutral" | "good" | "warn" | "danger" | "accent"> = {
  "strategy-updated": "accent",
  "rebalance-recommended": "warn",
  "policy-violation": "danger",
};

const KIND_LABEL: Record<HistoryEventKind, string> = {
  "strategy-updated": "Strategy updated",
  "rebalance-recommended": "Rebalance recommended",
  "policy-violation": "Policy violation",
};

export default function HistoryPage() {
  const { events } = useHistory();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-sm-text">History</h1>
        <p className="mt-1 text-sm text-sm-text-muted">
          A session-scoped audit log of strategy changes and rebalance recommendations. This resets on reload — a
          production deployment would persist this server-side per wallet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {events.length === 0 && (
            <p className="text-sm text-sm-text-faint">
              Nothing recorded yet — change your strategy or trigger a rebalance simulation to see activity here.
            </p>
          )}
          {events.map((e) => (
            <div key={e.id} className="flex items-start gap-3 border-b border-sm-border/60 pb-3 last:border-none last:pb-0">
              <StatusDot tone={KIND_TONE[e.kind]} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={KIND_TONE[e.kind]}>{KIND_LABEL[e.kind]}</Badge>
                  <span className="text-sm font-medium text-sm-text">{e.title}</span>
                </div>
                <p className="mt-1 text-sm text-sm-text-muted">{e.detail}</p>
                <p className="mt-0.5 text-xs text-sm-text-faint">
                  {e.epochLabel} · {new Date(e.at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
