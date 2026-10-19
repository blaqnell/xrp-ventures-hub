import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Eye, LayoutDashboard, LineChart, LogOut, Menu, MessageSquare, PieChart, Receipt, Shield, ShieldCheck, TrendingUp, User, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAuth, useRoles } from "@/hooks/use-auth";
import { signOutEverywhere, unreadCountQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: typeof Bell; exact?: boolean };

export const USER_NAV: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/dashboard/markets", label: "Markets", icon: LineChart },
  { to: "/dashboard/performance", label: "Performance", icon: TrendingUp },
  { to: "/dashboard/transactions", label: "Transactions", icon: Receipt },
  { to: "/dashboard/watchlist", label: "Watchlist", icon: Eye },
  { to: "/dashboard/support", label: "Messages & Support", icon: MessageSquare },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/security", label: "Security Settings", icon: Shield },
  { to: "/dashboard/profile", label: "Profile Settings", icon: User },
];

export function AppShell({ nav, title, children }: { nav: NavItem[]; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { isStaff } = useRoles();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const unread = useQuery({ ...unreadCountQuery(user?.id ?? ""), enabled: !!user });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  async function logout() {
    await signOutEverywhere(qc);
    navigate({ to: "/login", replace: true });
  }

  const side = (
    <nav aria-label={title} className="flex h-full flex-col gap-1 p-3">
      <div className="px-2 py-3"><Logo /></div>
      <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      {nav.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          activeOptions={{ exact: n.exact ?? false }}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          activeProps={{ className: "bg-sidebar-accent text-foreground" }}
        >
          <n.icon className="h-4 w-4" />
          <span className="flex-1">{n.label}</span>
          {n.to === "/dashboard/notifications" && (unread.data ?? 0) > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground" aria-label={`${unread.data} unread`}>{unread.data}</span>
          )}
        </Link>
      ))}
      <div className="mt-auto space-y-1 border-t pt-3">
        {isStaff && title !== "Admin" && (
          <Link to="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><ShieldCheck className="h-4 w-4" /> Admin console</Link>
        )}
        {title === "Admin" && (
          <Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><LayoutDashboard className="h-4 w-4" /> User dashboard</Link>
        )}
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><LogOut className="h-4 w-4" /> Logout</button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-sidebar lg:block">{side}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-background/70" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 border-r bg-sidebar">{side}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:px-8">
          <button className="rounded-md p-2 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[11px] text-warning">Tracking only · no real funds held</span>
          <span className="hidden truncate text-sm text-muted-foreground sm:block">{user?.email}</span>
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "up" | "down" }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`tabular mt-2 text-2xl font-semibold tracking-tight ${tone === "up" ? "text-success" : tone === "down" ? "text-destructive" : ""}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <h3 className="font-medium">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
