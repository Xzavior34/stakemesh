import { Badge } from "./primitives";
import type { DataSourceKind } from "@/lib/types";

export function DataSourceIndicator({ source }: { source: DataSourceKind }) {
  if (source === "live") {
    return (
      <Badge tone="good">
        <span className="h-1.5 w-1.5 rounded-full bg-sm-good animate-pulse" />
        Live Solana data
      </Badge>
    );
  }
  return (
    <Badge tone="warn">
      <span className="h-1.5 w-1.5 rounded-full bg-sm-warn" />
      Demo dataset
    </Badge>
  );
}
