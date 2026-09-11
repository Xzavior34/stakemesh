import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="border-b border-sm-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={22} />
          <Wordmark className="text-lg" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-sm-text-muted md:flex">
          <Link href="/docs" className="hover:text-sm-text">
            Docs
          </Link>
          <Link href="/about" className="hover:text-sm-text">
            About
          </Link>
          <a href="https://github.com/stakemesh/stakemesh" className="hover:text-sm-text">
            GitHub
          </a>
        </nav>
        <Link href="/app/overview">
          <Button size="sm">Open StakeMesh</Button>
        </Link>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-sm-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-sm-text-faint sm:flex-row">
        <span>StakeMesh — open-source Solana stake allocation infrastructure.</span>
        <div className="flex gap-4">
          <Link href="/docs/security" className="hover:text-sm-text-muted">
            Security
          </Link>
          <Link href="/about" className="hover:text-sm-text-muted">
            About
          </Link>
          <a href="https://github.com/stakemesh/stakemesh" className="hover:text-sm-text-muted">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

export function ProseShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sm-bg text-sm-text">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-6 py-14">{children}</main>
      <MarketingFooter />
    </div>
  );
}
