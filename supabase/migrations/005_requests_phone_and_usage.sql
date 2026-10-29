-- Milestone 4. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.

-- 1. The "Request a card" form also asks for a phone number.
alter table public.requests add column if not exists phone text;

-- 2. Usage numbers for the admin overview (admins only).
create or replace function public.admin_usage()
returns json
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  return json_build_object(
    'photos_bytes', coalesce((select sum((metadata->>'size')::bigint) from storage.objects where bucket_id = 'card-photos'), 0),
    'db_bytes', pg_database_size(current_database())
  );
end;
$$;

revoke execute on function public.admin_usage() from public, anon;
grant execute on function public.admin_usage() to authenticated;
