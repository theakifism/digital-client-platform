# Milestone 10: Weekly photo backup

Until now only the database was backed up. Client photos live in Supabase Storage, so a lost project meant every client
had to upload their photo again. This adds a weekly photo backup and a way to restore it.
No database change and no new package. Nothing changes for clients.

## What is new
- `.github/workflows/photo-backup.yml`: every Sunday night GitHub downloads all photos and keeps ONE file for 30 days.
- `scripts/backup-photos.mjs`: does the download. It uses only the public Project URL and the public anon key.
  The secret service-role key is NOT used on GitHub.
- `scripts/restore-photos.mjs`: puts a backup back into a Supabase project. You run it on your own computer. It uploads
  nothing until you add `--yes`.
- CHANGED: `docs/BACKUP-AND-RESTORE.md` (photo secrets, photo restore steps), `.github/workflows/backup.yml` (comment only),
  `.gitignore` (keeps downloaded photo folders out of git), `PROJECT-HANDOFF.md` (status: Milestone 9 and 10 added).

## Step 1: Apply the files
Unzip into your project folder and click Merge. Replace the four changed files when asked.
Then run `npm run build`. It must finish without errors.

## Step 2: Put the project on GitHub (skip if it is already there)
Follow docs/DEPLOY.md. The repository must be PRIVATE. Never commit `.env.local` (it is already ignored).

## Step 3: Add two GitHub secrets
GitHub -> your repository -> Settings -> Secrets and variables -> Actions -> New repository secret.
- `SUPABASE_URL`: Supabase -> Project Settings -> API -> Project URL
- `SUPABASE_ANON_KEY`: the same page, the `anon` (publishable) key
Do NOT use the `service_role` key.

## Step 4: Run it once
GitHub -> Actions -> "Weekly photo backup" -> Run workflow. Wait for the green tick.
Open the run -> step "Download every photo". The last line must read like `Photos found: 12. Saved: 12 (2.1 MB). Failed: 0.`
Under Artifacts, download `photo-backup`, unzip it, open `photos-DATE.tar.gz` (7-Zip or `tar -xzf`) and look inside:
the photos are there in folders, plus `manifest.tsv`.

## Test checklist
- [ ] `npm run build` passes after merging.
- [ ] "Weekly photo backup" run is green.
- [ ] "Photos found" and "Saved" are the same number, and Failed is 0.
- [ ] The downloaded file contains the photos and `manifest.tsv`.
- [ ] The number of photos matches what you expect (admin -> Overview shows the photo storage used).
- [ ] Optional, on your computer: `node --env-file=.env.local scripts/backup-photos.mjs` creates a `photo-backup` folder.
- [ ] Practise a restore ONCE into a scratch Supabase project (steps in docs/BACKUP-AND-RESTORE.md, "Restore the photos").

## Good to know
- A red run means something failed. Open it, read the failing step and paste the message into the chat.
- "Photos found: 0" is normal for a new project. If you expect photos, check the two secrets.
- Free private GitHub repositories have about 500 MB of space for these files. The job warns when one backup passes 150 MB.
  Photos are about 200 KB each, so this is roughly 700 photos. Before then, plan a second place for backups.
- The photo file is not encrypted: the photos are already public on the cards.
- After moving to a NEW Supabase project, card photo addresses must be changed too. The two SQL lines are in the guide.
