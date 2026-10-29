-- Milestone 2. Run ONCE in Supabase dashboard > SQL Editor > New query > Run.

-- 1. Two test cards (no owner on purpose). One is on, one is switched off.
insert into public.cards
  (slug, theme, name, designation, company, bio, phone, whatsapp, email, address, website, social_links, is_active)
values
  ('demo-card', 'teal', 'Rahul Sharma', 'Interior Designer', 'Sharma Interiors',
   'I design homes and offices that feel calm and work well. Ask me for a free first consultation.',
   '+91 98765 43210', '+91 98765 43210', 'rahul@example.com', 'Baner, Pune, Maharashtra',
   'sharmainteriors.example.com',
   '{"instagram":"https://instagram.com/example","linkedin":"https://linkedin.com/in/example"}'::jsonb, true),
  ('demo-off', 'light', 'Switched Off Card', 'Test', 'Test Co', 'This card is switched off.',
   null, null, null, null, null, '{}'::jsonb, false)
on conflict (slug) do nothing;

-- 2. Names that are already used by pages of the site cannot be card links.
alter table public.cards
  add constraint cards_slug_not_reserved
  check (slug not in ('admin','dashboard','login','after-login','auth','contact','api','about',
                      'privacy','terms','help','support','pricing','signup','register','logout',
                      'public','static','robots','sitemap','vcard'));
