import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Divider, FieldError, OAuthButtons, PasswordInput } from "@/components/auth/AuthParts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { safeRedirectPath } from "@/lib/safe-redirect";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in | XRP Ventures" },
      { name: "description", content: "Sign in to your XRP Ventures tracking dashboard." },
      { property: "og:title", content: "Sign in | XRP Ventures" },
      { property: "og:description", content: "Access your private XRP tracking dashboard." },
    ],
  }),
  component: Login,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });

function Login() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState<{ factorId: string } | null>(null);
  const [code, setCode] = useState("");
  const dest = safeRedirectPath(redirect);

  async function finish() {
    await supabase.rpc("log_security_event", { _event: "sign_in", _user_agent: navigator.userAgent });
    navigate({ to: dest, replace: true });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) return setErr(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setBusy(false);
      if (/confirm/i.test(error.message)) return setErr("Please verify your email first — check your inbox for the confirmation link.");
      if (/rate|too many/i.test(error.message)) return setErr("Too many attempts. Please wait a few minutes and try again.");
      return setErr("Incorrect email or password.");
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const { data: f } = await supabase.auth.mfa.listFactors();
      const totp = f?.totp.find((x) => x.status === "verified");
      if (totp) {
        setMfa({ factorId: totp.id });
        setBusy(false);
        return;
      }
    }
    await finish();
  }

  async function verifyMfa(e: FormEvent) {
    e.preventDefault();
    if (!mfa) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfa.factorId, code: code.trim() });
    setBusy(false);
    if (error) return setErr("That code didn't work. Check your authenticator app and try again.");
    await finish();
  }

  if (mfa) {
    return (
      <AuthShell title="Two-factor verification" subtitle="Enter the 6-digit code from your authenticator app.">
        <form onSubmit={verifyMfa} className="space-y-4">
          <Input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} aria-label="Authentication code" autoFocus />
          <FieldError>{err}</FieldError>
          <Button className="w-full" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify"}</Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your tracking dashboard." footer={<>New to XRP Ventures? <Link to="/signup" className="text-primary hover:underline">Create an account</Link></>}>
      <OAuthButtons />
      <Divider />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="mt-1.5" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="mt-1.5"><PasswordInput id="password" name="password" autoComplete="current-password" required /></div>
        </div>
        <FieldError>{err}</FieldError>
        <Button className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
    </AuthShell>
  );
}
