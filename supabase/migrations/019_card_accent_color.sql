-- Personal accent colour for the single signature business-card layout.
-- Run after migrations 017 and 018, before deploying the matching application code.

alter table public.cards add column if not exists accent_color text;

alter table public.cards drop constraint if exists cards_accent_color_shape;
alter table public.cards add constraint cards_accent_color_shape
  check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$') not valid;
alter table public.cards validate constraint cards_accent_color_shape;

grant select (accent_color) on public.cards to anon;
grant update (accent_color) on public.cards to authenticated;

-- Organization staff keep the organization-selected appearance, even if they
-- try to update the row directly instead of using the dashboard.
create or replace function public.cards_lock_design()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() and old.organization_id is not null then
    new.template := old.template;
    new.theme := old.theme;
    new.accent_color := old.accent_color;
  end if;
  return new;
end;
$$;
