import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-sm-border bg-sm-surface", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-4 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-medium text-sm-text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

type BadgeTone = "neutral" | "good" | "warn" | "danger" | "accent";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-sm-bg-elevated text-sm-text-muted border-sm-border",
  good: "bg-sm-good/10 text-sm-good border-sm-good/30",
  warn: "bg-sm-warn/10 text-sm-warn border-sm-warn/30",
  danger: "bg-sm-danger/10 text-sm-danger border-sm-danger/30",
  accent: "bg-sm-accent/10 text-sm-accent border-sm-accent/30",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

export function StatusDot({ tone = "neutral" }: { tone?: BadgeTone }) {
  const dotClasses: Record<BadgeTone, string> = {
    neutral: "bg-sm-text-faint",
    good: "bg-sm-good",
    warn: "bg-sm-warn",
    danger: "bg-sm-danger",
    accent: "bg-sm-accent",
  };
  return <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[tone])} />;
}
