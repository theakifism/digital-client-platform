-- Milestone 22: card TEMPLATES (the layout of the public card). Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Safe to run twice. Needs migrations 001 to 017 (it uses cards.organization_id from 017).
-- RUN THIS BEFORE you deploy the Milestone 22 code, otherwise the card pages cannot read the new column.
--
-- What this does
--   * adds cards.template: a short name such as 'wave' or 'midnight'. EMPTY means "classic" = the look every existing card has today.
--   * the list of templates lives in the code (src/lib/card-templates.ts), so adding a template later needs NO new migration.
--   * visitors may read the column (the public card needs it); logged-in clients may change it on their own card.
--   * for cards that belong to an ORGANIZATION, the template and the colour theme can only be changed by the server key
--     (the organization's administrator, or Orian's admin). A staff member cannot change them, even by calling the database directly.

alter table public.cards add column if not exists template text;

alter table public.cards drop constraint if exists cards_template_shape;
alter table public.cards add constraint cards_template_shape
  check (template is null or (template ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(template) <= 30));

grant select (template) on public.cards to anon;
grant update (template) on public.cards to authenticated;

create or replace function public.cards_lock_design()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() and old.organization_id is not null then
    new.template := old.template;
    new.theme    := old.theme;
  end if;
  return new;
end;
$$;

drop trigger if exists cards_lock_design on public.cards;
create trigger cards_lock_design
  before update on public.cards
  for each row execute function public.cards_lock_design();
