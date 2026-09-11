export function LogoMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="StakeMesh"
    >
      <line x1="7" y1="8" x2="16" y2="16" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.4" />
      <line x1="25" y1="9" x2="16" y2="16" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.4" />
      <line x1="6" y1="23" x2="16" y2="16" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.4" />
      <line x1="24" y1="24" x2="16" y2="16" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.4" />
      <line x1="7" y1="8" x2="6" y2="23" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.1" />
      <line x1="25" y1="9" x2="24" y2="24" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.1" />
      <circle cx="16" cy="16" r="4" fill="var(--sm-accent)" />
      <circle cx="7" cy="8" r="2.4" fill="currentColor" />
      <circle cx="25" cy="9" r="2.4" fill="currentColor" />
      <circle cx="6" cy="23" r="2.4" fill="currentColor" />
      <circle cx="24" cy="24" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-display font-semibold tracking-tight">Stake</span>
      <span className="font-display font-semibold tracking-tight text-sm-accent">Mesh</span>
    </span>
  );
}
