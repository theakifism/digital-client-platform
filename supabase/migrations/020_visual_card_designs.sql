-- Save each owner's selected business-card template and its canvas layout.
-- Run after migrations 001 through 019, before deploying the visual card editor.

alter table public.cards add column if not exists design_config jsonb;

alter table public.cards drop constraint if exists cards_design_config_shape;
alter table public.cards add constraint cards_design_config_shape
  check (
    design_config is null or (
      jsonb_typeof(design_config) = 'object'
      and pg_column_size(design_config) <= 65536
    )
  ) not valid;
alter table public.cards validate constraint cards_design_config_shape;

grant select (design_config) on public.cards to anon;
grant update (design_config) on public.cards to authenticated;

-- Organization staff cannot bypass the dashboard lock by writing design JSON directly.
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
    new.design_config := old.design_config;
  end if;
  return new;
end;
$$;
