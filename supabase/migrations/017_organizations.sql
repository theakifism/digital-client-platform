-- Milestone 21 (STRUCTURE ONLY): organizations and the organization admin role.
-- Run ONCE in Supabase dashboard > SQL Editor > New query > Run. Safe to run twice.
-- Needs migrations 001 to 016. Run it BEFORE deploying the Milestone 21 code.
--
-- What this adds
--   * a table of organizations (a bank, a department, a company)
--   * a new login role "org_admin": one person who manages ONLY their own organization's staff cards
--   * cards.organization_id and profiles.organization_id (empty for today's individual clients, so nothing existing changes)
--   * org_staff_counts(): message COUNTS for the caller's own organization (numbers only, like Milestone 20)
-- What stays the same
--   * the admin still does everything; clients still cannot change their own password or their own organization.

-- ---------- 1. Organizations ----------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40),
  max_cards   integer not null default 25 check (max_cards between 1 and 100000),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Membership columns (empty for every existing client). They must exist BEFORE the policy below, which reads profiles.organization_id.
alter table public.profiles add column if not exists organization_id uuid references public.organizations(id) on delete restrict;
alter table public.cards    add column if not exists organization_id uuid references public.organizations(id) on delete restrict;
create index if not exists cards_organization_idx    on public.cards (organization_id);
create index if not exists profiles_organization_idx on public.profiles (organization_id);

alter table public.organizations enable row level security;
revoke all on public.organizations from anon, authenticated;
grant select on public.organizations to authenticated;   -- the policy below decides which rows

drop policy if exists "organizations: read own or admin" on public.organizations;
create policy "organizations: read own or admin" on public.organizations
  for select to authenticated
  using (
    public.is_admin()
    or id = (select p.organization_id from public.profiles p where p.id = (select auth.uid()))
  );
-- No insert, update or delete grants: only the server key (the admin panel) writes organizations.

-- ---------- 2. The new role ----------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('client', 'admin', 'org_admin'));

-- Visitors (anon) never see organization_id: migration 015 gave them a fixed column list, and this column is not on it.
-- Clients cannot write it either: their update grant is a fixed column list too. This trigger is a second lock.
create or replace function public.cards_lock_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.organization_id := old.organization_id;
  end if;
  return new;
end;
$$;

drop trigger if exists cards_lock_organization on public.cards;
create trigger cards_lock_organization
  before update on public.cards
  for each row execute function public.cards_lock_organization();

-- ---------- 4. Message counts for the caller's own organization (numbers only) ----------
-- It takes NO parameters: the organization comes from the caller's own login, so nobody can ask about another organization.
create or replace function public.org_staff_counts()
returns table (card_id uuid, total bigint, new_count bigint, last_message_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  org uuid;
begin
  select p.organization_id into org
  from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'org_admin';

  if org is null then
    raise exception 'Organization admins only';
  end if;

  return query
  select
    c.id,
    count(l.id),
    count(l.id) filter (where coalesce(l.status, 'new') = 'new'),
    max(l.created_at)
  from public.cards c
  left join public.leads l on l.card_id = c.id
  where c.organization_id = org
  group by c.id;
end;
$$;

revoke execute on function public.org_staff_counts() from public, anon;
grant execute on function public.org_staff_counts() to authenticated;
