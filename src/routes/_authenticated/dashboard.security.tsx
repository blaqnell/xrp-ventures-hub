import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTitle } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/security")({
  head: () => ({ meta: [{ title: "Security Settings | XRP Ventures" }] }),
  component: Security,
});

function Security() {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["mfa"],
    queryFn: async () => {
      const [{ data: f, error }, { data: aal }] = await Promise.all([supabase.auth.mfa.listFactors(), supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);
      if (error) throw error;
      return { factors: f.totp.filter((x) => x.status === "verified"), level: aal?.currentLevel ?? "aal1" };
    },
  });
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    // remove abandoned unverified factors so a new one can be created
    const { data: f } = await supabase.auth.mfa.listFactors();
    for (const x of f?.all ?? []) if (x.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: x.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(e: FormEvent, factorId: string) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) { toast.error("That code didn't work. Check your authenticator app and try again."); return; }
    toast.success("Two-step verification is on for this session");
    setEnroll(null);
    setCode("");
    qc.invalidateQueries();
  }

  async function remove(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) { toast.error(error.message); return; }
    toast.success("Authenticator removed");
    qc.invalidateQueries({ queryKey: ["mfa"] });
  }

  const s = status.data;
  return (
    <>
      <PageTitle title="Security Settings" description="Two-step verification with an authenticator app. Required for admin actions." />
      <div className="max-w-xl rounded-2xl border bg-card p-5 shadow-card">
        {!s ? <p className="text-sm text-muted-foreground">Loading…</p> : s.factors.length > 0 ? (
          <>
            <p className="text-sm">Two-step verification is <span className="font-medium text-success">on</span>.</p>
            <p className="mt-1 text-xs text-muted-foreground">This session is {s.level === "aal2" ? "verified" : "not verified yet"}.</p>
            {s.level !== "aal2" && (
              <form onSubmit={(e) => verify(e, s.factors[0]!.id)} className="mt-4 flex gap-2">
                <Input aria-label="6-digit code" inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
                <Button type="submit" disabled={busy || code.trim().length !== 6}>Verify</Button>
              </form>
            )}
            <ul className="mt-4 divide-y border-t">
              {s.factors.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>Authenticator app</span>
                  <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>Remove</Button>
                </li>
              ))}
            </ul>
          </>
        ) : enroll ? (
          <form onSubmit={(e) => verify(e, enroll.id)} className="space-y-4">
            <p className="text-sm">Scan this code with Google Authenticator, 1Password, Authy or similar.</p>
            <img src={enroll.qr} alt="Authenticator QR code" className="h-44 w-44 rounded-lg bg-foreground p-2" />
            <p className="break-all text-xs text-muted-foreground">Or enter this key: <span className="font-mono text-foreground">{enroll.secret}</span></p>
            <div>
              <Label htmlFor="code">6-digit code</Label>
              <Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="mt-1.5" />
            </div>
            <Button type="submit" disabled={busy || code.trim().length !== 6}>Turn on</Button>
          </form>
        ) : (
          <>
            <p className="text-sm">Two-step verification is <span className="font-medium">off</span>.</p>
            <Button className="mt-4" onClick={start} disabled={busy}>Set up authenticator app</Button>
          </>
        )}
      </div>
    </>
  );
}
