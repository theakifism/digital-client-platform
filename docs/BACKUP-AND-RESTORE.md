# Backups and restoring

## What is backed up
- **Every Sunday night** GitHub makes an encrypted copy of the database (cards, logins, messages, requests, website
  sections, activity). Kept for 90 days. File: `.github/workflows/backup.yml`.
- **Photos have their own weekly backup** (`.github/workflows/photo-backup.yml`): every client photo in one file, kept for
  30 days. Photos live in Supabase Storage (or in Cloudflare R2 if you moved them, Milestone 18), not in the database, so the database backup does not contain them. The photos are
  public on the cards anyway, so the photo file is not encrypted.
- The free Supabase plan does not promise backups of its own. This file is your safety net.

## Set up once
1. Put the project on GitHub (private repository). See DEPLOY.md.
2. GitHub -> your repository -> Settings -> Secrets and variables -> Actions -> New repository secret. Add:
   - `SUPABASE_DB_URL`: Supabase -> Connect -> choose "Session pooler" (it works from GitHub; the direct address may not).
     Copy the connection string and put your database password in place of [YOUR-PASSWORD].
   - `BACKUP_PASSPHRASE`: a long phrase you make up (for example five random words). Save it in the company password manager.
     WITHOUT IT A BACKUP CANNOT BE OPENED.
   - `SITE_URL`: your website address with no slash at the end (used by the keep-alive job).
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` (for the photo backup): Supabase -> Project Settings -> API. Copy the Project URL
     and the `anon` (publishable) key. These two are public values. Do NOT use the `service_role` key: it must never go to GitHub.
   - Only if you moved the photos to Cloudflare R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` instead, with a
     SEPARATE, READ-ONLY R2 token (not the one the website uses). See MILESTONE-18.md.
3. GitHub -> Actions -> "Weekly database backup" -> Run workflow. Wait for the green tick.
   Open the run: under Artifacts you will see `database-backup`. Download it once to check that the file exists.
   If the run is red, open it and read the failing step. Paste the message into the chat and I will fix it.
4. Do the same for "Weekly photo backup". Open the run, open the step "Download every photo" and read the last line:
   `Photos found: N. Saved: N` (the two numbers must match and Failed must be 0). Under Artifacts you will see `photo-backup`.
5. Do the same for "Keep alive". Green tick = the database is being touched every 3 days.

## Every month (5 minutes)
- Actions tab: check all four jobs are green (database backup, photo backup, keep alive, admin e-mail check). GitHub may switch scheduled jobs off in repositories with no activity for a long
  time; if that happens, press "Enable workflow".
- Download the latest backup and save it in the company drive too (a second copy somewhere that is not GitHub).

## Practice a restore ONCE, before you need it (a backup you have never restored is only a hope)
Do this into a scratch Supabase project (a second free project), never into the live one.
1. Install the PostgreSQL 17 command line tools on your computer (the "client tools" are enough).
2. Open the backup: `openssl enc -d -aes-256-cbc -pbkdf2 -in backup-2026-XX-XX.dump.enc -out restore.dump`
   (it asks for your BACKUP_PASSPHRASE).
3. In the scratch project, SQL Editor: run migrations 001 to 007 in order. This rebuilds the empty tables and rules.
4. Load the data: `pg_restore --data-only --no-owner --schema=public --schema=auth -d "SCRATCH_PROJECT_SESSION_POOLER_URL" restore.dump`
   Messages about "duplicate key" for profiles are expected (a login creates its profile automatically).
5. Run migration 002 again so the admin has the admin role, then check that the cards, messages and logins are there.
6. If any step fails, paste the error into the chat. We adjust these steps while nothing is at stake. Then delete restore.dump.

## Restore the photos
Do this after migration 004 has been run in the target project (it creates the photo bucket and its rules). If your photos are on Cloudflare R2, the bucket must exist instead (see MILESTONE-18.md).
1. GitHub -> Actions -> "Weekly photo backup" -> the newest green run -> Artifacts -> download `photo-backup` and unzip it.
   Inside is `photos-DATE.tar.gz`.
2. Unpack it (PowerShell, from the project folder):
   `mkdir photo-restore`
   `tar -xzf photos-2026-XX-XX.tar.gz -C photo-restore`
3. Make `.env.local` point at the place you are restoring INTO: its Project URL and its `service_role` key (or, for R2, the four R2 settings).
4. Look first. This uploads nothing, it only prints how many photos there are and which place they would go to:
   `node --env-file=.env.local scripts/restore-photos.mjs photo-restore`
5. If the address is the right one, upload them: `node --env-file=.env.local scripts/restore-photos.mjs photo-restore --yes`
6. Only if the PUBLIC ADDRESS of the photos changed (a NEW Supabase project with a different Project URL, or a move to or between R2 addresses):
   the cards still contain the OLD photo addresses. In the Supabase SQL Editor of the project that holds the cards run this, with OLD and NEW
   replaced by the two addresses up to and including `card-photos` for Supabase (for example `https://abc.supabase.co/storage/v1/object/public/card-photos`)
   or the plain R2 address, no slash at the end. For R2 also set `R2_PUBLIC_URL` on the host to the NEW address and deploy again:
   `update public.cards set photo_url = replace(photo_url, 'OLD', 'NEW') where photo_url like 'OLD%';`
   `update public.card_blocks set content = replace(content::text, 'OLD', 'NEW')::jsonb where type = 'gallery';`
   Then open a card and a website gallery and check that the photos show. If the address did not change, skip this step.
7. Delete the `photo-restore` folder when you are done.

## If the live database is ever lost
1. Make a new Supabase project. 2. Follow the restore steps above into it, using the newest backup.
3. Update the Supabase keys and URL in the host's environment settings (and in `.env.local`) and deploy again.
4. Restore the photos from the newest photo backup (next section), then tell clients the site was briefly unavailable.
   Clients can also upload a missing photo again themselves.

## Keep the PostgreSQL version in step
The workflow installs the version 17 tools. If Supabase moves your project to a newer PostgreSQL version, the backup
will fail with a "server version mismatch" message. Change `postgresql-client-17` and `/usr/lib/postgresql/17/` in
`backup.yml` to the new number.
