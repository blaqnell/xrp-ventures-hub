import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldError, PasswordInput } from "@/components/auth/AuthParts";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { passwordSchema } from "./signup";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password | XRP Ventures" },
      { name: "description", content: "Choose a new password for your XRP Ventures account." },
      { property: "og:title", content: "Set a new password | XRP Ventures" },
      { property: "og:description", content: "Securely choose a new password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery") || window.location.search.includes("code=");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady("ok");
    });
    const t = setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setReady((r) => (r === "ok" ? r : s.session && isRecovery ? "ok" : "invalid"));
    }, 1200);
    return () => { data.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("password") ?? "");
    if (pw !== fd.get("confirm")) return setErr("Passwords don't match.");
    const p = passwordSchema.safeParse(pw);
    if (!p.success) return setErr(p.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(/pwned|breach/i.test(error.message) ? "This password has appeared in a data breach. Choose another." : "Couldn't update your password. The link may have expired — request a new one.");
    await supabase.rpc("log_security_event", { _event: "password_changed", _user_agent: navigator.userAgent });
    await supabase.auth.signOut({ scope: "others" });
    navigate({ to: "/dashboard", replace: true });
  }

  if (ready === "checking") return <AuthShell title="Verifying link…"><p className="text-sm text-muted-foreground">One moment.</p></AuthShell>;
  if (ready === "invalid")
    return (
      <AuthShell title="Link invalid or expired" subtitle="Recovery links can be used once and expire quickly.">
        <Button asChild className="w-full"><Link to="/forgot-password">Request a new link</Link></Button>
      </AuthShell>
    );
  return (
    <AuthShell title="Set a new password" subtitle="Other sessions will be signed out after you change it.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div><Label htmlFor="password">New password</Label><div className="mt-1.5"><PasswordInput id="password" name="password" autoComplete="new-password" /></div></div>
        <div><Label htmlFor="confirm">Confirm password</Label><div className="mt-1.5"><PasswordInput id="confirm" name="confirm" autoComplete="new-password" /></div></div>
        <FieldError>{err}</FieldError>
        <Button className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
      </form>
    </AuthShell>
  );
}
