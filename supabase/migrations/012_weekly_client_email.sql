-- Milestone 15. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Run it BEFORE you put the Milestone 15 code on the live site. (Needs migration 011 from Milestone 14.)
-- Each client can choose to get a short weekly e-mail with their card's numbers. It starts as NO for every card.

alter table public.cards add column if not exists weekly_email boolean not null default false;

-- The numbers for the weekly e-mail: one row per active card that opted in and has an e-mail address.
-- COUNTS ONLY: it never returns what a visitor wrote. Only the server (service role) may call it.
create or replace function public.weekly_card_stats()
returns table (
  card_id uuid, slug text, name text, email text,
  views bigint, views_prev bigint, site_views bigint, taps bigint, saves bigint,
  new_messages bigint, waiting_messages bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id, c.slug::text, c.name::text, c.email::text,
    (select count(*) from public.events e where e.card_id = c.id and e.type = 'view' and e.created_at >= now() - interval '7 days'),
    (select count(*) from public.events e where e.card_id = c.id and e.type = 'view' and e.created_at >= now() - interval '14 days' and e.created_at < now() - interval '7 days'),
    (select count(*) from public.events e where e.card_id = c.id and e.type = 'site_view' and e.created_at >= now() - interval '7 days'),
    (select count(*) from public.events e where e.card_id = c.id and e.type in ('call', 'whatsapp', 'email', 'directions', 'website', 'social') and e.created_at >= now() - interval '7 days'),
    (select count(*) from public.events e where e.card_id = c.id and e.type = 'save' and e.created_at >= now() - interval '7 days'),
    (select count(*) from public.leads l where l.card_id = c.id and l.created_at >= now() - interval '7 days'),
    (select count(*) from public.leads l where l.card_id = c.id and l.status = 'new')
  from public.cards c
  where c.is_active = true and c.weekly_email = true and coalesce(trim(c.email), '') <> ''
  order by c.id;
$$;

revoke all on function public.weekly_card_stats() from public, anon, authenticated;
grant execute on function public.weekly_card_stats() to service_role;
