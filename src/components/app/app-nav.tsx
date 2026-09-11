"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark, Wordmark } from "@/components/ui/logo";
import { WalletConnectButton } from "./wallet-connect-button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/app/overview", label: "Overview" },
  { href: "/app/validators", label: "Validators" },
  { href: "/app/strategy", label: "Strategy" },
  { href: "/app/allocation", label: "Allocation" },
  { href: "/app/rebalancing", label: "Rebalancing" },
  { href: "/app/stake-accounts", label: "Stake Accounts" },
  { href: "/app/history", label: "History" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-sm-border bg-sm-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-4 py-3 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-sm-text">
          <LogoMark size={22} />
          <Wordmark className="text-base" />
        </Link>
        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex" aria-label="Dashboard">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                  active ? "bg-sm-surface text-sm-text" : "text-sm-text-muted hover:text-sm-text hover:bg-sm-surface"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto shrink-0">
          <WalletConnectButton />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-sm-border px-4 py-2 lg:hidden" aria-label="Dashboard">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                active ? "bg-sm-surface text-sm-text" : "text-sm-text-muted"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
