import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="xv-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-chart-2)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="var(--color-surface)" stroke="url(#xv-g)" strokeOpacity="0.6" />
      <path d="M10 12 L20 28 L30 12" fill="none" stroke="url(#xv-g)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="12" r="2.4" fill="var(--color-primary)" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md" aria-label="XRP Ventures home">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">
        XRP <span className="text-muted-foreground font-normal">Ventures</span>
      </span>
    </Link>
  );
}
