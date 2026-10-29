# Milestone 20: Admin view of messages (counts only)

You can now see, for every card, how many messages visitors sent and what the client has done with them.
You still never see what a visitor wrote. The messages belong to the clients.
ONE database change (`016_admin_lead_counts.sql`). No new packages: you do NOT need `npm install`.

## Files
New: `supabase/migrations/016_admin_lead_counts.sql`, `src/lib/lead-counts.ts`, `src/app/admin/leads/page.tsx`, `MILESTONE-20.md`
Changed: `src/app/admin/layout.tsx` (new "Messages" menu item), `scripts/security-check.mjs` (new checks), `PROJECT-HANDOFF.md`

## Order
1. Migration 011 must already be run (it adds the message status).
2. Copy the files in, run `npm run typecheck`, deploy.
3. Run `016_admin_lead_counts.sql` in Supabase -> SQL Editor. It must say Success.
4. Run the security check (`docs/SECURITY-CHECK.md`).

## What you get: Admin -> Messages
- Five numbers: messages in total, cards that got a message, still marked New, became a customer, cards waiting 3+ days.
- A table per card: Messages, New, Contacted, Became a customer, Not interested, age of the oldest New message, date of the last message.
- Tabs: All cards / Got messages / Waiting 3+ days. The most overdue cards come first.
- "Waiting" is a hint, not proof: a client may have answered and simply not changed the status.

## Privacy
The database function returns numbers and dates only. It has no column for a name, phone, e-mail, message or note.
Only a logged-in admin can call it (checked inside the function; visitors and clients get an error).
Note: the older policy "leads: admin full access" (migration 001) still lets an admin login read messages by talking to the database directly.
This milestone does not use it and the page never shows message text. If you want even that closed, say so and we will do it in migration 017.

## Test list
1. Run 016. Reload `/admin/leads` as admin: the page loads, no "not available yet" notice.
2. Send a message from a demo card's public page. Reload: Messages +1, New +1, "Last message" shows today.
3. As that client, set the message to "Contacted". Reload as admin: New -1, Contacted +1.
4. Tab "Waiting 3+ days" shows nobody (the message is new). In Supabase run
   `update public.leads set created_at = now() - interval '5 days' where id = '<that message id>';` (use a status-New test message). Reload: the card shows "waiting 5 days".
5. Log in as a client and open `/admin/leads`: you are sent to `/dashboard`.
6. `node scripts/security-check.mjs`: the two new "cannot open the admin message counts" lines PASS. With an admin login in `.env.security`, a third line says the counts hold numbers only.
7. Run 016 BEFORE the code, or the code before 016: the page shows the friendly "run migrations 011 and 016" notice, nothing breaks.

## Not done on purpose
CSV download of these counts, e-mail alerts to the client about waiting messages, and showing message text to the admin.

## Not yet tested against a real database or a real build.
