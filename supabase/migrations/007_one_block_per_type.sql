-- Milestone 6. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.

-- Each card has at most ONE block of each kind (About, Services, ...). This keeps the editor simple.
alter table public.card_blocks
  add constraint card_blocks_one_per_type unique (card_id, type);

-- A block can never hold more than about 32 KB of data (protects the free database from abuse).
alter table public.card_blocks
  add constraint card_blocks_content_size check (pg_column_size(content) <= 32768);
