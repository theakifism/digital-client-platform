# Milestone 13: E-mail alerts for you (the admin)

Every morning the website checks itself and e-mails you ONLY when something needs attention:
- a card request has been waiting more than 2 days,
- photo storage or the database is over 80% of the free plan.
Every Monday you always get a short weekly summary. That e-mail doubles as a heartbeat: if a Monday passes with no e-mail, something is wrong.
The e-mails contain numbers only. They never show what visitors or clients wrote (the messages belong to your clients).
New card requests are still e-mailed to you straight away, as before.

## What is new
- NEW `supabase/migrations/010_system_usage.sql`: a small function that gives the two usage numbers to the server only.
- NEW `src/app/api/cron/digest/route.ts` and `src/lib/digest.ts`: the check and the e-mail text.
- NEW `.github/workflows/admin-digest.yml`: calls it every morning (about 8:30 AM India time).
- CHANGED `src/lib/mail.ts` (it now knows whether an e-mail was really sent), `.env.example`, `docs/DEPLOY.md`,
  `docs/BACKUP-AND-RESTORE.md`, `PROJECT-HANDOFF.md`.

## Step 1: Database
Supabase -> SQL Editor -> New query -> paste `supabase/migrations/010_system_usage.sql` -> Run. "Success" is the answer.
(If you skip it, the e-mail still works and says the usage numbers "could not be read".)

## Step 2: Make a secret
In PowerShell:
```powershell
$b = New-Object byte[] 32; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```
It prints about 44 characters. Copy it and keep it in your company password manager. Use the SAME value in three places:
1. `.env.local` (for testing on your computer): a new line `CRON_SECRET=the-value`
2. The host's settings (Netlify -> environment variables): `CRON_SECRET`
3. GitHub -> Settings -> Secrets and variables -> Actions -> New repository secret: `CRON_SECRET`
(`SITE_URL` is already a GitHub secret from the keep-alive job.)
The e-mail itself uses the same Resend settings as card requests: `RESEND_API_KEY`, `RESEND_FROM`, `REQUEST_NOTIFY_EMAIL`.

## Step 3: Apply the files
Unzip into your project and click Merge. Replace the changed files when asked. Then `npm run build`.

## Step 4: Test on your computer
Start the site (`npm run dev`), and in a second PowerShell window (use `curl.exe`, not `curl`):
```powershell
$s = "the-value-of-your-CRON_SECRET"
curl.exe -X POST -H "Authorization: Bearer $s" "http://localhost:3000/api/cron/digest?force=1"
```
Expected: `{"ok":true,"sent":true,"email":"sent",...}` and an e-mail arrives at the REQUEST_NOTIFY_EMAIL address.
Without `?force=1` on a quiet day (not Monday) you get `{"ok":true,"sent":false,"reasons":[]}`: nothing is sent.

## Test checklist
- [ ] The forced command above returns `"sent":true` and the e-mail arrives.
- [ ] The e-mail shows requests waiting, cards, client logins, photo storage and database numbers, and three links. No visitor words.
- [ ] With a wrong secret (`Bearer wrong`) the answer is 401 (not allowed). With no CRON_SECRET set on the site the answer is 503.
- [ ] After deploying: GitHub -> Actions -> "Admin e-mail check" -> Run workflow, tick "Send the e-mail now" -> green tick and an e-mail.
- [ ] Run it again WITHOUT the tick on a day that is not Monday: green tick, no e-mail (quiet day).
- [ ] Create a card request on the live site and leave it for 3 days (or ask me to lower the days for a test): an attention e-mail arrives.

## Good to know
- A RED GitHub job on an alert day means an e-mail was due but could not be sent (check the Resend settings) or the site could not be reached.
- Photo storage over 80% is your signal to run "Photo storage" clean-up in the admin panel, or move to a paid plan.
- GitHub may switch off scheduled jobs in a repository that has had no activity for a long time. If the Monday e-mail stops, open the Actions tab.
- To stop the alerts: remove `CRON_SECRET` from the host. The route then answers 503 and the GitHub job goes red until you also disable the workflow.
