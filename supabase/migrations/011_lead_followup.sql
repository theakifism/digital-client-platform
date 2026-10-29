-- Milestone 14. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Run it BEFORE you put the Milestone 14 code on the live site.
-- Lets a client follow up on the messages visitors send to their card:
-- a status (new, contacted, won, not interested) and a private note on each message.

alter table public.leads add column if not exists status text not null default 'new';
alter table public.leads add column if not exists note text;

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check check (status in ('new', 'contacted', 'won', 'lost'));

alter table public.leads drop constraint if exists leads_note_length;
alter table public.leads add constraint leads_note_length check (note is null or char_length(note) <= 1000);

create index if not exists leads_card_status_idx on public.leads (card_id, status);

-- A logged-in client may change ONLY these two columns (never the visitor's name, phone, e-mail or message).
-- The column-level grant enforces that; the policy below enforces "only on your own cards".
grant update (status, note) on public.leads to authenticated;

drop policy if exists "leads: owner update" on public.leads;
create policy "leads: owner update" on public.leads
  for update to authenticated
  using (public.owns_card(card_id))
  with check (public.owns_card(card_id));
