-- Milestone 9. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- 1) Feedback from clients  2) Adoption numbers for the admin  3) A list of unused photos for the admin.

-- ---------- 1. Feedback ----------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  rating int check (rating between 1 and 5),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.feedback (owner_id);

alter table public.feedback enable row level security;
grant select, insert, update, delete on public.feedback to authenticated;

-- A client can write feedback as themselves and read only their own. Only the admin reads everything.
create policy "feedback owner insert" on public.feedback
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "feedback owner read" on public.feedback
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "feedback admin all" on public.feedback
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- 2. Adoption numbers (admin only) ----------
-- One row per card: did the client log in, is the card filled in, is it being seen?
-- It only COUNTS messages. It never shows what visitors wrote.
create or replace function public.admin_adoption()
returns table (
  card_id uuid, card_slug text, card_name text, company text, is_active boolean,
  owner_username text, last_sign_in_at timestamptz, card_created_at timestamptz,
  has_photo boolean, has_bio boolean, has_phone boolean, social_count bigint,
  site_sections bigint, views_30d bigint, messages bigint, last_activity timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  return query
  select
    c.id,
    c.slug::text,
    c.name::text,
    c.company::text,
    c.is_active,
    p.username::text,
    u.last_sign_in_at,
    c.created_at,
    (c.photo_url is not null and c.photo_url <> ''),
    (coalesce(c.bio, '') <> ''),
    (coalesce(c.phone, '') <> ''),
    (select count(*) from jsonb_each_text(coalesce(c.social_links::jsonb, '{}'::jsonb)) kv where kv.value <> ''),
    (select count(*) from public.card_blocks b where b.card_id = c.id and b.is_visible),
    (select count(*) from public.events e where e.card_id = c.id and e.type = 'view' and e.created_at >= now() - interval '30 days'),
    (select count(*) from public.leads l where l.card_id = c.id),
    (select max(e.created_at) from public.events e where e.card_id = c.id)
  from public.cards c
  left join public.profiles p on p.id = c.owner_id
  left join auth.users u on u.id = c.owner_id
  order by c.created_at desc;
end;
$$;

-- ---------- 3. Unused photos (admin only) ----------
-- Files in the photo bucket that no card and no gallery uses, and that are more than a day old
-- (so a photo someone is uploading right now is never listed).
create or replace function public.admin_unused_photos()
returns table (file_name text, size_bytes bigint, uploaded_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  return query
  select
    o.name::text,
    coalesce((o.metadata->>'size')::bigint, 0),
    o.created_at
  from storage.objects o
  where o.bucket_id = 'card-photos'
    and o.name not like '%.emptyFolderPlaceholder'
    and o.created_at < now() - interval '1 day'
    and not exists (select 1 from public.cards c where c.photo_url is not null and position(o.name in c.photo_url) > 0)
    and not exists (select 1 from public.card_blocks b where b.type = 'gallery' and position(o.name in b.content::text) > 0)
  order by o.created_at;
end;
$$;

revoke execute on function public.admin_adoption() from public, anon;
revoke execute on function public.admin_unused_photos() from public, anon;
grant execute on function public.admin_adoption() to authenticated;
grant execute on function public.admin_unused_photos() to authenticated;
