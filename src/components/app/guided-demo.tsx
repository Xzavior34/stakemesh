"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/primitives";

const STEPS: { label: string; href: string }[] = [
  { label: "Set a stake amount", href: "/app/strategy" },
  { label: "Choose a strategy preset", href: "/app/strategy" },
  { label: "Review eligible validators", href: "/app/validators" },
  { label: "See the computed allocation", href: "/app/allocation" },
  { label: "Inspect why each validator was picked", href: "/app/allocation" },
  { label: "Check ASN / datacenter concentration", href: "/app/allocation" },
  { label: "Simulate a validator degradation", href: "/app/rebalancing" },
  { label: "Review the rebalance recommendation", href: "/app/rebalancing" },
  { label: "Inspect exactly why it was recommended", href: "/app/rebalancing" },
];

export function GuidedDemo() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Card className="border-sm-accent/30 bg-sm-accent/5">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-sm-text">Guided technical walkthrough</div>
            <p className="mt-1 text-xs text-sm-text-muted">
              A reviewer path through every piece of the allocation and rebalancing engine, using clearly-labeled
              demo data.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-xs text-sm-text-faint hover:text-sm-text-muted"
            aria-label="Dismiss guided walkthrough"
          >
            Dismiss
          </button>
        </div>
        <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.label}>
              <Link href={step.href} className="text-sm-text-muted hover:text-sm-accent">
                <span className="tabular-nums text-sm-text-faint">{i + 1}.</span> {step.label}
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
