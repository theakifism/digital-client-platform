-- Milestone 12. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Run it BEFORE you put the Milestone 12 code on the live site.

-- Each card gets a choice: may search engines (Google and others) list it? The answer starts as NO for every card.
alter table public.cards add column if not exists allow_search_index boolean not null default false;

-- Nothing else is needed: the owner can already edit their own card, and visitors can already read active cards.
