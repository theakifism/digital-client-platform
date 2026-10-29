-- Milestone 19. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Deploy the Milestone 19 code FIRST, then run this. (The new code works without it; it just protects less.)
-- Needs migrations 001 to 014 (it uses cards.allow_search_index from 009 and cards.weekly_email from 012).
-- What it does:
--   1. Narrows what visitors and clients can touch on "cards" (column-level permissions).
--   2. Adds length and shape limits (CHECK constraints) so nobody can store junk by calling the database directly.
--   3. Adds the small counter table and functions used for rate limits and for deleting old activity numbers.

-- ---------- 1. Table permissions ----------
-- Nobody gets TRUNCATE / REFERENCES / TRIGGER on our tables through the public API.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- Visitors (not logged in) may only READ, and only the columns a public card needs (no owner_id).
revoke all on public.cards from anon;
grant select (id, slug, theme, name, designation, company, bio, photo_url, phone, whatsapp, email,
              address, map_url, website, social_links, is_active, allow_search_index, created_at, updated_at)
  on public.cards to anon;
revoke all on public.card_blocks from anon;
grant select on public.card_blocks to anon;
revoke all on public.profiles, public.leads, public.requests, public.events, public.feedback from anon;

-- Clients (logged in) may read their cards and change ONLY these columns.
-- Creating and deleting cards, and changing the link, owner or on/off switch, is done by the server with the service key.
revoke all on public.cards from authenticated;
grant select on public.cards to authenticated;
grant update (name, designation, company, bio, photo_url, phone, whatsapp, email, address, map_url,
              website, social_links, theme, allow_search_index, weekly_email)
  on public.cards to authenticated;

-- ---------- 2. Limits on what can be stored ----------
-- NOT VALID = checked for every new or changed row, existing rows are left alone.
-- If you add a theme in the code (src/app/dashboard/themes.ts), also change cards_theme_known (in a NEW migration).
-- (Safe to run twice: the limits are removed first, then added again.)
alter table public.cards
  drop constraint if exists cards_name_len,
  drop constraint if exists cards_designation_len,
  drop constraint if exists cards_company_len,
  drop constraint if exists cards_bio_len,
  drop constraint if exists cards_phone_len,
  drop constraint if exists cards_whatsapp_len,
  drop constraint if exists cards_email_len,
  drop constraint if exists cards_address_len,
  drop constraint if exists cards_map_url_len,
  drop constraint if exists cards_website_len,
  drop constraint if exists cards_photo_url_len,
  drop constraint if exists cards_theme_known,
  drop constraint if exists cards_social_shape;
alter table public.card_blocks drop constraint if exists card_blocks_content_is_object;

alter table public.cards
  add constraint cards_name_len        check (char_length(name)        <= 80)  not valid,
  add constraint cards_designation_len check (char_length(designation) <= 80)  not valid,
  add constraint cards_company_len     check (char_length(company)     <= 80)  not valid,
  add constraint cards_bio_len         check (char_length(bio)         <= 500) not valid,
  add constraint cards_phone_len       check (char_length(phone)       <= 30)  not valid,
  add constraint cards_whatsapp_len    check (char_length(whatsapp)    <= 30)  not valid,
  add constraint cards_email_len       check (char_length(email)       <= 120) not valid,
  add constraint cards_address_len     check (char_length(address)     <= 200) not valid,
  add constraint cards_map_url_len     check (char_length(map_url)     <= 400) not valid,
  add constraint cards_website_len     check (char_length(website)     <= 300) not valid,
  add constraint cards_photo_url_len   check (char_length(photo_url)   <= 500) not valid,
  add constraint cards_theme_known     check (theme in ('light', 'dark', 'teal', 'orion')) not valid,
  add constraint cards_social_shape    check (jsonb_typeof(social_links) = 'object' and pg_column_size(social_links) <= 3072) not valid;

alter table public.card_blocks
  add constraint card_blocks_content_is_object check (jsonb_typeof(content) = 'object') not valid;

-- ---------- 3. Rate-limit counters (server only) ----------
create table if not exists public.rate_limits (
  key     text        not null,
  bucket  timestamptz not null,
  n       integer     not null default 0,
  primary key (key, bucket)
);
alter table public.rate_limits enable row level security;   -- no policies: only the service key can use it
revoke all on public.rate_limits from anon, authenticated;

-- Counts one hit and answers true while the key is still under the limit for the current time window.
create or replace function public.hit_rate_limit(p_key text, p_window_seconds int, p_max int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bucket timestamptz;
  v_n int;
begin
  if p_window_seconds < 1 or p_max < 0 then
    raise exception 'bad rate limit settings';
  end if;
  v_bucket := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits as r (key, bucket, n)
  values (left(p_key, 120), v_bucket, 1)
  on conflict (key, bucket) do update set n = r.n + 1
  returning r.n into v_n;
  if random() < 0.02 then
    delete from public.rate_limits where bucket < now() - interval '2 days';
  end if;
  return v_n <= p_max;
end;
$$;
revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- Deletes activity numbers older than p_days (the daily admin check calls this with 400). Returns how many were deleted.
create or replace function public.purge_old_events(p_days int default 400)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted bigint;
begin
  if p_days < 30 then
    raise exception 'p_days must be at least 30';
  end if;
  with d as (
    delete from public.events where created_at < now() - make_interval(days => p_days) returning 1
  )
  select count(*) into v_deleted from d;
  return v_deleted;
end;
$$;
revoke all on function public.purge_old_events(int) from public, anon, authenticated;
grant execute on function public.purge_old_events(int) to service_role;

-- (Photo storage needs nothing here: since migration 014 clients cannot write to the photo bucket at all.
--  Uploads go through the server, which now also limits uploads per login with the counter above.)
