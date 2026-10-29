-- Milestone 3: storage for card photos.
-- Run ONCE in Supabase dashboard > SQL Editor > New query > Run.

-- A public bucket (anyone can VIEW a photo, which a public card needs).
-- Only small JPEG files are accepted (the dashboard shrinks every photo to about 200 KB first).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('card-photos', 'card-photos', true, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

-- Each client may only add, replace or delete files inside their OWN folder.
-- Photos are saved as  <user id>/<card id>.jpg
create policy "card photos: public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'card-photos');

create policy "card photos: owner upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'card-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "card photos: owner replace" on storage.objects
  for update to authenticated
  using (bucket_id = 'card-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'card-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "card photos: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'card-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "card photos: admin full access" on storage.objects
  for all to authenticated
  using (bucket_id = 'card-photos' and public.is_admin())
  with check (bucket_id = 'card-photos' and public.is_admin());
