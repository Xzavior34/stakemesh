import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sm-bg px-6 text-center text-sm-text">
      <LogoMark size={32} />
      <h1 className="font-display text-xl font-semibold">Page not found</h1>
      <p className="max-w-md text-sm text-sm-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="flex gap-2">
        <Link href="/">
          <Button variant="secondary">Back to home</Button>
        </Link>
        <Link href="/app/overview">
          <Button>Open StakeMesh</Button>
        </Link>
      </div>
    </div>
  );
}
