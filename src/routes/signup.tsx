import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Divider, FieldError, OAuthButtons, PasswordInput } from "@/components/auth/AuthParts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account | XRP Ventures" },
      { name: "description", content: "Create a free XRP Ventures account to track XRP holdings privately." },
      { property: "og:title", content: "Create your XRP Ventures account" },
      { property: "og:description", content: "Private XRP portfolio tracking. No deposits or custody." },
    ],
  }),
  component: Signup,
});

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

const schema = z.object({
  displayName: z.string().trim().min(1, "Enter a display name").max(60),
  email: z.string().trim().email("Enter a valid email").max(254),
  password: passwordSchema,
  terms: z.literal(true, { errorMap: () => ({ message: "Please accept the terms and risk disclosure" }) }),
});

function Signup() {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ displayName: fd.get("displayName"), email: fd.get("email"), password: fd.get("password"), terms });
    if (!parsed.success) return setErr(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { display_name: parsed.data.displayName } },
    });
    setBusy(false);
    if (error) {
      if (/pwned|breach|weak/i.test(error.message)) return setErr("This password has appeared in a data breach. Please choose a different one.");
      if (/rate/i.test(error.message)) return setErr("Too many attempts. Please wait a few minutes.");
      return setErr("We couldn't create the account. Please check your details and try again.");
    }
    // Same response whether or not the email already exists (no enumeration).
    setSent(parsed.data.email);
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle={`If ${sent} can be registered, we've sent a verification link. Click it to activate your account.`} footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}>
        <MailCheck className="h-10 w-10 text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Didn't get it? Check spam, or wait a minute and sign up again to resend.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Start tracking — your portfolio begins empty." footer={<>Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>}>
      <OAuthButtons label="Sign up" />
      <Divider />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div><Label htmlFor="displayName">Display name</Label><Input id="displayName" name="displayName" autoComplete="nickname" maxLength={60} className="mt-1.5" /></div>
        <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" className="mt-1.5" /></div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="mt-1.5"><PasswordInput id="password" name="password" autoComplete="new-password" /></div>
          <p className="mt-1.5 text-xs text-muted-foreground">10+ characters with upper- and lowercase letters and a number.</p>
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} className="mt-0.5" />
          <span>I agree to the <Link to="/terms" className="text-primary hover:underline">Terms</Link>, <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link to="/risk-disclosure" className="text-primary hover:underline">Risk Disclosure</Link>, and understand XRP Ventures is tracking-only.</span>
        </label>
        <FieldError>{err}</FieldError>
        <Button className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
      </form>
    </AuthShell>
  );
}
