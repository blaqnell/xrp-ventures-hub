
create policy "Participants read attachments" on storage.objects for select to authenticated
  using (bucket_id = 'support-attachments' and public.can_view_conversation(((storage.foldername(name))[1])::uuid, auth.uid()));
create policy "Participants upload attachments" on storage.objects for insert to authenticated
  with check (bucket_id = 'support-attachments'
    and public.is_participant(((storage.foldername(name))[1])::uuid, auth.uid())
    and lower(storage.extension(name)) in ('png','jpg','jpeg','pdf'));
-- snapshots: users may not insert directly (server computes price)
revoke insert on public.portfolio_snapshots from authenticated;
