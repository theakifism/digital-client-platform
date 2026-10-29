# Milestone 7: Test, back up, deploy, pilot

This milestone is mostly a PLAN you follow, plus a few small files. Do the steps in this order.

## What is new
- `next.config.ts`: safe browser rules on every page; private pages and (for now) client cards stay out of search engines.
- `src/app/robots.ts`, `src/app/error.tsx` (friendly error page), `src/app/api/health/route.ts` (keep-alive address).
- `.github/workflows/keep-alive.yml` (touches the database every 3 days) and `backup.yml` (weekly encrypted database backup).
- `scripts/security-check.mjs`: about 40 automatic checks that one client cannot reach another's data.
- `docs/`: SECURITY-CHECK.md, DEPLOY.md, BACKUP-AND-RESTORE.md, PILOT.md.
- `PROJECT-HANDOFF.md`: fully updated status of the whole project (replaces your old copy).

## Step 1: Apply the files
Stop the server. Unzip into your project and click Merge. REPLACE these files when asked:
`next.config.ts` and `PROJECT-HANDOFF.md`. Everything else is new.
Then restart `npm run dev` and click through the site once: home, login, a card, the dashboard, the admin panel.
Open /api/health: you should see `"ok":true`.
(The security rules also add extra headers; if any page behaves oddly, tell me which one.)

## Step 2: Run the build
In the project folder run `npm run build`. It must finish without errors. If it prints errors (typing or lint errors are
possible, because I cannot run your project myself), paste them into the chat and I will fix them.

## Step 3: Security check (docs/SECURITY-CHECK.md)
Set up two test clients and run the script. The goal is "0 FAILED". Do not go on until it is.

## Step 4: GitHub, backups and keep-alive (docs/BACKUP-AND-RESTORE.md)
Private repository, three secrets, run both jobs once, download one backup, and practise a restore into a scratch project.

## Step 5: Deploy (docs/DEPLOY.md)
Netlify free plan, environment variables, domain, Supabase and Turnstile settings. Then run the earlier test checklists on the live site.
Run the security check again, now with `NEXT_PUBLIC_SUPABASE_URL` pointing at the live project (it is the same database).

## Step 6: Pilot (docs/PILOT.md)
5 to 10 friendly clients for about a week. Keep the problem table. Decide go or no-go.

## Go-live checklist
- [ ] Security check: 0 FAILED
- [ ] `npm run build` passes and the live site passes the earlier checklists
- [ ] Turnstile keys set; request and message emails arrive
- [ ] Backup job green; a backup downloaded; a restore practised once; passphrase stored in the password manager
- [ ] Keep-alive job green
- [ ] Netlify and Supabase usage looked at; upgrade plan agreed
- [ ] Privacy notice approved by the company; request-handler named
- [ ] `NEXT_PUBLIC_SITE_URL` is the real address (QR codes!) and a QR code was scanned with a real phone
- [ ] Decision made on search engines (`NEXT_PUBLIC_INDEX_CARDS`)
- [ ] Pilot finished with a GO

## Good to know
- The security script and the GitHub jobs need your real Supabase project, so I could not run them here. I tested the script's
  logic against a pretend database only. Treat the first real run as the real test and send me whatever fails.
- A friendly warning: this checks the rules we wrote. Before you hold real clients' personal data at scale, consider a
  review of the database rules by someone with Supabase security experience.
