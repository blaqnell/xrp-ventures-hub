import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, FieldError } from "@/components/auth/AuthParts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password | XRP Ventures" },
      { name: "description", content: "Request a secure password recovery link for your XRP Ventures account." },
      { property: "og:title", content: "Reset your password | XRP Ventures" },
      { property: "og:description", content: "Request a secure password recovery link." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const email = z.string().trim().email().safeParse(new FormData(e.currentTarget).get("email"));
    if (!email.success) return setErr("Enter a valid email address.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error && /rate/i.test(error.message)) return setErr("Too many requests. Please wait a few minutes and try again.");
    // Always show the same message — never reveal whether the email is registered.
    setDone(true);
  }
  return (
    <AuthShell title="Forgot your password?" subtitle="We'll email you a secure link to set a new one." footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}>
      {done ? (
        <p className="text-sm text-muted-foreground" role="status">If an account exists for that email, a recovery link is on its way. The link expires after a short time.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" className="mt-1.5" /></div>
          <FieldError>{err}</FieldError>
          <Button className="w-full" disabled={busy}>{busy ? "Sending…" : "Send recovery link"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
