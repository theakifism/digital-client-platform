-- Milestone 13. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Gives the daily admin e-mail the same two numbers as the admin overview (photo space and database size).
-- Only the server (service role) may call it. Clients, visitors and even logged-in admins cannot.
create or replace function public.system_usage()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'photos_bytes', coalesce((select sum((metadata->>'size')::bigint) from storage.objects where bucket_id = 'card-photos'), 0),
    'db_bytes', pg_database_size(current_database())
  );
$$;

revoke all on function public.system_usage() from public, anon, authenticated;
grant execute on function public.system_usage() to service_role;
