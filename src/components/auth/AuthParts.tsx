import { useState, type ReactNode, forwardRef, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="bg-hero flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8"><Logo /></div>
      <main id="main" className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-card">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </main>
      {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
      <p className="mt-8 max-w-md text-center text-xs text-muted-foreground">Tracking only. XRP Ventures never asks for wallet keys or seed phrases.</p>
    </div>
  );
}

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={show ? "text" : "password"} {...props} className="pr-10" />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

export function OAuthButtons({ label = "Continue" }: { label?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  async function go(provider: "google" | "apple") {
    setBusy(provider);
    const res = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth/callback` });
    if (res.error) {
      toast.error(`${provider === "google" ? "Google" : "Apple"} sign-in failed. Please try again or use email.`);
      setBusy(null);
      return;
    }
    if (res.redirected) return;
    window.location.assign("/auth/callback");
  }
  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" onClick={() => go("google")} disabled={!!busy}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.4-1.66 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.78 3.97 14.7 3 12.18 3 7.13 3 3.05 7.08 3.05 12.32s4.08 9.32 9.13 9.32c5.27 0 8.77-3.7 8.77-8.92 0-.6-.07-1.06-.15-1.52z"/></svg>
        {label} with Google
      </Button>
      <Button type="button" variant="outline" onClick={() => go("apple")} disabled={!!busy}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M16.37 12.6c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84s2.01.84 3.39.81c1.4-.02 2.29-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.74-4.12zM13.8 4.95c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.09 3.18 1.15.09 2.32-.58 3.04-1.45z"/></svg>
        {label} with Apple
      </Button>
    </div>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="mt-1.5 text-xs text-destructive">{children}</p>;
}
