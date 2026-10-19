import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell, PageHero } from "@/components/site/PublicShell";
import { supabase } from "@/integrations/supabase/client";
import { formatXrp } from "@/lib/finance";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard | XRP Ventures" },
      { name: "description", content: "Opt-in, pseudonymous leaderboard of user-reported XRP tracking. No emails, wallets or fabricated returns." },
      { property: "og:title", content: "XRP Ventures Leaderboard" },
      { property: "og:description", content: "Pseudonymous, opt-in leaderboard of user-reported XRP holdings." },
    ],
  }),
  component: Leaderboard,
});

const EXAMPLES = [
  { pseudonym: "Example_Harbor", tracked: "12500" },
  { pseudonym: "Example_Ledger", tracked: "8200" },
];

function Leaderboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard");
      if (error) throw error;
      return data;
    },
  });
  return (
    <PublicShell>
      <PageHero eyebrow="Community" title="Leaderboard" intro="Ranked by user-reported XRP quantity for all time. We do not rank by returns because we cannot verify them." />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground">
          Figures are <strong className="text-foreground">user-reported and unverified</strong>. Participants opt in and choose a pseudonym and whether to show their quantity. Demo holdings are excluded.
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted-foreground">
              <tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Pseudonym</th><th className="px-4 py-3">Period</th><th className="px-4 py-3 text-right">Tracked XRP</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4} className="p-4"><Skeleton className="h-8" /></td></tr>}
              {isError && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Leaderboard unavailable right now.</td></tr>}
              {data?.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No participants yet. Opt in from your profile settings.</td></tr>}
              {data?.map((r) => (
                <tr key={r.pseudonym} className="border-t">
                  <td className="tabular px-4 py-3">#{r.rank}</td>
                  <td className="px-4 py-3 font-medium">{r.pseudonym}</td>
                  <td className="px-4 py-3 text-muted-foreground">All time</td>
                  <td className="tabular px-4 py-3 text-right">{r.shows_value ? formatXrp(r.tracked_xrp) : <span className="text-muted-foreground">Hidden</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="mt-10 text-sm font-medium text-muted-foreground">Illustrative example rows (not real people)</h2>
        <div className="mt-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          {EXAMPLES.map((e) => (
            <div key={e.pseudonym} className="flex justify-between py-1"><span>{e.pseudonym} <span className="ml-2 rounded bg-muted px-1.5 text-[10px] uppercase">Example</span></span><span className="tabular">{formatXrp(e.tracked)} XRP</span></div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Want to join? <Link to="/dashboard/profile" className="text-primary underline-offset-4 hover:underline">Manage leaderboard preferences</Link>.</p>
      </div>
    </PublicShell>
  );
}
