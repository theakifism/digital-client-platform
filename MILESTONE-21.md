# Milestone 21: Organizations and the organization panel (STRUCTURE ONLY)

This builds the skeleton of the third panel: a bank, department or company gets its own administrator who manages ONLY its own staff cards.
There is NO visual design work here (the panel reuses the existing admin look), no template system and no meeting booking yet.
ONE database change (`017_organizations.sql`). No new packages: you do NOT need `npm install`.
This zip is CUMULATIVE: it also contains the Milestone 20 files (migration 016, Messages page), so apply it even if you have not applied the Milestone 20 zip.

## The three panels
1. **Admin** (`/admin`): Orian staff. New: "Organizations" menu item.
2. **Client dashboard** (`/dashboard`): one card owner (an individual, or an organization's employee). Unchanged.
3. **Organization panel** (`/org`): one organization's administrator. NEW.

## What an organization admin can do
- See an overview: cards used of the limit, cards switched on, message COUNTS (numbers only, never message text).
- List the staff cards of their organization only, with message counts, and switch a card on or off.
- Add a staff card (login + card in one step). The card limit of the organization is enforced.
## What they cannot do (by design)
- See or touch any other organization's cards, or the Orian admin panel.
- Change a staff member's password. Only Orian's admin can (Admin -> Organizations -> Change password for the administrator; Admin -> Cards for staff).
- Edit a staff member's card details, delete cards, or change templates (none exist yet).
- An organization admin login has no card of its own.

## What the Orian admin can do (new)
Admin -> Organizations: create an organization together with its administrator's login (a copyable message with the password is shown once), see cards used of the limit, pause or open an organization's panel (its cards are NOT switched off), and reset the administrator's password.

## Files
New: `supabase/migrations/017_organizations.sql`, `src/lib/org.ts`, `src/app/org/{layout.tsx,page.tsx,actions.ts}`, `src/app/org/staff/page.tsx`, `src/app/org/staff/new/{page.tsx,new-staff-form.tsx}`, `src/app/admin/organizations/{page.tsx,actions.ts,state.ts}`, `src/app/admin/organizations/new/{page.tsx,new-org-form.tsx}`, `MILESTONE-21.md`
Changed: `src/lib/provision.ts` (organization id on cards; new `provisionOrgAdmin`), `src/lib/admin.ts`, `src/middleware.ts` (protects `/org`), `src/app/after-login/route.ts` (organization admins go to `/org`), `src/app/admin/layout.tsx`, `src/app/admin/actions.ts` (password reset also allowed for organization admins), `src/app/admin/cards/reset-password.tsx`, `scripts/security-check.mjs`, `PROJECT-HANDOFF.md`
Plus the Milestone 20 files (cumulative): `016_admin_lead_counts.sql`, `src/lib/lead-counts.ts`, `src/app/admin/leads/page.tsx`.

## How it is built (read this before changing it)
- New role value `org_admin` in `profiles.role`. New nullable `organization_id` on `profiles` and `cards`. Every existing client has it empty, so nothing existing changes.
- The organization panel uses the SERVER key (like the admin panel), so its safety rests on ONE rule: every query adds `.eq('organization_id', org.id)`, and `org` comes from `requireOrgAdmin()` (from the logged-in profile), never from the browser. Any new organization page or action MUST start with `requireOrgAdmin()` and filter this way.
- Message counts come from the database function `org_staff_counts()`, which takes no parameters and reads the organization from the caller's own login.
- Visitors cannot see `organization_id` (not in migration 015's column list for visitors). Clients cannot write it (not in their update column list) and a trigger is a second lock.
- Pausing an organization locks its administrator out; it does not switch off staff cards.

## Order
1. Migration 011 and 016 already run (016 needs 011).
2. Run `017_organizations.sql` in Supabase -> SQL Editor BEFORE deploying the new code. It must say Success.
3. Copy the files in, `npm run typecheck`, deploy.
4. Run the security check (`docs/SECURITY-CHECK.md`). The test clients A and B must not belong to an organization.

## Test list (the security check cannot prove the cross-organization part: do this by hand)
1. Admin -> Organizations -> Create an organization "Test Bank One" with administrator `testbank1-admin`. Copy the message. The page lists it as Open with "0 of 25".
2. Create a second organization "Test Bank Two" with administrator `testbank2-admin`.
3. Log in as `testbank1-admin`: you land on `/org` (not `/admin`, not `/dashboard`). Add two staff cards. The numbers on Overview update.
4. Log in as `testbank2-admin` and add one staff card. Staff list shows ONLY Bank Two's card. Bank One's cards never appear.
5. As Bank Two's admin, try to switch off a Bank One card: while logged in as Bank One's admin, copy the card id from the page's form (browser inspector), then log in as Bank Two's admin and submit the same `card_id` (for example with a browser extension or by editing the hidden field on Bank Two's own page). The Bank One card must stay ON.
6. Set the Bank One card limit to 2 in the database (`update public.organizations set max_cards = 2 where slug = '...'`). Adding a third card must say the limit is reached.
7. Admin -> Organizations -> Pause panel for Bank One: its administrator sees "This panel is paused"; its staff cards still open normally. Open the panel again.
8. Log in as Bank One staff member (a normal client): you land on `/dashboard`; visiting `/org` sends you back to `/dashboard`.
9. Log in as `testbank1-admin` and open `/admin`: you are sent to `/org`. Open `/dashboard`: it should not break (an organization admin has no card, so expect an empty state or a message; tell me what you see).
10. Admin -> Organizations -> Change password for the administrator. Log in with the new password.
11. `node scripts/security-check.mjs`: the new "Milestone 21" lines pass.

## Known limits (not decided or not built)
- Usernames are global across the whole platform. Two banks cannot both have a user called `ravi`. Suggest a prefix.
- Card limit check is not atomic: two very fast double-submits could create one card over the limit.
- No bulk CSV upload, no editing of staff details, no template assignment, no audit trail, no departments, no meeting booking yet.
- Deleting an organization is blocked while it has members (on purpose). There is no screen for it.
- The Setup check on Admin -> Overview does not yet check migration 017.
- Organization admins can see message COUNTS of their staff. Whether the organization may also read message TEXT is an open privacy decision (see HANDOFF-DECISIONS.md, question 3).
- Not yet tested against a real database or a real build. Only the syntax of the new files was checked.
