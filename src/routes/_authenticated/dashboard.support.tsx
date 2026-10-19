import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTitle, EmptyState } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/support")({
  head: () => ({ meta: [{ title: "Support | XRP Ventures" }] }),
  component: Support,
});

function Support() {
  const qc = useQueryClient();
  const tickets = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_tickets").select("id, subject, status, category, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [err, setErr] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: async (v: { subject: string; body: string }) => {
      const { error } = await supabase.rpc("create_support_ticket", { _subject: v.subject, _category: "other", _body: v.body });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Ticket opened"); qc.invalidateQueries({ queryKey: ["tickets"] }); },
    onError: (e) => setErr(e instanceof Error ? e.message : "Could not open ticket"),
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const subject = String(fd.get("subject") ?? "").trim();
    const body = String(fd.get("body") ?? "").trim();
    if (subject.length < 3 || body.length < 1) return setErr("Add a subject and a message.");
    create.mutate({ subject, body });
    e.currentTarget.reset();
  }
  return (
    <>
      <PageTitle title="Messages & Support" description="Open a ticket and our team will reply." />
      <form onSubmit={submit} className="mb-6 space-y-3 rounded-2xl border bg-card p-5">
        <Input name="subject" placeholder="Subject" maxLength={140} aria-label="Subject" />
        <Textarea name="body" placeholder="How can we help?" maxLength={4000} aria-label="Message" />
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Button disabled={create.isPending}>Open ticket</Button>
      </form>
      {tickets.data?.length === 0 ? <EmptyState title="No tickets yet" body="Your support conversations will appear here." /> : (
        <ul className="divide-y rounded-2xl border bg-card">
          {tickets.data?.map((t) => <li key={t.id} className="flex justify-between px-4 py-3 text-sm"><span>{t.subject}</span><span className="capitalize text-muted-foreground">{t.status}</span></li>)}
        </ul>
      )}
    </>
  );
}
