-- =====================================================================
-- Digital Client Platform: Milestone 1 database
-- Run this ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- =====================================================================

-- ---------- 1. PEOPLE (one row per login) ----------
-- The username is the part before the @ of the hidden login address.
-- Rules: lowercase letters, numbers and single hyphens, 3 to 30 characters (example: ravi-sharma).
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique
                check (username ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(username) between 3 and 30),
  full_name   text,
  role        text not null default 'client' check (role in ('client', 'admin')),
  created_at  timestamptz not null default now()
);

-- ---------- 2. CARDS ----------
create table public.cards (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references public.profiles(id) on delete set null,
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  theme         text not null default 'light',
  name          text,
  designation   text,
  company       text,
  bio           text,
  photo_url     text,
  phone         text,
  whatsapp      text,
  email         text,
  address       text,
  map_url       text,
  website       text,
  social_links  jsonb not null default '{}'::jsonb,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index cards_owner_idx on public.cards (owner_id);

-- ---------- 3. SMALL WEBSITE BLOCKS ----------
create table public.card_blocks (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.cards(id) on delete cascade,
  type        text not null check (type in
                ('about', 'services', 'gallery', 'testimonials', 'faq', 'contact_map')),
  position    integer not null default 0,
  is_visible  boolean not null default true,
  content     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index card_blocks_card_idx on public.card_blocks (card_id, position);

-- ---------- 4. LEADS (from the "Contact me" form) ----------
create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.cards(id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  message     text,
  consent     boolean not null check (consent = true),  -- a lead is only saved with consent
  created_at  timestamptz not null default now()
);
create index leads_card_idx on public.leads (card_id, created_at desc);

-- ---------- 5. REQUESTS (from the public "Request a card" form) ----------
create table public.requests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  company     text,
  message     text,
  consent     boolean not null check (consent = true),
  status      text not null default 'new' check (status in ('new', 'contacted', 'card_created')),
  created_at  timestamptz not null default now()
);

-- ---------- 6. EVENTS (analytics: views, clicks, saves) ----------
create table public.events (
  id          bigint generated always as identity primary key,
  card_id     uuid not null references public.cards(id) on delete cascade,
  type        text not null,
  created_at  timestamptz not null default now()
);
create index events_card_idx on public.events (card_id, created_at);

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Is the person making this request an admin?
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Does the person making this request own this card?
create function public.owns_card(check_card_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cards
    where id = check_card_id and owner_id = (select auth.uid())
  );
$$;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- When a login is created in Supabase, create its profile (role = client).
-- The username comes from the hidden address: ravi-sharma@example.com -> ravi-sharma.
-- If the username breaks the rules above, creating the login fails (this is on purpose).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username) values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- If the hidden address is changed in Supabase (this renames a username), keep the profile in step.
create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set username = split_part(new.email, '@', 1) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Card rules on every update:
--  * the link (slug) can never change
--  * a client cannot change owner_id or is_active (only admins can switch a card on/off)
--  * updated_at is refreshed
create function public.cards_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'A card link (slug) can never be changed.';
  end if;

  -- auth.uid() is empty for the SQL editor and the server key, so only
  -- logged-in non-admin people are restricted here.
  if (select auth.uid()) is not null and not public.is_admin() then
    new.owner_id := old.owner_id;
    new.is_active := old.is_active;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger cards_before_update
  before update on public.cards
  for each row execute function public.cards_before_update();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger card_blocks_set_updated_at
  before update on public.card_blocks
  for each row execute function public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY: who may see and change what
-- =====================================================================
alter table public.profiles    enable row level security;
alter table public.cards       enable row level security;
alter table public.card_blocks enable row level security;
alter table public.leads       enable row level security;
alter table public.requests    enable row level security;
alter table public.events      enable row level security;

-- Table permissions (RLS below then narrows them down).
grant select on public.cards, public.card_blocks to anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.cards, public.card_blocks to authenticated;
grant select, delete on public.leads to authenticated;
grant select, update, delete on public.requests to authenticated;
grant select on public.events to authenticated;

-- PROFILES: you see your own row; admins see and change everyone.
-- (No client can change a profile, so nobody can make themselves admin.)
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: admin update" on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- CARDS
create policy "cards: public can read active" on public.cards
  for select to anon, authenticated
  using (is_active = true);
create policy "cards: owner can read own" on public.cards
  for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "cards: owner can edit own" on public.cards
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "cards: admin full access" on public.cards
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- CARD BLOCKS
create policy "blocks: public can read visible blocks of active cards" on public.card_blocks
  for select to anon, authenticated
  using (
    is_visible = true
    and exists (select 1 from public.cards c where c.id = card_id and c.is_active = true)
  );
create policy "blocks: owner full access" on public.card_blocks
  for all to authenticated
  using (public.owns_card(card_id)) with check (public.owns_card(card_id));
create policy "blocks: admin full access" on public.card_blocks
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- LEADS: the card owner reads and deletes their own; admin sees all.
-- New leads are saved by the server (Milestone 5), never straight from the browser.
create policy "leads: owner read" on public.leads
  for select to authenticated
  using (public.owns_card(card_id));
create policy "leads: owner delete" on public.leads
  for delete to authenticated
  using (public.owns_card(card_id));
create policy "leads: admin full access" on public.leads
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- REQUESTS: admin only. The public form saves through the server (Milestone 4).
create policy "requests: admin full access" on public.requests
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- EVENTS: the card owner reads their own; admin reads all. Saved by the server (Milestone 5).
create policy "events: owner read" on public.events
  for select to authenticated
  using (public.owns_card(card_id));
create policy "events: admin read" on public.events
  for select to authenticated
  using (public.is_admin());
