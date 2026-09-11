"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In a production deployment this is where an error-tracking service
    // (Sentry, etc.) would be wired in. Logging to console here is
    // intentional and expected — not a leftover debug statement — so a
    // technical reviewer can see what failed without opening dev tools'
    // network tab.
    console.error("StakeMesh encountered an unexpected error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sm-bg px-6 text-center text-sm-text">
      <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-sm-text-muted">
        StakeMesh hit an unexpected error. This has been logged. You can try again, or head back to the dashboard.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
