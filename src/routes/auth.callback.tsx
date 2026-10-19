import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthParts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in | XRP Ventures" },
      { name: "description", content: "Completing sign-in to XRP Ventures." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Signing you in | XRP Ventures" },
      { property: "og:description", content: "Completing sign-in." },
    ],
  }),
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let done = false;
    const go = async () => {
      if (done) return;
      done = true;
      await supabase.rpc("log_security_event", { _event: "sign_in", _user_agent: navigator.userAgent });
      navigate({ to: "/dashboard", replace: true });
    };
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) go(); });
    supabase.auth.getSession().then(({ data: d }) => { if (d.session) go(); });
    const t = setTimeout(() => { if (!done) setFailed(true); }, 6000);
    return () => { data.subscription.unsubscribe(); clearTimeout(t); };
  }, [navigate]);
  if (failed)
    return (
      <AuthShell title="We couldn't complete sign-in" subtitle="The link may have expired or already been used.">
        <Button asChild className="w-full"><Link to="/login">Back to sign in</Link></Button>
      </AuthShell>
    );
  return <AuthShell title="Signing you in…"><p className="text-sm text-muted-foreground">Verifying your session.</p></AuthShell>;
}
