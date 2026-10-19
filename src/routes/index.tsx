import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Eye, LineChart, Lock, ShieldCheck, Wallet } from "lucide-react";
import { PublicShell } from "@/components/site/PublicShell";
import { QuotePanel } from "@/components/market/QuotePanel";
import { PriceChart } from "@/components/market/PriceChart";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { quoteQuery } from "@/lib/market.functions";
import { FAQS } from "@/lib/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "XRP Ventures — Your Digital Assets. A Clearer Perspective." },
      { name: "description", content: "Live XRP/USD market data, interactive charts and private portfolio tracking. A tracking-only platform: no deposits, trading or custody." },
      { property: "og:title", content: "XRP Ventures — Your Digital Assets. A Clearer Perspective." },
      { property: "og:description", content: "Live XRP market data and private, user-reported portfolio tracking." },
    ],
  }),
  loader: ({ context }) => context.queryClient.prefetchQuery(quoteQuery()),
  component: Home,
});

const FEATURES = [
  { icon: LineChart, title: "Live XRP market data", body: "Price, 24h range, volume and market cap from CoinGecko, with source and timestamp on every figure." },
  { icon: Wallet, title: "Private portfolio tracking", body: "Record XRP holdings and cost basis. Entries are labeled user-reported — never presented as verified balances." },
  { icon: BarChart3, title: "Honest performance", body: "Unrealized P/L only when you supply a cost basis. Market moves are kept separate from your inputs." },
  { icon: Eye, title: "Watchlist & alerts", body: "Keep XRP on your watchlist and receive in-app notifications for support and security events." },
  { icon: ShieldCheck, title: "Security by default", body: "Row-level data isolation, optional two-factor authentication and audit logs for every admin action." },
  { icon: Lock, title: "You control sharing", body: "Leaderboard participation is opt-in and pseudonymous. Emails and account details are never public." },
];

const STEPS = [
  ["Create an account", "Sign up with email, Google or Apple and verify your address."],
  ["Add your holdings", "Enter XRP quantities, dates and cost basis you already know. Nothing is moved or held."],
  ["Follow the market", "See estimated value against live prices, with clear stale-data warnings when the feed lags."],
  ["Review & export", "Filter your tracking history by date and export your own records as CSV."],
];

function Home() {
  return (
    <PublicShell>
      <section className="bg-hero relative overflow-hidden border-b">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Tracking-only platform · No custody · No trading
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Your Digital Assets.
              <br />
              <span className="text-primary">A Clearer Perspective.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Follow the XRP market in real time and track the holdings you already own — privately, precisely and without handing anything over.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/signup">Create Account</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/markets">Explore Markets</Link></Button>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <QuotePanel />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <PriceChart height={320} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight">Built for clarity, not speculation</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Everything you see is either real market data, your own records, or clearly labeled as a demo.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-card">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {STEPS.map(([t, b], i) => (
              <li key={t}>
                <span className="tabular text-sm font-medium text-primary">0{i + 1}</span>
                <h3 className="mt-2 font-medium">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Security & privacy</h2>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li>• Passwords are handled by our authentication provider and never stored in our application tables.</li>
            <li>• Database policies isolate every user's portfolio, settings and conversations.</li>
            <li>• Optional authenticator-app two-factor authentication; required for administrators.</li>
            <li>• Sensitive administrator actions are recorded in an append-only audit log.</li>
          </ul>
          <Button asChild variant="link" className="mt-4 px-0"><Link to="/security">Read our security practices →</Link></Button>
        </div>
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-6">
          <h3 className="font-medium text-warning">Know the risks</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            XRP is a volatile digital asset. Its price can fall sharply and historical prices do not guarantee future returns. XRP Ventures does not provide investment advice, is not a licensed financial institution and does not hold your assets.
          </p>
          <Button asChild variant="link" className="mt-2 px-0"><Link to="/risk-disclosure">Risk disclosure →</Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-6">
          {FAQS.slice(0, 5).map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link to="/faq">All FAQs</Link></Button>
          <Button asChild variant="outline"><Link to="/contact">Contact support</Link></Button>
        </div>
      </section>
    </PublicShell>
  );
}
