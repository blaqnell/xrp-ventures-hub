import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Wallet } from "lucide-react";
import { AppShell, PageTitle, StatCard } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRoles } from "@/hooks/use-auth";
import { MAX_CREDIT_USD, parseCreditAmount } from "@/lib/ledger";
import { formatUsd } from "@/lib/finance";

const errText = (e: unknown, fallback: string) => (e && typeof e === "object" && "message" in e && typeof e.message === "string" ? e.message : fallback);

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | XRP Ventures" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin } = useRoles();
  // Access is enforced by the database: non-staff get "Forbidden".
  const m = useQuery({
    queryKey: ["admin-metrics"],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_metrics");
      if (error) throw error;
      return data as Record<string, number | string | null>;
    },
  });
  return (
    <AppShell nav={[{ to: "/admin", label: "Overview", icon: () => null } as never]} title="Admin">
      <PageTitle title="Admin console" />
      {m.error ? <p className="text-sm text-destructive">{errText(m.error, "Access denied")}{/MFA/.test(errText(m.error, "")) && <> — <a href="/dashboard/security" className="underline">set up or verify your authenticator</a>.</>}</p> : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Accounts" value={m.data?.["accounts"] ?? "—"} />
            <StatCard label="New (7 days)" value={m.data?.["new_7d"] ?? "—"} />
            <StatCard label="Open tickets" value={m.data?.["open_tickets"] ?? "—"} />
          </div>
          {isAdmin && <FundAccounts />}
        </>
      )}
    </AppShell>
  );
}

type Target = { id: string; label: string };

function FundAccounts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  const users = useQuery({
    queryKey: ["admin-users", term],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", { _search: term, _limit: 25, _offset: 0 });
      if (error) throw error;
      return data;
    },
  });

  const recent = useQuery({
    queryKey: ["ledger", "admin-recent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("account_ledger").select("id, user_id, amount_usd, memo, created_at").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });

  const credit = useMutation({
    mutationFn: async (v: { target: string; amount: string; memo: string }) => {
      const { error } = await supabase.rpc("admin_credit_account", { _target: v.target, _amount: Number(v.amount), _memo: v.memo });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(`${formatUsd(v.amount)} deposited to ${target?.label}`);
      setAmount("");
      setMemo("");
      qc.invalidateQueries({ queryKey: ["ledger"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.error(errText(e, "Deposit failed")),
  });

  const parsed = parseCreditAmount(amount);
  const nameOf = (id: string) => users.data?.find((u) => u.id === id)?.email ?? (id === user?.id ? "You" : `${id.slice(0, 8)}…`);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target || !parsed) return;
    credit.mutate({ target: target.id, amount: parsed, memo });
  }

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-5">
      <div className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-medium"><Wallet className="h-4 w-4" /> Fund an account</h2>
          {user && <Button size="sm" variant="outline" onClick={() => setTarget({ id: user.id, label: "your account" })}>Fund my account</Button>}
        </div>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setTerm(search.trim()); }}>
          <Input aria-label="Search accounts" placeholder="Search by email or name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button type="submit" variant="secondary"><Search className="h-4 w-4" /></Button>
        </form>
        {users.error && <p className="mt-3 text-sm text-destructive">{errText(users.error, "Could not load accounts")}</p>}
        <ul className="mt-3 max-h-80 divide-y overflow-y-auto">
          {users.data?.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.display_name}{u.id === user?.id && " (you)"}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Button size="sm" variant={target?.id === u.id ? "default" : "outline"} onClick={() => setTarget({ id: u.id, label: u.id === user?.id ? "your account" : (u.email ?? u.display_name) })}>
                {target?.id === u.id ? "Selected" : "Select"}
              </Button>
            </li>
          ))}
          {users.data?.length === 0 && <li className="py-3 text-sm text-muted-foreground">No accounts match.</li>}
        </ul>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="font-medium">Deposit</h2>
          <p className="mt-1 text-sm text-muted-foreground">{target ? <>To <span className="text-foreground">{target.label}</span></> : "Select an account first."}</p>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input id="amount" inputMode="decimal" placeholder="10,000.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5" />
              {amount && !parsed && <p className="mt-1 text-xs text-destructive">Enter an amount above 0 and up to {MAX_CREDIT_USD.toLocaleString("en-US")}, with at most 2 decimals.</p>}
            </div>
            <div>
              <Label htmlFor="memo">Note (optional)</Label>
              <Input id="memo" maxLength={200} value={memo} onChange={(e) => setMemo(e.target.value)} className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full" disabled={!target || !parsed || credit.isPending}>
              {credit.isPending ? "Depositing…" : parsed ? `Deposit ${formatUsd(parsed)}` : "Deposit"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Funds are issued by the system. Every deposit is permanent and recorded in the audit log.</p>
        </form>

        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="font-medium">Recent deposits</h2>
          {recent.data?.length === 0 && <p className="mt-3 text-sm text-muted-foreground">None yet.</p>}
          <ul className="mt-3 divide-y">
            {recent.data?.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">{nameOf(r.user_id)}{r.memo && <span className="text-muted-foreground"> · {r.memo}</span>}</span>
                <span className="tabular shrink-0 text-success">+{formatUsd(r.amount_usd)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
