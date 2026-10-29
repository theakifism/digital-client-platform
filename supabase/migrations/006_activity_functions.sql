-- Milestone 5. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Two read-only helpers for the dashboard's activity numbers.
-- They run with the caller's own rights ("security invoker"), so Row Level Security still applies:
-- a client only ever counts events of THEIR OWN cards.

create or replace function public.card_activity(p_card uuid, p_days int)
returns table (type text, total bigint)
language sql stable security invoker set search_path = ''
as $$
  select e.type, count(*)::bigint
  from public.events e
  where e.card_id = p_card and e.created_at >= now() - make_interval(days => p_days)
  group by e.type
$$;

-- Views per day (India time), for the small bar chart.
create or replace function public.card_daily_views(p_card uuid, p_days int)
returns table (day date, views bigint)
language sql stable security invoker set search_path = ''
as $$
  select (e.created_at at time zone 'Asia/Kolkata')::date as day, count(*)::bigint as views
  from public.events e
  where e.card_id = p_card and e.type = 'view' and e.created_at >= now() - make_interval(days => p_days)
  group by 1
  order by 1
$$;

revoke execute on function public.card_activity(uuid, int) from public, anon;
revoke execute on function public.card_daily_views(uuid, int) from public, anon;
grant execute on function public.card_activity(uuid, int) to authenticated;
grant execute on function public.card_daily_views(uuid, int) to authenticated;
