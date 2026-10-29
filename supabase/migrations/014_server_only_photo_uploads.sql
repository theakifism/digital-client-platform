-- Milestone 18. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.
-- Run it LAST: only AFTER the Milestone 18 code is live and a photo upload has worked on the live site.
-- Photos are now uploaded through our own server, which checks the size and the type. This closes the old way:
-- from now on a logged-in client can no longer write, replace or delete files in the Supabase "card-photos" bucket by themselves,
-- so nobody can skip the server's size limit by talking to Supabase storage directly.
-- This is correct whether your photos stay in Supabase Storage or move to Cloudflare R2: the server writes with its own key.

drop policy if exists "card photos: owner upload" on storage.objects;
drop policy if exists "card photos: owner replace" on storage.objects;
drop policy if exists "card photos: owner delete" on storage.objects;

-- Public read and the admin policy stay as they were.
-- (To go back: run supabase/migrations/004_card_photos_storage.sql again.)
