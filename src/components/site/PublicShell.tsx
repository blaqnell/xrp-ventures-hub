import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LivePricePill } from "@/components/market/LivePricePill";

const NAV = [
  { to: "/markets", label: "Markets" },
  { to: "/platform", label: "Platform" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/security", label: "Security" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3"><Logo /><LivePricePill /></div>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Button asChild size="sm"><Link to="/dashboard">Dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
              <Button asChild size="sm"><Link to="/signup">Create account</Link></Button>
            </>
          )}
        </div>
        <button className="rounded-md p-2 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t px-4 py-3 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2.5 text-sm">
              {n.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-2">
            {user ? (
              <Button asChild className="flex-1"><Link to="/dashboard">Dashboard</Link></Button>
            ) : (
              <>
                <Button asChild variant="outline" className="flex-1"><Link to="/login">Sign in</Link></Button>
                <Button asChild className="flex-1"><Link to="/signup">Create account</Link></Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const cols = [
    { title: "Product", links: [["/markets", "Markets"], ["/platform", "Platform"], ["/leaderboard", "Leaderboard"], ["/security", "Security"]] },
    { title: "Company", links: [["/about", "About"], ["/faq", "FAQ"], ["/contact", "Contact & complaints"]] },
    { title: "Legal", links: [["/terms", "Terms of Service"], ["/privacy", "Privacy Policy"], ["/risk-disclosure", "Risk Disclosure"], ["/cookies", "Cookie preferences"]] },
  ] as const;
  return (
    <footer className="border-t bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">Independent XRP market information and portfolio tracking. Not affiliated with Ripple Labs.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-medium">{c.title}</h4>
              <ul className="mt-3 space-y-2">
                {c.links.map(([to, l]) => (
                  <li key={to}><Link to={to} className="text-sm text-muted-foreground hover:text-foreground">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 space-y-3 border-t pt-6 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Important:</strong> XRP Ventures is a tracking and information platform only. We do not accept deposits, execute trades, hold or custody digital assets, or provide investment advice. Balances shown are user-reported or clearly labeled demo data and do not represent assets held by XRP Ventures.
          </p>
          <p>Cryptocurrency prices are highly volatile. Past performance does not guarantee future results. XRP Ventures is not a licensed broker, exchange, investment adviser or money transmitter. Market data provided by CoinGecko.</p>
          <p>© {new Date().getFullYear()} XRP Ventures. "XRP" refers to the digital asset; no affiliation with or endorsement by Ripple Labs Inc. is implied.</p>
        </div>
      </div>
    </footer>
  );
}

export function SupportWidget() {
  const { user } = useAuth();
  return (
    <Link
      to={user ? "/dashboard/support" : "/contact"}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-card transition-transform hover:scale-[1.03]"
      aria-label="Open support"
    >
      <MessageCircle className="h-4 w-4" /> Support
    </Link>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
      <SupportWidget />
    </div>
  );
}

export function PageHero({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <section className="bg-hero border-b">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        {eyebrow && <p className="text-sm font-medium text-primary">{eyebrow}</p>}
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{intro}</p>}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground">
      {children}
    </div>
  );
}

export function DraftNotice() {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
      Draft document — this text has not been reviewed by a lawyer and must be reviewed by qualified legal professionals before launch.
    </div>
  );
}
