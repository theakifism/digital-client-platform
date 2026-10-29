-- Milestone 20. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Needs migration 011 (the message "status" column). Safe to run twice.
-- Gives the admin message COUNTS per card: how many messages, how many are still marked New, and how long the oldest one has waited.
-- It NEVER returns what a visitor wrote (no name, phone, e-mail or message) and never the client's private note.
-- The messages belong to the clients, so this function only counts.

create or replace function public.admin_lead_counts()
returns table (
  card_id uuid, card_slug text, card_name text, company text, is_active boolean, owner_username text,
  total bigint, new_count bigint, contacted_count bigint, won_count bigint, lost_count bigint,
  last_message_at timestamptz, oldest_new_at timestamptz
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
    count(l.id),
    count(l.id) filter (where coalesce(l.status, 'new') = 'new'),
    count(l.id) filter (where l.status = 'contacted'),
    count(l.id) filter (where l.status = 'won'),
    count(l.id) filter (where l.status = 'lost'),
    max(l.created_at),
    min(l.created_at) filter (where coalesce(l.status, 'new') = 'new')
  from public.cards c
  left join public.profiles p on p.id = c.owner_id
  left join public.leads l on l.card_id = c.id
  group by c.id, p.username
  order by min(l.created_at) filter (where coalesce(l.status, 'new') = 'new') asc nulls last, c.created_at desc;
end;
$$;

revoke execute on function public.admin_lead_counts() from public, anon;
grant execute on function public.admin_lead_counts() to authenticated;
