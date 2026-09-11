"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function AppSectionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("StakeMesh dashboard error:", error);
  }, [error]);

  return (
    <Card className="border-sm-danger/40 bg-sm-danger/5">
      <CardContent className="flex flex-col items-start gap-3 py-6">
        <div>
          <div className="text-sm font-medium text-sm-danger">This page hit an unexpected error</div>
          <p className="mt-1 text-sm text-sm-text-muted">
            {error.message || "Something went wrong loading this section."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
          <Link href="/app/overview">
            <Button size="sm" variant="secondary">
              Back to overview
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
