# Milestone 19: Hardening against floods and misuse, and the missing admin tools

Your site works. This milestone makes it harder to abuse, and gives you the admin tools that were missing
(search, edit a card, delete a request, erase a client). It also fixes a few real bugs.
There is ONE database change (`015_hardening.sql`). No new packages: you do NOT need `npm install`.

## The order matters
1. Apply the files and deploy the NEW CODE first (Step 1 to 3). The code works without the database change; it just protects less.
2. Then run the migration (Step 4).
3. Then run the security check (Step 5).

## What changed, in plain words
- **Floods are limited.** The message form, the request form, activity counting, Save-to-contacts counting and photo uploads now have limits that
  are kept in the database (the old limit lived in the memory of one server and did not hold on free hosting).
  A robot can no longer use up your daily e-mail allowance, so your own admin alerts keep working. Messages are still always saved.
- **The spam check can no longer be forgotten.** On the live site, if the Turnstile keys are missing, the forms are blocked (before, they were open to everyone).
- **The database refuses junk.** Even someone who talks to the database directly cannot change a card's link, owner or on/off switch, store a 10,000-letter name,
  or read which login owns a card. Visitors can only read what a public card shows.
- **Admin tools.** Cards: search, pages of 25, an **Edit** page, "are you sure" before switching a card off, and **Erase client** (login, cards, messages, activity,
  feedback and the photo files; you type the username to confirm). Requests: search, pages, **Delete**. "Change password" now ends with a message you can copy and send.
- **Overview has a "Setup check"** that says in plain words what is not set up yet (website address, spam check, e-mail, admin e-mail secret, security mode, database upgrade).
- **Bulk upload is safe for big files**: it creates the clients in small groups while you watch, up to 200 at a time. Before, one long request could stop halfway.
- **Bug fixes:** phone numbers starting with `+` were saved in the CSV downloads with a stray apostrophe (`'+91 ...`); the Save-to-contacts file broke web addresses with commas and
  did not wrap long lines; the dashboard greeting never showed the client's name; the public card asked the database several times per visit.
- **Small things:** the daily admin e-mail now also deletes activity numbers older than 400 days (keeps the free database small), a `global-error.tsx` page,
  a neutral "Page not found" page, an HTTPS-only header, a complete `.env.example`, `npm run typecheck`, and an automatic build check on GitHub (`ci.yml`).

## Step 0: one check before you start (30 seconds)
Supabase -> SQL Editor -> New query -> paste -> Run. It must say **Success. No rows returned**.
If it lists cards, tell me before running Step 4 (those cards could not be saved again after the migration).
```sql
select slug, name from public.cards
where char_length(name) > 80 or char_length(designation) > 80 or char_length(company) > 80 or char_length(bio) > 500
   or char_length(phone) > 30 or char_length(whatsapp) > 30 or char_length(email) > 120 or char_length(address) > 200
   or char_length(map_url) > 400 or char_length(website) > 300 or char_length(photo_url) > 500
   or theme not in ('light','dark','teal','orion') or jsonb_typeof(social_links) <> 'object' or pg_column_size(social_links) > 3072;
```

## Step 1: Apply the files
Unzip into your project and click Merge (replace the changed files when asked). Then:
```powershell
npm run typecheck
npm run build
npm run dev
```
`npm run typecheck` is new. If it prints errors, send me the output. (I could not run it here: see "What was and was not tested".)

## Step 2: Settings (the important ones are the first two)
Open `.env.example` for the full list with explanations. Add to `.env.local` AND to the host's settings (Netlify):
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (Cloudflare -> Turnstile -> add a site). **Without them the live forms are blocked.**
  On your own computer (`npm run dev`) the spam check is skipped, so testing works as before.
- `NEXT_PUBLIC_SITE_URL` must be the real `https://...` address on the live site.
- Optional: `CLIENT_IP_HEADER` (leave empty on Netlify; on Cloudflare Pages use `cf-connecting-ip`), `LEAD_EMAIL_DAILY_CAP` (default 80),
  `NEXT_PUBLIC_BRAND_NAME` (the company name; this is the easy way to settle Orion or Orian, but the logo picture `public/logo.png` must be replaced separately).
Then open **Admin -> Overview**: the **Setup check** box shows what still needs attention.

## Step 3: Deploy
git push, as usual. GitHub now also runs a **Checks** job (`ci.yml`) on every push: type check, lint (warnings do not stop it) and build. It needs no secrets.
A red Checks job means the change does not build: do not deploy that version.

## Step 4: Run the database upgrade (after the code is live)
Supabase -> SQL Editor -> New query -> paste `supabase/migrations/015_hardening.sql` -> Run. It is safe to run twice.
Open **Admin -> Overview**: the Setup check line "Database upgrade 015" turns to OK.

## Step 5: Run the security check
`node --env-file=.env.security scripts/security-check.mjs` (as in `docs/SECURITY-CHECK.md`). The new section "Milestone 19 hardening" must all PASS.
Before Step 4 those lines FAIL on purpose.

## Test checklist (about 15 minutes)
- [ ] Admin -> Overview shows the Setup check; every "Needs attention" line is something you understand.
- [ ] Admin -> Cards: type part of a name in the search box; the list narrows. With more than 25 cards, Next/Previous work.
- [ ] Cards -> Edit on a test card: change the phone number, Save, open the public card: it shows the new number. The photo is unchanged.
- [ ] Cards -> Switch off asks "are you sure". Switch it on again.
- [ ] Cards -> Change password (leave empty): a message with the login details appears, "Copy message" works, and the client can log in with it.
- [ ] Requests: send a test request from `/contact`, find it, search for it, Delete it (it asks first).
- [ ] Bulk upload a CSV with 12 test clients: the table fills in groups, "Download logins" works, a duplicate row shows a clear message.
- [ ] Create a TEST client, give it a card photo and one gallery photo, then Cards -> Edit -> **Erase client** (type the username). The login, the card link and the photos are gone.
      (Never do this on a real client.)
- [ ] Leads CSV (dashboard -> Messages -> Download): a phone number like `+91 98765 43210` has no apostrophe in front.
- [ ] On the card, "Save to contacts" still adds the contact with the website address correct.
- [ ] Send 7 messages from one phone through the card's message form within an hour: the 7th says "You have sent several messages already".
- [ ] A client dashboard: save the card, switch the weekly e-mail on and off, upload a photo: everything still works after Step 4.
- [ ] The public card, the small website and the QR code still open (visitors are not logged in).

## If something goes wrong after Step 4 (rollback)
Paste this in the SQL Editor. It puts the old, wider permissions back. Tell me what failed so I can fix it properly.
```sql
grant select, insert, update, delete on public.cards to authenticated;
grant select on public.cards to anon;
grant select on public.card_blocks to anon;
alter table public.cards
  drop constraint if exists cards_name_len, drop constraint if exists cards_designation_len, drop constraint if exists cards_company_len,
  drop constraint if exists cards_bio_len, drop constraint if exists cards_phone_len, drop constraint if exists cards_whatsapp_len,
  drop constraint if exists cards_email_len, drop constraint if exists cards_address_len, drop constraint if exists cards_map_url_len,
  drop constraint if exists cards_website_len, drop constraint if exists cards_photo_url_len, drop constraint if exists cards_theme_known,
  drop constraint if exists cards_social_shape;
alter table public.card_blocks drop constraint if exists card_blocks_content_is_object;
```
(The new code keeps working after a rollback; only the extra database protection is off.)

## Files (nothing is deleted)
ADDED (11 files):
- `.github/workflows/ci.yml`
- `supabase/migrations/015_hardening.sql`
- `src/lib/ratelimit.ts`, `src/lib/setup-check.ts`
- `src/app/global-error.tsx`
- `src/app/admin/confirm-button.tsx`, `src/app/admin/pager.tsx`
- `src/app/admin/cards/[id]/page.tsx`, `admin-card-form.tsx`, `erase-client.tsx`
- `MILESTONE-19.md`

MODIFIED (32 files):
- Config and docs: `next.config.ts`, `package.json`, `.env.example`, `docs/DEPLOY.md`, `PROJECT-HANDOFF.md`, `scripts/security-check.mjs`
- Library: `src/lib/brand.ts`, `card.ts`, `blocks.ts`, `csv.ts`, `vcard.ts`, `turnstile.ts`, `provision.ts`, `digest.ts`
- Public and API: `src/app/layout.tsx`, `not-found.tsx`, `[slug]/lead-actions.ts`, `[slug]/vcard/route.ts`, `contact/actions.ts`, `api/track/route.ts`, `api/upload/route.ts`, `api/cron/digest/route.ts`, `dashboard/page.tsx` (one sentence)
- Admin: `src/app/admin/actions.ts`, `state.ts`, `admin.css`, `page.tsx`, `cards/page.tsx`, `cards/reset-password.tsx`, `cards/bulk/page.tsx`, `cards/bulk/bulk-form.tsx`, `requests/page.tsx`

## What was and was not tested (please read)
- Tested by running the code: the CSV phone fix, the CSV formula guard, the vCard web address and the long-line wrapping.
- Checked with the TypeScript compiler (with stand-in types for outside packages, because the packages could not be installed here): no missing imports, no wrong names,
  no mistakes between your own files in anything I changed. This is NOT the same as your real `npm run typecheck` and `npm run build`: please run both.
- The SQL was reviewed line by line but NOT run against a database (none was available). That is why Step 0, the rollback and the security check exist. Run it first on a copy
  if you are worried: Supabase can make a free test project in two minutes.
- Not tested against a real Supabase project, Netlify, Resend or Turnstile.

## Good to know
- **E-mail allowance:** to my knowledge the Resend free plan allows about 100 e-mails a day (check their pricing page). Messages from visitors may use at most
  `LEAD_EMAIL_DAILY_CAP` of those (default 80); admin alerts and the weekly client e-mails use the rest. Messages are never lost: they are always in the dashboard.
- **Erase client** deletes the files that cards and galleries use. A photo a client uploaded but never saved is swept too on Supabase Storage; on Cloudflare R2 it shows up in
  Admin -> Photo storage after a day. Backups (database and photos) keep older copies until they expire; this is described in `docs/BACKUP-AND-RESTORE.md`.
- **Rate limits** count visitors by the address your host reports. On Netlify that works out of the box. If you move to another host, set `CLIENT_IP_HEADER`.
  A visitor address is scrambled before it is stored; the counter rows delete themselves after two days.
- **Still open, by design:** clients cannot change their own password (Milestone 17). The Content-Security-Policy still only reports (set `CSP_ENFORCE=true` after the test in `MILESTONE-11.md`).
  Admin cannot read clients' messages (privacy decision from the handoff). The Orion or Orian spelling is still yours to confirm.

## Updated CURRENT STATUS
Already added to `PROJECT-HANDOFF.md` (DONE 19).
