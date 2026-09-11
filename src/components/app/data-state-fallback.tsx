import { Card, CardContent } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

/**
 * Renders a consistent loading / error state wherever validator data hasn't
 * resolved yet. Used so an RPC failure (live mode) or a slow demo-data load
 * shows the person something actionable instead of an infinite spinner or a
 * blank page.
 */
export function DataStateFallback({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <Card className="border-sm-danger/40 bg-sm-danger/5">
        <CardContent className="flex flex-col items-start gap-3 py-6">
          <div>
            <div className="text-sm font-medium text-sm-danger">Couldn&apos;t load validator data</div>
            <p className="mt-1 text-sm text-sm-text-muted">{error}</p>
            <p className="mt-1 text-xs text-sm-text-faint">
              If you&apos;re in live mode, this usually means the configured RPC endpoint is unreachable or
              rate-limiting requests. Switch to demo mode (the default) to continue exploring without an RPC
              dependency.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <div className="text-sm text-sm-text-muted">{loading ? "Loading validator data…" : "No validator data available."}</div>;
}
