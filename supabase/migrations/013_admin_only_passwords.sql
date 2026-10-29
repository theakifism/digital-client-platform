-- Milestone 17 (revised). Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Run it BEFORE you put the Milestone 17 code on the live site.
-- After this, ONLY the admin can change a client's password. A client who is logged in cannot change their own,
-- not on the website and not by talking to the login system directly. Passwords of ADMIN logins are not affected.
-- If you ran an earlier "013_must_change_password.sql", delete that file from your project: this one replaces it.

-- Remove the mark from the earlier design, if it was ever created.
alter table public.profiles drop column if exists must_change_password;

-- 1. The only way to change a client's password: this function, callable by the server (service role) only.
create or replace function public.admin_set_password(target_user uuid, new_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new_password is null or char_length(new_password) < 8 or char_length(new_password) > 72 then
    raise exception 'The password must have 8 to 72 characters.';
  end if;
  if not exists (select 1 from public.profiles p where p.id = target_user and p.role = 'client') then
    raise exception 'This login is not a client login.';
  end if;
  perform set_config('app.admin_password_change', 'on', true); -- lasts only for this one statement block
  update auth.users
     set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
         updated_at = now()
   where id = target_user;
end;
$$;

revoke all on function public.admin_set_password(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_password(uuid, text) to service_role;

-- 2. The lock: any change to a CLIENT's password is refused unless it comes through the function above.
create or replace function public.block_client_password_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password
     and coalesce(current_setting('app.admin_password_change', true), '') <> 'on'
     and exists (select 1 from public.profiles p where p.id = new.id and p.role = 'client') then
    raise exception 'Only the admin can change a client password.';
  end if;
  return new;
end;
$$;

drop trigger if exists clients_cannot_change_password on auth.users;
create trigger clients_cannot_change_password
  before update of encrypted_password on auth.users
  for each row execute function public.block_client_password_change();

-- TO SWITCH THE LOCK OFF AGAIN (emergency only), run:
--   drop trigger if exists clients_cannot_change_password on auth.users;
